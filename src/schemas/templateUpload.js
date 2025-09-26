/**
 * Template Upload Validation Schemas
 * Work Order #32: Template Upload Initiation and Completion API Endpoints
 * 
 * Request validation schemas for template upload endpoints.
 */

const { isValidUUID } = require('../utils/uuidValidation');

// Template types enum
const TEMPLATE_TYPES = ['Figma', 'PNG'];

// Allowed file types
const ALLOWED_FILE_TYPES = ['application/zip', 'application/x-zip-compressed', 'image/png', 'image/jpeg'];

/**
 * Validates the initiate upload request
 */
const validateInitiateUploadRequest = (req, res, next) => {
    const { fileName, fileType, fileSize } = req.body;
    const errors = [];
    
    // Validate fileName
    if (!fileName || typeof fileName !== 'string') {
        errors.push('fileName is required and must be a string');
    } else if (fileName.length === 0 || fileName.length > 255) {
        errors.push('fileName must be between 1 and 255 characters');
    } else if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
        errors.push('fileName contains invalid characters. Only alphanumeric characters, dots, underscores, and hyphens are allowed');
    }
    
    // Validate fileType
    if (!fileType || typeof fileType !== 'string') {
        errors.push('fileType is required and must be a string');
    } else if (!ALLOWED_FILE_TYPES.includes(fileType)) {
        errors.push(`fileType must be one of: ${ALLOWED_FILE_TYPES.join(', ')}`);
    }
    
    // Validate fileSize
    if (fileSize !== undefined) {
        if (typeof fileSize !== 'number' || !Number.isInteger(fileSize)) {
            errors.push('fileSize must be an integer');
        } else if (fileSize <= 0) {
            errors.push('fileSize must be greater than 0');
        } else if (fileSize > 100 * 1024 * 1024) { // 100MB max
            errors.push('fileSize must not exceed 100MB');
        }
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Invalid request data',
            code: 'INVALID_REQUEST_DATA',
            details: errors
        });
    }
    
    next();
};

/**
 * Validates the complete upload request
 */
const validateCompleteUploadRequest = (req, res, next) => {
    const { uploadId, templateType, originalFileName } = req.body;
    const errors = [];
    
    // Validate uploadId
    if (!uploadId || typeof uploadId !== 'string') {
        errors.push('uploadId is required and must be a string');
    } else if (!isValidUUID(uploadId)) {
        errors.push('uploadId must be a valid UUID');
    }
    
    // Validate templateType
    if (!templateType || typeof templateType !== 'string') {
        errors.push('templateType is required and must be a string');
    } else if (!TEMPLATE_TYPES.includes(templateType)) {
        errors.push(`templateType must be one of: ${TEMPLATE_TYPES.join(', ')}`);
    }
    
    // Validate originalFileName
    if (!originalFileName || typeof originalFileName !== 'string') {
        errors.push('originalFileName is required and must be a string');
    } else if (originalFileName.length === 0 || originalFileName.length > 255) {
        errors.push('originalFileName must be between 1 and 255 characters');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Invalid request data',
            code: 'INVALID_REQUEST_DATA',
            details: errors
        });
    }
    
    next();
};

/**
 * Validates file type based on file extension and MIME type
 */
const validateFileType = (fileName, fileType) => {
    const errors = [];
    
    if (!fileName || !fileType) {
        return { isValid: false, errors: ['fileName and fileType are required'] };
    }
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Check file extension
    const validExtensions = ['figma', 'png', 'jpg', 'jpeg'];
    if (!validExtensions.includes(extension)) {
        errors.push(`File extension '${extension}' is not supported. Supported extensions: ${validExtensions.join(', ')}`);
    }
    
    // Check MIME type matches extension
    const mimeTypeMap = {
        'figma': ['application/zip', 'application/x-zip-compressed'],
        'png': ['image/png'],
        'jpg': ['image/jpeg'],
        'jpeg': ['image/jpeg']
    };
    
    if (mimeTypeMap[extension] && !mimeTypeMap[extension].includes(fileType)) {
        errors.push(`MIME type '${fileType}' does not match file extension '${extension}'`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        extension
    };
};

/**
 * Validates file size based on file type
 */
const validateFileSize = (fileSize, fileType) => {
    const maxSizes = {
        'figma': 50 * 1024 * 1024, // 50MB
        'png': 10 * 1024 * 1024,   // 10MB
        'jpg': 10 * 1024 * 1024,   // 10MB
        'jpeg': 10 * 1024 * 1024   // 10MB
    };
    
    const extension = fileType.split('/').pop().toLowerCase();
    const maxSize = maxSizes[extension] || 10 * 1024 * 1024; // Default 10MB
    
    if (fileSize > maxSize) {
        return {
            isValid: false,
            error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB for ${extension} files`
        };
    }
    
    return { isValid: true };
};

/**
 * Sanitizes file name to prevent path traversal and other security issues
 */
const sanitizeFileName = (fileName) => {
    if (!fileName) return '';
    
    // Remove path traversal attempts
    let sanitized = fileName.replace(/\.\./g, '');
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
        const extension = sanitized.split('.').pop();
        const nameWithoutExt = sanitized.substring(0, 255 - extension.length - 1);
        sanitized = `${nameWithoutExt}.${extension}`;
    }
    
    return sanitized;
};

/**
 * Validates upload ID format
 */
const validateUploadId = (uploadId) => {
    if (!uploadId) {
        return { isValid: false, error: 'uploadId is required' };
    }
    
    if (typeof uploadId !== 'string') {
        return { isValid: false, error: 'uploadId must be a string' };
    }
    
    if (!isValidUUID(uploadId)) {
        return { isValid: false, error: 'uploadId must be a valid UUID' };
    }
    
    return { isValid: true };
};

module.exports = {
    validateInitiateUploadRequest,
    validateCompleteUploadRequest,
    validateFileType,
    validateFileSize,
    sanitizeFileName,
    validateUploadId,
    TEMPLATE_TYPES,
    ALLOWED_FILE_TYPES
};
