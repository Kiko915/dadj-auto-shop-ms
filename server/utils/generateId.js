// utils/generateId.js - Custom ID generators with prefixes

import { customAlphabet } from 'nanoid';

// Use alphanumeric characters (no special symbols for cleaner IDs)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);

/**
 * Generate a custom customer ID with 'cust-' prefix
 * Format: cust-XXXXXXXXXXXX (12 random alphanumeric characters)
 * Example: cust-8Hy7fG2kL9pQ
 * @returns {string} Customer ID with prefix
 */
export const generateCustomerId = () => {
  return `cust-${nanoid()}`;
};

/**
 * Generate a custom vehicle ID with 'veh-' prefix
 * Format: veh-XXXXXXXXXXXX (12 random alphanumeric characters)
 * Example: veh-3Kp9mN7qR2wT
 * @returns {string} Vehicle ID with prefix
 */
export const generateVehicleId = () => {
  return `veh-${nanoid()}`;
};

/**
 * Validate if an ID has the correct prefix
 * @param {string} id - The ID to validate
 * @param {string} prefix - Expected prefix (e.g., 'cust-', 'veh-')
 * @returns {boolean} True if ID has correct prefix
 */
export const validateIdPrefix = (id, prefix) => {
  return id && typeof id === 'string' && id.startsWith(prefix);
};
