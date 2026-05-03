import express from 'express';
import { body, param } from 'express-validator';
import { createTask, deleteTask, updateTask } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.use(protect);

router.post('/', [
  body('projectId').isInt({ min: 1 }).withMessage('A valid project id is required'),
  body('title').trim().isLength({ min: 2 }).withMessage('Task title must be at least 2 characters'),
  body('description').optional().trim(),
  body('dueDate').isISO8601().withMessage('A valid due date is required'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High'),
  body('status').optional().isIn(['To Do', 'In Progress', 'Done']).withMessage('Invalid task status'),
  body('assignedTo').isInt({ min: 1 }).withMessage('A valid assignee is required'),
  validateRequest
], createTask);

router.patch('/:taskId', [
  param('taskId').isInt({ min: 1 }).withMessage('Invalid task id'),
  body('title').optional().trim().isLength({ min: 2 }).withMessage('Task title must be at least 2 characters'),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601().withMessage('A valid due date is required'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High'),
  body('status').optional().isIn(['To Do', 'In Progress', 'Done']).withMessage('Invalid task status'),
  body('assignedTo').optional().isInt({ min: 1 }).withMessage('A valid assignee is required'),
  validateRequest
], updateTask);

router.delete('/:taskId', [
  param('taskId').isInt({ min: 1 }).withMessage('Invalid task id'),
  validateRequest
], deleteTask);

export default router;
