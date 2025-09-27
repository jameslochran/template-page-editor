/**
 * BannerComponent Model - Client Side
 * Work Order #23: Implement Banner Component Data Model Structure
 * 
 * This model provides structured data management for banner components
 * with headline text, background images, and call-to-action functionality on the client side.
 */

class BannerComponent {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.type = 'BannerComponent';
        this.data = this.initializeData(data.data);
        this.order = data.order || 1;
        this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
        this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'banner-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Initialize banner data with proper structure and validation
     * @param {Object} data - Data object or undefined
     * @returns {Object} Structured banner data
     */
    initializeData(data) {
        if (!data) {
            return this.getDefaultData();
        }

        return {
            headlineText: this.validateHeadlineText(data.headlineText) || 'Banner Headline',
            backgroundImageUrl: this.validateBackgroundImageUrl(data.backgroundImageUrl) || '',
            backgroundImageAltText: this.validateBackgroundImageAltText(data.backgroundImageAltText) || '',
            callToAction: this.initializeCallToAction(data.callToAction),
            style: data.style || 'default'
        };
    }

    /**
     * Get default banner data structure
     * @returns {Object} Default banner data
     */
    getDefaultData() {
        return {
            headlineText: 'Banner Headline',
            backgroundImageUrl: '',
            backgroundImageAltText: '',
            callToAction: {
                buttonText: 'Learn More',
                linkUrl: '',
                linkTarget: '_self'
            },
            style: 'default'
        };
    }

    /**
     * Initialize call-to-action data with proper structure
     * @param {Object} callToAction - Call-to-action data or undefined
     * @returns {Object} Structured call-to-action object
     */
    initializeCallToAction(callToAction) {
        if (!callToAction || typeof callToAction !== 'object') {
            return {
                buttonText: 'Learn More',
                linkUrl: '',
                linkTarget: '_self'
            };
        }

        return {
            buttonText: this.validateButtonText(callToAction.buttonText) || 'Learn More',
            linkUrl: this.validateLinkUrl(callToAction.linkUrl) || '',
            linkTarget: this.validateLinkTarget(callToAction.linkTarget) || '_self'
        };
    }

    /**
     * Validate headline text field (max 500 characters)
     * @param {string} headlineText - Headline text
     * @returns {string|null} Validated headline text or null if invalid
     */
    validateHeadlineText(headlineText) {
        if (!headlineText || typeof headlineText !== 'string') {
            return null;
        }

        const trimmedHeadline = headlineText.trim();
        return trimmedHeadline.length <= 500 ? trimmedHeadline : null;
    }

