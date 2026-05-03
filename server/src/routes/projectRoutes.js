import express from 'express';
import { body, param } from 'express-validator';
import {
  addMember,
  createProject,
  getProject,
  getProjectDashboard,
  listProjects,
  removeMember
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { listProjectTasks } from '../controllers/taskController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listProjects)
  .post([
    body('name').trim().isLength({ min: 2 }).withMessage('Project name must be at least 2 characters'),
    body('description').optional().trim(),
    validateRequest
  ], createProject);

router.get('/:projectId', [
  param('projectId').isInt({ min: 1 }).withMessage('Invalid project id'),
  validateRequest
], getProject);

router.get('/:projectId/tasks', [
  param('projectId').isInt({ min: 1 }).withMessage('Invalid project id'),
  validateRequest
], listProjectTasks);

router.get('/:projectId/dashboard', [
  param('projectId').isInt({ min: 1 }).withMessage('Invalid project id'),
  validateRequest
], getProjectDashboard);

router.post('/:projectId/members', [
  param('projectId').isInt({ min: 1 }).withMessage('Invalid project id'),
  body('email').isEmail().withMessage('A valid user email is required').normalizeEmail(),
  body('role').optional().isIn(['Admin', 'Member']).withMessage('Role must be Admin or Member'),
  validateRequest
], addMember);

router.delete('/:projectId/members/:userId', [
  param('projectId').isInt({ min: 1 }).withMessage('Invalid project id'),
  param('userId').isInt({ min: 1 }).withMessage('Invalid user id'),
  validateRequest
], removeMember);

export default router;
