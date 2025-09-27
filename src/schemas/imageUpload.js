/**
 * Image Upload Validation Schemas
 * Work Order #26: Build ImageUploader Component for Banner Background Images
 * 
 * Defines validation schemas for image upload requests.
 */

const { isValidUUID } = require('../utils/uuidValidation');

/**
 * Schema for initiating image upload
 */
const initiateImageUploadSchema = {
    fileName: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 255,
        pattern: /^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/,
        message: 'File name must be a valid filename with extension'
    },
    fileType: {
        type: 'string',
        required: true,
        enum: ['image/jpeg', 'image/png', 'image/webp'],
        message: 'File type must be one of: image/jpeg, image/png, image/webp'
    },
    fileSize: {
        type: 'number',
        required: true,
        min: 1,
        max: 10 * 1024 * 1024, // 10MB
        message: 'File size must be between 1 byte and 10MB'
    },
    altText: {
        type: 'string',
        required: false,
        maxLength: 500,
        message: 'Alt text must be less than 500 characters'
    }
};

/**
 * Schema for completing image upload
 */
const completeImageUploadSchema = {
    uploadId: {
        type: 'string',
        required: true,
        validate: isValidUUID,
        message: 'Upload ID must be a valid UUID'
    },
    s3Key: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 1024,
        message: 'S3 key must be a valid string'
    },
    bucket: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 255,
        message: 'S3 bucket must be a valid string'
    },
    fileName: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 255,
        message: 'File name must be a valid string'
    },
    fileSize: {
        type: 'number',
        required: true,
        min: 1,
        message: 'File size must be a positive number'
    },
    contentType: {
        type: 'string',
        required: true,
        enum: ['image/jpeg', 'image/png', 'image/webp'],
        message: 'Content type must be one of: image/jpeg, image/png, image/webp'
    },
    altText: {
        type: 'string',
        required: false,
        maxLength: 500,
        message: 'Alt text must be less than 500 characters'
    }
};

/**
 * Schema for updating image metadata
 */
const updateImageSchema = {
    altText: {
        type: 'string',
        required: false,
        maxLength: 500,
        message: 'Alt text must be less than 500 characters'
    }
};

/**
 * Validates request data against a schema
 */
const validateSchema = (data, schema) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];

        // Check required fields
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            continue;
        }

        // Skip validation for optional fields that are not provided
        if (!rules.required && (value === undefined || value === null || value === '')) {
            continue;
        }

        // Type validation
        if (rules.type && typeof value !== rules.type) {
            errors.push(`${field} must be of type ${rules.type}`);
            continue;
        }

        // String length validation
        if (rules.type === 'string' && value !== undefined) {
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`${field} must be at least ${rules.minLength} characters long`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
            }
        }

        // Number range validation
        if (rules.type === 'number' && value !== undefined) {
            if (rules.min !== undefined && value < rules.min) {
                errors.push(`${field} must be at least ${rules.min}`);
            }
            if (rules.max !== undefined && value > rules.max) {
                errors.push(`${field} must be no more than ${rules.max}`);
            }
        }

        // Enum validation
        if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(rules.message || `${field} format is invalid`);
        }

        // Custom validation
        if (rules.validate && !rules.validate(value)) {
            errors.push(rules.message || `${field} validation failed`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates initiate image upload request
 */
const validateInitiateImageUpload = (data) => {
    return validateSchema(data, initiateImageUploadSchema);
};

/**
 * Validates complete image upload request
 */
const validateCompleteImageUpload = (data) => {
    return validateSchema(data, completeImageUploadSchema);
};

/**
 * Validates update image request
 */
const validateUpdateImage = (data) => {
    return validateSchema(data, updateImageSchema);
};

module.exports = {
    initiateImageUploadSchema,
    completeImageUploadSchema,
    updateImageSchema,
    validateInitiateImageUpload,
    validateCompleteImageUpload,
    validateUpdateImage,
    validateSchema
};
