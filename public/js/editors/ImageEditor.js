/**
 * ImageEditor - Image editing component
 * Work Order 16: Implement Component-Specific Editors for Content Types
 * 
 * This editor provides image editing capabilities for CardComponent and BannerComponent
 * with URL input, file upload, and image preview functionality.
 */

class ImageEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.originalData = null;
        this.validationErrors = [];
        this.imagePreview = null;
    }

    /**
     * Render the image editor
     */
    render() {
        this.container.innerHTML = '';

        // Get component data with defaults
        const componentData = this.options.componentData || {};
        const data = componentData.data || componentData || this.getDefaultData();

        // Store original data for cancel functionality
        this.originalData = JSON.parse(JSON.stringify(data));

        // Create editor structure
        const editorHTML = `
            <div class="image-editor-container">
                <div class="editor-header">
                    <h4>Edit Image Component</h4>
                    <p class="editor-description">Upload an image or enter an image URL to display in your component.</p>
                </div>
                
                <div class="editor-content">
                    <div class="form-group">
                        <label for="image-url">Image URL</label>
                        <div class="input-group">
                            <input 
                                type="url" 
                                id="image-url" 
                                class="form-control" 
                                placeholder="https://example.com/image.jpg"
                                value="${data.imageUrl || ''}"
                            >
                            <div class="input-group-append">
                                <button type="button" class="btn btn-outline-secondary" data-action="clear-url">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <small class="form-text text-muted">
                            Enter a direct URL to an image file (JPG, PNG, GIF, WebP, SVG)
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="image-upload">Or Upload Image</label>
                        <div class="upload-area" id="image-upload-area">
                            <input type="file" id="image-upload" class="d-none" accept="image/*">
                            <div class="upload-content">
                                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                                <p class="upload-text">Click to browse or drag and drop an image file</p>
                                <small class="upload-hint">Supports JPG, PNG, GIF, WebP, SVG (max 10MB)</small>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="alt-text">Alt Text</label>
                        <input 
                            type="text" 
                            id="alt-text" 
                            class="form-control" 
                            placeholder="Describe the image for accessibility"
                            value="${data.altText || ''}"
                            maxlength="200"
                        >
                        <small class="form-text text-muted">
                            Important for accessibility and SEO. Describe what the image shows.
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="image-caption">Caption (Optional)</label>
                        <input 
                            type="text" 
                            id="image-caption" 
                            class="form-control" 
                            placeholder="Optional caption for the image"
                            value="${data.caption || ''}"
                            maxlength="200"
                        >
                    </div>

                    <div class="form-group">
                        <label>Image Preview</label>
                        <div class="image-preview-container" id="image-preview-container">
                            <div class="no-image-placeholder">
                                <i class="fas fa-image"></i>
                                <p>No image selected</p>
                                <small>Enter a URL or upload an image to see a preview</small>
                            </div>
                        </div>
                    </div>

                    <div class="validation-errors" id="image-validation-errors" style="display: none;">
                        <!-- Validation errors will be displayed here -->
                    </div>
                </div>

                <div class="editor-actions">
                    <button type="button" class="btn btn-secondary" data-action="cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-primary" data-action="save">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        `;

        this.container.innerHTML = editorHTML;
        this.setupEventListeners();
        this.updateImagePreview();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // URL input handler
        const urlInput = this.container.querySelector('#image-url');
        if (urlInput) {
            urlInput.addEventListener('input', (e) => {
                this.handleUrlChange(e.target.value);
            });

            urlInput.addEventListener('blur', (e) => {
                this.validateUrl(e.target.value);
            });
        }

        // Clear URL button
        const clearBtn = this.container.querySelector('[data-action="clear-url"]');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearUrl();
            });
        }

        // File upload handlers
        const uploadInput = this.container.querySelector('#image-upload');
        const uploadArea = this.container.querySelector('#image-upload-area');
        
        if (uploadInput && uploadArea) {
            // Click to browse
            uploadArea.addEventListener('click', () => {
                uploadInput.click();
            });

            // File selection
            uploadInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files[0]);
            });

            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });
        }

        // Alt text handler
        const altInput = this.container.querySelector('#alt-text');
        if (altInput) {
            altInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Caption handler
        const captionInput = this.container.querySelector('#image-caption');
        if (captionInput) {
            captionInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Action buttons
        const cancelBtn = this.container.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancel();
            });
        }

        const saveBtn = this.container.querySelector('[data-action="save"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.save();
            });
        }
    }

    /**
     * Handle URL change
     * @param {string} url - New URL
     */
    handleUrlChange(url) {
        // Clear file input when URL is entered
        const uploadInput = this.container.querySelector('#image-upload');
        if (uploadInput) {
            uploadInput.value = '';
        }

        this.handleDataChange();
        this.updateImagePreview();
    }

    /**
     * Clear URL
     */
    clearUrl() {
        const urlInput = this.container.querySelector('#image-url');
        if (urlInput) {
            urlInput.value = '';
            this.handleDataChange();
            this.updateImagePreview();
        }
    }

    /**
     * Handle file upload
     * @param {File} file - Uploaded file
     */
    handleFileUpload(file) {
        if (!file) return;

        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        // Clear URL input
        const urlInput = this.container.querySelector('#image-url');
        if (urlInput) {
            urlInput.value = '';
        }

        // Create object URL for preview
        const objectUrl = URL.createObjectURL(file);
        this.updateImagePreview(objectUrl);

        // In a real implementation, you would upload the file to a server
        // For now, we'll simulate this by using the object URL
        this.handleDataChange();
        
        // Show upload message
        this.showUploadMessage('File selected. In a real implementation, this would be uploaded to a server.');
    }

    /**
     * Validate file
     * @param {File} file - File to validate
     * @returns {boolean} Whether file is valid
     */
    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

        if (file.size > maxSize) {
            this.showError('File size must be less than 10MB');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showError('File must be an image (JPG, PNG, GIF, WebP, SVG)');
            return false;
        }

        return true;
    }

    /**
     * Validate URL
     * @param {string} url - URL to validate
     */
    validateUrl(url) {
        if (!url) return;

        if (window.ValidationUtils) {
            const validation = window.ValidationUtils.validateImageUrl(url);
            if (!validation.isValid) {
                this.showError(validation.getFirstError()?.message || 'Invalid image URL');
            }
        }
    }

    /**
     * Update image preview
     * @param {string} imageUrl - Image URL for preview
     */
    updateImagePreview(imageUrl = null) {
        const previewContainer = this.container.querySelector('#image-preview-container');
        if (!previewContainer) return;

        const urlInput = this.container.querySelector('#image-url');
        const url = imageUrl || (urlInput ? urlInput.value : '');

        if (!url) {
            previewContainer.innerHTML = `
                <div class="no-image-placeholder">
                    <i class="fas fa-image"></i>
                    <p>No image selected</p>
                    <small>Enter a URL or upload an image to see a preview</small>
                </div>
            `;
            return;
        }

        // Create image element
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Image preview';
        img.className = 'image-preview';
        
        // Handle load and error
        img.onload = () => {
            previewContainer.innerHTML = '';
            previewContainer.appendChild(img);
        };

        img.onerror = () => {
            previewContainer.innerHTML = `
                <div class="image-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load image</p>
                    <small>Please check the URL or try a different image</small>
                </div>
            `;
        };

        // Show loading state
        previewContainer.innerHTML = `
            <div class="image-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading image...</p>
            </div>
        `;
    }

    /**
     * Handle data change
     */
    handleDataChange() {
        const data = this.getCurrentData();
        this.validateData(data);
        this.emitUpdate(data);
    }

    /**
     * Validate data
     * @param {Object} data - Data to validate
     */
    validateData(data) {
        if (!window.ValidationUtils) {
            console.warn('ValidationUtils not available');
            return;
        }

        // Validate image URL if present
        if (data.imageUrl) {
            const validation = window.ValidationUtils.validateImageUrl(data.imageUrl);
            if (!validation.isValid) {
                this.validationErrors = validation.errors;
                this.displayValidationErrors();
                return;
            }
        }

        // Clear validation errors if valid
        this.validationErrors = [];
        this.displayValidationErrors();
    }

    /**
     * Display validation errors
     */
    displayValidationErrors() {
        const errorContainer = this.container.querySelector('#image-validation-errors');
        if (!errorContainer) return;

        if (this.validationErrors.length === 0) {
            errorContainer.style.display = 'none';
            errorContainer.innerHTML = '';
            return;
        }

        const errorHTML = this.validationErrors.map(error => `
            <div class="validation-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${error.message}</span>
            </div>
        `).join('');

        errorContainer.innerHTML = errorHTML;
        errorContainer.style.display = 'block';
    }

    /**
     * Get current data
     * @returns {Object} Current data
     */
    getCurrentData() {
        const urlInput = this.container.querySelector('#image-url');
        const altInput = this.container.querySelector('#alt-text');
        const captionInput = this.container.querySelector('#image-caption');

        return {
            imageUrl: urlInput ? urlInput.value : '',
            altText: altInput ? altInput.value : '',
            caption: captionInput ? captionInput.value : ''
        };
    }

    /**
     * Get default data
     * @returns {Object} Default data structure
     */
    getDefaultData() {
        return {
            imageUrl: '',
            altText: '',
            caption: ''
        };
    }

    /**
     * Save changes
     */
    save() {
        const data = this.getCurrentData();
        
        // Validate before saving
        if (window.ValidationUtils && data.imageUrl) {
            const validation = window.ValidationUtils.validateImageUrl(data.imageUrl);
            if (!validation.isValid) {
                this.validationErrors = validation.errors;
                this.displayValidationErrors();
                return;
            }
        }

        // Emit save event
        this.emitUpdate(data);
        
        // Show success feedback
        this.showSuccessMessage('Image settings saved successfully');
    }

    /**
     * Cancel changes
     */
    cancel() {
        // Restore original data
        const urlInput = this.container.querySelector('#image-url');
        const altInput = this.container.querySelector('#alt-text');
        const captionInput = this.container.querySelector('#image-caption');
        
        if (this.originalData) {
            if (urlInput) urlInput.value = this.originalData.imageUrl || '';
            if (altInput) altInput.value = this.originalData.altText || '';
            if (captionInput) captionInput.value = this.originalData.caption || '';
        }

        // Clear validation errors
        this.validationErrors = [];
        this.displayValidationErrors();

        // Update preview
        this.updateImagePreview();

        // Emit cancel event
        this.emitClose();
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show upload message
     * @param {string} message - Upload message
     */
    showUploadMessage(message) {
        this.showMessage(message, 'info');
    }

    /**
     * Show message
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(message, type = 'info') {
        // Create temporary message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-triangle' : 'info-circle';
        
        messageDiv.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(messageDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    /**
     * Update editor with new data
     * @param {Object} newData - New component data
     */
    update(newData) {
        this.options.componentData = newData;
        this.render();
    }

    /**
     * Destroy the editor
     */
    destroy() {
        // Clean up object URLs
        if (this.imagePreview) {
            URL.revokeObjectURL(this.imagePreview);
        }

        super.destroy();
    }
}

// Export the ImageEditor class
window.ImageEditor = ImageEditor;
