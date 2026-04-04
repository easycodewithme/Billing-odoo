const prisma = require('../utils/prisma');
const authService = require('../services/auth.service');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');

/**
 * GET /users
 * Paginated list with optional filter by role and search by name/email.
 */
const getAll = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);
    const { role, search } = req.query;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          address: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginated(res, users, total, page, limit);
  } catch (err) {
    console.error('Get all users error:', err);
    return error(res, 'Failed to fetch users');
  }
};

/**
 * GET /users/:id
 * Single user with subscription count.
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    return success(res, user);
  } catch (err) {
    console.error('Get user by ID error:', err);
    return error(res, 'Failed to fetch user');
  }
};

/**
 * POST /users
 * Admin creates an internal_user account.
 */
const create = async (req, res) => {
  try {
    const { fullName, email, password, role, phone } = req.body;

    // Only allow creating internal_user role
    if (role && role !== 'internal_user') {
      return error(res, 'Can only create users with internal_user role', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return error(res, 'A user with this email already exists', 409);
    }

    const hashedPassword = await authService.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: 'internal_user',
        phone: phone || null,
      },
    });

    const { password: _, ...userData } = user;

    return success(res, userData, 'User created successfully', 201);
  } catch (err) {
    console.error('Create user error:', err);
    return error(res, 'Failed to create user');
  }
};

/**
 * PUT /users/:id
 * Update own profile or admin can update any user.
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;

    // Non-admin users can only update their own profile
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return error(res, 'You can only update your own profile', 403);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'User not found', 404);
    }

    const { fullName, phone, avatar, address } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
        ...(address !== undefined && { address }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAction('User', user.id, 'update', existing, user, req.user.id);

    return success(res, user, 'User updated successfully');
  } catch (err) {
    console.error('Update user error:', err);
    return error(res, 'Failed to update user');
  }
};

/**
 * PATCH /users/:id/deactivate
 * Admin only - set isActive = false.
 */
const deactivate = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'User not found', 404);
    }

    if (!existing.isActive) {
      return error(res, 'User is already deactivated', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    });

    return success(res, user, 'User deactivated successfully');
  } catch (err) {
    console.error('Deactivate user error:', err);
    return error(res, 'Failed to deactivate user');
  }
};

/**
 * PATCH /users/:id/activate
 * Admin only - set isActive = true.
 */
const activate = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'User not found', 404);
    }

    if (existing.isActive) {
      return error(res, 'User is already active', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    });

    return success(res, user, 'User activated successfully');
  } catch (err) {
    console.error('Activate user error:', err);
    return error(res, 'Failed to activate user');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deactivate,
  activate,
};
