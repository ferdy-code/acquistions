import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (e) {
    logger.error(`Error getting user by ID: ${e}`);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    const updateData = { ...updates };

    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }

    updateData.updated_at = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User ${updatedUser.email} updated successfully`);

    return updatedUser;
  } catch (e) {
    logger.error(`Error updating user: ${e}`);
    throw e;
  }
};

export const deleteUser = async id => {
  try {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    if (!deletedUser) {
      throw new Error('User not found');
    }

    logger.info(`User ${deletedUser.email} deleted successfully`);

    return deletedUser;
  } catch (e) {
    logger.error(`Error deleting user: ${e}`);
    throw e;
  }
};
