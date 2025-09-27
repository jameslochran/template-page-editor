const { isValidUUID } = require('../utils/uuidValidation');

/**
 * Template Schemas
 * Validation schemas for template CRUD operations
 */

/**
 * Validate template creation request
 * @param {Object} data - Request data
 * @returns {Object} Validation result
 */
const validateCreateTemplateRequest = (data) => {
    const errors = [];

    // Validate name
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Template name is required and must be a non-empty string');
    } else if (data.name.length > 255) {
        errors.push('Template name cannot exceed 255 characters');
    }

    // Validate description
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
        errors.push('Template description is required and must be a non-empty string');
    } else if (data.description.length > 1000) {
        errors.push('Template description cannot exceed 1000 characters');
    }

    // Validate categoryId
    if (!data.categoryId || !isValidUUID(data.categoryId)) {
        errors.push('Category ID is required and must be a valid UUID');
    }

    // Validate previewImageUrl
    if (!data.previewImageUrl || typeof data.previewImageUrl !== 'string' || data.previewImageUrl.trim().length === 0) {
        errors.push('Preview image URL is required and must be a non-empty string');
    } else {
        // Basic URL validation
        try {
            new URL(data.previewImageUrl);
        } catch (e) {
            errors.push('Preview image URL must be a valid URL');
        }
    }

    // Validate components
    if (!Array.isArray(data.components)) {
        errors.push('Components must be an array');
    } else {
        if (data.components.length === 0) {
            errors.push('Components array cannot be empty');
        }

        // Validate each component
        data.components.forEach((component, index) => {
            if (!component || typeof component !== 'object') {
                errors.push(`Component at index ${index} must be an object`);
                return;
            }

            if (!component.id || typeof component.id !== 'string' || component.id.trim().length === 0) {
                errors.push(`Component at index ${index} must have a valid ID`);
            }

            if (!component.type || typeof component.type !== 'string' || component.type.trim().length === 0) {
                errors.push(`Component at index ${index} must have a valid type`);
            }

            // Validate component type is one of the allowed types
            const allowedTypes = ['TextComponent', 'BannerComponent', 'CardComponent', 'AccordionComponent', 'LinkGroupComponent'];
            if (component.type && !allowedTypes.includes(component.type)) {
                errors.push(`Component at index ${index} has invalid type. Must be one of: ${allowedTypes.join(', ')}`);
            }
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate template update request
 * @param {Object} data - Request data
 * @returns {Object} Validation result
 */
const validateUpdateTemplateRequest = (data) => {
    // For updates, we use the same validation as create
    return validateCreateTemplateRequest(data);
};

/**
 * Validate template ID parameter
 * @param {string} templateId - Template ID
 * @returns {Object} Validation result
 */
const validateTemplateId = (templateId) => {
    const errors = [];

    if (!templateId || !isValidUUID(templateId)) {
        errors.push('Template ID must be a valid UUID');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate category ID parameter
 * @param {string} categoryId - Category ID
 * @returns {Object} Validation result
 */
const validateCategoryId = (categoryId) => {
    const errors = [];

    if (!categoryId || !isValidUUID(categoryId)) {
        errors.push('Category ID must be a valid UUID');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Sanitize template data for response
 * @param {Object} template - Template object
 * @returns {Object} Sanitized template
 */
const sanitizeTemplateResponse = (template) => {
    if (!template) {
        return null;
    }

    return {
        id: template.id,
        name: template.name,
        description: template.description,
        categoryId: template.categoryId,
        previewImageUrl: template.previewImageUrl,
        components: template.components,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
    };
};

/**
 * Sanitize category data for response
 * @param {Object} category - Category object
 * @returns {Object} Sanitized category
 */
const sanitizeCategoryResponse = (category) => {
    if (!category) {
        return null;
    }

    return {
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
    };
};

/**
 * Create error response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Array} details - Error details
 * @returns {Object} Error response
 */
const createErrorResponse = (message, code, details = []) => {
    return {
        error: message,
        code,
        details,
        timestamp: new Date().toISOString()
    };
};

/**
 * Create success response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Success response
 */
const createSuccessResponse = (data, message) => {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    validateCreateTemplateRequest,
    validateUpdateTemplateRequest,
    validateTemplateId,
    validateCategoryId,
    sanitizeTemplateResponse,
    sanitizeCategoryResponse,
    createErrorResponse,
    createSuccessResponse
};
