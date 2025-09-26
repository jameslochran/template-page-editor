/**
 * PageVersion Data Model
 * Work Order #31: Implement Page Version Management API Endpoints
 * 
 * This model represents a version of a page, storing the components
 * and metadata for historical page states.
 */

const { v4: uuidv4 } = require('uuid');

class PageVersion {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.pageId = data.pageId || data.page_id;
        this.versionNumber = data.versionNumber || data.version_number || 1;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.userId = data.userId || data.user_id || 'system'; // Default to 'system' for now
        this.versionName = data.versionName || data.version_name || null;
        this.changeDescription = data.changeDescription || data.change_description || null;
        this.components = data.components || [];
        
        // Validate the data
        const validation = this.validate();
        if (!validation.isValid) {
            throw new Error(`Invalid PageVersion data: ${validation.errors.join(', ')}`);
        }
    }

    /**
     * Validate the PageVersion data
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

        if (typeof this.versionNumber !== 'number' || this.versionNumber < 1) {
            errors.push('Version number must be a positive integer');
        }

        if (!this.timestamp) {
            errors.push('Timestamp is required');
        } else if (!this.isValidTimestamp(this.timestamp)) {
            errors.push('Timestamp must be a valid ISO 8601 date string');
        }

        if (!this.userId) {
            errors.push('User ID is required');
        }

        // Validate optional fields
        if (this.versionName !== null && typeof this.versionName !== 'string') {
            errors.push('Version name must be a string or null');
        }

        if (this.changeDescription !== null && typeof this.changeDescription !== 'string') {
            errors.push('Change description must be a string or null');
        }

        if (!Array.isArray(this.components)) {
            errors.push('Components must be an array');
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
     * Validate timestamp format
     * @param {string} timestamp - Timestamp string to validate
     * @returns {boolean} True if valid ISO 8601 timestamp
     */
    isValidTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date instanceof Date && !isNaN(date) && date.toISOString() === timestamp;
    }

    /**
     * Get metadata for this version (excluding components for performance)
     * @returns {Object} Version metadata
     */
    getMetadata() {
        return {
            id: this.id,
            pageId: this.pageId,
            versionNumber: this.versionNumber,
            timestamp: this.timestamp,
            userId: this.userId,
            versionName: this.versionName,
            changeDescription: this.changeDescription,
            componentCount: this.components.length
        };
    }

    /**
     * Get full version data including components
     * @returns {Object} Complete version data
     */
    getFullData() {
        return {
            id: this.id,
            pageId: this.pageId,
            versionNumber: this.versionNumber,
            timestamp: this.timestamp,
            userId: this.userId,
            versionName: this.versionName,
            changeDescription: this.changeDescription,
            components: this.components
        };
    }

    /**
     * Convert to JSON format
     * @returns {Object} JSON representation
     */
    toJSON() {
        return this.getFullData();
    }

    /**
     * Create PageVersion from JSON
     * @param {Object} json - JSON data
     * @returns {PageVersion} PageVersion instance
     */
    static fromJSON(json) {
        return new PageVersion(json);
    }

    /**
     * Create a new PageVersion from page data
     * @param {string} pageId - Page ID
     * @param {Array} components - Page components
     * @param {Object} options - Additional options
     * @returns {PageVersion} New PageVersion instance
     */
    static createFromPage(pageId, components, options = {}) {
        const data = {
            pageId: pageId,
            components: components,
            versionNumber: options.versionNumber || 1,
            userId: options.userId || 'system',
            versionName: options.versionName || null,
            changeDescription: options.changeDescription || null
        };

        return new PageVersion(data);
    }

    /**
     * Get version summary for display
     * @returns {Object} Version summary
     */
    getSummary() {
        return {
            id: this.id,
            versionNumber: this.versionNumber,
            timestamp: this.timestamp,
            versionName: this.versionName || `Version ${this.versionNumber}`,
            changeDescription: this.changeDescription,
            componentCount: this.components.length,
            isLatest: false // This would be determined by comparing with other versions
        };
    }

    /**
     * Check if this version has the same components as another version
     * @param {PageVersion} otherVersion - Other version to compare
     * @returns {boolean} True if components are identical
     */
    hasSameComponents(otherVersion) {
        if (!otherVersion || !Array.isArray(otherVersion.components)) {
            return false;
        }

        if (this.components.length !== otherVersion.components.length) {
            return false;
        }

        // Deep comparison of components (simplified)
        return JSON.stringify(this.components) === JSON.stringify(otherVersion.components);
    }

    /**
     * Get component statistics
     * @returns {Object} Component statistics
     */
    getComponentStats() {
        const stats = {
            totalComponents: this.components.length,
            componentTypes: {}
        };

        this.components.forEach(component => {
            const type = component.type || 'Unknown';
            stats.componentTypes[type] = (stats.componentTypes[type] || 0) + 1;
        });

        return stats;
    }
}

module.exports = PageVersion;
