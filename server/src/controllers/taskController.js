import { query } from '../utils/db.js';
import { serializeTask } from '../utils/serializers.js';

async function getMembership(projectId, userId) {
  const { rows } = await query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return rows[0];
}

async function canManageProject(projectId, userId) {
  return (await getMembership(projectId, userId))?.role === 'Admin';
}

async function getAccessibleProject(projectId, userId) {
  const { rows } = await query(
    `SELECT p.*
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id
     WHERE p.id = $1 AND pm.user_id = $2`,
    [projectId, userId]
  );
  return rows[0];
}

async function getTaskWithUsers(taskId) {
  const { rows } = await query(
    `SELECT t.*,
      au.id AS assigned_to_id, au.name AS assigned_to_name, au.email AS assigned_to_email,
      cu.id AS created_by_id, cu.name AS created_by_name, cu.email AS created_by_email
     FROM tasks t
     JOIN app_users au ON au.id = t.assigned_to
     JOIN app_users cu ON cu.id = t.created_by
     WHERE t.id = $1`,
    [taskId]
  );
  return rows[0];
}

export async function listProjectTasks(req, res, next) {
  try {
    const project = await getAccessibleProject(req.params.projectId, req.user.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    const isAdmin = await canManageProject(project.id, req.user.id);
    const params = [project.id];
    let assigneeFilter = '';

    if (!isAdmin) {
      params.push(req.user.id);
      assigneeFilter = 'AND t.assigned_to = $2';
    }

    const { rows } = await query(
      `SELECT t.*,
        au.id AS assigned_to_id, au.name AS assigned_to_name, au.email AS assigned_to_email,
        cu.id AS created_by_id, cu.name AS created_by_name, cu.email AS created_by_email
       FROM tasks t
       JOIN app_users au ON au.id = t.assigned_to
       JOIN app_users cu ON cu.id = t.created_by
       WHERE t.project_id = $1 ${assigneeFilter}
       ORDER BY t.due_date ASC`,
      params
    );

    res.json(rows.map(serializeTask));
  } catch (error) {
    next(error);
  }
}

export async function createTask(req, res, next) {
  try {
    const project = await getAccessibleProject(req.body.projectId, req.user.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (!(await canManageProject(project.id, req.user.id))) {
      res.status(403);
      throw new Error('Only project admins can create tasks');
    }

    if (!(await getMembership(project.id, req.body.assignedTo))) {
      res.status(400);
      throw new Error('Task assignee must be a project member');
    }

    const { rows } = await query(
      `INSERT INTO tasks (title, description, due_date, priority, status, project_id, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        req.body.title,
        req.body.description || '',
        req.body.dueDate,
        req.body.priority || 'Medium',
        req.body.status || 'To Do',
        project.id,
        req.body.assignedTo,
        req.user.id
      ]
    );

    res.status(201).json(serializeTask(await getTaskWithUsers(rows[0].id)));
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const task = await getTaskWithUsers(req.params.taskId);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const project = await getAccessibleProject(task.project_id, req.user.id);

    if (!project) {
      res.status(404);
      throw new Error('Task not found');
    }

    const isAdmin = await canManageProject(project.id, req.user.id);
    const isAssignee = String(task.assigned_to) === String(req.user.id);

    if (!isAdmin && !isAssignee) {
      res.status(403);
      throw new Error('You can only update tasks assigned to you');
    }

    if (isAdmin && req.body.assignedTo && !(await getMembership(project.id, req.body.assignedTo))) {
      res.status(400);
      throw new Error('Task assignee must be a project member');
    }

    const nextTask = {
      title: isAdmin && req.body.title !== undefined ? req.body.title : task.title,
      description: isAdmin && req.body.description !== undefined ? req.body.description : task.description,
      dueDate: isAdmin && req.body.dueDate !== undefined ? req.body.dueDate : task.due_date,
      priority: isAdmin && req.body.priority !== undefined ? req.body.priority : task.priority,
      status: req.body.status !== undefined ? req.body.status : task.status,
      assignedTo: isAdmin && req.body.assignedTo !== undefined ? req.body.assignedTo : task.assigned_to
    };

    await query(
      `UPDATE tasks
       SET title = $1, description = $2, due_date = $3, priority = $4, status = $5,
           assigned_to = $6, updated_at = NOW()
       WHERE id = $7`,
      [
        nextTask.title,
        nextTask.description,
        nextTask.dueDate,
        nextTask.priority,
        nextTask.status,
        nextTask.assignedTo,
        task.id
      ]
    );

    res.json(serializeTask(await getTaskWithUsers(task.id)));
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await getTaskWithUsers(req.params.taskId);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    if (!(await canManageProject(task.project_id, req.user.id))) {
      res.status(403);
      throw new Error('Only project admins can delete tasks');
    }

    await query('DELETE FROM tasks WHERE id = $1', [task.id]);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
}
