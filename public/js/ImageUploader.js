/**
 * ImageUploader Component
 * Work Order #19: Implement ImageUploader Component for Card Image Management
 * 
 * A reusable component that allows users to upload, preview, and manage images
 * for card components, including setting alt text for accessibility compliance.
 */

class ImageUploader {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            initialImageUrl: options.initialImageUrl || '',
            initialAltText: options.initialAltText || '',
            onUpdate: options.onUpdate || (() => {}),
            onError: options.onError || (() => {}),
            maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
            allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            showAltText: options.showAltText !== false, // Default to true
            showRemoveButton: options.showRemoveButton !== false, // Default to true
            ...options
        };
        
        this.currentImageUrl = this.options.initialImageUrl;
        this.currentAltText = this.options.initialAltText;
        this.isUploading = false;
        this.uploadProgress = 0;
        
        this.render();
    }

    /**
     * Render the ImageUploader component
     */
    render() {
        this.container.innerHTML = '';

        const uploaderHTML = `
            <div class="image-uploader-container">
                <div class="image-uploader-header">
                    <h4>Image Upload</h4>
                    <p class="uploader-description">Upload an image or enter an image URL</p>
                </div>
                
                <div class="image-uploader-content">
                    <!-- File Upload Area -->
                    <div class="file-upload-area" id="file-upload-area">
                        <div class="upload-dropzone" id="upload-dropzone">
                            <div class="upload-icon">
                                <i class="fas fa-cloud-upload-alt"></i>
                            </div>
                            <div class="upload-text">
                                <p class="upload-primary">Drop image here or click to browse</p>
                                <p class="upload-secondary">Supports: JPG, PNG, GIF, WebP (max 10MB)</p>
                            </div>
                            <input type="file" id="file-input" accept="image/*" style="display: none;">
                        </div>
                    </div>

                    <!-- URL Input Area -->
                    <div class="url-input-area">
                        <label for="image-url-input">Or enter image URL:</label>
                        <div class="url-input-group">
                            <input type="url" id="image-url-input" placeholder="https://example.com/image.jpg" 
                                   value="${this.currentImageUrl}">
                            <button type="button" class="btn btn-secondary" id="load-url-btn">
                                <i class="fas fa-external-link-alt"></i> Load
                            </button>
                        </div>
                    </div>

                    <!-- Image Preview -->
                    <div class="image-preview-container" id="image-preview-container" style="display: none;">
                        <div class="image-preview-header">
                            <h5>Image Preview</h5>
                            <div class="preview-actions">
                                <button type="button" class="btn btn-sm btn-secondary" id="replace-image-btn">
                                    <i class="fas fa-edit"></i> Replace
                                </button>
                                ${this.options.showRemoveButton ? `
                                    <button type="button" class="btn btn-sm btn-danger" id="remove-image-btn">
                                        <i class="fas fa-trash"></i> Remove
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="image-preview">
                            <img id="preview-image" src="" alt="Preview">
                        </div>
                    </div>

                    <!-- Alt Text Input -->
                    ${this.options.showAltText ? `
                        <div class="alt-text-area">
                            <label for="alt-text-input">Alt Text (for accessibility):</label>
                            <input type="text" id="alt-text-input" placeholder="Describe the image for screen readers" 
                                   value="${this.currentAltText}" maxlength="255">
                            <div class="alt-text-help">
                                <small class="text-muted">
                                    <i class="fas fa-info-circle"></i>
                                    Alt text helps users with screen readers understand the image content.
                                </small>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Upload Progress -->
                    <div class="upload-progress" id="upload-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-text" id="progress-text">Uploading...</div>
                    </div>

                    <!-- Error Messages -->
                    <div class="upload-errors" id="upload-errors" style="display: none;">
                        <!-- Error messages will be displayed here -->
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = uploaderHTML;
        this.setupEventListeners();
        this.updatePreview();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const dropzone = this.container.querySelector('#upload-dropzone');
        const fileInput = this.container.querySelector('#file-input');
        const urlInput = this.container.querySelector('#image-url-input');
        const loadUrlBtn = this.container.querySelector('#load-url-btn');
        const altTextInput = this.container.querySelector('#alt-text-input');
        const replaceImageBtn = this.container.querySelector('#replace-image-btn');
        const removeImageBtn = this.container.querySelector('#remove-image-btn');

        // File upload events
        if (dropzone) {
            dropzone.addEventListener('click', () => {
                fileInput.click();
            });

            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('drag-over');
            });

            dropzone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0]);
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelect(e.target.files[0]);
                }
            });
        }

        // URL input events
        if (loadUrlBtn) {
            loadUrlBtn.addEventListener('click', () => {
                this.handleUrlLoad();
            });
        }

        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleUrlLoad();
                }
            });

            urlInput.addEventListener('input', () => {
                this.clearErrors();
            });
        }

        // Alt text events
        if (altTextInput) {
            altTextInput.addEventListener('input', () => {
                this.currentAltText = altTextInput.value;
                this.notifyUpdate();
            });
        }

        // Preview actions
        if (replaceImageBtn) {
            replaceImageBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', () => {
                this.removeImage();
            });
        }
    }

    /**
     * Handle file selection
     * @param {File} file - Selected file
     */
    handleFileSelect(file) {
        this.clearErrors();

        // Validate file
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            this.showError(validation.errors.join(', '));
            return;
        }

        // Show preview
        this.showFilePreview(file);

        // Upload file
        this.uploadFile(file);
    }

    /**
     * Validate file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        const errors = [];

        if (!file) {
            errors.push('No file selected');
            return { isValid: false, errors };
        }

        // Check file type
        if (!this.options.allowedTypes.includes(file.type)) {
            errors.push(`File type ${file.type} is not supported. Allowed types: ${this.options.allowedTypes.join(', ')}`);
        }

        // Check file size
        if (file.size > this.options.maxFileSize) {
            const maxSizeMB = Math.round(this.options.maxFileSize / (1024 * 1024));
            errors.push(`File size ${Math.round(file.size / (1024 * 1024))}MB exceeds maximum ${maxSizeMB}MB`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Show file preview
     * @param {File} file - File to preview
     */
    showFilePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImageUrl = e.target.result;
            this.updatePreview();
        };
        reader.readAsDataURL(file);
    }

    /**
     * Upload file to S3
     * @param {File} file - File to upload
     */
    async uploadFile(file) {
        this.isUploading = true;
        this.showUploadProgress();

        try {
            // For now, we'll use a mock upload since we don't have S3 integration on the frontend
            // In a real implementation, this would:
            // 1. Get a pre-signed URL from the backend
            // 2. Upload the file directly to S3
            // 3. Get the final URL
            
            // Simulate upload progress
            for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                this.updateUploadProgress(i, `Uploading... ${i}%`);
            }

            // Mock successful upload - in real implementation, this would be the S3 URL
            const mockUrl = `https://example.com/uploads/${Date.now()}-${file.name}`;
            this.currentImageUrl = mockUrl;
            
            this.hideUploadProgress();
            this.updatePreview();
            this.notifyUpdate();
            this.showSuccess('Image uploaded successfully');

        } catch (error) {
            this.hideUploadProgress();
            this.showError('Upload failed: ' + error.message);
            this.options.onError(error);
        } finally {
            this.isUploading = false;
        }
    }

    /**
     * Handle URL load
     */
    handleUrlLoad() {
        const urlInput = this.container.querySelector('#image-url-input');
        if (!urlInput) return;

        const url = urlInput.value.trim();
        if (!url) {
            this.showError('Please enter a valid image URL');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            this.showError('Please enter a valid URL');
            return;
        }

        this.currentImageUrl = url;
        this.updatePreview();
        this.notifyUpdate();
        this.clearErrors();
    }

    /**
     * Update image preview
     */
    updatePreview() {
        const previewContainer = this.container.querySelector('#image-preview-container');
        const previewImage = this.container.querySelector('#preview-image');
        const urlInput = this.container.querySelector('#image-url-input');

        if (this.currentImageUrl) {
            if (previewContainer) {
                previewContainer.style.display = 'block';
            }
            if (previewImage) {
                previewImage.src = this.currentImageUrl;
                previewImage.alt = this.currentAltText || 'Image preview';
            }
            if (urlInput) {
                urlInput.value = this.currentImageUrl;
            }
        } else {
            if (previewContainer) {
                previewContainer.style.display = 'none';
            }
        }
    }

    /**
     * Remove image
     */
    removeImage() {
        this.currentImageUrl = '';
        this.currentAltText = '';
        
        const urlInput = this.container.querySelector('#image-url-input');
        const altTextInput = this.container.querySelector('#alt-text-input');
        
        if (urlInput) {
            urlInput.value = '';
        }
        if (altTextInput) {
            altTextInput.value = '';
        }
        
        this.updatePreview();
        this.notifyUpdate();
        this.clearErrors();
    }

    /**
     * Show upload progress
     */
    showUploadProgress() {
        const progressContainer = this.container.querySelector('#upload-progress');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
    }

    /**
     * Hide upload progress
     */
    hideUploadProgress() {
        const progressContainer = this.container.querySelector('#upload-progress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    /**
     * Update upload progress
     * @param {number} percent - Progress percentage
     * @param {string} text - Progress text
     */
    updateUploadProgress(percent, text) {
        const progressFill = this.container.querySelector('#progress-fill');
        const progressText = this.container.querySelector('#progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        if (progressText) {
            progressText.textContent = text;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorContainer = this.container.querySelector('#upload-errors');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${message}</span>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const errorContainer = this.container.querySelector('#upload-errors');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <span>${message}</span>
                </div>
            `;
            errorContainer.style.display = 'block';
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                if (errorContainer) {
                    errorContainer.style.display = 'none';
                }
            }, 3000);
        }
    }

    /**
     * Clear error messages
     */
    clearErrors() {
        const errorContainer = this.container.querySelector('#upload-errors');
        if (errorContainer) {
            errorContainer.style.display = 'none';
            errorContainer.innerHTML = '';
        }
    }

    /**
     * Notify parent component of updates
     */
    notifyUpdate() {
        const data = {
            imageUrl: this.currentImageUrl,
            altText: this.currentAltText
        };
        this.options.onUpdate(data);
    }

    /**
     * Get current image data
     * @returns {Object} Current image data
     */
    getImageData() {
        return {
            imageUrl: this.currentImageUrl,
            altText: this.currentAltText
        };
    }

    /**
     * Set image data
     * @param {Object} data - Image data
     */
    setImageData(data) {
        this.currentImageUrl = data.imageUrl || '';
        this.currentAltText = data.altText || '';
        
        const urlInput = this.container.querySelector('#image-url-input');
        const altTextInput = this.container.querySelector('#alt-text-input');
        
        if (urlInput) {
            urlInput.value = this.currentImageUrl;
        }
        if (altTextInput) {
            altTextInput.value = this.currentAltText;
        }
        
        this.updatePreview();
    }

    /**
     * Check if image is set
     * @returns {boolean} True if image is set
     */
    hasImage() {
        return this.currentImageUrl && this.currentImageUrl.trim() !== '';
    }

    /**
     * Check if currently uploading
     * @returns {boolean} True if uploading
     */
    isUploading() {
        return this.isUploading;
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other scripts
window.ImageUploader = ImageUploader;
