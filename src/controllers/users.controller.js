import logger from '#config/logger.js';
import { formatValidationError } from '#utils/format.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#services/users.service.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users ...');

    const allUsers = await getAllUsers();

    res.json({
      message: 'Successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    next(e);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting user with ID: ${id}`);

    const user = await getUserById(parseInt(id));

    res.json({
      message: 'Successfully retrieved user',
      user,
    });
  } catch (e) {
    logger.error('Error fetching user by ID', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const modifyUser = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramValidation.error),
      });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'At least one field must be provided for update',
      });
    }

    const userId = parseInt(id);
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    if (requestingUserId !== userId && requestingUserRole !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile',
      });
    }

    if (updates.role && requestingUserRole !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can change user roles',
      });
    }

    logger.info(`Updating user with ID: ${userId}`);

    const updatedUser = await updateUser(userId, updates);

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e) {
    logger.error('Error updating user', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const removeUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    const userId = parseInt(id);
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    if (requestingUserId !== userId && requestingUserRole !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own account',
      });
    }

    logger.info(`Deleting user with ID: ${userId}`);

    const deletedUser = await deleteUser(userId);

    res.json({
      message: 'User deleted successfully',
      user: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: deletedUser.name,
      },
    });
  } catch (e) {
    logger.error('Error deleting user', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};
