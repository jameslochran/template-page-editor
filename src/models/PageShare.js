/**
 * PageShare Data Model
 * Work Order #39: Implement PageShare Data Model for Collaborative Sharing
 * 
 * This model represents a page sharing record that tracks which users have access
 * to specific pages and their permission levels.
 */

const { v4: uuidv4 } = require('uuid');

class PageShare {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.pageId = data.pageId || null;
        this.userId = data.userId || null;
        this.permissionLevel = data.permissionLevel || 'view';
        this.sharedByUserId = data.sharedByUserId || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        
        this.validate();
    }

    /**
     * Validate the PageShare data
     * @throws {Error} If validation fails
     */
    validate() {
        // Validate required fields
        if (!this.pageId) {
            throw new Error('PageShare pageId is required');
        }
        
        if (!this.userId) {
            throw new Error('PageShare userId is required');
        }
        
        if (!this.sharedByUserId) {
            throw new Error('PageShare sharedByUserId is required');
        }
        
        // Validate UUID format for IDs
        if (!this.isValidUUID(this.pageId)) {
            throw new Error('PageShare pageId must be a valid UUID');
        }
        
        if (!this.isValidUUID(this.userId)) {
            throw new Error('PageShare userId must be a valid UUID');
        }
        
        if (!this.isValidUUID(this.sharedByUserId)) {
            throw new Error('PageShare sharedByUserId must be a valid UUID');
        }
        
        // Validate permission level enum
        if (!this.isValidPermissionLevel(this.permissionLevel)) {
            throw new Error('PageShare permissionLevel must be "view" or "edit"');
        }
        
        // Validate timestamps
        if (!this.isValidTimestamp(this.createdAt)) {
            throw new Error('PageShare createdAt must be a valid ISO timestamp');
        }
        
        if (!this.isValidTimestamp(this.updatedAt)) {
            throw new Error('PageShare updatedAt must be a valid ISO timestamp');
        }
    }

    /**
     * Check if a string is a valid UUID
     * @param {string} uuid - String to validate
     * @returns {boolean} True if valid UUID
     */
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Check if a permission level is valid
     * @param {string} permissionLevel - Permission level to validate
     * @returns {boolean} True if valid permission level
     */
    isValidPermissionLevel(permissionLevel) {
        return ['view', 'edit'].includes(permissionLevel);
    }

    /**
     * Check if a string is a valid ISO timestamp
     * @param {string} timestamp - String to validate
     * @returns {boolean} True if valid timestamp
     */
    isValidTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date instanceof Date && !isNaN(date.getTime());
    }

    /**
     * Update the permission level
     * @param {string} newPermissionLevel - New permission level
     * @returns {boolean} True if update was successful
     */
    updatePermissionLevel(newPermissionLevel) {
        if (!this.isValidPermissionLevel(newPermissionLevel)) {
            return false;
        }
        
        this.permissionLevel = newPermissionLevel;
        this.updatedAt = new Date().toISOString();
        return true;
    }

    /**
     * Check if the user can view the page
     * @returns {boolean} True if user can view
     */
    canView() {
        return this.permissionLevel === 'view' || this.permissionLevel === 'edit';
    }

    /**
     * Check if the user can edit the page
     * @returns {boolean} True if user can edit
     */
    canEdit() {
        return this.permissionLevel === 'edit';
    }

    /**
     * Get a summary of the PageShare for API responses
     * @returns {Object} Summary object
     */
    getSummary() {
        return {
            id: this.id,
            pageId: this.pageId,
            userId: this.userId,
            permissionLevel: this.permissionLevel,
            sharedByUserId: this.sharedByUserId,
            canView: this.canView(),
            canEdit: this.canEdit(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convert PageShare to JSON object
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            pageId: this.pageId,
            userId: this.userId,
            permissionLevel: this.permissionLevel,
            sharedByUserId: this.sharedByUserId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create a new PageShare instance
     * @param {string} pageId - Page ID
     * @param {string} userId - User ID
     * @param {string} sharedByUserId - User ID who is sharing
     * @param {string} permissionLevel - Permission level
     * @returns {PageShare} New PageShare instance
     */
    static create(pageId, userId, sharedByUserId, permissionLevel = 'view') {
        const data = {
            pageId,
            userId,
            sharedByUserId,
            permissionLevel
        };
        
        return new PageShare(data);
    }

    /**
     * Create PageShare from existing data
     * @param {Object} data - Existing data
     * @returns {PageShare} PageShare instance
     */
    static fromJSON(data) {
        return new PageShare(data);
    }

    /**
     * Validate PageShare data without creating instance
     * @param {Object} data - Data to validate
     * @returns {Object} Validation result
     */
    static validateData(data) {
        try {
            new PageShare(data);
            return { isValid: true, errors: [] };
        } catch (error) {
            return { isValid: false, errors: [error.message] };
        }
    }
}

module.exports = PageShare;
