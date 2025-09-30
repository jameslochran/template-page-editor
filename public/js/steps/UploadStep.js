/**
 * Upload Step Component
 * Work Order #47: Implement Multi-Step Template Upload Wizard with State Management
 * 
 * Handles file upload functionality for the template creation wizard,
 * supporting both PNG and Figma file types with progress tracking.
 */

class UploadStep {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            stateManager: null,
            onStepComplete: null,
            ...options
        };

        if (!this.container) {
            console.error('UploadStep: Container not found:', containerId);
            return;
        }

        if (!this.options.stateManager) {
            console.error('UploadStep: State manager is required');
            return;
        }

        this.stateManager = this.options.stateManager;
        this.elements = {};
        this.isUploading = false;
        this.uploadAbortController = null;

        this.init();
    }

    /**
     * Initialize the upload step
     */
    init() {
        this.render();
        this.setupEventListeners();
        this.loadExistingData();
    }

    /**
     * Render the upload step UI
     */
    render() {
        this.container.innerHTML = `
            <div class="upload-step">
                <div class="step-header">
                    <h3 class="step-title">
                        <i class="fas fa-cloud-upload-alt"></i>
                        Upload Template File
                    </h3>
                    <p class="step-description">
                        Upload your template file. Supported formats: PNG images and Figma files.
                    </p>
                </div>

                <div class="upload-area" id="upload-area">
                    <div class="upload-content">
                        <div class="upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <div class="upload-text">
                            <h4>Drag & drop your file here</h4>
                            <p>or <span class="upload-link">browse files</span></p>
                        </div>
                        <div class="upload-formats">
                            <span class="format-tag">PNG</span>
                            <span class="format-tag">Figma</span>
                        </div>
                    </div>
                    <input type="file" id="file-input" accept=".png,.fig" style="display: none;">
                </div>

                <div class="upload-progress" id="upload-progress" style="display: none;">
                    <div class="progress-header">
                        <span class="file-name" id="upload-file-name"></span>
                        <span class="progress-percentage" id="upload-progress-percentage">0%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="upload-progress-fill"></div>
                    </div>
                    <div class="progress-status" id="upload-progress-status">Preparing upload...</div>
                </div>

                <div class="upload-result" id="upload-result" style="display: none;">
                    <div class="result-content">
                        <div class="result-icon success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="result-info">
                            <h4 class="result-title">Upload Successful!</h4>
                            <p class="result-description" id="upload-result-description"></p>
                            <div class="file-details" id="upload-file-details"></div>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="upload-change-file">
                            <i class="fas fa-edit"></i>
                            Change File
                        </button>
                    </div>
                </div>

                <div class="upload-error" id="upload-error" style="display: none;">
                    <div class="error-content">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="error-info">
                            <h4 class="error-title">Upload Failed</h4>
                            <p class="error-message" id="upload-error-message"></p>
                        </div>
                        <button class="btn btn-primary btn-sm" id="upload-retry">
                            <i class="fas fa-redo"></i>
                            Try Again
                        </button>
                    </div>
                </div>

                <div class="step-actions">
                    <div class="file-requirements">
                        <h5>File Requirements:</h5>
                        <ul>
                            <li><strong>PNG:</strong> High-resolution images for component definition</li>
                            <li><strong>Figma:</strong> Design files for direct import</li>
                            <li><strong>Size:</strong> Maximum 50MB per file</li>
                            <li><strong>Quality:</strong> High-resolution recommended for best results</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        this.cacheElements();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            uploadArea: document.getElementById('upload-area'),
            fileInput: document.getElementById('file-input'),
            uploadProgress: document.getElementById('upload-progress'),
            fileName: document.getElementById('upload-file-name'),
            progressPercentage: document.getElementById('upload-progress-percentage'),
            progressFill: document.getElementById('upload-progress-fill'),
            progressStatus: document.getElementById('upload-progress-status'),
            uploadResult: document.getElementById('upload-result'),
            resultDescription: document.getElementById('upload-result-description'),
            fileDetails: document.getElementById('upload-file-details'),
            changeFileBtn: document.getElementById('upload-change-file'),
            uploadError: document.getElementById('upload-error'),
            errorMessage: document.getElementById('upload-error-message'),
            retryBtn: document.getElementById('upload-retry')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File input change
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        this.elements.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Click to browse
        this.elements.uploadArea.addEventListener('click', () => this.elements.fileInput.click());

        // Change file button
        this.elements.changeFileBtn.addEventListener('click', () => this.resetUpload());

        // Retry button
        this.elements.retryBtn.addEventListener('click', () => this.resetUpload());
    }

    /**
     * Load existing data from state
     */
    loadExistingData() {
        const uploadData = this.stateManager.getStepData('upload');
        
        if (uploadData.isUploaded && uploadData.publicUrl) {
            this.showUploadResult(uploadData);
        } else if (uploadData.error) {
            this.showUploadError(uploadData.error);
        }
    }

    /**
     * Handle file selection
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    /**
     * Handle drag over
     */
    handleDragOver(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.add('drag-over');
    }

    /**
     * Handle drag leave
     */
    handleDragLeave(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.remove('drag-over');
    }

    /**
     * Handle file drop
     */
    handleDrop(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    /**
     * Process selected file
     */
    async processFile(file) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.showUploadError(validation.error);
            return;
        }

        // Clear any previous errors
        this.stateManager.clearStepError(1);

        // Start upload
        await this.uploadFile(file);
    }

    /**
     * Validate file
     */
    validateFile(file) {
        // Check file type
        const allowedTypes = ['image/png', 'application/figma'];
        const allowedExtensions = ['.png', '.fig'];
        
        const hasValidType = allowedTypes.includes(file.type);
        const hasValidExtension = allowedExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );

        if (!hasValidType && !hasValidExtension) {
            return {
                valid: false,
                error: 'Please select a PNG image or Figma file (.fig)'
            };
        }

        // Check file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'File size must be less than 50MB'
            };
        }

        return { valid: true };
    }

    /**
     * Upload file
     */
    async uploadFile(file) {
        try {
            this.isUploading = true;
            this.uploadAbortController = new AbortController();
            
            this.showUploadProgress(file);

            // Step 1: Initiate upload
            const initiateResponse = await fetch('/api/admin/templates/upload/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-admin-token-123'
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size
                }),
                signal: this.uploadAbortController.signal
            });

            if (!initiateResponse.ok) {
                const errorData = await initiateResponse.json();
                throw new Error(errorData.message || 'Failed to initiate upload');
            }

            const initiateData = await initiateResponse.json();
            const uploadId = initiateData.data.uploadId;
            const uploadUrl = initiateData.data.presignedUrl;

            // Update state with upload ID
            this.stateManager.updateStepData('upload', {
                uploadId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            });

            // Step 2: Upload file to S3
            this.updateProgressStatus('Uploading file...');
            
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                signal: this.uploadAbortController.signal
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file to storage');
            }

            // Step 3: Complete upload
            this.updateProgressStatus('Finalizing upload...');
            
            const completeResponse = await fetch('/api/admin/templates/upload/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-admin-token-123'
                },
                body: JSON.stringify({
                    uploadId,
                    fileName: file.name
                }),
                signal: this.uploadAbortController.signal
            });

            if (!completeResponse.ok) {
                const errorData = await completeResponse.json();
                throw new Error(errorData.message || 'Failed to complete upload');
            }

            const completeData = await completeResponse.json();
            const publicUrl = completeData.data.publicUrl;

            // Update state with successful upload
            this.stateManager.updateStepData('upload', {
                file,
                publicUrl,
                isUploaded: true,
                uploadProgress: 100,
                error: null
            });

            // Show success
            this.showUploadResult({
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                publicUrl
            });

            // Mark step as complete
            if (this.options.onStepComplete) {
                this.options.onStepComplete();
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Upload cancelled');
                return;
            }

            console.error('UploadStep: Upload failed:', error);
            this.showUploadError(error.message);
            this.stateManager.setStepError(1, error.message);
        } finally {
            this.isUploading = false;
            this.uploadAbortController = null;
        }
    }

    /**
     * Show upload progress
     */
    showUploadProgress(file) {
        this.elements.uploadArea.style.display = 'none';
        this.elements.uploadProgress.style.display = 'block';
        this.elements.uploadResult.style.display = 'none';
        this.elements.uploadError.style.display = 'none';

        this.elements.fileName.textContent = file.name;
        this.updateProgress(0);
        this.updateProgressStatus('Preparing upload...');
    }

    /**
     * Update progress
     */
    updateProgress(percentage) {
        this.elements.progressPercentage.textContent = `${Math.round(percentage)}%`;
        this.elements.progressFill.style.width = `${percentage}%`;
        
        this.stateManager.updateStepData('upload', {
            uploadProgress: percentage
        });
    }

    /**
     * Update progress status
     */
    updateProgressStatus(status) {
        this.elements.progressStatus.textContent = status;
    }

    /**
     * Show upload result
     */
    showUploadResult(data) {
        this.elements.uploadArea.style.display = 'none';
        this.elements.uploadProgress.style.display = 'none';
        this.elements.uploadResult.style.display = 'block';
        this.elements.uploadError.style.display = 'none';

        const fileTypeText = data.fileType === 'image/png' ? 'PNG Image' : 'Figma File';
        const fileSizeText = this.formatFileSize(data.fileSize);

        this.elements.resultDescription.textContent = 
            `Your ${fileTypeText} has been uploaded successfully.`;
        
        this.elements.fileDetails.innerHTML = `
            <div class="file-detail">
                <span class="detail-label">File:</span>
                <span class="detail-value">${data.fileName}</span>
            </div>
            <div class="file-detail">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${fileTypeText}</span>
            </div>
            <div class="file-detail">
                <span class="detail-label">Size:</span>
                <span class="detail-value">${fileSizeText}</span>
            </div>
        `;
    }

    /**
     * Show upload error
     */
    showUploadError(message) {
        this.elements.uploadArea.style.display = 'none';
        this.elements.uploadProgress.style.display = 'none';
        this.elements.uploadResult.style.display = 'none';
        this.elements.uploadError.style.display = 'block';

        this.elements.errorMessage.textContent = message;
    }

    /**
     * Reset upload
     */
    resetUpload() {
        // Cancel any ongoing upload
        if (this.uploadAbortController) {
            this.uploadAbortController.abort();
        }

        // Reset state
        this.stateManager.updateStepData('upload', {
            file: null,
            uploadId: null,
            fileName: null,
            fileType: null,
            fileSize: null,
            publicUrl: null,
            isUploaded: false,
            uploadProgress: 0,
            error: null
        });

        // Reset UI
        this.elements.uploadArea.style.display = 'block';
        this.elements.uploadProgress.style.display = 'none';
        this.elements.uploadResult.style.display = 'none';
        this.elements.uploadError.style.display = 'none';
        this.elements.fileInput.value = '';
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Destroy the component
     */
    destroy() {
        // Cancel any ongoing upload
        if (this.uploadAbortController) {
            this.uploadAbortController.abort();
        }

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UploadStep;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.UploadStep = UploadStep;
}
