/**
 * Page Sharing API Routes
 * Work Order #34: Implement Page Sharing API Endpoints with Permission Management
 * 
 * This module provides API endpoints for managing page sharing permissions,
 * including creating, updating, revoking, and viewing page shares.
 */

const express = require('express');
const router = express.Router();
const pageShareController = require('../controllers/pageShareController');

// Helper for UUID validation
const isValidUUID = (uuid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

// Helper for permission level validation
const isValidPermissionLevel = (permissionLevel) => {
    return ['view', 'edit'].includes(permissionLevel);
};

// Mock authentication middleware (in a real app, this would integrate with your auth system)
const authenticateUser = (req, res, next) => {
    // For demo purposes, we'll use a mock user ID
    // In a real implementation, this would extract user info from JWT token or session
    req.user = {
        id: '550e8400-e29b-41d4-a716-446655440010', // Mock authenticated user ID
        email: 'user@example.com',
        name: 'Test User'
    };
    next();
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

// Middleware to validate shareId parameter
const validateShareId = (req, res, next) => {
    const { shareId } = req.params;
    
    if (!isValidUUID(shareId)) {
        return res.status(400).json({ 
            error: 'Invalid share ID format. Must be a valid UUID.', 
            code: 'INVALID_SHARE_ID_FORMAT' 
        });
    }
    
    next();
};

// POST /api/pages/{pageId}/share - Create a new page share
router.post('/:pageId/share', authenticateUser, validatePageId, async (req, res) => {
    try {
        const { pageId } = req.params;
        const { userId, permissionLevel } = req.body;
        const sharedByUserId = req.user.id;
        
        // Validate request body
        if (!userId) {
            return res.status(400).json({ 
                error: 'User ID is required', 
                code: 'MISSING_USER_ID' 
            });
        }
        
        if (!isValidUUID(userId)) {
            return res.status(400).json({ 
                error: 'Invalid user ID format. Must be a valid UUID.', 
                code: 'INVALID_USER_ID_FORMAT' 
            });
        }
        
        if (!permissionLevel) {
            return res.status(400).json({ 
                error: 'Permission level is required', 
                code: 'MISSING_PERMISSION_LEVEL' 
            });
        }
        
        if (!isValidPermissionLevel(permissionLevel)) {
            return res.status(400).json({ 
                error: 'Invalid permission level. Must be "view" or "edit".', 
                code: 'INVALID_PERMISSION_LEVEL' 
            });
        }
        
        const result = await pageShareController.createPageShare(
            pageId, 
            userId, 
            sharedByUserId, 
            permissionLevel,
            req
        );
        
        res.status(201).json(result);
    } catch (error) {
        console.error(`Error creating page share for page ${req.params.pageId}:`, error);
        
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'CANNOT_SHARE_WITH_SELF') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'SHARE_ALREADY_EXISTS') {
            return res.status(409).json({ error: error.message, code: error.code });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

// PUT /api/pages/{pageId}/share/{shareId} - Update page share permissions
router.put('/:pageId/share/:shareId', authenticateUser, validatePageId, validateShareId, async (req, res) => {
    try {
        const { pageId, shareId } = req.params;
        const { permissionLevel } = req.body;
        const requestingUserId = req.user.id;
        
        // Validate request body
        if (!permissionLevel) {
            return res.status(400).json({ 
                error: 'Permission level is required', 
                code: 'MISSING_PERMISSION_LEVEL' 
            });
        }
        
        if (!isValidPermissionLevel(permissionLevel)) {
            return res.status(400).json({ 
                error: 'Invalid permission level. Must be "view" or "edit".', 
                code: 'INVALID_PERMISSION_LEVEL' 
            });
        }
        
        const result = await pageShareController.updatePageShare(
            pageId, 
            shareId, 
            permissionLevel, 
            requestingUserId,
            req
        );
        
        res.json(result);
    } catch (error) {
        console.error(`Error updating page share ${req.params.shareId} for page ${req.params.pageId}:`, error);
        
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'SHARE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'INSUFFICIENT_PERMISSIONS') {
            return res.status(403).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'INVALID_PERMISSION_LEVEL') {
            return res.status(400).json({ error: error.message, code: error.code });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

// DELETE /api/pages/{pageId}/share/{shareId} - Delete page share
router.delete('/:pageId/share/:shareId', authenticateUser, validatePageId, validateShareId, async (req, res) => {
    try {
        const { pageId, shareId } = req.params;
        const requestingUserId = req.user.id;
        
        const result = await pageShareController.deletePageShare(
            pageId, 
            shareId, 
            requestingUserId,
            req
        );
        
        res.json(result);
    } catch (error) {
        console.error(`Error deleting page share ${req.params.shareId} for page ${req.params.pageId}:`, error);
        
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'SHARE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'INSUFFICIENT_PERMISSIONS') {
            return res.status(403).json({ error: error.message, code: error.code });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

// GET /api/pages/{pageId}/share - Get all shares for a page
router.get('/:pageId/share', authenticateUser, validatePageId, async (req, res) => {
    try {
        const { pageId } = req.params;
        const requestingUserId = req.user.id;
        
        const shares = await pageShareController.getPageShares(pageId, requestingUserId, req);
        
        res.json(shares);
    } catch (error) {
        console.error(`Error fetching shares for page ${req.params.pageId}:`, error);
        
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        if (error.code === 'INSUFFICIENT_PERMISSIONS') {
            return res.status(403).json({ error: error.message, code: error.code });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

// GET /api/users/me/shared-pages - Get all pages shared with authenticated user
router.get('/users/me/shared-pages', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const sharedPages = await pageShareController.getSharedPages(userId, req);
        
        res.json(sharedPages);
    } catch (error) {
        console.error(`Error fetching shared pages for user ${req.user.id}:`, error);
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

// GET /api/pages/{pageId}/share/stats - Get share statistics for a page
router.get('/:pageId/share/stats', authenticateUser, validatePageId, async (req, res) => {
    try {
        const { pageId } = req.params;
        
        const stats = await pageShareController.getPageShareStats(pageId, req);
        
        res.json(stats);
    } catch (error) {
        console.error(`Error fetching share stats for page ${req.params.pageId}:`, error);
        
        if (error.code === 'PAGE_NOT_FOUND') {
            return res.status(404).json({ error: error.message, code: error.code });
        }
        
        res.status(500).json({ 
            error: 'Internal server error', 
            code: 'INTERNAL_SERVER_ERROR' 
        });
    }
});

module.exports = router;
