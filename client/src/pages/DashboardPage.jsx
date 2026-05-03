import { FolderKanban, Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../state/AuthContext.jsx';
import { Message } from '../ui/Message.jsx';
import { getErrorMessage } from '../utils/format.js';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function createProject(event) {
    event.preventDefault();
    setError('');

    try {
      const { data } = await api.post('/projects', form);
      setProjects((current) => [data, ...current]);
      setForm({ name: '', description: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="page-grid">
      <section className="work-area">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Projects</p>
            <h1>Your workspaces</h1>
          </div>
        </div>
        <Message type="error">{error}</Message>
        {loading ? (
          <p className="muted">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={36} />
            <h2>No projects yet</h2>
            <p>Create your first project to become its Admin.</p>
          </div>
        ) : (
          <div className="project-list">
            {projects.map((project) => {
              const myRole = project.members.find((member) => member.user._id === user?.id)?.role;
              return (
                <Link className="project-card" key={project._id} to={`/projects/${project._id}`}>
                  <div>
                    <h2>{project.name}</h2>
                    <p>{project.description || 'No description added.'}</p>
                  </div>
                  <div className="card-footer">
                    <span>{project.members.length} members</span>
                    <strong>{myRole}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <aside className="side-panel">
        <h2>Create project</h2>
        <form className="form-stack" onSubmit={createProject}>
          <label>
            <span>Name</span>
            <input name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={2} />
          </label>
          <label>
            <span>Description</span>
            <textarea name="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="4" />
          </label>
          <button className="primary-button">
            <Plus size={18} />
            Create
          </button>
        </form>
      </aside>
    </div>
  );
}
