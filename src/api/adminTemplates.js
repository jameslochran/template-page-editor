/**
 * Admin Templates API Routes
 * Work Order #32: Template Upload Initiation and Completion API Endpoints
 * 
 * Defines API routes for admin template upload functionality.
 */

const express = require('express');
const router = express.Router();
const adminTemplatesController = require('../controllers/adminTemplatesController');
const { requireAdmin } = require('../middleware/adminAuth');
const { 
    validateInitiateUploadRequest, 
    validateCompleteUploadRequest,
    validateUploadId 
} = require('../schemas/templateUpload');

// Middleware to validate uploadId parameter
router.param('uploadId', (req, res, next, uploadId) => {
    const validation = validateUploadId(uploadId);
    if (!validation.isValid) {
        return res.status(400).json({
            error: 'Invalid upload ID format',
            code: 'INVALID_UPLOAD_ID_FORMAT',
            message: validation.error
        });
    }
    next();
});

/**
 * POST /api/admin/templates/upload/initiate
 * Initiates a template upload by generating a pre-signed S3 URL
 * 
 * Request Body:
 * - fileName (string): Name of the file to upload
 * - fileType (string): MIME type of the file
 * - fileSize (number, optional): Size of the file in bytes
 * 
 * Response:
 * - uploadId (string): Unique identifier for this upload session
 * - presignedUrl (string): Pre-signed S3 URL for direct upload
 * - expiresIn (number): URL expiration time in seconds
 * - s3Key (string): S3 key where the file will be stored
 */
router.post('/upload/initiate',
    requireAdmin('template_upload'),
    validateInitiateUploadRequest,
    adminTemplatesController.initiateTemplateUpload
);

/**
 * POST /api/admin/templates/upload/complete
 * Completes a template upload and triggers appropriate processing
 * 
 * Request Body:
 * - uploadId (string): Upload session ID from initiate endpoint
 * - templateType (string): Type of template ('Figma' or 'PNG')
 * - originalFileName (string): Original name of the uploaded file
 * 
 * Response:
 * - templateId (string): ID of the created template record
 * - templateType (string): Type of the template
 * - status (string): Upload completion status
 * - processingStatus (string): Background processing status
 */
router.post('/upload/complete',
    requireAdmin('template_upload'),
    validateCompleteUploadRequest,
    adminTemplatesController.completeTemplateUpload
);

/**
 * GET /api/admin/templates/upload/:uploadId/status
 * Gets the status of an upload session
 * 
 * Response:
 * - uploadId (string): Upload session ID
 * - status (string): Current status of the upload
 * - fileName (string): Name of the file being uploaded
 * - fileType (string): MIME type of the file
 * - fileSize (number): Size of the file in bytes
 * - createdAt (string): When the upload was initiated
 * - expiresAt (string): When the upload session expires
 * - templateId (string, optional): ID of created template (if completed)
 * - templateType (string, optional): Type of template (if completed)
 */
router.get('/upload/:uploadId/status',
    requireAdmin('template_upload'),
    adminTemplatesController.getUploadStatus
);

/**
 * GET /api/admin/templates/upload/sessions
 * Gets all upload sessions for the authenticated admin user
 * 
 * Response:
 * - sessions (array): Array of upload session objects
 * - count (number): Total number of sessions
 */
router.get('/upload/sessions',
    requireAdmin('template_upload'),
    adminTemplatesController.getUploadSessions
);

/**
 * DELETE /api/admin/templates/upload/:uploadId
 * Cancels an upload session
 * 
 * Response:
 * - success (boolean): Whether the cancellation was successful
 * - message (string): Success message
 */
router.delete('/upload/:uploadId',
    requireAdmin('template_upload'),
    adminTemplatesController.cancelUpload
);

/**
 * GET /api/admin/templates/upload/stats
 * Gets upload statistics for admin dashboard
 * 
 * Response:
 * - totalUploads (number): Total number of uploads
 * - successfulUploads (number): Number of successful uploads
 * - failedUploads (number): Number of failed uploads
 * - pendingUploads (number): Number of pending uploads
 * - figmaUploads (number): Number of Figma file uploads
 * - pngUploads (number): Number of PNG file uploads
 * - totalFileSize (number): Total size of all uploaded files
 * - averageProcessingTime (number): Average processing time in seconds
 */
router.get('/upload/stats',
    requireAdmin('template_upload'),
    adminTemplatesController.getUploadStats
);

// Error handling middleware for admin template routes
router.use((error, req, res, next) => {
    console.error('Admin templates route error:', error);
    
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            message: error.message
        });
    }
    
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
        });
    }
    
    if (error.name === 'ForbiddenError') {
        return res.status(403).json({
            error: 'Forbidden',
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
        });
    }
    
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
    });
});

module.exports = router;
