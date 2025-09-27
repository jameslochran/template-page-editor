/**
 * Image Upload Controller
 * Work Order #26: Build ImageUploader Component for Banner Background Images
 * 
 * Handles HTTP requests for image upload operations.
 */

const imageUploadService = require('../services/imageUploadService');

/**
 * Initiates an image upload
 */
const initiateImageUpload = async (req, res) => {
    try {
        const { fileName, fileType, fileSize, altText } = req.body;
        const uploadedBy = req.user?.id || 'anonymous';

        const result = await imageUploadService.initiateImageUpload({
            fileName,
            fileType,
            fileSize,
            altText
        }, uploadedBy);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in initiateImageUpload:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to initiate image upload',
            message: error.message
        });
    }
};

/**
 * Completes an image upload
 */
const completeImageUpload = async (req, res) => {
    try {
        const { uploadId, s3Key, bucket, fileName, fileSize, contentType, altText } = req.body;
        const uploadedBy = req.user?.id || 'anonymous';

        const result = await imageUploadService.completeImageUpload({
            uploadId,
            s3Key,
            bucket,
            fileName,
            fileSize,
            contentType,
            altText
        }, uploadedBy);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in completeImageUpload:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to complete image upload',
            message: error.message
        });
    }
};

/**
 * Gets upload status
 */
const getUploadStatus = async (req, res) => {
    try {
        const { uploadId } = req.params;

        const result = await imageUploadService.getUploadStatus(uploadId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Upload not found',
                message: 'Upload session not found or expired'
            });
        }

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in getUploadStatus:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to get upload status',
            message: error.message
        });
    }
};

/**
 * Gets user upload sessions
 */
const getUserUploadSessions = async (req, res) => {
    try {
        const uploadedBy = req.user?.id || 'anonymous';

        const result = await imageUploadService.getUserUploadSessions(uploadedBy);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in getUserUploadSessions:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to get user upload sessions',
            message: error.message
        });
    }
};

/**
 * Cancels an upload
 */
const cancelUpload = async (req, res) => {
    try {
        const { uploadId } = req.params;

        await imageUploadService.cancelUpload(uploadId);

        res.status(200).json({
            success: true,
            message: 'Upload cancelled successfully'
        });

    } catch (error) {
        console.error('Error in cancelUpload:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to cancel upload',
            message: error.message
        });
    }
};

/**
 * Gets upload statistics
 */
const getUploadStats = async (req, res) => {
    try {
        const result = await imageUploadService.getUploadStats();

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in getUploadStats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get upload statistics',
            message: error.message
        });
    }
};

/**
 * Cleans up expired upload sessions
 */
const cleanupExpiredSessions = async (req, res) => {
    try {
        const result = await imageUploadService.cleanupExpiredSessions();

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error in cleanupExpiredSessions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup expired sessions',
            message: error.message
        });
    }
};

module.exports = {
    initiateImageUpload,
    completeImageUpload,
    getUploadStatus,
    getUserUploadSessions,
    cancelUpload,
    getUploadStats,
    cleanupExpiredSessions
};
