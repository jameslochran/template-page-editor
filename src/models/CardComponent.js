/**
 * CardComponent Model
 * Work Order #18: Implement CardComponent Data Model Structure and Validation
 * 
 * This model provides structured data management for card components
 * with title, rich text description, image, and link functionality.
 */

const { v4: uuidv4 } = require('uuid');
const TextComponent = require('./TextComponent');

class CardComponent {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.type = 'CardComponent';
        this.data = this.initializeData(data.data);
        this.order = data.order || 1;
        this.createdAt = data.createdAt || data.created_at || new Date();
        this.updatedAt = data.updatedAt || data.updated_at || new Date();
    }

    /**
     * Initialize card data with proper structure and validation
     * @param {Object} data - Data object or undefined
     * @returns {Object} Structured card data
     */
    initializeData(data) {
        if (!data) {
            return this.getDefaultData();
        }

        return {
            title: this.validateTitle(data.title) || 'Card Title',
            description: this.initializeDescription(data.description),
            imageUrl: this.validateImageUrl(data.imageUrl) || '',
            altText: this.validateAltText(data.altText) || '',
            linkUrl: this.validateLinkUrl(data.linkUrl) || '',
            linkText: this.validateLinkText(data.linkText) || '',
            linkTarget: this.validateLinkTarget(data.linkTarget) || '_self',
            style: data.style || 'default'
        };
    }

    /**
     * Get default card data structure
     * @returns {Object} Default card data
     */
    getDefaultData() {
        return {
            title: 'Card Title',
            description: {
                format: 'html',
                data: '<p>Card description goes here...</p>',
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            },
            imageUrl: '',
            altText: '',
            linkUrl: '',
            linkText: '',
            linkTarget: '_self',
            style: 'default'
        };
    }

    /**
     * Initialize description using TextComponent structure
     * @param {Object|string} description - Description data or undefined
     * @returns {Object} Structured description object
     */
    initializeDescription(description) {
        if (!description) {
            return {
                format: 'html',
                data: '<p>Card description goes here...</p>',
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            };
        }

        // Handle string description
        if (typeof description === 'string') {
            return {
                format: 'html',
                data: description,
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            };
        }

        // Handle object description
        if (typeof description === 'object') {
            return {
                format: description.format || 'html',
                data: description.data || '<p>Card description goes here...</p>',
                metadata: {
                    version: description.metadata?.version || '1.0',
                    created: description.metadata?.created || new Date().toISOString(),
                    lastModified: description.metadata?.lastModified || new Date().toISOString()
                }
            };
        }

        return {
            format: 'html',
            data: '<p>Card description goes here...</p>',
            metadata: {
                version: '1.0',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        };
    }

    /**
     * Validate title field (max 255 characters)
     * @param {string} title - Title text
     * @returns {string|null} Validated title or null if invalid
     */
    validateTitle(title) {
        if (!title || typeof title !== 'string') {
            return null;
        }

        const trimmedTitle = title.trim();
        return trimmedTitle.length <= 255 ? trimmedTitle : null;
    }

    /**
     * Validate image URL field (max 2048 characters)
     * @param {string} imageUrl - Image URL
     * @returns {string|null} Validated image URL or null if invalid
     */
    validateImageUrl(imageUrl) {
        if (!imageUrl || typeof imageUrl !== 'string') {
            return null;
        }

        const trimmedUrl = imageUrl.trim();
        if (trimmedUrl.length > 2048) {
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
     * Validate alt text field (max 255 characters)
     * @param {string} altText - Alt text
     * @returns {string|null} Validated alt text or null if invalid
     */
    validateAltText(altText) {
        if (!altText || typeof altText !== 'string') {
            return null;
        }

        const trimmedAltText = altText.trim();
        return trimmedAltText.length <= 255 ? trimmedAltText : null;
    }

    /**
     * Validate link URL field (max 2048 characters)
     * @param {string} linkUrl - Link URL
     * @returns {string|null} Validated link URL or null if invalid
     */
    validateLinkUrl(linkUrl) {
        if (!linkUrl || typeof linkUrl !== 'string') {
            return null;
        }

        const trimmedUrl = linkUrl.trim();
        if (trimmedUrl.length > 2048) {
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
     * Validate link text field (max 255 characters)
     * @param {string} linkText - Link text
     * @returns {string|null} Validated link text or null if invalid
     */
    validateLinkText(linkText) {
        if (!linkText || typeof linkText !== 'string') {
            return null;
        }

        const trimmedLinkText = linkText.trim();
        return trimmedLinkText.length <= 255 ? trimmedLinkText : null;
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
     * Validate the CardComponent structure
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Validate ID
        if (!this.id || typeof this.id !== 'string') {
            errors.push('ID must be a non-empty string');
        }

        // Validate type
        if (this.type !== 'CardComponent') {
            errors.push('Type must be CardComponent');
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
     * Validate card data structure
     * @param {Object} data - Data object to validate
     * @returns {Object} Validation result
     */
    validateData(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            return { isValid: false, errors: ['Data must be an object'] };
        }

        // Validate title
        if (!data.title || typeof data.title !== 'string') {
            errors.push('Title is required and must be a string');
        } else if (data.title.length > 255) {
            errors.push('Title must not exceed 255 characters');
        }

        // Validate description
        if (!data.description || typeof data.description !== 'object') {
            errors.push('Description is required and must be an object');
        } else {
            const textComponent = new TextComponent({ content: data.description });
            const descriptionValidation = textComponent.validateContent(data.description);
            if (!descriptionValidation.isValid) {
                errors.push(...descriptionValidation.errors.map(err => `Description: ${err}`));
            }
        }

        // Validate imageUrl (optional)
        if (data.imageUrl !== undefined && data.imageUrl !== '') {
            if (typeof data.imageUrl !== 'string') {
                errors.push('ImageUrl must be a string');
            } else if (data.imageUrl.length > 2048) {
                errors.push('ImageUrl must not exceed 2048 characters');
            } else {
                try {
                    new URL(data.imageUrl);
                } catch {
                    errors.push('ImageUrl must be a valid URL');
                }
            }
        }

        // Validate altText (optional)
        if (data.altText !== undefined && data.altText !== '') {
            if (typeof data.altText !== 'string') {
                errors.push('AltText must be a string');
            } else if (data.altText.length > 255) {
                errors.push('AltText must not exceed 255 characters');
            }
        }

        // Validate linkUrl (optional)
        if (data.linkUrl !== undefined && data.linkUrl !== '') {
            if (typeof data.linkUrl !== 'string') {
                errors.push('LinkUrl must be a string');
            } else if (data.linkUrl.length > 2048) {
                errors.push('LinkUrl must not exceed 2048 characters');
            } else {
                try {
                    new URL(data.linkUrl);
                } catch {
                    errors.push('LinkUrl must be a valid URL');
                }
            }
        }

        // Validate linkText (optional)
        if (data.linkText !== undefined && data.linkText !== '') {
            if (typeof data.linkText !== 'string') {
                errors.push('LinkText must be a string');
            } else if (data.linkText.length > 255) {
                errors.push('LinkText must not exceed 255 characters');
            }
        }

        // Validate linkTarget
        if (data.linkTarget !== undefined) {
            if (typeof data.linkTarget !== 'string') {
                errors.push('LinkTarget must be a string');
            } else if (data.linkTarget !== '_self' && data.linkTarget !== '_blank') {
                errors.push('LinkTarget must be either "_self" or "_blank"');
            }
        }

        // Validate style (optional)
        if (data.style !== undefined && typeof data.style !== 'string') {
            errors.push('Style must be a string');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Update card data
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    updateData(updates) {
        const updatedData = { ...this.data, ...updates };

        // Validate updated data
        const validation = this.validateData(updatedData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Apply validated updates
        if (updates.title !== undefined) {
            const validatedTitle = this.validateTitle(updates.title);
            if (!validatedTitle) {
                throw new Error('Invalid title: must be a string with maximum 255 characters');
            }
            updatedData.title = validatedTitle;
        }

        if (updates.description !== undefined) {
            updatedData.description = this.initializeDescription(updates.description);
        }

        if (updates.imageUrl !== undefined) {
            updatedData.imageUrl = updates.imageUrl ? this.validateImageUrl(updates.imageUrl) : '';
            if (updates.imageUrl && !updatedData.imageUrl) {
                throw new Error('Invalid imageUrl: must be a valid URL with maximum 2048 characters');
            }
        }

        if (updates.altText !== undefined) {
            updatedData.altText = updates.altText ? this.validateAltText(updates.altText) : '';
            if (updates.altText && !updatedData.altText) {
                throw new Error('Invalid altText: must be a string with maximum 255 characters');
            }
        }

        if (updates.linkUrl !== undefined) {
            updatedData.linkUrl = updates.linkUrl ? this.validateLinkUrl(updates.linkUrl) : '';
            if (updates.linkUrl && !updatedData.linkUrl) {
                throw new Error('Invalid linkUrl: must be a valid URL with maximum 2048 characters');
            }
        }

        if (updates.linkText !== undefined) {
            updatedData.linkText = updates.linkText ? this.validateLinkText(updates.linkText) : '';
            if (updates.linkText && !updatedData.linkText) {
                throw new Error('Invalid linkText: must be a string with maximum 255 characters');
            }
        }

        if (updates.linkTarget !== undefined) {
            updatedData.linkTarget = this.validateLinkTarget(updates.linkTarget);
        }

        if (updates.style !== undefined) {
            updatedData.style = updates.style;
        }

        this.data = updatedData;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Get title
     * @returns {string} Card title
     */
    getTitle() {
        return this.data.title;
    }

    /**
     * Get description as HTML
     * @returns {string} Description as HTML
     */
    getDescriptionAsHtml() {
        const textComponent = new TextComponent({ content: this.data.description });
        return textComponent.getAsHtml();
    }

    /**
     * Get description as plain text
     * @returns {string} Description as plain text
     */
    getDescriptionAsPlainText() {
        const textComponent = new TextComponent({ content: this.data.description });
        return textComponent.getAsPlainText();
    }

    /**
     * Get image URL
     * @returns {string} Image URL
     */
    getImageUrl() {
        return this.data.imageUrl;
    }

    /**
     * Get alt text
     * @returns {string} Alt text
     */
    getAltText() {
        return this.data.altText;
    }

    /**
     * Get link URL
     * @returns {string} Link URL
     */
    getLinkUrl() {
        return this.data.linkUrl;
    }

    /**
     * Get link text
     * @returns {string} Link text
     */
    getLinkText() {
        return this.data.linkText;
    }

    /**
     * Get link target
     * @returns {string} Link target
     */
    getLinkTarget() {
        return this.data.linkTarget;
    }

    /**
     * Check if card has image
     * @returns {boolean} True if card has image
     */
    hasImage() {
        return this.data.imageUrl && this.data.imageUrl.trim() !== '';
    }

    /**
     * Check if card has link
     * @returns {boolean} True if card has link
     */
    hasLink() {
        return this.data.linkUrl && this.data.linkUrl.trim() !== '';
    }

    /**
     * Get content statistics
     * @returns {Object} Content statistics
     */
    getContentStats() {
        const textComponent = new TextComponent({ content: this.data.description });
        const plainText = textComponent.getAsPlainText();
        
        return {
            titleLength: this.data.title.length,
            descriptionLength: plainText.length,
            descriptionWords: plainText.split(/\s+/).filter(word => word.length > 0).length,
            hasImage: this.hasImage(),
            hasLink: this.hasLink(),
            imageUrlLength: this.data.imageUrl.length,
            linkUrlLength: this.data.linkUrl.length
        };
    }

    /**
     * Clone the CardComponent
     * @returns {CardComponent} Cloned instance
     */
    clone() {
        return new CardComponent({
            data: JSON.parse(JSON.stringify(this.data)),
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
     * Create CardComponent instance from JSON
     * @param {Object} json - JSON object
     * @returns {CardComponent} CardComponent instance
     */
    static fromJSON(json) {
        return new CardComponent(json);
    }

    /**
     * Create a new CardComponent with default data
     * @param {Object} options - Optional custom data
     * @returns {CardComponent} New CardComponent instance
     */
    static createDefault(options = {}) {
        const defaultData = {
            title: options.title || 'Card Title',
            description: options.description || {
                format: 'html',
                data: '<p>Card description goes here...</p>',
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            },
            imageUrl: options.imageUrl || '',
            altText: options.altText || '',
            linkUrl: options.linkUrl || '',
            linkText: options.linkText || '',
            linkTarget: options.linkTarget || '_self',
            style: options.style || 'default'
        };

        return new CardComponent({
            data: defaultData
        });
    }
}

module.exports = CardComponent;
