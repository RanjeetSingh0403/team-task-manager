import { LogOut, Plus, Users } from 'lucide-react';
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('/')}>
          <Users size={22} />
          <span>Team Task Manager</span>
        </button>
        <div className="topbar-actions">
          <span className="user-pill">{user?.name}</span>
          <button className="icon-button" onClick={() => navigate('/')} title="New project">
            <Plus size={18} />
          </button>
          <button className="icon-button" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
