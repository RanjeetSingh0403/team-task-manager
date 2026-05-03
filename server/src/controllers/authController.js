import bcrypt from 'bcryptjs';
import { query } from '../utils/db.js';
import { serializeUser } from '../utils/serializers.js';
import { createToken } from '../utils/token.js';

function authResponse(row) {
  const user = serializeUser(row);

  return {
    user,
    token: createToken(user.id)
  };
}

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existingUser = await query('SELECT id FROM app_users WHERE email = $1', [email]);

    if (existingUser.rows[0]) {
      res.status(409);
      throw new Error('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO app_users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    res.status(201).json(authResponse(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { rows } = await query('SELECT id, name, email, password FROM app_users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json(authResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json(req.user);
}
