const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

class AuthService {
  async register({ name, email, password, phone, role = 'customer' }) {
    const [existing] = await pool.query('SELECT user_id FROM user WHERE email = ?', [email]);
    if (existing.length) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO user (name, email, password_hash, phone, role, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [name, email, hashedPassword, phone || null, role]
    );

    const userId = result.insertId;
    const token = this._generateToken(userId);

    return {
      token,
      user: { user_id: userId, name, email, role },
    };
  }

  async login({ email, password }) {
    const [rows] = await pool.query(
      'SELECT user_id, name, email, password_hash, role, is_active FROM user WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const user = rows[0];
    if (!user.is_active) {
      const err = new Error('Account is deactivated');
      err.statusCode = 403;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const token = this._generateToken(user.user_id);
    return {
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId) {
    const [rows] = await pool.query(
      'SELECT user_id, name, email, phone, role, created_at FROM user WHERE user_id = ?',
      [userId]
    );
    if (!rows.length) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return rows[0];
  }

  _generateToken(userId) {
    if (!process.env.JWT_SECRET) {
      const err = new Error('JWT configuration missing');
      err.statusCode = 500;
      throw err;
    }
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }
}

module.exports = new AuthService();
