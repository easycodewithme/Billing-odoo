const prisma = require('../utils/prisma');

/**
 * Create an audit log entry.
 *
 * @param {string} tableName  - The database table that was affected (e.g. 'User', 'Subscription')
 * @param {string} recordId   - The primary key of the affected record
 * @param {string} action     - The action performed (e.g. 'CREATE', 'UPDATE', 'DELETE')
 * @param {object|null} oldValues - Previous values (null for CREATE)
 * @param {object|null} newValues - New values (null for DELETE)
 * @param {string|null} userId - ID of the user who performed the action
 * @returns {Promise<object>} The created AuditLog record
 */
const logAction = async (tableName, recordId, action, oldValues, newValues, userId) => {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        tableName,
        recordId,
        action,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        userId: userId || null,
      },
    });

    return auditLog;
  } catch (error) {
    // Log but don't throw -- audit logging should never break the main flow
    console.error('Audit log error:', error);
    return null;
  }
};

module.exports = {
  logAction,
};
