import { pool, query } from '../utils/db.js';
import { serializeProject, serializeTask, serializeUser } from '../utils/serializers.js';

async function getProjectRow(projectId) {
  const { rows } = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
  return rows[0];
}

async function getMembers(projectId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, pm.role
     FROM project_members pm
     JOIN app_users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY pm.created_at ASC`,
    [projectId]
  );

  return rows.map((row) => ({
    user: serializeUser(row),
    role: row.role
  }));
}

async function getProjectForUser(projectId, userId) {
  const { rows } = await query(
    `SELECT p.*
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE p.id = $1 AND pm.user_id = $2`,
    [projectId, userId]
  );
  return rows[0];
}

async function getMembership(projectId, userId) {
  const { rows } = await query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return rows[0];
}

async function ensureAdmin(projectId, userId) {
  const membership = await getMembership(projectId, userId);

  if (!membership || membership.role !== 'Admin') {
    const error = new Error('Admin access is required for this project');
    error.statusCode = 403;
    throw error;
  }
}

export async function createProject(req, res, next) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO projects (name, description, creator_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.body.name, req.body.description || '', req.user.id]
    );
    const project = rows[0];

    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, req.user.id, 'Admin']
    );

    await client.query('COMMIT');
    res.status(201).json(serializeProject(project, await getMembers(project.id)));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}

export async function listProjects(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT p.*
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = $1
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );

    const projects = await Promise.all(rows.map(async (project) => (
      serializeProject(project, await getMembers(project.id))
    )));

    res.json(projects);
  } catch (error) {
    next(error);
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await getProjectForUser(req.params.projectId, req.user.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    res.json(serializeProject(project, await getMembers(project.id)));
  } catch (error) {
    next(error);
  }
}

export async function addMember(req, res, next) {
  try {
    const project = await getProjectRow(req.params.projectId);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    await ensureAdmin(project.id, req.user.id);

    const userResult = await query('SELECT id, name, email FROM app_users WHERE email = $1', [req.body.email]);
    const user = userResult.rows[0];

    if (!user) {
      res.status(404);
      throw new Error('User with this email was not found');
    }

    const existing = await getMembership(project.id, user.id);

    if (existing) {
      res.status(409);
      throw new Error('User is already a project member');
    }

    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, user.id, req.body.role || 'Member']
    );

    res.json(serializeProject(project, await getMembers(project.id)));
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req, res, next) {
  try {
    const project = await getProjectRow(req.params.projectId);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    await ensureAdmin(project.id, req.user.id);

    if (String(project.creator_id) === String(req.params.userId)) {
      res.status(400);
      throw new Error('Project creator cannot be removed');
    }

    await query('DELETE FROM tasks WHERE project_id = $1 AND assigned_to = $2', [project.id, req.params.userId]);
    await query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [project.id, req.params.userId]);

    res.json(serializeProject(project, await getMembers(project.id)));
  } catch (error) {
    next(error);
  }
}

export async function getProjectDashboard(req, res, next) {
  try {
    const project = await getProjectForUser(req.params.projectId, req.user.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    const members = await getMembers(project.id);
    const tasksResult = await query(
      `SELECT t.*,
        au.id AS assigned_to_id, au.name AS assigned_to_name, au.email AS assigned_to_email,
        cu.id AS created_by_id, cu.name AS created_by_name, cu.email AS created_by_email
       FROM tasks t
       JOIN app_users au ON au.id = t.assigned_to
       JOIN app_users cu ON cu.id = t.created_by
       WHERE t.project_id = $1
       ORDER BY t.due_date ASC`,
      [project.id]
    );
    const tasks = tasksResult.rows.map(serializeTask);
    const statusCounts = { 'To Do': 0, 'In Progress': 0, Done: 0 };
    const tasksPerUser = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    members.forEach((member) => {
      tasksPerUser[member.user._id] = { user: member.user, count: 0 };
    });

    const overdueTasks = [];

    tasks.forEach((task) => {
      statusCounts[task.status] += 1;

      if (task.assignedTo?._id && tasksPerUser[task.assignedTo._id]) {
        tasksPerUser[task.assignedTo._id].count += 1;
      }

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (task.status !== 'Done' && dueDate < today) {
        overdueTasks.push(task);
      }
    });

    res.json({
      totalTasks: tasks.length,
      statusCounts,
      tasksPerUser: Object.values(tasksPerUser),
      overdueTasks
    });
  } catch (error) {
    next(error);
  }
}
