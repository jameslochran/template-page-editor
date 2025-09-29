/**
 * Page Share Controller
 * Work Order #34: Implement Page Sharing API Endpoints with Permission Management
 * 
 * This controller handles the business logic for page sharing operations,
 * including creating, updating, revoking, and viewing page shares.
 */

const PageShare = require('../models/PageShare');
const pageRepository = require('../data/pageRepository');

/**
 * Create a new page share
 * @param {string} pageId - Page ID
 * @param {string} userId - User ID to share with
 * @param {string} sharedByUserId - User ID who is sharing
 * @param {string} permissionLevel - Permission level ('view' or 'edit')
 * @param {Object} req - Express request object (to access PageShareService)
 * @returns {Object} Created share details
 */
async function createPageShare(pageId, userId, sharedByUserId, permissionLevel, req) {
    try {
        const pageShareService = req.app.locals.pageShareService;
        
        // Check if user is trying to share with themselves
        if (userId === sharedByUserId) {
            const error = new Error('Cannot share page with yourself');
            error.code = 'CANNOT_SHARE_WITH_SELF';
            throw error;
        }

        // Use PageShareService to create the share
        const result = pageShareService.createPageShare(pageId, userId, sharedByUserId, permissionLevel);
        
        return result;
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to create page share: ${error.message}`);
    }
}

/**
 * Update an existing page share
 * @param {string} pageId - Page ID
 * @param {string} shareId - Share ID
 * @param {string} permissionLevel - New permission level
 * @param {string} requestingUserId - User ID making the request
 * @param {Object} req - Express request object (to access PageShareService)
 * @returns {Object} Updated share details
 */
async function updatePageShare(pageId, shareId, permissionLevel, requestingUserId, req) {
    try {
        const pageShareService = req.app.locals.pageShareService;
        
        // Get the existing share to check permissions
        const existingShare = pageShareService.getPageShareById(shareId);
        if (!existingShare) {
            const error = new Error('Share not found');
            error.code = 'SHARE_NOT_FOUND';
            throw error;
        }

        // Check if requesting user has permission to update this share
        if (existingShare.sharedByUserId !== requestingUserId) {
            const error = new Error('Insufficient permissions to update this share');
            error.code = 'INSUFFICIENT_PERMISSIONS';
            throw error;
        }

        // Use PageShareService to update the share
        const result = pageShareService.updatePageShare(shareId, permissionLevel);
        
        return result;
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to update page share: ${error.message}`);
    }
}

/**
 * Delete a page share
 * @param {string} pageId - Page ID
 * @param {string} shareId - Share ID
 * @param {string} requestingUserId - User ID making the request
 * @param {Object} req - Express request object (to access PageShareService)
 * @returns {Object} Deletion result
 */
async function deletePageShare(pageId, shareId, requestingUserId, req) {
    try {
        const pageShareService = req.app.locals.pageShareService;
        
        // Get the existing share to check permissions
        const existingShare = pageShareService.getPageShareById(shareId);
        if (!existingShare) {
            const error = new Error('Share not found');
            error.code = 'SHARE_NOT_FOUND';
            throw error;
        }

        // Check if requesting user has permission to delete this share
        if (existingShare.sharedByUserId !== requestingUserId) {
            const error = new Error('Insufficient permissions to delete this share');
            error.code = 'INSUFFICIENT_PERMISSIONS';
            throw error;
        }

        // Use PageShareService to delete the share
        const result = pageShareService.deletePageShare(shareId);
        
        return result;
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to delete page share: ${error.message}`);
    }
}

/**
 * Get all shares for a page
 * @param {string} pageId - Page ID
 * @param {string} requestingUserId - User ID making the request
 * @param {Object} req - Express request object (to access PageShareService)
 * @returns {Array} Array of share details
 */
async function getPageShares(pageId, requestingUserId, req) {
    try {
        const pageShareService = req.app.locals.pageShareService;
        
        // Check if requesting user has permission to view shares
        if (!canViewPageShares(pageId, requestingUserId, pageShareService)) {
            const error = new Error('Insufficient permissions to view page shares');
            error.code = 'INSUFFICIENT_PERMISSIONS';
            throw error;
        }

        // Use PageShareService to get shares
        const shares = pageShareService.getPageSharesByPageId(pageId);
        
        return shares;
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to get page shares: ${error.message}`);
    }
}

/**
 * Get all pages shared with a user
 * @param {string} userId - User ID
 * @param {Object} req - Express request object (to access PageShareService)
 * @returns {Array} Array of shared page details
 */
async function getSharedPages(userId, req) {
    try {
        const pageShareService = req.app.locals.pageShareService;
        
        // Use PageShareService to get shared pages
        const sharedPages = pageShareService.getPageSharesByUserId(userId);
        
        return sharedPages;
    } catch (error) {
        throw new Error(`Failed to get shared pages: ${error.message}`);
    }
}

/**
 * Check if a user can manage a share
 * @param {PageShare} pageShare - Page share to check
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user can manage the share
 */
function canManageShare(pageShare, userId) {
    // User can manage if they are the one who shared the page
    return pageShare.sharedByUserId === userId;
}

/**
 * Check if a user can view page shares
 * @param {string} pageId - Page ID
 * @param {string} userId - User ID to check
 * @param {PageShareService} pageShareService - PageShareService instance
 * @returns {boolean} True if user can view page shares
 */
function canViewPageShares(pageId, userId, pageShareService) {
    // For now, we'll allow the user who shared the page to view shares
    // In a real implementation, this might also include page owners
    const allShares = pageShareService.getAllPageShares();
    const userShares = allShares.filter(share => 
        share.pageId === pageId && share.sharedByUserId === userId
    );
    
    return userShares.length > 0;
}

/**
 * Check if a user has access to a page
 * @param {string} pageId - Page ID
 * @param {string} userId - User ID to check
 * @param {string} requiredPermission - Required permission level ('view' or 'edit')
 * @param {Object} req - Express request object (to access PageShareService)
 * @returns {Object} Access check result
 */
function checkPageAccess(pageId, userId, requiredPermission = 'view', req) {
    const pageShareService = req.app.locals.pageShareService;
    
    return pageShareService.checkPageAccess(pageId, userId, requiredPermission);
}

/**
 * Get share statistics for a page
 * @param {string} pageId - Page ID
 * @param {Object} req - Express request object (to access PageShareService)
 * @returns {Object} Share statistics
 */
async function getPageShareStats(pageId, req) {
    try {
        const pageShareService = req.app.locals.pageShareService;
        
        // Use PageShareService to get stats
        const stats = pageShareService.getPageShareStats(pageId);
        
        return stats;
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to get page share stats: ${error.message}`);
    }
}

module.exports = {
    createPageShare,
    updatePageShare,
    deletePageShare,
    getPageShares,
    getSharedPages,
    checkPageAccess,
    getPageShareStats
};
