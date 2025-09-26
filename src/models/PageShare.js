/**
 * PageShare Data Model
 * Work Order #34: Implement Page Sharing API Endpoints with Permission Management
 * 
 * This model represents a page sharing relationship between a page owner
 * and another user with specific permission levels.
 */

const { v4: uuidv4 } = require('uuid');

class PageShare {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.pageId = data.pageId || data.page_id;
        this.userId = data.userId || data.user_id;
        this.sharedByUserId = data.sharedByUserId || data.shared_by_user_id;
        this.permissionLevel = data.permissionLevel || data.permission_level || 'view';
        this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
        this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
        
        // Validate the data
        const validation = this.validate();
        if (!validation.isValid) {
            throw new Error(`Invalid PageShare data: ${validation.errors.join(', ')}`);
        }
    }

    /**
     * Validate the PageShare data
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Validate required fields
        if (!this.id) {
            errors.push('ID is required');
        } else if (!this.isValidUUID(this.id)) {
            errors.push('ID must be a valid UUID');
        }

        if (!this.pageId) {
            errors.push('Page ID is required');
        } else if (!this.isValidUUID(this.pageId)) {
            errors.push('Page ID must be a valid UUID');
        }

        if (!this.userId) {
            errors.push('User ID is required');
        } else if (!this.isValidUUID(this.userId)) {
            errors.push('User ID must be a valid UUID');
        }

        if (!this.sharedByUserId) {
            errors.push('Shared by user ID is required');
        } else if (!this.isValidUUID(this.sharedByUserId)) {
            errors.push('Shared by user ID must be a valid UUID');
        }

        // Validate permission level
        if (!this.permissionLevel) {
            errors.push('Permission level is required');
        } else if (!this.isValidPermissionLevel(this.permissionLevel)) {
            errors.push('Permission level must be either "view" or "edit"');
        }

        // Validate timestamps
        if (!this.createdAt) {
            errors.push('Created at timestamp is required');
        } else if (!this.isValidTimestamp(this.createdAt)) {
            errors.push('Created at must be a valid ISO 8601 date string');
        }

        if (!this.updatedAt) {
            errors.push('Updated at timestamp is required');
        } else if (!this.isValidTimestamp(this.updatedAt)) {
            errors.push('Updated at must be a valid ISO 8601 date string');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate UUID format
     * @param {string} uuid - UUID string to validate
     * @returns {boolean} True if valid UUID
     */
    isValidUUID(uuid) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
    }

    /**
     * Validate permission level
     * @param {string} permissionLevel - Permission level to validate
     * @returns {boolean} True if valid permission level
     */
    isValidPermissionLevel(permissionLevel) {
        return ['view', 'edit'].includes(permissionLevel);
    }

    /**
     * Validate timestamp format
     * @param {string} timestamp - Timestamp string to validate
     * @returns {boolean} True if valid ISO 8601 timestamp
     */
    isValidTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date instanceof Date && !isNaN(date) && date.toISOString() === timestamp;
    }

    /**
     * Check if this share allows editing
     * @returns {boolean} True if permission level is 'edit'
     */
    canEdit() {
        return this.permissionLevel === 'edit';
    }

    /**
     * Check if this share allows viewing
     * @returns {boolean} True if permission level is 'view' or 'edit'
     */
    canView() {
        return ['view', 'edit'].includes(this.permissionLevel);
    }

    /**
     * Update permission level
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
     * Get share summary for display
     * @returns {Object} Share summary
     */
    getSummary() {
        return {
            id: this.id,
            pageId: this.pageId,
            userId: this.userId,
            sharedByUserId: this.sharedByUserId,
            permissionLevel: this.permissionLevel,
            canEdit: this.canEdit(),
            canView: this.canView(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convert to JSON format
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            pageId: this.pageId,
            userId: this.userId,
            sharedByUserId: this.sharedByUserId,
            permissionLevel: this.permissionLevel,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create PageShare from JSON
     * @param {Object} json - JSON data
     * @returns {PageShare} PageShare instance
     */
    static fromJSON(json) {
        return new PageShare(json);
    }

    /**
     * Create a new PageShare
     * @param {string} pageId - Page ID
     * @param {string} userId - User ID to share with
     * @param {string} sharedByUserId - User ID who is sharing
     * @param {string} permissionLevel - Permission level ('view' or 'edit')
     * @returns {PageShare} New PageShare instance
     */
    static create(pageId, userId, sharedByUserId, permissionLevel = 'view') {
        const data = {
            pageId: pageId,
            userId: userId,
            sharedByUserId: sharedByUserId,
            permissionLevel: permissionLevel
        };

        return new PageShare(data);
    }

    /**
     * Check if two shares are for the same page and user
     * @param {PageShare} otherShare - Other share to compare
     * @returns {boolean} True if shares are for same page and user
     */
    isSameShare(otherShare) {
        return this.pageId === otherShare.pageId && this.userId === otherShare.userId;
    }

    /**
     * Get permission level hierarchy
     * @returns {Object} Permission hierarchy information
     */
    getPermissionHierarchy() {
        return {
            view: 1,
            edit: 2
        };
    }

    /**
     * Check if this share has higher or equal permission than another
     * @param {string} otherPermissionLevel - Other permission level to compare
     * @returns {boolean} True if this share has higher or equal permission
     */
    hasHigherOrEqualPermission(otherPermissionLevel) {
        const hierarchy = this.getPermissionHierarchy();
        const thisLevel = hierarchy[this.permissionLevel] || 0;
        const otherLevel = hierarchy[otherPermissionLevel] || 0;
        return thisLevel >= otherLevel;
    }
}

module.exports = PageShare;
