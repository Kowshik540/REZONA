// server/utils/isAdmin.js
// Single source of truth for admin check — replaces all hardcoded email comparisons

const ADMIN_EMAIL = 'kowshikthota43@gmail.com';

function isAdmin(user) {
  if (!user) return false;
  return user.email === ADMIN_EMAIL || user.plan === 'admin';
}

module.exports = { isAdmin, ADMIN_EMAIL };
