/**
 * Image Upload API Routes
 * Work Order #26: Build ImageUploader Component for Banner Background Images
 * 
 * Defines API endpoints for image upload operations.
 */

const express = require('express');
const router = express.Router();
const imageUploadController = require('../controllers/imageUploadController');
const { authenticateAdmin } = require('../middleware/adminAuth');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * POST /api/admin/images/upload/initiate
 * Initiates an image upload by generating a pre-signed URL
 */
router.post('/upload/initiate', imageUploadController.initiateImageUpload);

/**
 * POST /api/admin/images/upload/complete
 * Completes an image upload and creates the image record
 */
router.post('/upload/complete', imageUploadController.completeImageUpload);

/**
 * GET /api/admin/images/upload/:uploadId/status
 * Gets the status of an upload session
 */
router.get('/upload/:uploadId/status', imageUploadController.getUploadStatus);

/**
 * GET /api/admin/images/upload/sessions
 * Gets all upload sessions for the current user
 */
router.get('/upload/sessions', imageUploadController.getUserUploadSessions);

/**
 * DELETE /api/admin/images/upload/:uploadId
 * Cancels an upload session
 */
router.delete('/upload/:uploadId', imageUploadController.cancelUpload);

/**
 * GET /api/admin/images/upload/stats
 * Gets upload statistics
 */
router.get('/upload/stats', imageUploadController.getUploadStats);

/**
 * POST /api/admin/images/upload/cleanup
 * Cleans up expired upload sessions
 */
router.post('/upload/cleanup', imageUploadController.cleanupExpiredSessions);

module.exports = router;
