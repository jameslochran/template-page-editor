/**
 * PageShare Service
 * Work Order #39: Implement PageShare Data Model for Collaborative Sharing
 * 
 * This service manages PageShare records using in-memory storage and provides
 * data access methods for collaborative sharing functionality.
 */

const { v4: uuidv4 } = require('uuid');
const PageShare = require('../models/PageShare');

class PageShareService {
    constructor() {
        // In-memory storage for page shares
        this.pageShares = new Map();
        
        // In-memory storage for pages (simplified for foreign key relationships)
        this.pages = new Map();
        
        // In-memory storage for users (simplified for foreign key relationships)
        this.users = new Map();
        
        // Initialize with sample data
        this.initializeSampleData();
    }

    /**
     * Initialize sample data for demonstration
     */
    initializeSampleData() {
        // Sample pages
        const page1 = {
            id: '750e8400-e29b-41d4-a716-446655440001',
            title: 'Sample Page 1',
            templateId: 'template-1',
            components: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const page2 = {
            id: '750e8400-e29b-41d4-a716-446655440002',
            title: 'Sample Page 2',
            templateId: 'template-2',
            components: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.pages.set(page1.id, page1);
        this.pages.set(page2.id, page2);

        // Sample users
        const user1 = {
            id: '550e8400-e29b-41d4-a716-446655440010',
            email: 'user1@example.com',
            name: 'John Doe',
            createdAt: new Date().toISOString()
        };
        
        const user2 = {
            id: '550e8400-e29b-41d4-a716-446655440011',
            email: 'user2@example.com',
            name: 'Jane Smith',
            createdAt: new Date().toISOString()
        };
        
        const user3 = {
            id: '550e8400-e29b-41d4-a716-446655440012',
            email: 'user3@example.com',
            name: 'Bob Johnson',
            createdAt: new Date().toISOString()
        };
        
        const user4 = {
            id: '550e8400-e29b-41d4-a716-446655440013',
            email: 'alice.brown@example.com',
            name: 'Alice Brown',
            createdAt: new Date().toISOString()
        };
        
        const user5 = {
            id: '550e8400-e29b-41d4-a716-446655440014',
            email: 'charlie.wilson@example.com',
            name: 'Charlie Wilson',
            createdAt: new Date().toISOString()
        };

        this.users.set(user1.id, user1);
        this.users.set(user2.id, user2);
        this.users.set(user3.id, user3);
        this.users.set(user4.id, user4);
        this.users.set(user5.id, user5);

        // Sample page shares
        const share1 = PageShare.create(
            page1.id,
            user2.id,
            user1.id,
            'edit'
        );
        
        const share2 = PageShare.create(
            page1.id,
            user3.id,
            user1.id,
            'view'
        );
        
        const share3 = PageShare.create(
            page2.id,
            user1.id,
            user2.id,
            'edit'
        );

        this.pageShares.set(share1.id, share1);
        this.pageShares.set(share2.id, share2);
        this.pageShares.set(share3.id, share3);

        console.log('PageShareService initialized with sample data:');
        console.log(`- ${this.pages.size} pages`);
        console.log(`- ${this.users.size} users`);
        console.log(`- ${this.pageShares.size} page shares`);
    }

    /**
     * Create a new page share
     * @param {string} pageId - Page ID
     * @param {string} userId - User ID to share with
     * @param {string} sharedByUserId - User ID who is sharing
     * @param {string} permissionLevel - Permission level ('view' or 'edit')
     * @returns {Object} Created share details
     */
    createPageShare(pageId, userId, sharedByUserId, permissionLevel = 'view') {
        try {
            // Validate that page exists
            if (!this.pages.has(pageId)) {
                const error = new Error('Page not found');
                error.code = 'PAGE_NOT_FOUND';
                throw error;
            }

            // Validate that user exists
            if (!this.users.has(userId)) {
                const error = new Error('User not found');
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            // Validate that sharedBy user exists
            if (!this.users.has(sharedByUserId)) {
                const error = new Error('SharedBy user not found');
                error.code = 'SHARED_BY_USER_NOT_FOUND';
                throw error;
            }

            // Check if share already exists
            const existingShare = this.getPageShareByPageAndUser(pageId, userId);
            if (existingShare) {
                const error = new Error('Page is already shared with this user');
                error.code = 'SHARE_ALREADY_EXISTS';
                throw error;
            }

            // Create new page share
            const pageShare = PageShare.create(pageId, userId, sharedByUserId, permissionLevel);
            
            // Store the share
            this.pageShares.set(pageShare.id, pageShare);

            console.log(`Created page share: ${pageShare.id} for page ${pageId} with user ${userId} (${permissionLevel})`);
            
            return pageShare.getSummary();
        } catch (error) {
            if (error.code) {
                throw error;
            }
            throw new Error(`Failed to create page share: ${error.message}`);
        }
    }

    /**
     * Get all page shares for a specific page
     * @param {string} pageId - Page ID
     * @returns {Array} Array of page share summaries
     */
    getPageSharesByPageId(pageId) {
        try {
            // Validate that page exists
            if (!this.pages.has(pageId)) {
                const error = new Error('Page not found');
                error.code = 'PAGE_NOT_FOUND';
                throw error;
            }

            const shares = [];
            for (const [shareId, pageShare] of this.pageShares) {
                if (pageShare.pageId === pageId) {
                    shares.push(pageShare.getSummary());
                }
            }

            // Sort by creation date (newest first)
            shares.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            console.log(`Retrieved ${shares.length} page shares for page ${pageId}`);
            return shares;
        } catch (error) {
            if (error.code) {
                throw error;
            }
            throw new Error(`Failed to get page shares for page ${pageId}: ${error.message}`);
        }
    }

    /**
     * Get all page shares for a specific user
     * @param {string} userId - User ID
     * @returns {Array} Array of page share summaries with page details
     */
    getPageSharesByUserId(userId) {
        try {
            // Validate that user exists
            if (!this.users.has(userId)) {
                const error = new Error('User not found');
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            const shares = [];
            for (const [shareId, pageShare] of this.pageShares) {
                if (pageShare.userId === userId) {
                    const page = this.pages.get(pageShare.pageId);
                    if (page) {
                        shares.push({
                            ...pageShare.getSummary(),
                            page: {
                                id: page.id,
                                title: page.title,
                                templateId: page.templateId,
                                componentCount: page.components ? page.components.length : 0,
                                createdAt: page.createdAt,
                                updatedAt: page.updatedAt
                            }
                        });
                    }
                }
            }

            // Sort by creation date (newest first)
            shares.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            console.log(`Retrieved ${shares.length} page shares for user ${userId}`);
            return shares;
        } catch (error) {
            if (error.code) {
                throw error;
            }
            throw new Error(`Failed to get page shares for user ${userId}: ${error.message}`);
        }
    }

    /**
     * Get a specific page share by ID
     * @param {string} shareId - Share ID
     * @returns {Object|null} Page share or null if not found
     */
    getPageShareById(shareId) {
        const pageShare = this.pageShares.get(shareId);
        return pageShare ? pageShare.getSummary() : null;
    }

    /**
     * Get a page share by page ID and user ID
     * @param {string} pageId - Page ID
     * @param {string} userId - User ID
     * @returns {Object|null} Page share or null if not found
     */
    getPageShareByPageAndUser(pageId, userId) {
        for (const [shareId, pageShare] of this.pageShares) {
            if (pageShare.pageId === pageId && pageShare.userId === userId) {
                return pageShare.getSummary();
            }
        }
        return null;
    }

    /**
     * Update a page share's permission level
     * @param {string} shareId - Share ID
     * @param {string} permissionLevel - New permission level
     * @returns {Object} Updated share details
     */
    updatePageShare(shareId, permissionLevel) {
        try {
            const pageShare = this.pageShares.get(shareId);
            if (!pageShare) {
                const error = new Error('Page share not found');
                error.code = 'SHARE_NOT_FOUND';
                throw error;
            }

            const updateSuccess = pageShare.updatePermissionLevel(permissionLevel);
            if (!updateSuccess) {
                const error = new Error('Invalid permission level');
                error.code = 'INVALID_PERMISSION_LEVEL';
                throw error;
            }

            console.log(`Updated page share ${shareId} permission level to ${permissionLevel}`);
            return pageShare.getSummary();
        } catch (error) {
            if (error.code) {
                throw error;
            }
            throw new Error(`Failed to update page share ${shareId}: ${error.message}`);
        }
    }

    /**
     * Delete a page share
     * @param {string} shareId - Share ID
     * @returns {Object} Deletion result
     */
    deletePageShare(shareId) {
        try {
            const pageShare = this.pageShares.get(shareId);
            if (!pageShare) {
                const error = new Error('Page share not found');
                error.code = 'SHARE_NOT_FOUND';
                throw error;
            }

            this.pageShares.delete(shareId);

            console.log(`Deleted page share ${shareId}`);
            return {
                success: true,
                message: 'Page share deleted successfully',
                deletedShare: {
                    id: pageShare.id,
                    pageId: pageShare.pageId,
                    userId: pageShare.userId,
                    permissionLevel: pageShare.permissionLevel
                }
            };
        } catch (error) {
            if (error.code) {
                throw error;
            }
            throw new Error(`Failed to delete page share ${shareId}: ${error.message}`);
        }
    }

    /**
     * Get share statistics for a page
     * @param {string} pageId - Page ID
     * @returns {Object} Share statistics
     */
    getPageShareStats(pageId) {
        try {
            // Validate that page exists
            if (!this.pages.has(pageId)) {
                const error = new Error('Page not found');
                error.code = 'PAGE_NOT_FOUND';
                throw error;
            }

            const pageSharesForPage = [];
            for (const [shareId, pageShare] of this.pageShares) {
                if (pageShare.pageId === pageId) {
                    pageSharesForPage.push(pageShare);
                }
            }
            
            const stats = {
                totalShares: pageSharesForPage.length,
                viewShares: 0,
                editShares: 0,
                sharesByPermission: {}
            };

            pageSharesForPage.forEach(pageShare => {
                const permission = pageShare.permissionLevel;
                
                if (permission === 'view') {
                    stats.viewShares++;
                } else if (permission === 'edit') {
                    stats.editShares++;
                }
                
                stats.sharesByPermission[permission] = (stats.sharesByPermission[permission] || 0) + 1;
            });

            console.log(`Retrieved share stats for page ${pageId}: ${stats.totalShares} total shares`);
            return stats;
        } catch (error) {
            if (error.code) {
                throw error;
            }
            throw new Error(`Failed to get share stats for page ${pageId}: ${error.message}`);
        }
    }

    /**
     * Check if a user has access to a page
     * @param {string} pageId - Page ID
     * @param {string} userId - User ID
     * @param {string} requiredPermission - Required permission level ('view' or 'edit')
     * @returns {Object} Access check result
     */
    checkPageAccess(pageId, userId, requiredPermission = 'view') {
        for (const [shareId, pageShare] of this.pageShares) {
            if (pageShare.pageId === pageId && pageShare.userId === userId) {
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
        }

        return {
            hasAccess: false,
            permissionLevel: null,
            reason: 'No share found for this user'
        };
    }

    /**
     * Get all page shares (for debugging/admin purposes)
     * @returns {Array} All page shares
     */
    getAllPageShares() {
        const shares = [];
        for (const [shareId, pageShare] of this.pageShares) {
            shares.push(pageShare.getSummary());
        }
        return shares;
    }

    /**
     * Get service statistics
     * @returns {Object} Service statistics
     */
    getServiceStats() {
        return {
            totalPageShares: this.pageShares.size,
            totalPages: this.pages.size,
            totalUsers: this.users.size,
            sharesByPermission: this.getSharesByPermissionStats()
        };
    }

    /**
     * Get statistics by permission level
     * @returns {Object} Permission level statistics
     */
    getSharesByPermissionStats() {
        const stats = { view: 0, edit: 0 };
        for (const [shareId, pageShare] of this.pageShares) {
            stats[pageShare.permissionLevel]++;
        }
        return stats;
    }
}

module.exports = PageShareService;