    /**
     * Validate background image URL field (max 2048 characters)
     * @param {string} backgroundImageUrl - Background image URL
     * @returns {string|null} Validated background image URL or null if invalid
     */
    validateBackgroundImageUrl(backgroundImageUrl) {
        if (!backgroundImageUrl || typeof backgroundImageUrl !== 'string') {
            return null;
        }

        const trimmedUrl = backgroundImageUrl.trim();
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
     * Validate background image alt text field (max 255 characters)
     * @param {string} backgroundImageAltText - Background image alt text
     * @returns {string|null} Validated background image alt text or null if invalid
     */
    validateBackgroundImageAltText(backgroundImageAltText) {
        if (!backgroundImageAltText || typeof backgroundImageAltText !== 'string') {
            return null;
        }

        const trimmedAltText = backgroundImageAltText.trim();
        return trimmedAltText.length <= 255 ? trimmedAltText : null;
    }

    /**
     * Validate button text field (max 255 characters)
     * @param {string} buttonText - Button text
     * @returns {string|null} Validated button text or null if invalid
     */
    validateButtonText(buttonText) {
        if (!buttonText || typeof buttonText !== 'string') {
            return null;
        }

        const trimmedButtonText = buttonText.trim();
        return trimmedButtonText.length <= 255 ? trimmedButtonText : null;
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
     * Validate the BannerComponent structure
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Validate ID
        if (!this.id || typeof this.id !== 'string') {
            errors.push('ID must be a non-empty string');
        }

        // Validate type
        if (this.type !== 'BannerComponent') {
            errors.push('Type must be BannerComponent');
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
     * Validate banner data structure
     * @param {Object} data - Data object to validate
     * @returns {Object} Validation result
     */
    validateData(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            return { isValid: false, errors: ['Data must be an object'] };
        }

        // Validate headlineText
        if (!data.headlineText || typeof data.headlineText !== 'string') {
            errors.push('HeadlineText is required and must be a string');
        } else if (data.headlineText.length > 500) {
            errors.push('HeadlineText must not exceed 500 characters');
        }

        // Validate backgroundImageUrl (optional)
        if (data.backgroundImageUrl !== undefined && data.backgroundImageUrl !== '') {
            if (typeof data.backgroundImageUrl !== 'string') {
                errors.push('BackgroundImageUrl must be a string');
            } else if (data.backgroundImageUrl.length > 2048) {
                errors.push('BackgroundImageUrl must not exceed 2048 characters');
            } else {
                try {
                    new URL(data.backgroundImageUrl);
                } catch {
                    errors.push('BackgroundImageUrl must be a valid URL');
                }
            }
        }

        // Validate backgroundImageAltText (optional)
        if (data.backgroundImageAltText !== undefined && data.backgroundImageAltText !== '') {
            if (typeof data.backgroundImageAltText !== 'string') {
                errors.push('BackgroundImageAltText must be a string');
            } else if (data.backgroundImageAltText.length > 255) {
                errors.push('BackgroundImageAltText must not exceed 255 characters');
            }
        }

        // Validate callToAction
        if (!data.callToAction || typeof data.callToAction !== 'object') {
            errors.push('CallToAction is required and must be an object');
        } else {
            const ctaErrors = this.validateCallToAction(data.callToAction);
            if (ctaErrors.length > 0) {
                errors.push(...ctaErrors.map(err => `CallToAction: ${err}`));
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
     * Validate call-to-action structure
     * @param {Object} callToAction - Call-to-action object to validate
     * @returns {Array} Array of validation errors
     */
    validateCallToAction(callToAction) {
        const errors = [];

        // Validate buttonText (optional)
        if (callToAction.buttonText !== undefined && callToAction.buttonText !== '') {
            if (typeof callToAction.buttonText !== 'string') {
                errors.push('ButtonText must be a string');
            } else if (callToAction.buttonText.length > 255) {
                errors.push('ButtonText must not exceed 255 characters');
            }
        }

        // Validate linkUrl (optional)
        if (callToAction.linkUrl !== undefined && callToAction.linkUrl !== '') {
            if (typeof callToAction.linkUrl !== 'string') {
                errors.push('LinkUrl must be a string');
            } else if (callToAction.linkUrl.length > 2048) {
                errors.push('LinkUrl must not exceed 2048 characters');
            } else {
                try {
                    new URL(callToAction.linkUrl);
                } catch {
                    errors.push('LinkUrl must be a valid URL');
                }
            }
        }

        // Validate linkTarget
        if (callToAction.linkTarget !== undefined) {
            if (typeof callToAction.linkTarget !== 'string') {
                errors.push('LinkTarget must be a string');
            } else if (callToAction.linkTarget !== '_self' && callToAction.linkTarget !== '_blank') {
                errors.push('LinkTarget must be either "_self" or "_blank"');
            }
        }

        return errors;
    }

    /**
     * Update banner data
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
        if (updates.headlineText !== undefined) {
            const validatedHeadline = this.validateHeadlineText(updates.headlineText);
            if (!validatedHeadline) {
                throw new Error('Invalid headlineText: must be a string with maximum 500 characters');
            }
            updatedData.headlineText = validatedHeadline;
        }

        if (updates.backgroundImageUrl !== undefined) {
            updatedData.backgroundImageUrl = updates.backgroundImageUrl ? this.validateBackgroundImageUrl(updates.backgroundImageUrl) : '';
            if (updates.backgroundImageUrl && !updatedData.backgroundImageUrl) {
                throw new Error('Invalid backgroundImageUrl: must be a valid URL with maximum 2048 characters');
            }
        }

        if (updates.backgroundImageAltText !== undefined) {
            updatedData.backgroundImageAltText = updates.backgroundImageAltText ? this.validateBackgroundImageAltText(updates.backgroundImageAltText) : '';
            if (updates.backgroundImageAltText && !updatedData.backgroundImageAltText) {
                throw new Error('Invalid backgroundImageAltText: must be a string with maximum 255 characters');
            }
        }

        if (updates.callToAction !== undefined) {
            updatedData.callToAction = this.initializeCallToAction(updates.callToAction);
        }

        if (updates.style !== undefined) {
            updatedData.style = updates.style;
        }

        this.data = updatedData;
        this.updatedAt = new Date().toISOString();
        return true;
    }

    /**
     * Update call-to-action data
     * @param {Object} ctaUpdates - Call-to-action fields to update
     * @returns {boolean} Success status
     */
    updateCallToAction(ctaUpdates) {
        const updatedCTA = { ...this.data.callToAction, ...ctaUpdates };

        // Validate updated CTA
        const ctaErrors = this.validateCallToAction(updatedCTA);
        if (ctaErrors.length > 0) {
            throw new Error(`CallToAction validation failed: ${ctaErrors.join(', ')}`);
        }

        // Apply validated updates
        if (ctaUpdates.buttonText !== undefined) {
            updatedCTA.buttonText = ctaUpdates.buttonText ? this.validateButtonText(ctaUpdates.buttonText) : '';
            if (ctaUpdates.buttonText && !updatedCTA.buttonText) {
                throw new Error('Invalid buttonText: must be a string with maximum 255 characters');
            }
        }

        if (ctaUpdates.linkUrl !== undefined) {
            updatedCTA.linkUrl = ctaUpdates.linkUrl ? this.validateLinkUrl(ctaUpdates.linkUrl) : '';
            if (ctaUpdates.linkUrl && !updatedCTA.linkUrl) {
                throw new Error('Invalid linkUrl: must be a valid URL with maximum 2048 characters');
            }
        }

        if (ctaUpdates.linkTarget !== undefined) {
            updatedCTA.linkTarget = this.validateLinkTarget(ctaUpdates.linkTarget);
        }

        this.data.callToAction = updatedCTA;
        this.updatedAt = new Date().toISOString();
        return true;
    }

    /**
     * Get headline text
     * @returns {string} Banner headline text
     */
    getHeadlineText() {
        return this.data.headlineText;
    }

    /**
     * Get background image URL
     * @returns {string} Background image URL
     */
    getBackgroundImageUrl() {
        return this.data.backgroundImageUrl;
    }

    /**
     * Get background image alt text
     * @returns {string} Background image alt text
     */
    getBackgroundImageAltText() {
        return this.data.backgroundImageAltText;
    }

    /**
     * Get call-to-action object
     * @returns {Object} Call-to-action object
     */
    getCallToAction() {
        return this.data.callToAction;
    }

    /**
     * Get button text
     * @returns {string} Button text
     */
    getButtonText() {
        return this.data.callToAction.buttonText;
    }

    /**
     * Get link URL
     * @returns {string} Link URL
     */
    getLinkUrl() {
        return this.data.callToAction.linkUrl;
    }

    /**
     * Get link target
     * @returns {string} Link target
     */
    getLinkTarget() {
        return this.data.callToAction.linkTarget;
    }

    /**
     * Check if banner has background image
     * @returns {boolean} True if banner has background image
     */
    hasBackgroundImage() {
        return this.data.backgroundImageUrl && this.data.backgroundImageUrl.trim() !== '';
    }

    /**
     * Check if banner has call-to-action
     * @returns {boolean} True if banner has call-to-action
     */
    hasCallToAction() {
        return this.data.callToAction.linkUrl && this.data.callToAction.linkUrl.trim() !== '';
    }

    /**
     * Remove background image and alt text
     * @returns {boolean} Success status
     */
    removeBackgroundImage() {
        try {
            this.data.backgroundImageUrl = '';
            this.data.backgroundImageAltText = '';
            this.updatedAt = new Date().toISOString();
            return true;
        } catch (error) {
            console.error('Error removing background image:', error);
            return false;
        }
    }

    /**
     * Get content statistics
     * @returns {Object} Content statistics
     */
    getContentStats() {
        return {
            headlineLength: this.data.headlineText.length,
            hasBackgroundImage: this.hasBackgroundImage(),
            hasCallToAction: this.hasCallToAction(),
            backgroundImageUrlLength: this.data.backgroundImageUrl.length,
            backgroundImageAltTextLength: this.data.backgroundImageAltText.length,
            buttonTextLength: this.data.callToAction.buttonText.length,
            linkUrlLength: this.data.callToAction.linkUrl.length
        };
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
     * Create BannerComponent instance from JSON
     * @param {Object} json - JSON object
     * @returns {BannerComponent} BannerComponent instance
     */
    static fromJSON(json) {
        return new BannerComponent(json);
    }

    /**
     * Create a new BannerComponent with default data
     * @param {Object} options - Optional custom data
     * @returns {BannerComponent} New BannerComponent instance
     */
    static createDefault(options = {}) {
        const defaultData = {
            headlineText: options.headlineText || 'Banner Headline',
            backgroundImageUrl: options.backgroundImageUrl || '',
            backgroundImageAltText: options.backgroundImageAltText || '',
            callToAction: {
                buttonText: options.callToAction?.buttonText || 'Learn More',
                linkUrl: options.callToAction?.linkUrl || '',
                linkTarget: options.callToAction?.linkTarget || '_self'
            },
            style: options.style || 'default'
        };

        return new BannerComponent({
            data: defaultData
        });
    }
}

// Export for use in other scripts
window.BannerComponent = BannerComponent;
