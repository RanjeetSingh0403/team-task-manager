import { CalendarClock, CheckCircle2, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Message } from '../ui/Message.jsx';
import { dateInputValue, formatDate, getErrorMessage } from '../utils/format.js';

const statuses = ['To Do', 'In Progress', 'Done'];
const priorities = ['Low', 'Medium', 'High'];

export default function ProjectPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [memberForm, setMemberForm] = useState({ email: '', role: 'Member' });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: dateInputValue(new Date()),
    priority: 'Medium',
    status: 'To Do',
    assignedTo: ''
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const myRole = useMemo(() => {
    return project?.members.find((member) => member.user._id === user?.id)?.role;
  }, [project, user]);

  const isAdmin = myRole === 'Admin';

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  useEffect(() => {
    if (project?.members.length && !taskForm.assignedTo) {
      setTaskForm((current) => ({ ...current, assignedTo: project.members[0].user._id }));
    }
  }, [project, taskForm.assignedTo]);

  async function loadProjectData() {
    setError('');
    try {
      const [projectResponse, tasksResponse, dashboardResponse] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/dashboard`)
      ]);
      setProject(projectResponse.data);
      setTasks(tasksResponse.data);
      setDashboard(dashboardResponse.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function addMember(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      const { data } = await api.post(`/projects/${projectId}/members`, memberForm);
      setProject(data);
      setMemberForm({ email: '', role: 'Member' });
      setNotice('Member added.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeMember(userId) {
    setError('');
    setNotice('');

    try {
      const { data } = await api.delete(`/projects/${projectId}/members/${userId}`);
      setProject(data);
      await loadProjectData();
      setNotice('Member removed.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createTask(event) {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      await api.post('/tasks', { ...taskForm, projectId });
      setTaskForm({
        title: '',
        description: '',
        dueDate: dateInputValue(new Date()),
        priority: 'Medium',
        status: 'To Do',
        assignedTo: project.members[0]?.user._id || ''
      });
      await loadProjectData();
      setNotice('Task created.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function updateTask(task, patch) {
    setError('');
    setNotice('');

    try {
      await api.patch(`/tasks/${task._id}`, patch);
      await loadProjectData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteTask(taskId) {
    setError('');
    setNotice('');

    try {
      await api.delete(`/tasks/${taskId}`);
      await loadProjectData();
      setNotice('Task deleted.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!project) {
    return (
      <div className="content-wrap">
        <Message type="error">{error}</Message>
        {!error && <p className="muted">Loading project...</p>}
      </div>
    );
  }

  return (
    <div className="project-page">
      <section className="project-hero">
        <div>
          <p className="eyebrow">{myRole}</p>
          <h1>{project.name}</h1>
          <p>{project.description || 'Project tasks and progress.'}</p>
        </div>
      </section>

      <div className="content-wrap">
        <Message type="error">{error}</Message>
        <Message type="success">{notice}</Message>

        <section className="metrics-grid">
          <Metric title="Total tasks" value={dashboard?.totalTasks || 0} />
          <Metric title="To Do" value={dashboard?.statusCounts?.['To Do'] || 0} />
          <Metric title="In Progress" value={dashboard?.statusCounts?.['In Progress'] || 0} />
          <Metric title="Done" value={dashboard?.statusCounts?.Done || 0} />
        </section>

        <section className="two-column">
          <div className="work-area">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Tasks</p>
                <h2>Project board</h2>
              </div>
            </div>
            <div className="kanban">
              {statuses.map((status) => (
                <div className="kanban-column" key={status}>
                  <h3>{status}</h3>
                  {tasks.filter((task) => task.status === status).map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      isAdmin={isAdmin}
                      members={project.members}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <aside className="side-stack">
            {isAdmin && (
              <section className="side-panel">
                <h2>Create task</h2>
                <form className="form-stack" onSubmit={createTask}>
                  <label>
                    <span>Title</span>
                    <input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required minLength={2} />
                  </label>
                  <label>
                    <span>Description</span>
                    <textarea value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} rows="3" />
                  </label>
                  <label>
                    <span>Due date</span>
                    <input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} required />
                  </label>
                  <label>
                    <span>Priority</span>
                    <select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>
                      {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Assign to</span>
                    <select value={taskForm.assignedTo} onChange={(event) => setTaskForm({ ...taskForm, assignedTo: event.target.value })}>
                      {project.members.map((member) => <option key={member.user._id} value={member.user._id}>{member.user.name}</option>)}
                    </select>
                  </label>
                  <button className="primary-button">Create task</button>
                </form>
              </section>
            )}

            <section className="side-panel">
              <h2>Members</h2>
              {isAdmin && (
                <form className="inline-form" onSubmit={addMember}>
                  <input placeholder="member@email.com" value={memberForm.email} onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} required />
                  <select value={memberForm.role} onChange={(event) => setMemberForm({ ...memberForm, role: event.target.value })}>
                    <option>Member</option>
                    <option>Admin</option>
                  </select>
                  <button className="icon-button" title="Add member">
                    <UserPlus size={18} />
                  </button>
                </form>
              )}
              <div className="member-list">
                {project.members.map((member) => (
                  <div className="member-row" key={member.user._id}>
                    <div>
                      <strong>{member.user.name}</strong>
                      <span>{member.user.email}</span>
                    </div>
                    <small>{member.role}</small>
                    {isAdmin && member.user._id !== user.id && (
                      <button className="icon-button danger" onClick={() => removeMember(member.user._id)} title="Remove member">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="side-panel">
              <h2>Task load</h2>
              <div className="member-list">
                {dashboard?.tasksPerUser?.map((item) => (
                  <div className="member-row" key={item.user._id}>
                    <strong>{item.user.name}</strong>
                    <small>{item.count} tasks</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="side-panel">
              <h2>Overdue</h2>
              {dashboard?.overdueTasks?.length ? dashboard.overdueTasks.map((task) => (
                <div className="mini-task" key={task._id}>
                  <CalendarClock size={16} />
                  <span>{task.title}</span>
                </div>
              )) : <p className="muted">No overdue tasks.</p>}
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TaskCard({ task, isAdmin, members, onUpdate, onDelete }) {
  return (
    <article className={`task-card priority-${task.priority.toLowerCase()}`}>
      <div className="task-card-head">
        <h4>{task.title}</h4>
        {isAdmin && (
          <button className="icon-button danger" onClick={() => onDelete(task._id)} title="Delete task">
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <p>{task.description || 'No description.'}</p>
      <div className="task-meta">
        <span>{task.priority}</span>
        <span>{formatDate(task.dueDate)}</span>
      </div>
      <label>
        <span>Status</span>
        <select value={task.status} onChange={(event) => onUpdate(task, { status: event.target.value })}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      <label>
        <span>Assignee</span>
        {isAdmin ? (
          <select value={task.assignedTo?._id} onChange={(event) => onUpdate(task, { assignedTo: event.target.value })}>
            {members.map((member) => <option key={member.user._id} value={member.user._id}>{member.user.name}</option>)}
          </select>
        ) : (
          <div className="assignee"><CheckCircle2 size={15} />{task.assignedTo?.name}</div>
        )}
      </label>
    </article>
  );
}
