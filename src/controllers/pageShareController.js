/**
 * Page Share Controller
 * Work Order #34: Implement Page Sharing API Endpoints with Permission Management
 * 
 * This controller handles the business logic for page sharing operations,
 * including creating, updating, revoking, and viewing page shares.
 */

const PageShare = require('../models/PageShare');
const pageRepository = require('../data/pageRepository');

// In-memory data store for page shares (simulating database)
const pageShares = [];

/**
 * Create a new page share
 * @param {string} pageId - Page ID
 * @param {string} userId - User ID to share with
 * @param {string} sharedByUserId - User ID who is sharing
 * @param {string} permissionLevel - Permission level ('view' or 'edit')
 * @returns {Object} Created share details
 */
async function createPageShare(pageId, userId, sharedByUserId, permissionLevel) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        // Check if user is trying to share with themselves
        if (userId === sharedByUserId) {
            const error = new Error('Cannot share page with yourself');
            error.code = 'CANNOT_SHARE_WITH_SELF';
            throw error;
        }

        // Check if share already exists
        const existingShare = pageShares.find(share => 
            share.pageId === pageId && share.userId === userId
        );

        if (existingShare) {
            const error = new Error('Page is already shared with this user');
            error.code = 'SHARE_ALREADY_EXISTS';
            throw error;
        }

        // Create new page share
        const pageShare = PageShare.create(pageId, userId, sharedByUserId, permissionLevel);
        
        // Store the share
        pageShares.push(pageShare.toJSON());

        return pageShare.getSummary();
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
 * @returns {Object} Updated share details
 */
async function updatePageShare(pageId, shareId, permissionLevel, requestingUserId) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        // Find the share
        const shareIndex = pageShares.findIndex(share => 
            share.id === shareId && share.pageId === pageId
        );

        if (shareIndex === -1) {
            const error = new Error('Share not found');
            error.code = 'SHARE_NOT_FOUND';
            throw error;
        }

        const shareData = pageShares[shareIndex];
        const pageShare = new PageShare(shareData);

        // Check if requesting user has permission to update this share
        if (!canManageShare(pageShare, requestingUserId)) {
            const error = new Error('Insufficient permissions to update this share');
            error.code = 'INSUFFICIENT_PERMISSIONS';
            throw error;
        }

        // Update the permission level
        const updateSuccess = pageShare.updatePermissionLevel(permissionLevel);
        if (!updateSuccess) {
            const error = new Error('Invalid permission level');
            error.code = 'INVALID_PERMISSION_LEVEL';
            throw error;
        }

        // Update the stored share
        pageShares[shareIndex] = pageShare.toJSON();

        return pageShare.getSummary();
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
 * @returns {Object} Deletion result
 */
async function deletePageShare(pageId, shareId, requestingUserId) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        // Find the share
        const shareIndex = pageShares.findIndex(share => 
            share.id === shareId && share.pageId === pageId
        );

        if (shareIndex === -1) {
            const error = new Error('Share not found');
            error.code = 'SHARE_NOT_FOUND';
            throw error;
        }

        const shareData = pageShares[shareIndex];
        const pageShare = new PageShare(shareData);

        // Check if requesting user has permission to delete this share
        if (!canManageShare(pageShare, requestingUserId)) {
            const error = new Error('Insufficient permissions to delete this share');
            error.code = 'INSUFFICIENT_PERMISSIONS';
            throw error;
        }

        // Remove the share
        const deletedShare = pageShares.splice(shareIndex, 1)[0];

        return {
            success: true,
            message: 'Page share deleted successfully',
            deletedShare: {
                id: deletedShare.id,
                userId: deletedShare.userId,
                permissionLevel: deletedShare.permissionLevel
            }
        };
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
 * @returns {Array} Array of share details
 */
async function getPageShares(pageId, requestingUserId) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        // Check if requesting user has permission to view shares
        if (!canViewPageShares(pageId, requestingUserId)) {
            const error = new Error('Insufficient permissions to view page shares');
            error.code = 'INSUFFICIENT_PERMISSIONS';
            throw error;
        }

        // Get all shares for this page
        const shares = pageShares
            .filter(share => share.pageId === pageId)
            .map(shareData => {
                const pageShare = new PageShare(shareData);
                return pageShare.getSummary();
            });

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
 * @returns {Array} Array of shared page details
 */
async function getSharedPages(userId) {
    try {
        // Get all shares for this user
        const userShares = pageShares.filter(share => share.userId === userId);
        
        const sharedPages = [];
        
        for (const shareData of userShares) {
            const pageShare = new PageShare(shareData);
            
            // Get page details
            const page = await pageRepository.getPageById(pageShare.pageId);
            if (page) {
                sharedPages.push({
                    shareId: pageShare.id,
                    pageId: pageShare.pageId,
                    permissionLevel: pageShare.permissionLevel,
                    canEdit: pageShare.canEdit(),
                    canView: pageShare.canView(),
                    sharedAt: pageShare.createdAt,
                    page: {
                        id: page.id,
                        templateId: page.templateId,
                        componentCount: page.components ? page.components.length : 0,
                        createdAt: page.createdAt,
                        updatedAt: page.updatedAt
                    }
                });
            }
        }

        // Sort by shared date (newest first)
        sharedPages.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));

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
 * @returns {boolean} True if user can view page shares
 */
function canViewPageShares(pageId, userId) {
    // For now, we'll allow the user who shared the page to view shares
    // In a real implementation, this might also include page owners
    const userShares = pageShares.filter(share => 
        share.pageId === pageId && share.sharedByUserId === userId
    );
    
    return userShares.length > 0;
}

/**
 * Check if a user has access to a page
 * @param {string} pageId - Page ID
 * @param {string} userId - User ID to check
 * @param {string} requiredPermission - Required permission level ('view' or 'edit')
 * @returns {Object} Access check result
 */
function checkPageAccess(pageId, userId, requiredPermission = 'view') {
    const userShares = pageShares.filter(share => 
        share.pageId === pageId && share.userId === userId
    );

    if (userShares.length === 0) {
        return {
            hasAccess: false,
            permissionLevel: null,
            reason: 'No share found for this user'
        };
    }

    const pageShare = new PageShare(userShares[0]);
    
    if (requiredPermission === 'edit' && !pageShare.canEdit()) {
        return {
            hasAccess: false,
            permissionLevel: pageShare.permissionLevel,
            reason: 'Insufficient permission level for edit access'
        };
    }

    if (requiredPermission === 'view' && !pageShare.canView()) {
        return {
            hasAccess: false,
            permissionLevel: pageShare.permissionLevel,
            reason: 'Insufficient permission level for view access'
        };
    }

    return {
        hasAccess: true,
        permissionLevel: pageShare.permissionLevel,
        reason: 'Access granted'
    };
}

/**
 * Get share statistics for a page
 * @param {string} pageId - Page ID
 * @returns {Object} Share statistics
 */
async function getPageShareStats(pageId) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        const pageSharesForPage = pageShares.filter(share => share.pageId === pageId);
        
        const stats = {
            totalShares: pageSharesForPage.length,
            viewShares: 0,
            editShares: 0,
            sharesByPermission: {}
        };

        pageSharesForPage.forEach(shareData => {
            const pageShare = new PageShare(shareData);
            const permission = pageShare.permissionLevel;
            
            if (permission === 'view') {
                stats.viewShares++;
            } else if (permission === 'edit') {
                stats.editShares++;
            }
            
            stats.sharesByPermission[permission] = (stats.sharesByPermission[permission] || 0) + 1;
        });

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
