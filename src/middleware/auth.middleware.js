import logger from '#config/logger.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';

export const authenticate = (req, res, next) => {
  try {
    const token = cookies.get(req, 'token');

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const decoded = jwttoken.verify(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (e) {
    logger.error('Authentication error', e);

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

export const authorize = role => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required',
    });
  }

  next();
};
