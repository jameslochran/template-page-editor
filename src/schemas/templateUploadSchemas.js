/**
 * Template Upload Validation Schemas
 * Work Order #38: Implement File Upload Step for Template Creation Wizard
 * 
 * Defines validation schemas for template file upload requests and responses.
 */

const s3Service = require('../services/s3Service');

/**
 * Validates initiate template upload request
 */
const validateInitiateTemplateUpload = (req, res, next) => {
    try {
        const { fileName, fileType, fileSize } = req.body;

        // Required fields validation
        if (!fileName || typeof fileName !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'File name is required and must be a string',
                details: ['fileName is required']
            });
        }

        if (!fileType || typeof fileType !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'File type is required and must be a string',
                details: ['fileType is required']
            });
        }

        if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'File size is required and must be a positive number',
                details: ['fileSize is required and must be > 0']
            });
        }

        // File validation using S3 service
        const validation = s3Service.validateFile(fileName, fileType, fileSize);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'FILE_VALIDATION_FAILED',
                message: 'File validation failed',
                details: validation.errors
            });
        }

        // Add validated data to request
        req.validatedData = {
            fileName: fileName.trim(),
            fileType: fileType.trim(),
            fileSize: Math.floor(fileSize),
            extension: validation.extension
        };

        next();

    } catch (error) {
        console.error('TemplateUploadSchemas: Error validating initiate upload request:', error);
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error during validation',
            details: [error.message]
        });
    }
};

/**
 * Validates complete template upload request
 */
const validateCompleteTemplateUpload = (req, res, next) => {
    try {
        const { uploadId } = req.body;

        // Required fields validation
        if (!uploadId || typeof uploadId !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'Upload ID is required and must be a string',
                details: ['uploadId is required']
            });
        }

        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uploadId)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'Upload ID must be a valid UUID',
                details: ['uploadId format is invalid']
            });
        }

        // Add validated data to request
        req.validatedData = {
            uploadId: uploadId.trim()
        };

        next();

    } catch (error) {
        console.error('TemplateUploadSchemas: Error validating complete upload request:', error);
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error during validation',
            details: [error.message]
        });
    }
};

/**
 * Validates upload progress update request
 */
const validateUpdateUploadProgress = (req, res, next) => {
    try {
        const { uploadId, progress } = req.body;

        // Required fields validation
        if (!uploadId || typeof uploadId !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'Upload ID is required and must be a string',
                details: ['uploadId is required']
            });
        }

        if (progress === undefined || progress === null || typeof progress !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'Progress is required and must be a number',
                details: ['progress is required and must be a number']
            });
        }

        // Progress range validation
        if (progress < 0 || progress > 100) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'Progress must be between 0 and 100',
                details: ['progress must be >= 0 and <= 100']
            });
        }

        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uploadId)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'Upload ID must be a valid UUID',
                details: ['uploadId format is invalid']
            });
        }

        // Add validated data to request
        req.validatedData = {
            uploadId: uploadId.trim(),
            progress: Math.floor(progress)
        };

        next();

    } catch (error) {
        console.error('TemplateUploadSchemas: Error validating progress update request:', error);
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error during validation',
            details: [error.message]
        });
    }
};

/**
 * Validates upload status request
 */
const validateGetUploadStatus = (req, res, next) => {
    try {
        const { uploadId } = req.params;

        // Required fields validation
        if (!uploadId || typeof uploadId !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'Upload ID is required and must be a string',
                details: ['uploadId is required']
            });
        }

        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uploadId)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'Upload ID must be a valid UUID',
                details: ['uploadId format is invalid']
            });
        }

        // Add validated data to request
        req.validatedData = {
            uploadId: uploadId.trim()
        };

        next();

    } catch (error) {
        console.error('TemplateUploadSchemas: Error validating status request:', error);
        res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error during validation',
            details: [error.message]
        });
    }
};

/**
 * Creates a standardized success response
 */
const createSuccessResponse = (data, message = 'Operation completed successfully') => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

/**
 * Creates a standardized error response
 */
const createErrorResponse = (message, errorCode = 'UNKNOWN_ERROR', details = []) => {
    return {
        success: false,
        error: errorCode,
        message,
        details,
        timestamp: new Date().toISOString()
    };
};

/**
 * Sanitizes upload session data for response
 */
const sanitizeUploadSessionResponse = (session) => {
    if (!session) {
        return null;
    }

    return {
        uploadId: session.uploadId,
        fileName: session.fileName,
        fileType: session.fileType,
        fileSize: session.fileSize,
        status: session.status,
        progress: session.progress,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        error: session.error,
        expiresAt: session.expiresAt
    };
};

module.exports = {
    validateInitiateTemplateUpload,
    validateCompleteTemplateUpload,
    validateUpdateUploadProgress,
    validateGetUploadStatus,
    createSuccessResponse,
    createErrorResponse,
    sanitizeUploadSessionResponse
};
