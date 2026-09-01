export const ROLES = {
  USER: 'USER',
  PHARMACY_OWNER: 'PHARMACY_OWNER',
  ADMIN: 'ADMIN',
};

export const ROLE_HOME_ROUTE = {
  [ROLES.USER]: '/dashboard',
  [ROLES.PHARMACY_OWNER]: '/pharmacy-owner/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
};

