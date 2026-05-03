import jwt from 'jsonwebtoken';
import { query } from '../utils/db.js';
import { serializeUser } from '../utils/serializers.js';

export async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized, token missing');
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT id, name, email FROM app_users WHERE id = $1',
      [decoded.userId]
    );

    if (!rows[0]) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    req.user = serializeUser(rows[0]);
    next();
  } catch (error) {
    res.status(401);
    next(new Error('Not authorized, token invalid'));
  }
}
