/**
 * Admin Templates Controller
 * Work Order #32: Template Upload Initiation and Completion API Endpoints
 * 
 * Handles admin template upload endpoints including initiation and completion.
 */

const templateUploadService = require('../services/templateUploadService');
const { sanitizeFileName } = require('../schemas/templateUpload');

/**
 * Initiates a template upload by generating a pre-signed S3 URL
 * POST /api/admin/templates/upload/initiate
 */
async function initiateTemplateUpload(req, res) {
    try {
        const { fileName, fileType, fileSize } = req.body;
        const userId = req.userId; // From admin auth middleware
        
        // Sanitize file name
        const sanitizedFileName = sanitizeFileName(fileName);
        
        // Initiate upload
        const uploadInfo = await templateUploadService.initiateTemplateUpload(
            sanitizedFileName,
            fileType,
            fileSize,
            userId
        );
        
        res.status(200).json({
            success: true,
            data: {
                uploadId: uploadInfo.uploadId,
                presignedUrl: uploadInfo.presignedUrl,
                expiresIn: uploadInfo.expiresIn,
                s3Key: uploadInfo.s3Key
            },
            message: 'Upload initiated successfully'
        });
        
    } catch (error) {
        console.error('Error initiating template upload:', error);
        
        // Handle specific error types
        if (error.message.includes('File validation failed')) {
            return res.status(400).json({
                error: 'File validation failed',
                code: 'FILE_VALIDATION_FAILED',
                message: error.message
            });
        }
        
        if (error.message.includes('Failed to generate pre-signed URL')) {
            return res.status(500).json({
                error: 'S3 service error',
                code: 'S3_SERVICE_ERROR',
                message: 'Failed to generate pre-signed URL for upload'
            });
        }
        
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while initiating the upload'
        });
    }
}

/**
 * Completes a template upload and triggers appropriate processing
 * POST /api/admin/templates/upload/complete
 */
async function completeTemplateUpload(req, res) {
    try {
        const { uploadId, templateType, originalFileName } = req.body;
        const userId = req.userId; // From admin auth middleware
        
        // Sanitize original file name
        const sanitizedFileName = sanitizeFileName(originalFileName);
        
        // Complete upload
        const result = await templateUploadService.completeTemplateUpload(
            uploadId,
            templateType,
            sanitizedFileName
        );
        
        res.status(200).json({
            success: true,
            data: {
                templateId: result.templateId,
                templateType: result.templateType,
                status: result.status,
                processingStatus: result.processingStatus
            },
            message: 'Upload completed successfully'
        });
        
    } catch (error) {
        console.error('Error completing template upload:', error);
        
        // Handle specific error types
        if (error.message.includes('Upload session not found')) {
            return res.status(404).json({
                error: 'Upload session not found',
                code: 'UPLOAD_SESSION_NOT_FOUND',
                message: 'The specified upload session does not exist or has expired'
            });
        }
        
        if (error.message.includes('File was not successfully uploaded to S3')) {
            return res.status(400).json({
                error: 'Upload verification failed',
                code: 'UPLOAD_VERIFICATION_FAILED',
                message: 'The file was not found in S3. Please ensure the upload was completed successfully.'
            });
        }
        
        if (error.message.includes('Unsupported template type')) {
            return res.status(400).json({
                error: 'Unsupported template type',
                code: 'UNSUPPORTED_TEMPLATE_TYPE',
                message: error.message
            });
        }
        
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while completing the upload'
        });
    }
}

/**
 * Gets the status of an upload session
 * GET /api/admin/templates/upload/:uploadId/status
 */
async function getUploadStatus(req, res) {
    try {
        const { uploadId } = req.params;
        
        const status = templateUploadService.getUploadStatus(uploadId);
        
        res.status(200).json({
            success: true,
            data: status,
            message: 'Upload status retrieved successfully'
        });
        
    } catch (error) {
        console.error('Error getting upload status:', error);
        
        if (error.message.includes('Upload session not found')) {
            return res.status(404).json({
                error: 'Upload session not found',
                code: 'UPLOAD_SESSION_NOT_FOUND',
                message: 'The specified upload session does not exist or has expired'
            });
        }
        
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while retrieving upload status'
        });
    }
}

/**
 * Gets all upload sessions for the authenticated admin user
 * GET /api/admin/templates/upload/sessions
 */
async function getUploadSessions(req, res) {
    try {
        const userId = req.userId; // From admin auth middleware
        
        // In a real application, this would filter by userId
        // For now, return all sessions (admin can see all)
        const allSessions = templateUploadService.getAllUploadSessions ? 
            templateUploadService.getAllUploadSessions() : [];
        
        res.status(200).json({
            success: true,
            data: {
                sessions: allSessions,
                count: allSessions.length
            },
            message: 'Upload sessions retrieved successfully'
        });
        
    } catch (error) {
        console.error('Error getting upload sessions:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while retrieving upload sessions'
        });
    }
}

/**
 * Cancels an upload session
 * DELETE /api/admin/templates/upload/:uploadId
 */
async function cancelUpload(req, res) {
    try {
        const { uploadId } = req.params;
        const userId = req.userId; // From admin auth middleware
        
        // Get the session to verify ownership
        const session = templateUploadService.getUploadSession(uploadId);
        if (!session) {
            return res.status(404).json({
                error: 'Upload session not found',
                code: 'UPLOAD_SESSION_NOT_FOUND',
                message: 'The specified upload session does not exist'
            });
        }
        
        // In a real application, verify that the user owns this session
        if (session.userId !== userId) {
            return res.status(403).json({
                error: 'Access denied',
                code: 'ACCESS_DENIED',
                message: 'You can only cancel your own upload sessions'
            });
        }
        
        // Delete the session
        templateUploadService.deleteUploadSession(uploadId);
        
        res.status(200).json({
            success: true,
            message: 'Upload session cancelled successfully'
        });
        
    } catch (error) {
        console.error('Error cancelling upload:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while cancelling the upload'
        });
    }
}

/**
 * Gets upload statistics for admin dashboard
 * GET /api/admin/templates/upload/stats
 */
async function getUploadStats(req, res) {
    try {
        // In a real application, this would query the database for statistics
        const stats = {
            totalUploads: 0,
            successfulUploads: 0,
            failedUploads: 0,
            pendingUploads: 0,
            figmaUploads: 0,
            pngUploads: 0,
            totalFileSize: 0,
            averageProcessingTime: 0
        };
        
        res.status(200).json({
            success: true,
            data: stats,
            message: 'Upload statistics retrieved successfully'
        });
        
    } catch (error) {
        console.error('Error getting upload stats:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while retrieving upload statistics'
        });
    }
}

module.exports = {
    initiateTemplateUpload,
    completeTemplateUpload,
    getUploadStatus,
    getUploadSessions,
    cancelUpload,
    getUploadStats
};
