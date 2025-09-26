/**
 * Link Model
 * Work Order #24: Implement LinkGroupComponent Data Model Structure
 * 
 * This model provides structured data management for individual links
 * within a LinkGroupComponent, including validation for text, URL, and target fields.
 */

const { v4: uuidv4 } = require('uuid');

class Link {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.linkText = this.validateLinkText(data.linkText) || 'Link';
        this.linkUrl = this.validateLinkUrl(data.linkUrl) || '';
        this.linkTarget = this.validateLinkTarget(data.linkTarget) || '_self';
        this.order = data.order || 0;
        this.createdAt = data.createdAt || data.created_at || new Date();
        this.updatedAt = data.updatedAt || data.updated_at || new Date();
    }

    /**
     * Validate link text field (max 255 characters, not empty)
     * @param {string} linkText - Link text
     * @returns {string|null} Validated link text or null if invalid
     */
    validateLinkText(linkText) {
        if (!linkText || typeof linkText !== 'string') {
            return null;
        }

        const trimmedText = linkText.trim();
        if (trimmedText.length === 0 || trimmedText.length > 255) {
            return null;
        }

        return trimmedText;
    }

    /**
     * Validate link URL field (max 2048 characters, valid URL format)
     * @param {string} linkUrl - Link URL
     * @returns {string|null} Validated link URL or null if invalid
     */
    validateLinkUrl(linkUrl) {
        if (!linkUrl || typeof linkUrl !== 'string') {
            return null;
        }

        const trimmedUrl = linkUrl.trim();
        if (trimmedUrl.length === 0 || trimmedUrl.length > 2048) {
            return null;
        }

        // Basic URL validation
        try {
            new URL(trimmedUrl);
            return trimmedUrl;
        } catch {
            return null;
        }
    }

    /**
     * Validate link target field (only '_self' or '_blank')
     * @param {string} linkTarget - Link target
     * @returns {string} Validated link target
     */
    validateLinkTarget(linkTarget) {
        if (!linkTarget || typeof linkTarget !== 'string') {
            return '_self';
        }

        const trimmedTarget = linkTarget.trim();
        return (trimmedTarget === '_self' || trimmedTarget === '_blank') ? trimmedTarget : '_self';
    }

    /**
     * Validate the Link structure
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Validate ID
        if (!this.id || typeof this.id !== 'string') {
            errors.push('ID must be a non-empty string');
        }

        // Validate linkText
        if (!this.linkText || typeof this.linkText !== 'string') {
            errors.push('LinkText is required and must be a string');
        } else if (this.linkText.length === 0) {
            errors.push('LinkText cannot be empty');
        } else if (this.linkText.length > 255) {
            errors.push('LinkText must not exceed 255 characters');
        }

        // Validate linkUrl
        if (!this.linkUrl || typeof this.linkUrl !== 'string') {
            errors.push('LinkUrl is required and must be a string');
        } else if (this.linkUrl.length === 0) {
            errors.push('LinkUrl cannot be empty');
        } else if (this.linkUrl.length > 2048) {
            errors.push('LinkUrl must not exceed 2048 characters');
        } else {
            try {
                new URL(this.linkUrl);
            } catch {
                errors.push('LinkUrl must be a valid URL');
            }
        }

        // Validate linkTarget
        if (typeof this.linkTarget !== 'string') {
            errors.push('LinkTarget must be a string');
        } else if (this.linkTarget !== '_self' && this.linkTarget !== '_blank') {
            errors.push('LinkTarget must be either "_self" or "_blank"');
        }

        // Validate order
        if (typeof this.order !== 'number' || this.order < 0) {
            errors.push('Order must be a non-negative number');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Update link data
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    updateData(updates) {
        // Validate updated data
        const updatedLink = { ...this.toJSON(), ...updates };
        const validation = new Link(updatedLink).validate();
        
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Apply validated updates
        if (updates.linkText !== undefined) {
            const validatedText = this.validateLinkText(updates.linkText);
            if (!validatedText) {
                throw new Error('Invalid linkText: must be a non-empty string with maximum 255 characters');
            }
            this.linkText = validatedText;
        }

        if (updates.linkUrl !== undefined) {
            const validatedUrl = this.validateLinkUrl(updates.linkUrl);
            if (!validatedUrl) {
                throw new Error('Invalid linkUrl: must be a non-empty valid URL with maximum 2048 characters');
            }
            this.linkUrl = validatedUrl;
        }

        if (updates.linkTarget !== undefined) {
            this.linkTarget = this.validateLinkTarget(updates.linkTarget);
        }

        if (updates.order !== undefined) {
            this.order = updates.order;
        }

        this.updatedAt = new Date();
        return true;
    }

    /**
     * Get link text
     * @returns {string} Link text
     */
    getLinkText() {
        return this.linkText;
    }

    /**
     * Get link URL
     * @returns {string} Link URL
     */
    getLinkUrl() {
        return this.linkUrl;
    }

    /**
     * Get link target
     * @returns {string} Link target
     */
    getLinkTarget() {
        return this.linkTarget;
    }

    /**
     * Check if link has valid URL
     * @returns {boolean} True if link has valid URL
     */
    hasValidUrl() {
        return this.linkUrl && this.linkUrl.trim() !== '';
    }

    /**
     * Get link statistics
     * @returns {Object} Link statistics
     */
    getStats() {
        return {
            textLength: this.linkText.length,
            urlLength: this.linkUrl.length,
            hasValidUrl: this.hasValidUrl(),
            target: this.linkTarget
        };
    }

    /**
     * Clone the Link
     * @returns {Link} Cloned instance
     */
    clone() {
        return new Link({
            linkText: this.linkText,
            linkUrl: this.linkUrl,
            linkTarget: this.linkTarget,
            order: this.order + 1
        });
    }

    /**
     * Convert to JSON object
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            linkText: this.linkText,
            linkUrl: this.linkUrl,
            linkTarget: this.linkTarget,
            order: this.order,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create Link instance from JSON
     * @param {Object} json - JSON object
     * @returns {Link} Link instance
     */
    static fromJSON(json) {
        return new Link(json);
    }

    /**
     * Create a new Link with default data
     * @param {Object} options - Optional custom data
     * @returns {Link} New Link instance
     */
    static createDefault(options = {}) {
        const defaultData = {
            linkText: options.linkText || 'New Link',
            linkUrl: options.linkUrl || 'https://example.com',
            linkTarget: options.linkTarget || '_self',
            order: options.order || 0
        };

        return new Link(defaultData);
    }
}

module.exports = Link;
