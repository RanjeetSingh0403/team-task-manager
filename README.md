# Team Task Manager

Team Task Manager is a full-stack web application for managing projects, team members, and tasks. It supports authentication, project-based roles, task assignment, status tracking, and a dashboard for project progress.

Live App: https://team-task-manager-production-0ea7.up.railway.app

GitHub Repository: https://github.com/RanjeetSingh0403/team-task-manager

## Features

- User signup and login
- JWT-based authentication
- Create and manage projects
- Project roles: Admin and Member
- Admin can add and remove project members
- Admin can create, assign, update, and delete tasks
- Members can view and update their assigned tasks
- Task status: To Do, In Progress, Done
- Task priority: Low, Medium, High
- Dashboard with:
  - Total tasks
  - Tasks by status
  - Tasks per user
  - Overdue tasks

## Tech Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Authentication: JWT, bcrypt
- Deployment: Railway

## Project Structure

```text
team-task-manager/
  client/
    src/
      api/
      pages/
      state/
      ui/
      utils/
  server/
    src/
      controllers/
      middleware/
      routes/
      utils/
```

## Local Setup

Install dependencies:

```bash
npm run install:all
```

Create `server/.env`:

```env
PORT=5000
DATABASE_URL=your_postgresql_database_url
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run backend:

```powershell
cd server
npm run dev
```

Run frontend in another terminal:

```powershell
cd client
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

Backend runs on:

```text
http://localhost:5000
```

## API Routes

Protected routes require this header:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get logged-in user |
| GET | `/api/projects` | Get user projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:projectId` | Get project details |
| POST | `/api/projects/:projectId/members` | Add project member |
| DELETE | `/api/projects/:projectId/members/:userId` | Remove project member |
| GET | `/api/projects/:projectId/tasks` | Get project tasks |
| GET | `/api/projects/:projectId/dashboard` | Get dashboard data |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:taskId` | Update task |
| DELETE | `/api/tasks/:taskId` | Delete task |

## Database Tables

- `app_users`
- `projects`
- `project_members`
- `tasks`

The backend creates these tables automatically when the server starts.

## Railway Deployment

The project is deployed on Railway with PostgreSQL.

Required environment variables:

```env
DATABASE_URL=your_railway_postgres_url
JWT_SECRET=your_jwt_secret
NODE_ENV=production
CLIENT_URL=your_railway_app_url
```

Build command:

```bash
npm run build
```

Start command:

```bash
npm start
```

In production, Express serves the built React frontend from `client/dist`.

## Demo Flow

For testing or demo:

1. Signup as an admin user.
2. Create a project.
3. Signup another user.
4. Add the second user to the project by email.
5. Create and assign tasks.
6. Update task status.
7. Check dashboard counts and overdue tasks.
