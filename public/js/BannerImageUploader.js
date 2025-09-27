/**
 * BannerImageUploader Component
 * Work Order #26: Build ImageUploader Component for Banner Background Images
 * 
 * A specialized ImageUploader component for banner background images with
 * aspect ratio handling and banner-specific styling.
 */

class BannerImageUploader {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            initialImageUrl: '',
            initialAltText: '',
            onUpdate: () => {}, // Callback for when image URL or alt text changes
            onError: () => {},   // Callback for errors
            maxFileSize: 10 * 1024 * 1024, // Default to 10MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            showAltText: true,
            showRemoveButton: true,
            aspectRatio: '16:9', // Default banner aspect ratio
            ...options
        };

        this.currentImageUrl = this.options.initialImageUrl;
        this.currentAltText = this.options.initialAltText;
        this.file = null;
        this.uploadProgress = 0;
        this.errors = [];
        this.isUploading = false;
        this.uploadId = null;

        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="banner-image-uploader-container">
                <div class="banner-image-uploader-header">
                    <h4>Banner Background Image</h4>
                    <p class="uploader-description">Upload a background image for your banner component.</p>
                </div>
                <div class="banner-image-uploader-content">
                    ${this.currentImageUrl ? this.renderPreview() : this.renderUploadControls()}
                    ${this.options.showAltText ? this.renderAltTextInput() : ''}
                    ${this.errors.length > 0 ? this.renderErrors() : ''}
                    ${this.isUploading ? this.renderProgressBar() : ''}
                </div>
            </div>
        `;
        this.setupEventListeners();
    }

    renderUploadControls() {
        return `
            <div class="file-upload-area">
                <div class="upload-dropzone" data-action="select-file">
                    <div class="upload-icon">📷</div>
                    <div class="upload-text">
                        <p class="upload-primary">Upload Banner Image</p>
                        <p class="upload-secondary">Drag & drop or click to select</p>
                        <p class="upload-secondary">Supports JPEG, PNG, WebP (max 10MB)</p>
                    </div>
                </div>
            </div>
            <div class="url-input-area">
                <label for="banner-image-url">Or enter image URL:</label>
                <div class="url-input-group">
                    <input type="url" id="banner-image-url" placeholder="https://example.com/image.jpg" />
                    <button type="button" class="btn btn-primary" data-action="load-url">Load URL</button>
                </div>
            </div>
        `;
    }

    renderPreview() {
        return `
            <div class="image-preview-container">
                <div class="image-preview-header">
                    <h5>Current Banner Image</h5>
                    <div class="preview-actions">
                        <button type="button" class="btn btn-secondary btn-sm" data-action="change-image">Change</button>
                        ${this.options.showRemoveButton ? '<button type="button" class="btn btn-danger btn-sm" data-action="remove-image">Remove</button>' : ''}
                    </div>
                </div>
                <div class="image-preview banner-preview">
                    <div class="banner-preview-container" style="aspect-ratio: ${this.options.aspectRatio};">
                        <img src="${this.currentImageUrl}" alt="${this.currentAltText}" />
                    </div>
                </div>
            </div>
        `;
    }

    renderAltTextInput() {
        return `
            <div class="alt-text-area">
                <label for="banner-alt-text">Alt Text (for accessibility):</label>
                <input type="text" id="banner-alt-text" value="${this.currentAltText}" placeholder="Describe the banner image..." />
                <div class="alt-text-help">
                    <small>Provide a description of the banner image for screen readers and accessibility.</small>
                </div>
            </div>
        `;
    }

    renderProgressBar() {
        return `
            <div class="upload-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.uploadProgress}%"></div>
                </div>
                <div class="progress-text">Uploading... ${this.uploadProgress}%</div>
            </div>
        `;
    }

    renderErrors() {
        return `
            <div class="upload-errors">
                ${this.errors.map(error => `
                    <div class="error-message">
                        <i>⚠️</i>
                        <span>${error}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupEventListeners() {
        // File selection
        const dropzone = this.container.querySelector('[data-action="select-file"]');
        if (dropzone) {
            dropzone.addEventListener('click', () => this.selectFile());
            dropzone.addEventListener('dragover', (e) => this.handleDragOver(e));
            dropzone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            dropzone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // URL input
        const urlButton = this.container.querySelector('[data-action="load-url"]');
        if (urlButton) {
            urlButton.addEventListener('click', () => this.loadFromUrl());
        }

        const urlInput = this.container.querySelector('#banner-image-url');
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.loadFromUrl();
                }
            });
        }

        // Preview actions
        const changeButton = this.container.querySelector('[data-action="change-image"]');
        if (changeButton) {
            changeButton.addEventListener('click', () => this.showUploadControls());
        }

        const removeButton = this.container.querySelector('[data-action="remove-image"]');
        if (removeButton) {
            removeButton.addEventListener('click', () => this.removeImage());
        }

        // Alt text input
        const altTextInput = this.container.querySelector('#banner-alt-text');
        if (altTextInput) {
            altTextInput.addEventListener('input', (e) => {
                this.currentAltText = e.target.value;
                this.emitUpdate();
            });
        }
    }

    selectFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = this.options.allowedTypes.join(',');
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFile(file);
            }
        });
        input.click();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFile(file) {
        this.clearErrors();

        // Validate file
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            this.errors = validation.errors;
            this.render();
            return;
        }

        this.file = file;
        this.uploadFile();
    }

    validateFile(file) {
        const errors = [];

        // Check file type
        if (!this.options.allowedTypes.includes(file.type)) {
            errors.push(`File type ${file.type} is not supported. Allowed types: ${this.options.allowedTypes.join(', ')}`);
        }

        // Check file size
        if (file.size > this.options.maxFileSize) {
            const maxSizeMB = this.options.maxFileSize / (1024 * 1024);
            errors.push(`File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed size of ${maxSizeMB}MB`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async uploadFile() {
        try {
            this.isUploading = true;
            this.uploadProgress = 0;
            this.render();

            // Initiate upload
            const initiateResponse = await fetch('/api/admin/images/upload/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer admin-token' // Mock admin token
                },
                body: JSON.stringify({
                    fileName: this.file.name,
                    fileType: this.file.type,
                    fileSize: this.file.size,
                    altText: this.currentAltText
                })
            });

            if (!initiateResponse.ok) {
                throw new Error('Failed to initiate upload');
            }

            const initiateData = await initiateResponse.json();
            this.uploadId = initiateData.data.uploadId;

            // Upload to S3
            const uploadResponse = await fetch(initiateData.data.presignedUrl, {
                method: 'PUT',
                body: this.file,
                headers: {
                    'Content-Type': this.file.type
                }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file to S3');
            }

            // Complete upload
            const completeResponse = await fetch('/api/admin/images/upload/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer admin-token' // Mock admin token
                },
                body: JSON.stringify({
                    uploadId: this.uploadId,
                    s3Key: initiateData.data.s3Key,
                    bucket: initiateData.data.bucket,
                    fileName: this.file.name,
                    fileSize: this.file.size,
                    contentType: this.file.type,
                    altText: this.currentAltText
                })
            });

            if (!completeResponse.ok) {
                throw new Error('Failed to complete upload');
            }

            const completeData = await completeResponse.json();
            
            // Update current image
            this.currentImageUrl = completeData.data.url;
            this.currentAltText = completeData.data.altText;
            this.isUploading = false;
            this.uploadProgress = 100;

            this.render();
            this.emitUpdate();

        } catch (error) {
            console.error('Upload error:', error);
            this.errors = [error.message];
            this.isUploading = false;
            this.uploadProgress = 0;
            this.render();
            this.options.onError(error);
        }
    }

    loadFromUrl() {
        const urlInput = this.container.querySelector('#banner-image-url');
        const url = urlInput.value.trim();

        if (!url) {
            this.errors = ['Please enter a valid image URL'];
            this.render();
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            this.errors = ['Please enter a valid URL'];
            this.render();
            return;
        }

        this.clearErrors();
        this.currentImageUrl = url;
        this.render();
        this.emitUpdate();
    }

    removeImage() {
        this.currentImageUrl = '';
        this.currentAltText = '';
        this.file = null;
        this.clearErrors();
        this.render();
        this.emitUpdate();
    }

    showUploadControls() {
        this.currentImageUrl = '';
        this.file = null;
        this.clearErrors();
        this.render();
    }

    clearErrors() {
        this.errors = [];
    }

    emitUpdate() {
        this.options.onUpdate({
            imageUrl: this.currentImageUrl,
            altText: this.currentAltText
        });
    }

    // Public methods
    getImageUrl() {
        return this.currentImageUrl;
    }

    getAltText() {
        return this.currentAltText;
    }

    setImageUrl(url) {
        this.currentImageUrl = url;
        this.render();
    }

    setAltText(altText) {
        this.currentAltText = altText;
        const altTextInput = this.container.querySelector('#banner-alt-text');
        if (altTextInput) {
            altTextInput.value = altText;
        }
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

// Export for use in other scripts
window.BannerImageUploader = BannerImageUploader;
