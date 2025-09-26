/**
 * LinkGroupComponent Model
 * Work Order #24: Implement LinkGroupComponent Data Model Structure
 * 
 * This model provides structured data management for link group components
 * containing collections of links with comprehensive validation and management.
 */

const { v4: uuidv4 } = require('uuid');
const Link = require('./Link');

class LinkGroupComponent {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.type = 'LinkGroupComponent';
        this.data = this.initializeData(data.data);
        this.order = data.order || 1;
        this.createdAt = data.createdAt || data.created_at || new Date();
        this.updatedAt = data.updatedAt || data.updated_at || new Date();
    }

    /**
     * Initialize link group data with proper structure and validation
     * @param {Object} data - Data object or undefined
     * @returns {Object} Structured link group data
     */
    initializeData(data) {
        if (!data) {
            return this.getDefaultData();
        }

        return {
            links: this.initializeLinks(data.links),
            style: data.style || 'default',
            title: data.title || 'Link Group'
        };
    }

    /**
     * Get default link group data structure
     * @returns {Object} Default link group data
     */
    getDefaultData() {
        return {
            links: [
                new Link({
                    linkText: 'Home',
                    linkUrl: 'https://example.com/home',
                    linkTarget: '_self',
                    order: 0
                }),
                new Link({
                    linkText: 'About',
                    linkUrl: 'https://example.com/about',
                    linkTarget: '_self',
                    order: 1
                })
            ].map(link => link.toJSON()),
            style: 'default',
            title: 'Link Group'
        };
    }

    /**
     * Initialize links array with proper Link objects
     * @param {Array} links - Links array or undefined
     * @returns {Array} Array of Link objects as JSON
     */
    initializeLinks(links) {
        if (!links || !Array.isArray(links)) {
            return this.getDefaultData().links;
        }

        return links.map((linkData, index) => {
            const link = new Link({
                ...linkData,
                order: linkData.order !== undefined ? linkData.order : index
            });
            return link.toJSON();
        });
    }

    /**
     * Validate the LinkGroupComponent structure
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Validate ID
        if (!this.id || typeof this.id !== 'string') {
            errors.push('ID must be a non-empty string');
        }

        // Validate type
        if (this.type !== 'LinkGroupComponent') {
            errors.push('Type must be LinkGroupComponent');
        }

        // Validate order
        if (typeof this.order !== 'number' || this.order < 0) {
            errors.push('Order must be a non-negative number');
        }

        // Validate data structure
        const dataValidation = this.validateData(this.data);
        if (!dataValidation.isValid) {
            errors.push(...dataValidation.errors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate link group data structure
     * @param {Object} data - Data object to validate
     * @returns {Object} Validation result
     */
    validateData(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            return { isValid: false, errors: ['Data must be an object'] };
        }

        // Validate links array
        if (!data.links || !Array.isArray(data.links)) {
            errors.push('Links is required and must be an array');
        } else if (data.links.length === 0) {
            errors.push('Links array must contain at least one link');
        } else {
            // Validate each link
            data.links.forEach((linkData, index) => {
                const link = new Link(linkData);
                const linkValidation = link.validate();
                if (!linkValidation.isValid) {
                    errors.push(`Link ${index + 1}: ${linkValidation.errors.join(', ')}`);
                }
            });

            // Check for duplicate link texts
            const linkTexts = data.links.map(link => link.linkText);
            const uniqueLinkTexts = new Set(linkTexts);
            if (linkTexts.length !== uniqueLinkTexts.size) {
                errors.push('Link texts must be unique within the group');
            }
        }

        // Validate style (optional)
        if (data.style !== undefined && typeof data.style !== 'string') {
            errors.push('Style must be a string');
        }

        // Validate title (optional)
        if (data.title !== undefined && typeof data.title !== 'string') {
            errors.push('Title must be a string');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get all links as Link objects
     * @returns {Array} Array of Link instances
     */
    getLinks() {
        return this.data.links.map(linkData => new Link(linkData));
    }

    /**
     * Get link by ID
     * @param {string} linkId - Link ID
     * @returns {Link|null} Link instance or null
     */
    getLinkById(linkId) {
        const linkData = this.data.links.find(link => link.id === linkId);
        return linkData ? new Link(linkData) : null;
    }

    /**
     * Add a new link to the group
     * @param {Object} linkData - Link data
     * @returns {Link} Created Link instance
     */
    addLink(linkData = {}) {
        const link = new Link({
            ...linkData,
            order: this.getNextOrder()
        });

        // Validate the link
        const validation = link.validate();
        if (!validation.isValid) {
            throw new Error(`Link validation failed: ${validation.errors.join(', ')}`);
        }

        // Check for duplicate link text
        const existingTexts = this.data.links.map(l => l.linkText);
        if (existingTexts.includes(link.linkText)) {
            throw new Error('Link text must be unique within the group');
        }

        this.data.links.push(link.toJSON());
        this.updatedAt = new Date();
        return link;
    }

    /**
     * Remove a link from the group
     * @param {string} linkId - Link ID
     * @returns {boolean} Success status
     */
    removeLink(linkId) {
        const initialLength = this.data.links.length;
        this.data.links = this.data.links.filter(link => link.id !== linkId);
        
        if (this.data.links.length === initialLength) {
            throw new Error(`Link with ID '${linkId}' not found`);
        }

        if (this.data.links.length === 0) {
            throw new Error('Cannot remove the last link from the group');
        }

        // Reorder remaining links
        this.data.links.forEach((link, index) => {
            link.order = index;
        });

        this.updatedAt = new Date();
        return true;
    }

    /**
     * Update a link in the group
     * @param {string} linkId - Link ID
     * @param {Object} updates - Link updates
     * @returns {boolean} Success status
     */
    updateLink(linkId, updates) {
        const linkIndex = this.data.links.findIndex(link => link.id === linkId);
        if (linkIndex === -1) {
            throw new Error(`Link with ID '${linkId}' not found`);
        }

        const link = new Link(this.data.links[linkIndex]);
        
        // Check for duplicate link text if updating linkText
        if (updates.linkText) {
            const existingTexts = this.data.links
                .filter((_, index) => index !== linkIndex)
                .map(l => l.linkText);
            if (existingTexts.includes(updates.linkText)) {
                throw new Error('Link text must be unique within the group');
            }
        }

        link.updateData(updates);
        this.data.links[linkIndex] = link.toJSON();
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Reorder links in the group
     * @param {Array} linkIds - Array of link IDs in new order
     * @returns {boolean} Success status
     */
    reorderLinks(linkIds) {
        if (linkIds.length !== this.data.links.length) {
            throw new Error('Must provide all link IDs for reordering');
        }

        const reorderedLinks = [];
        linkIds.forEach((linkId, newOrder) => {
            const linkData = this.data.links.find(link => link.id === linkId);
            if (!linkData) {
                throw new Error(`Link with ID '${linkId}' not found`);
            }
            linkData.order = newOrder;
            reorderedLinks.push(linkData);
        });

        this.data.links = reorderedLinks;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Get next order number for new links
     * @returns {number} Next order number
     */
    getNextOrder() {
        if (this.data.links.length === 0) {
            return 0;
        }
        return Math.max(...this.data.links.map(link => link.order || 0)) + 1;
    }

    /**
     * Get links count
     * @returns {number} Number of links
     */
    getLinksCount() {
        return this.data.links.length;
    }

    /**
     * Check if link group has links
     * @returns {boolean} True if link group has links
     */
    hasLinks() {
        return this.data.links.length > 0;
    }

    /**
     * Get link group statistics
     * @returns {Object} Link group statistics
     */
    getStats() {
        const links = this.getLinks();
        const stats = {
            totalLinks: links.length,
            linksWithValidUrls: 0,
            linksWithSelfTarget: 0,
            linksWithBlankTarget: 0,
            averageTextLength: 0,
            totalTextLength: 0
        };

        links.forEach(link => {
            const linkStats = link.getStats();
            stats.totalTextLength += linkStats.textLength;
            
            if (linkStats.hasValidUrl) {
                stats.linksWithValidUrls++;
            }
            
            if (linkStats.target === '_self') {
                stats.linksWithSelfTarget++;
            } else if (linkStats.target === '_blank') {
                stats.linksWithBlankTarget++;
            }
        });

        stats.averageTextLength = links.length > 0 ? 
            Math.round(stats.totalTextLength / links.length) : 0;

        return stats;
    }

    /**
     * Search links by text or URL
     * @param {string} searchTerm - Search term
     * @returns {Array} Array of matching links with search context
     */
    searchLinks(searchTerm) {
        const matches = [];
        const links = this.getLinks();

        links.forEach(link => {
            const linkText = link.getLinkText().toLowerCase();
            const linkUrl = link.getLinkUrl().toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            if (linkText.includes(searchLower)) {
                matches.push({
                    linkId: link.id,
                    field: 'linkText',
                    content: link.getLinkText(),
                    match: searchTerm
                });
            }

            if (linkUrl.includes(searchLower)) {
                matches.push({
                    linkId: link.id,
                    field: 'linkUrl',
                    content: link.getLinkUrl(),
                    match: searchTerm
                });
            }
        });

        return matches;
    }

    /**
     * Clone the LinkGroupComponent
     * @returns {LinkGroupComponent} Cloned instance
     */
    clone() {
        const clonedData = {
            links: this.data.links.map(linkData => ({
                ...linkData,
                id: uuidv4()
            })),
            style: this.data.style,
            title: this.data.title
        };

        return new LinkGroupComponent({
            data: clonedData,
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
            type: this.type,
            data: this.data,
            order: this.order,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create LinkGroupComponent instance from JSON
     * @param {Object} json - JSON object
     * @returns {LinkGroupComponent} LinkGroupComponent instance
     */
    static fromJSON(json) {
        return new LinkGroupComponent(json);
    }

    /**
     * Create a new LinkGroupComponent with default data
     * @param {Object} options - Optional custom data
     * @returns {LinkGroupComponent} New LinkGroupComponent instance
     */
    static createDefault(options = {}) {
        const defaultData = {
            links: options.links || [
                {
                    linkText: 'Home',
                    linkUrl: 'https://example.com/home',
                    linkTarget: '_self',
                    order: 0
                },
                {
                    linkText: 'About',
                    linkUrl: 'https://example.com/about',
                    linkTarget: '_self',
                    order: 1
                }
            ],
            style: options.style || 'default',
            title: options.title || 'Link Group'
        };

        return new LinkGroupComponent({
            data: defaultData
        });
    }
}

module.exports = LinkGroupComponent;
