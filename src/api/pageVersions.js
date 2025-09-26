/**
 * Page Version Management API Routes
 * Work Order #31: Implement Page Version Management API Endpoints
 * 
 * This module provides API endpoints for managing page versions,
 * including creating, listing, retrieving, and reverting page versions.
 */

const express = require('express');
const router = express.Router();
const pageVersionController = require('../controllers/pageVersionController');

// Helper for UUID validation
const isValidUUID = (uuid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

// Middleware to validate pageId parameter
const validatePageId = (req, res, next) => {
    const { pageId } = req.params;
    
    if (!isValidUUID(pageId)) {
        return res.status(400).json({ 
            error: 'Invalid page ID format. Must be a valid UUID.', 
            code: 'INVALID_PAGE_ID_FORMAT' 
        });
    }
    
    next();
};

// Middleware to validate versionId parameter
const validateVersionId = (req, res, next) => {
    const { versionId } = req.params;
    
    if (!isValidUUID(versionId)) {
        return res.status(400).json({ 
            error: 'Invalid version ID format. Must be a valid UUID.', 
            code: 'INVALID_VERSION_ID_FORMAT' 
        });
    }
    
    next();
};

// POST /api/pages/{pageId}/versions - Create a new page version
router.post('/:pageId/versions', validatePageId, async (req, res) => {
    try {
        const { pageId } = req.params;
        const { versionName, changeDescription } = req.body;
        
        // Validate request body
        if (versionName && typeof versionName !== 'string') {
            return res.status(400).json({ 
                error: 'Version name must be a string', 
                code: 'INVALID_VERSION_NAME_TYPE' 
            });
        }
        
        if (changeDescription && typeof changeDescription !== 'string') {
            return res.status(400).json({ 
                error: 'Change description must be a string', 
                code: 'INVALID_CHANGE_DESCRIPTION_TYPE' 
            });
        }
        
        const result = await pageVersionController.createPageVersion(pageId, {
            versionName,
            changeDescription
        });
        
        res.status(201).json(result);
    } catch (error) {
        console.error(`Error creating page version for page ${req.params.pageId}:`, error);
        
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'INVALID_PAGE_DATA') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

// GET /api/pages/{pageId}/versions - Get all versions for a page
router.get('/:pageId/versions', validatePageId, async (req, res) => {
    try {
        const { pageId } = req.params;
        
        const versions = await pageVersionController.getPageVersions(pageId);
        
        res.json(versions);
    } catch (error) {
        console.error(`Error fetching versions for page ${req.params.pageId}:`, error);
        
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

// GET /api/pages/{pageId}/versions/{versionId} - Get specific version content
router.get('/:pageId/versions/:versionId', validatePageId, validateVersionId, async (req, res) => {
    try {
        const { pageId, versionId } = req.params;
        
        const version = await pageVersionController.getPageVersionContent(pageId, versionId);
        
        res.json(version);
    } catch (error) {
        console.error(`Error fetching version ${req.params.versionId} for page ${req.params.pageId}:`, error);
        
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'VERSION_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

// POST /api/pages/{pageId}/revert/{versionId} - Revert page to specific version
router.post('/:pageId/revert/:versionId', validatePageId, validateVersionId, async (req, res) => {
    try {
        const { pageId, versionId } = req.params;
        const { createBackup = true } = req.body;
        
        // Validate request body
        if (typeof createBackup !== 'boolean') {
            return res.status(400).json({ 
                error: 'createBackup must be a boolean', 
                code: 'INVALID_CREATE_BACKUP_TYPE' 
            });
        }
        
        const result = await pageVersionController.revertPageToVersion(pageId, versionId, createBackup);
        
        res.json(result);
    } catch (error) {
        console.error(`Error reverting page ${req.params.pageId} to version ${req.params.versionId}:`, error);
        
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'VERSION_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'INVALID_PAGE_DATA') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

module.exports = router;
