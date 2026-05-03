# Team Task Manager

A full-stack collaborative task management app inspired by Trello and Asana. Users can sign up, create projects, invite members, assign tasks, update progress, and view dashboard analytics.

## Tech Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express.js
- Database: PostgreSQL with `pg`
- Authentication: JWT with bcrypt password hashing
- Deployment: Railway

## Features

- User signup and login
- JWT-protected REST APIs
- Project creation
- Project admin/member roles
- Add and remove project members
- Task creation with title, description, due date, priority, assignee, and status
- Role-based access control
- Dashboard with total tasks, task status counts, tasks per user, and overdue tasks

## API Overview

All protected routes require:

```http
Authorization: Bearer <jwt-token>
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create user account |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get logged-in user |
| GET | `/api/projects` | List projects for logged-in user |
| POST | `/api/projects` | Create project as Admin |
| GET | `/api/projects/:projectId` | Get project details |
| POST | `/api/projects/:projectId/members` | Admin adds member |
| DELETE | `/api/projects/:projectId/members/:userId` | Admin removes member |
| GET | `/api/projects/:projectId/tasks` | List project tasks |
| GET | `/api/projects/:projectId/dashboard` | Get dashboard metrics |
| POST | `/api/tasks` | Admin creates task |
| PATCH | `/api/tasks/:taskId` | Admin edits task, Member updates assigned task status |
| DELETE | `/api/tasks/:taskId` | Admin deletes task |

## Local Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create `server/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/team_task_manager
JWT_SECRET=replace-with-a-long-secret
CLIENT_URL=http://localhost:5173
```

3. Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

4. Run the app in two PowerShell windows:

```powershell
cd "E:\Team Task Manager\server"
npm run dev
```

```powershell
cd "E:\Team Task Manager\client"
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Railway Deployment

1. Push this repository to GitHub.
2. Create a new Railway project from your GitHub repository.
3. Add a PostgreSQL database on Railway.
4. Add these environment variables in Railway:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-production-secret
NODE_ENV=production
CLIENT_URL=https://your-railway-app-url
```

5. Railway should use:

```bash
npm run build
npm start
```

The Express server serves the built React frontend in production.

## Demo Video Guide

Show the following in 2-5 minutes:

1. Signup and login.
2. Create a project as an Admin.
3. Add a member by email.
4. Create and assign tasks.
5. Login as Member and update assigned task status.
6. Show the dashboard counts and overdue task section.
7. Explain backend routes, SQL tables, JWT auth, and role checks.

Suggested script:

```text
Hi, this is my Team Task Manager full-stack application.
It uses React on the frontend, Express on the backend, PostgreSQL for data storage, and JWT for authentication.

First I will create an account and log in. After login, I can create a project. The creator automatically becomes the project Admin.

Inside the project, the Admin can add members by email, create tasks, assign tasks to project members, choose priority and due date, and manage task status.

The dashboard shows total tasks, tasks by status, tasks per user, and overdue tasks.

Role-based access is enforced in the backend. Admins can manage users and tasks. Members can only view and update tasks assigned to them.

The backend is organized into controllers, routes, middleware, and a SQL database utility. PostgreSQL stores users, projects, project members, and tasks with proper relationships.

The project is Railway-ready. Environment variables are used for the PostgreSQL database URL, JWT secret, client URL, and production mode.
```
