/**
 * Template File Upload Component
 * Work Order #38: Implement File Upload Step for Template Creation Wizard
 * 
 * Handles file upload for template creation with drag-and-drop interface,
 * progress tracking, and validation for .fig and .png files.
 */

class TemplateFileUploadComponent {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            allowedTypes: ['.fig', '.png'],
            maxFileSize: 50 * 1024 * 1024, // 50MB
            onUploadStart: null,
            onUploadProgress: null,
            onUploadComplete: null,
            onUploadError: null,
            onFileSelect: null,
            ...options
        };

        this.state = {
            selectedFile: null,
            uploadId: null,
            isUploading: false,
            uploadProgress: 0,
            error: null,
            dragOver: false
        };

        this.eventListeners = new Map();
        this.init();
    }

    init() {
        if (!this.container) {
            console.error(`TemplateFileUploadComponent: Container element with ID "${this.containerId}" not found.`);
            return;
        }

        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="template-file-upload">
                <div class="template-upload-header">
                    <h3>Upload Template File</h3>
                    <p>Upload your Figma (.fig) or PNG (.png) template file</p>
                </div>
                
                <div class="template-upload-area ${this.state.dragOver ? 'drag-over' : ''}" 
                     data-upload-area="true">
                    <div class="template-upload-content">
                        <div class="template-upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <div class="template-upload-text">
                            <h4>Drag & Drop your file here</h4>
                            <p>or <span class="template-upload-browse">browse files</span></p>
                        </div>
                        <div class="template-upload-info">
                            <p>Supported formats: ${this.options.allowedTypes.join(', ')}</p>
                            <p>Maximum file size: ${this.formatFileSize(this.options.maxFileSize)}</p>
                        </div>
                    </div>
                    
                    <input type="file" 
                           class="template-file-input" 
                           accept="${this.options.allowedTypes.join(',')}"
                           style="display: none;">
                </div>

                ${this.state.selectedFile ? this.renderFileInfo() : ''}
                ${this.state.isUploading ? this.renderUploadProgress() : ''}
                ${this.state.error ? this.renderError() : ''}
                
                <div class="template-upload-actions">
                    ${this.renderActionButtons()}
                </div>
            </div>
        `;
    }

    renderFileInfo() {
        if (!this.state.selectedFile) return '';

        return `
            <div class="template-file-info">
                <div class="template-file-details">
                    <div class="template-file-icon">
                        <i class="fas ${this.getFileIcon(this.state.selectedFile.name)}"></i>
                    </div>
                    <div class="template-file-meta">
                        <h5>${this.state.selectedFile.name}</h5>
                        <p>${this.formatFileSize(this.state.selectedFile.size)} • ${this.getFileType(this.state.selectedFile.name)}</p>
                    </div>
                    <button class="template-file-remove" data-action="remove-file">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderUploadProgress() {
        return `
            <div class="template-upload-progress">
                <div class="template-progress-header">
                    <h4>Uploading...</h4>
                    <span class="template-progress-percentage">${Math.round(this.state.uploadProgress)}%</span>
                </div>
                <div class="template-progress-bar">
                    <div class="template-progress-fill" 
                         style="width: ${this.state.uploadProgress}%"></div>
                </div>
                <div class="template-progress-status">
                    <span class="template-progress-text">Uploading to cloud storage...</span>
                </div>
            </div>
        `;
    }

    renderError() {
        return `
            <div class="template-upload-error">
                <div class="template-error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="template-error-text">
                        <h4>Upload Failed</h4>
                        <p>${this.state.error}</p>
                    </div>
                    <button class="template-error-retry" data-action="retry-upload">
                        <i class="fas fa-redo"></i>
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    renderActionButtons() {
        if (this.state.isUploading) {
            return `
                <button class="template-upload-cancel-btn" data-action="cancel-upload">
                    <i class="fas fa-times"></i>
                    Cancel Upload
                </button>
            `;
        }

        if (this.state.selectedFile && !this.state.error) {
            return `
                <button class="template-upload-btn" data-action="start-upload">
                    <i class="fas fa-upload"></i>
                    Upload File
                </button>
            `;
        }

        return '';
    }

    attachEventListeners() {
        // File input change
        const fileInput = this.container.querySelector('.template-file-input');
        if (fileInput) {
            this.addEventListener(fileInput, 'change', this.handleFileSelect.bind(this));
        }

        // Browse button click
        const browseButton = this.container.querySelector('.template-upload-browse');
        if (browseButton) {
            this.addEventListener(browseButton, 'click', () => {
                fileInput.click();
            });
        }

        // Drag and drop events
        const uploadArea = this.container.querySelector('[data-upload-area="true"]');
        if (uploadArea) {
            this.addEventListener(uploadArea, 'dragover', this.handleDragOver.bind(this));
            this.addEventListener(uploadArea, 'dragleave', this.handleDragLeave.bind(this));
            this.addEventListener(uploadArea, 'drop', this.handleDrop.bind(this));
            this.addEventListener(uploadArea, 'click', () => {
                if (!this.state.selectedFile) {
                    fileInput.click();
                }
            });
        }

        // Action buttons
        this.container.addEventListener('click', this.handleActionClick.bind(this));

        // Prevent default drag behaviors on document
        this.addEventListener(document, 'dragover', (e) => e.preventDefault());
        this.addEventListener(document, 'drop', (e) => e.preventDefault());
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.selectFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.setState({ dragOver: true });
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.setState({ dragOver: false });
    }

    handleDrop(event) {
        event.preventDefault();
        this.setState({ dragOver: false });

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.selectFile(files[0]);
        }
    }

    handleActionClick(event) {
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        switch (action) {
            case 'remove-file':
                this.removeFile();
                break;
            case 'start-upload':
                this.startUpload();
                break;
            case 'cancel-upload':
                this.cancelUpload();
                break;
            case 'retry-upload':
                this.retryUpload();
                break;
        }
    }

    selectFile(file) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            this.setState({ error: validation.error });
            return;
        }

        this.setState({
            selectedFile: file,
            error: null,
            uploadProgress: 0
        });

        // Call onFileSelect callback
        if (this.options.onFileSelect) {
            this.options.onFileSelect(file);
        }
    }

    removeFile() {
        this.setState({
            selectedFile: null,
            error: null,
            uploadProgress: 0,
            uploadId: null
        });

        // Clear file input
        const fileInput = this.container.querySelector('.template-file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    async startUpload() {
        if (!this.state.selectedFile) return;

        try {
            this.setState({
                isUploading: true,
                error: null,
                uploadProgress: 0
            });

            // Call onUploadStart callback
            if (this.options.onUploadStart) {
                this.options.onUploadStart(this.state.selectedFile);
            }

            // Step 1: Initiate upload
            const initiateResponse = await this.initiateUpload();
            this.state.uploadId = initiateResponse.uploadId;

            // Step 2: Upload file to S3
            await this.uploadToS3(initiateResponse.presignedUrl);

            // Step 3: Complete upload
            const completeResponse = await this.completeUpload();

            this.setState({
                isUploading: false,
                uploadProgress: 100
            });

            // Call onUploadComplete callback
            if (this.options.onUploadComplete) {
                this.options.onUploadComplete(completeResponse);
            }

        } catch (error) {
            console.error('TemplateFileUploadComponent: Upload failed:', error);
            this.setState({
                isUploading: false,
                error: error.message || 'Upload failed. Please try again.'
            });

            // Call onUploadError callback
            if (this.options.onUploadError) {
                this.options.onUploadError(error);
            }
        }
    }

    async initiateUpload() {
        const response = await fetch('/api/admin/templates/upload/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-admin-token-123'
            },
            body: JSON.stringify({
                fileName: this.state.selectedFile.name,
                fileType: this.state.selectedFile.type,
                fileSize: this.state.selectedFile.size
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to initiate upload');
        }

        return await response.json();
    }

    async uploadToS3(presignedUrl) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    this.setState({ uploadProgress: progress });

                    // Call onUploadProgress callback
                    if (this.options.onUploadProgress) {
                        this.options.onUploadProgress(progress);
                    }
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed with status: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed due to network error'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload was cancelled'));
            });

            xhr.open('PUT', presignedUrl);
            xhr.setRequestHeader('Content-Type', this.state.selectedFile.type);
            xhr.send(this.state.selectedFile);
        });
    }

    async completeUpload() {
        const response = await fetch('/api/admin/templates/upload/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock-admin-token-123'
            },
            body: JSON.stringify({
                uploadId: this.state.uploadId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to complete upload');
        }

        return await response.json();
    }

    cancelUpload() {
        // TODO: Implement cancel upload API call
        this.setState({
            isUploading: false,
            uploadProgress: 0,
            uploadId: null
        });
    }

    retryUpload() {
        this.setState({ error: null });
        this.startUpload();
    }

    validateFile(file) {
        // Check file type
        const extension = this.getFileExtension(file.name);
        if (!this.options.allowedTypes.includes(`.${extension}`)) {
            return {
                isValid: false,
                error: `File type .${extension} is not supported. Please upload a ${this.options.allowedTypes.join(' or ')} file.`
            };
        }

        // Check file size
        if (file.size > this.options.maxFileSize) {
            return {
                isValid: false,
                error: `File size (${this.formatFileSize(file.size)}) exceeds the maximum allowed size of ${this.formatFileSize(this.options.maxFileSize)}.`
            };
        }

        return { isValid: true };
    }

    getFileExtension(fileName) {
        return fileName.split('.').pop().toLowerCase();
    }

    getFileType(fileName) {
        const extension = this.getFileExtension(fileName);
        switch (extension) {
            case 'fig':
                return 'Figma File';
            case 'png':
                return 'PNG Image';
            default:
                return 'Unknown';
        }
    }

    getFileIcon(fileName) {
        const extension = this.getFileExtension(fileName);
        switch (extension) {
            case 'fig':
                return 'fa-palette';
            case 'png':
                return 'fa-image';
            default:
                return 'fa-file';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({ event, handler });
    }

    destroy() {
        // Remove all event listeners
        for (const [element, listeners] of this.eventListeners) {
            for (const { event, handler } of listeners) {
                element.removeEventListener(event, handler);
            }
        }
        this.eventListeners.clear();

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    // Public API methods
    getSelectedFile() {
        return this.state.selectedFile;
    }

    getUploadState() {
        return { ...this.state };
    }

    reset() {
        this.setState({
            selectedFile: null,
            uploadId: null,
            isUploading: false,
            uploadProgress: 0,
            error: null,
            dragOver: false
        });
    }
}

// Export for use in other modules
window.TemplateFileUploadComponent = TemplateFileUploadComponent;
