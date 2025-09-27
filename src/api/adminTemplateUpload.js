const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const adminTemplatesController = require('../controllers/adminTemplatesController');

// All routes in this router require admin authentication
router.use(authenticateAdmin);

// POST /api/admin/templates/upload/initiate - Initiate a new template upload
router.post('/initiate', adminTemplatesController.initiateTemplateUpload);

// POST /api/admin/templates/upload/complete - Complete a template upload
router.post('/complete', adminTemplatesController.completeTemplateUpload);

// GET /api/admin/templates/upload/:uploadId/status - Get status of a specific upload session
router.get('/:uploadId/status', adminTemplatesController.getUploadStatus);

// GET /api/admin/templates/upload/sessions - List all active/recent upload sessions
router.get('/sessions', adminTemplatesController.getUploadSessions);

// DELETE /api/admin/templates/upload/:uploadId - Cancel an ongoing upload session
router.delete('/:uploadId', adminTemplatesController.cancelUpload);

// GET /api/admin/templates/upload/stats - Get statistics about template uploads
router.get('/stats', adminTemplatesController.getUploadStats);

module.exports = router;