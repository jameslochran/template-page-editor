/**
 * BannerEditor Component - Work Order 22
 * 
 * Provides a dedicated editing interface for BannerComponent properties
 * including headline text, call-to-action button text, link URL, and link target.
 * Integrates with ImageUploader for background image management.
 */

class BannerEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.bannerData = options.componentData || null;
        this.onHeadlineChange = options.onHeadlineChange || (() => {});
        this.onCallToActionChange = options.onCallToActionChange || (() => {});
        this.onBackgroundImageChange = options.onBackgroundImageChange || (() => {});
        this.onUpdate = options.onUpdate || (() => {});
        this.onClose = options.onClose || (() => {});
        
        this.validationErrors = [];
        this.isEditing = false;
        
        // Debug logging
        console.log('BannerEditor initialized with data:', this.bannerData);
        
        this.render();
        this.setupEventListeners();
        this.addStyles();
    }

    /**
     * Render the BannerEditor interface
     */
    render() {
        if (!this.bannerData) {
            this.container.innerHTML = '<div class="banner-editor-error">No banner data available</div>';
            return;
        }

        const cta = this.bannerData.data?.callToAction || this.bannerData.callToAction || {};
        
        this.container.innerHTML = `
            <div class="banner-editor">
                <div class="banner-editor-header">
                    <h3>Banner Editor</h3>
                    <button type="button" class="banner-editor-close" title="Close Editor">
                        <span>×</span>
                    </button>
                </div>
                
                <div class="banner-editor-content">
                    <!-- Headline Section -->
                    <div class="banner-editor-section">
                        <label for="banner-headline" class="banner-editor-label">
                            Headline Text
                        </label>
                        <input 
                            type="text" 
                            id="banner-headline" 
                            class="banner-editor-input" 
                            value="${this.escapeHtml(this.bannerData.data?.headlineText || this.bannerData.headlineText || '')}"
                            placeholder="Enter banner headline..."
                            maxlength="500"
                        >
                        <div class="banner-editor-help">Maximum 500 characters</div>
                    </div>

                    <!-- Background Image Section -->
                    <div class="banner-editor-section">
                        <label class="banner-editor-label">Background Image</label>
                        <div id="banner-image-uploader" class="banner-image-uploader-container">
                            <!-- ImageUploader will be initialized here -->
                        </div>
                    </div>

                    <!-- Call-to-Action Section -->
                    <div class="banner-editor-section">
                        <h4 class="banner-editor-subtitle">Call-to-Action</h4>
                        
                        <div class="banner-editor-field">
                            <label for="banner-cta-text" class="banner-editor-label">
                                Button Text
                            </label>
                            <input 
                                type="text" 
                                id="banner-cta-text" 
                                class="banner-editor-input" 
                                value="${this.escapeHtml(cta.buttonText || '')}"
                                placeholder="Enter button text..."
                                maxlength="100"
                            >
                            <div class="banner-editor-help">Maximum 100 characters</div>
                        </div>

                        <div class="banner-editor-field">
                            <label for="banner-cta-url" class="banner-editor-label">
                                Link URL
                            </label>
                            <input 
                                type="url" 
                                id="banner-cta-url" 
                                class="banner-editor-input" 
                                value="${this.escapeHtml(cta.linkUrl || '')}"
                                placeholder="https://example.com"
                            >
                            <div class="banner-editor-help">Enter a valid URL</div>
                            <div id="banner-url-error" class="banner-editor-error" style="display: none;"></div>
                        </div>

                        <div class="banner-editor-field">
                            <label for="banner-cta-target" class="banner-editor-label">
                                Link Target
                            </label>
                            <select id="banner-cta-target" class="banner-editor-select">
                                <option value="_self" ${cta.linkTarget === '_self' ? 'selected' : ''}>Same Window</option>
                                <option value="_blank" ${cta.linkTarget === '_blank' ? 'selected' : ''}>New Window</option>
                            </select>
                            <div class="banner-editor-help">Choose how the link opens</div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="banner-editor-actions">
                        <button type="button" class="banner-editor-save" disabled>
                            Save Changes
                        </button>
                        <button type="button" class="banner-editor-cancel">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Initialize ImageUploader if available
        this.initializeImageUploader();
    }

    /**
     * Initialize the ImageUploader for background image management
     */
    initializeImageUploader() {
        const uploaderContainer = this.container.querySelector('#banner-image-uploader');
        if (!uploaderContainer) return;

        if (window.ImageUploader) {
            const imageUploader = new window.ImageUploader(uploaderContainer, {
                initialImageUrl: this.bannerData.data?.backgroundImageUrl || this.bannerData.backgroundImageUrl || '',
                initialAltText: this.bannerData.data?.backgroundImageAltText || this.bannerData.backgroundImageAltText || '',
                onUpdate: (data) => {
                    this.handleBackgroundImageChange(data);
                },
                onError: (error) => {
                    console.error('ImageUploader error:', error);
                    this.showValidationError('Background image upload failed: ' + error.message);
                },
                maxFileSize: 10 * 1024 * 1024, // 10MB
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
                showAltText: true,
                showRemoveButton: true,
                aspectRatio: '16:9'
            });

            // Store reference for later access
            this.imageUploader = imageUploader;
        } else {
            // Fallback to basic input if ImageUploader is not available
            uploaderContainer.innerHTML = `
                <div class="banner-editor-fallback-uploader">
                    <input 
                        type="url" 
                        class="banner-editor-input" 
                        placeholder="Enter background image URL..."
                        value="${this.escapeHtml(this.bannerData.data?.backgroundImageUrl || this.bannerData.backgroundImageUrl || '')}"
                    >
                    <input 
                        type="text" 
                        class="banner-editor-input" 
                        placeholder="Alt text for accessibility..."
                        value="${this.escapeHtml(this.bannerData.data?.backgroundImageAltText || this.bannerData.backgroundImageAltText || '')}"
                    >
                </div>
            `;
        }
    }

    /**
     * Setup event listeners for the BannerEditor
     */
    setupEventListeners() {
        // Close button
        const closeBtn = this.container.querySelector('.banner-editor-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.handleClose());
        }

        // Headline input
        const headlineInput = this.container.querySelector('#banner-headline');
        if (headlineInput) {
            headlineInput.addEventListener('input', (e) => this.handleHeadlineChange(e.target.value));
        }

        // Call-to-action inputs
        const ctaTextInput = this.container.querySelector('#banner-cta-text');
        if (ctaTextInput) {
            ctaTextInput.addEventListener('input', (e) => this.handleCallToActionChange());
        }

        const ctaUrlInput = this.container.querySelector('#banner-cta-url');
        if (ctaUrlInput) {
            ctaUrlInput.addEventListener('input', (e) => this.handleCallToActionChange());
            ctaUrlInput.addEventListener('blur', (e) => this.validateUrl(e.target.value));
        }

        const ctaTargetSelect = this.container.querySelector('#banner-cta-target');
        if (ctaTargetSelect) {
            ctaTargetSelect.addEventListener('change', (e) => this.handleCallToActionChange());
        }

        // Action buttons
        const saveBtn = this.container.querySelector('.banner-editor-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        const cancelBtn = this.container.querySelector('.banner-editor-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }

        // Fallback uploader inputs
        const fallbackInputs = this.container.querySelectorAll('.banner-editor-fallback-uploader input');
        fallbackInputs.forEach((input, index) => {
            input.addEventListener('input', () => {
                const imageUrl = fallbackInputs[0].value;
                const altText = fallbackInputs[1].value;
                this.handleBackgroundImageChange({ imageUrl, altText });
            });
        });
    }

    /**
     * Handle headline text changes
     * @param {string} headlineText - New headline text
     */
    handleHeadlineChange(headlineText) {
        if (!this.bannerData) return;

        // Update the banner data - handle both data structures
        if (this.bannerData.data) {
            this.bannerData.data.headlineText = headlineText;
        } else {
            this.bannerData.headlineText = headlineText;
        }
        
        // Notify parent of the change
        this.onHeadlineChange(this.bannerData.id || this.bannerData._id, headlineText);
        this.onUpdate(this.bannerData);
        
        // Enable save button
        this.enableSaveButton();
    }

    /**
     * Handle call-to-action changes
     */
    handleCallToActionChange() {
        if (!this.bannerData) return;

        const ctaTextInput = this.container.querySelector('#banner-cta-text');
        const ctaUrlInput = this.container.querySelector('#banner-cta-url');
        const ctaTargetSelect = this.container.querySelector('#banner-cta-target');

        if (!ctaTextInput || !ctaUrlInput || !ctaTargetSelect) return;

        const callToAction = {
            buttonText: ctaTextInput.value,
            linkUrl: ctaUrlInput.value,
            linkTarget: ctaTargetSelect.value
        };

        // Update the banner data - handle both data structures
        if (this.bannerData.data) {
            this.bannerData.data.callToAction = callToAction;
        } else {
            this.bannerData.callToAction = callToAction;
        }
        
        // Notify parent of the change
        this.onCallToActionChange(this.bannerData.id || this.bannerData._id, callToAction);
        this.onUpdate(this.bannerData);
        
        // Enable save button
        this.enableSaveButton();
    }

    /**
     * Handle background image changes
     * @param {Object} imageData - Image data with imageUrl and altText
     */
    handleBackgroundImageChange(imageData) {
        if (!this.bannerData) return;

        // Update the banner data - handle both data structures
        if (this.bannerData.data) {
            this.bannerData.data.backgroundImageUrl = imageData.imageUrl || '';
            this.bannerData.data.backgroundImageAltText = imageData.altText || '';
        } else {
            this.bannerData.backgroundImageUrl = imageData.imageUrl || '';
            this.bannerData.backgroundImageAltText = imageData.altText || '';
        }
        
        // Notify parent of the change
        this.onBackgroundImageChange(this.bannerData.id || this.bannerData._id, imageData.imageUrl, imageData.altText);
        this.onUpdate(this.bannerData);
        
        // Enable save button
        this.enableSaveButton();
    }

    /**
     * Validate URL input
     * @param {string} url - URL to validate
     */
    validateUrl(url) {
        const errorElement = this.container.querySelector('#banner-url-error');
        if (!errorElement) return;

        if (!url) {
            this.hideValidationError();
            return;
        }

        try {
            new URL(url);
            this.hideValidationError();
        } catch (e) {
            this.showValidationError('Please enter a valid URL (e.g., https://example.com)');
        }
    }

    /**
     * Show validation error message
     * @param {string} message - Error message to show
     */
    showValidationError(message) {
        const errorElement = this.container.querySelector('#banner-url-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Hide validation error message
     */
    hideValidationError() {
        const errorElement = this.container.querySelector('#banner-url-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Enable the save button
     */
    enableSaveButton() {
        const saveBtn = this.container.querySelector('.banner-editor-save');
        if (saveBtn) {
            saveBtn.disabled = false;
        }
    }

    /**
     * Handle save action
     */
    handleSave() {
        // Validate all inputs
        if (!this.validateInputs()) {
            return;
        }

        // Emit save event
        this.emitUpdate(this.bannerData);
        
        // Disable save button
        const saveBtn = this.container.querySelector('.banner-editor-save');
        if (saveBtn) {
            saveBtn.disabled = true;
        }
    }

    /**
     * Handle cancel action
     */
    handleCancel() {
        this.handleClose();
    }

    /**
     * Handle close action
     */
    handleClose() {
        this.onClose();
    }

    /**
     * Validate all inputs
     * @returns {boolean} True if all inputs are valid
     */
    validateInputs() {
        this.validationErrors = [];

        // Validate headline
        const headlineInput = this.container.querySelector('#banner-headline');
        if (headlineInput && headlineInput.value.length > 500) {
            this.validationErrors.push('Headline text must be 500 characters or less');
        }

        // Validate CTA button text
        const ctaTextInput = this.container.querySelector('#banner-cta-text');
        if (ctaTextInput && ctaTextInput.value.length > 100) {
            this.validationErrors.push('Button text must be 100 characters or less');
        }

        // Validate CTA URL
        const ctaUrlInput = this.container.querySelector('#banner-cta-url');
        if (ctaUrlInput && ctaUrlInput.value) {
            try {
                new URL(ctaUrlInput.value);
            } catch (e) {
                this.validationErrors.push('Please enter a valid URL for the call-to-action link');
            }
        }

        // Show validation errors if any
        if (this.validationErrors.length > 0) {
            alert('Please fix the following errors:\n' + this.validationErrors.join('\n'));
            return false;
        }

        return true;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add CSS styles for the BannerEditor
     */
    addStyles() {
        if (document.getElementById('banner-editor-styles')) return;

        const style = document.createElement('style');
        style.id = 'banner-editor-styles';
        style.textContent = `
            .banner-editor {
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                max-width: 600px;
                margin: 0 auto;
            }

            .banner-editor-header {
                background: #f8fafc;
                padding: 16px 20px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .banner-editor-header h3 {
                margin: 0;
                color: #2d3748;
                font-size: 18px;
                font-weight: 600;
            }

            .banner-editor-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #718096;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .banner-editor-close:hover {
                background: #e2e8f0;
                color: #2d3748;
            }

            .banner-editor-content {
                padding: 20px;
            }

            .banner-editor-section {
                margin-bottom: 24px;
            }

            .banner-editor-section:last-child {
                margin-bottom: 0;
            }

            .banner-editor-subtitle {
                margin: 0 0 16px 0;
                color: #2d3748;
                font-size: 16px;
                font-weight: 600;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 8px;
            }

            .banner-editor-field {
                margin-bottom: 16px;
            }

            .banner-editor-field:last-child {
                margin-bottom: 0;
            }

            .banner-editor-label {
                display: block;
                margin-bottom: 6px;
                color: #4a5568;
                font-size: 14px;
                font-weight: 500;
            }

            .banner-editor-input,
            .banner-editor-select {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                box-sizing: border-box;
            }

            .banner-editor-input:focus,
            .banner-editor-select:focus {
                outline: none;
                border-color: #3182ce;
                box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
            }

            .banner-editor-help {
                margin-top: 4px;
                color: #718096;
                font-size: 12px;
            }

            .banner-editor-error {
                margin-top: 4px;
                color: #e53e3e;
                font-size: 12px;
                font-weight: 500;
            }

            .banner-image-uploader-container {
                border: 2px dashed #d1d5db;
                border-radius: 6px;
                padding: 16px;
                background: #f9fafb;
                min-height: 120px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .banner-editor-fallback-uploader {
                width: 100%;
            }

            .banner-editor-fallback-uploader input {
                margin-bottom: 8px;
            }

            .banner-editor-fallback-uploader input:last-child {
                margin-bottom: 0;
            }

            .banner-editor-actions {
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .banner-editor-save,
            .banner-editor-cancel {
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }

            .banner-editor-save {
                background: #3182ce;
                color: white;
            }

            .banner-editor-save:hover:not(:disabled) {
                background: #2c5aa0;
            }

            .banner-editor-save:disabled {
                background: #a0aec0;
                cursor: not-allowed;
            }

            .banner-editor-cancel {
                background: #e2e8f0;
                color: #4a5568;
            }

            .banner-editor-cancel:hover {
                background: #cbd5e0;
            }

            .banner-editor-error {
                background: #fed7d7;
                color: #c53030;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 16px;
                font-size: 14px;
            }
        `;

        document.head.appendChild(style);
    }
}

// Expose BannerEditor globally
window.BannerEditor = BannerEditor;
