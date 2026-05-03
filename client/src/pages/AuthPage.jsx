import { Lock, Mail, User } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { getErrorMessage } from '../utils/format.js';
import { Message } from '../ui/Message.jsx';

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await signup(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Collaborative workspace</p>
          <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="muted">
            Manage projects, assign work, and keep progress visible for the whole team.
          </p>
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <Message type="error">{error}</Message>
          {isSignup && (
            <label>
              <span>Name</span>
              <div className="field">
                <User size={18} />
                <input name="name" value={form.name} onChange={updateField} required minLength={2} />
              </div>
            </label>
          )}
          <label>
            <span>Email</span>
            <div className="field">
              <Mail size={18} />
              <input name="email" type="email" value={form.email} onChange={updateField} required />
            </div>
          </label>
          <label>
            <span>Password</span>
            <div className="field">
              <Lock size={18} />
              <input name="password" type="password" value={form.password} onChange={updateField} required minLength={6} />
            </div>
          </label>
          <button className="primary-button" disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Sign up' : 'Login'}
          </button>
        </form>

        <p className="switch-auth">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Login' : 'Create account'}</Link>
        </p>
      </section>
    </main>
  );
}
