/**
 * UUID Validation Utility
 * Work Order #32: Template Upload Initiation and Completion API Endpoints
 * 
 * Provides UUID validation functionality for the application.
 */

/**
 * Validates if a string is a valid UUID v4 format
 * @param {string} uuid - The string to validate
 * @returns {boolean} - True if valid UUID, false otherwise
 */
const isValidUUID = (uuid) => {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }
    
    // UUID v4 regex pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Validates if a string is a valid UUID (any version)
 * @param {string} uuid - The string to validate
 * @returns {boolean} - True if valid UUID, false otherwise
 */
const isValidUUIDAnyVersion = (uuid) => {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }
    
    // General UUID regex pattern (any version)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Generates a validation error message for invalid UUIDs
 * @param {string} fieldName - The name of the field being validated
 * @param {string} value - The invalid value
 * @returns {string} - Error message
 */
const getUUIDValidationError = (fieldName, value) => {
    if (!value) {
        return `${fieldName} is required`;
    }
    
    if (typeof value !== 'string') {
        return `${fieldName} must be a string`;
    }
    
    return `${fieldName} must be a valid UUID format`;
};

module.exports = {
    isValidUUID,
    isValidUUIDAnyVersion,
    getUUIDValidationError
};
