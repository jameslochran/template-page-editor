const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const adminTemplateController = require('../controllers/adminTemplateController');
const {
    validateInitiateTemplateUpload,
    validateCompleteTemplateUpload,
    validateUpdateUploadProgress,
    validateGetUploadStatus
} = require('../schemas/templateUploadSchemas');

// All routes in this router require admin authentication
router.use(authenticateAdmin);

// POST /api/admin/templates/upload/initiate - Initiate a new template upload
router.post('/initiate', validateInitiateTemplateUpload, adminTemplateController.initiateTemplateUpload);

// POST /api/admin/templates/upload/complete - Complete a template upload
router.post('/complete', validateCompleteTemplateUpload, adminTemplateController.completeTemplateUpload);

// PUT /api/admin/templates/upload/:uploadId/progress - Update upload progress
router.put('/:uploadId/progress', validateUpdateUploadProgress, adminTemplateController.updateUploadProgress);

// GET /api/admin/templates/upload/:uploadId/status - Get status of a specific upload session
router.get('/:uploadId/status', validateGetUploadStatus, adminTemplateController.getUploadStatus);

// DELETE /api/admin/templates/upload/:uploadId - Cancel an ongoing upload session
router.delete('/:uploadId', validateGetUploadStatus, adminTemplateController.cancelUpload);

module.exports = router;