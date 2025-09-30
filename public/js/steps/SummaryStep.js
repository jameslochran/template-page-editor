/**
 * Summary Step Component
 * Work Order #47: Implement Multi-Step Template Upload Wizard with State Management
 * 
 * Provides a final review of all template data before submission, allowing users
 * to verify all information is correct before completing the wizard.
 */

class SummaryStep {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            stateManager: null,
            onStepComplete: null,
            ...options
        };

        if (!this.container) {
            console.error('SummaryStep: Container not found:', containerId);
            return;
        }

        if (!this.options.stateManager) {
            console.error('SummaryStep: State manager is required');
            return;
        }

        this.stateManager = this.options.stateManager;
        this.elements = {};

        this.init();
    }

    /**
     * Initialize the summary step
     */
    init() {
        this.render();
        this.setupEventListeners();
        this.loadSummaryData();
    }

    /**
     * Render the summary step UI
     */
    render() {
        this.container.innerHTML = `
            <div class="summary-step">
                <div class="step-header">
                    <h3 class="step-title">
                        <i class="fas fa-clipboard-check"></i>
                        Review & Submit
                    </h3>
                    <p class="step-description">
                        Please review all the information below before submitting your template. You can go back to make changes if needed.
                    </p>
                </div>

                <div class="summary-content">
                    <div class="summary-sections">
                        <!-- Upload Section -->
                        <div class="summary-section" id="upload-summary">
                            <div class="section-header">
                                <h4 class="section-title">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    Upload Information
                                </h4>
                                <button class="btn btn-sm btn-secondary" onclick="this.editStep(1)">
                                    <i class="fas fa-edit"></i>
                                    Edit
                                </button>
                            </div>
                            <div class="section-content" id="upload-summary-content">
                                <!-- Content will be populated dynamically -->
                            </div>
                        </div>

                        <!-- PNG Components Section (conditional) -->
                        <div class="summary-section" id="png-components-summary" style="display: none;">
                            <div class="section-header">
                                <h4 class="section-title">
                                    <i class="fas fa-mouse-pointer"></i>
                                    Interactive Components
                                </h4>
                                <button class="btn btn-sm btn-secondary" onclick="this.editStep(2)">
                                    <i class="fas fa-edit"></i>
                                    Edit
                                </button>
                            </div>
                            <div class="section-content" id="png-components-summary-content">
                                <!-- Content will be populated dynamically -->
                            </div>
                        </div>

                        <!-- Metadata Section -->
                        <div class="summary-section" id="metadata-summary">
                            <div class="section-header">
                                <h4 class="section-title">
                                    <i class="fas fa-info-circle"></i>
                                    Template Information
                                </h4>
                                <button class="btn btn-sm btn-secondary" onclick="this.editStep(3)">
                                    <i class="fas fa-edit"></i>
                                    Edit
                                </button>
                            </div>
                            <div class="section-content" id="metadata-summary-content">
                                <!-- Content will be populated dynamically -->
                            </div>
                        </div>
                    </div>

                    <div class="summary-actions">
                        <div class="confirmation-checkbox">
                            <label class="checkbox-label">
                                <input type="checkbox" id="confirm-submission" />
                                <span class="checkmark"></span>
                                I have reviewed all the information above and confirm it is correct
                            </label>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <div class="summary-help">
                        <h5>Before You Submit:</h5>
                        <ul>
                            <li>Verify that your template file uploaded correctly</li>
                            <li>Check that all component definitions are accurate (for PNG templates)</li>
                            <li>Ensure the template name and description are clear and descriptive</li>
                            <li>Confirm the category and tags are appropriate</li>
                            <li>Review the template preview to ensure it looks correct</li>
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
            uploadSummary: document.getElementById('upload-summary'),
            uploadSummaryContent: document.getElementById('upload-summary-content'),
            pngComponentsSummary: document.getElementById('png-components-summary'),
            pngComponentsSummaryContent: document.getElementById('png-components-summary-content'),
            metadataSummary: document.getElementById('metadata-summary'),
            metadataSummaryContent: document.getElementById('metadata-summary-content'),
            confirmCheckbox: document.getElementById('confirm-submission')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Confirmation checkbox
        this.elements.confirmCheckbox.addEventListener('change', () => this.handleConfirmationChange());
    }

    /**
     * Load summary data
     */
    loadSummaryData() {
        this.loadUploadSummary();
        this.loadPngComponentsSummary();
        this.loadMetadataSummary();
        this.updateConfirmationState();
    }

    /**
     * Load upload summary
     */
    loadUploadSummary() {
        const uploadData = this.stateManager.getStepData('upload');
        
        if (!uploadData.isUploaded) {
            this.elements.uploadSummaryContent.innerHTML = `
                <div class="summary-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>No file uploaded</span>
                </div>
            `;
            return;
        }

        const fileTypeText = uploadData.fileType === 'image/png' ? 'PNG Image' : 'Figma File';
        const fileSizeText = this.formatFileSize(uploadData.fileSize);

        this.elements.uploadSummaryContent.innerHTML = `
            <div class="summary-item">
                <div class="item-label">File Name:</div>
                <div class="item-value">${this.escapeHtml(uploadData.fileName)}</div>
            </div>
            <div class="summary-item">
                <div class="item-label">File Type:</div>
                <div class="item-value">${fileTypeText}</div>
            </div>
            <div class="summary-item">
                <div class="item-label">File Size:</div>
                <div class="item-value">${fileSizeText}</div>
            </div>
            <div class="summary-item">
                <div class="item-label">Preview:</div>
                <div class="item-value">
                    <img src="${uploadData.publicUrl}" alt="Template preview" class="template-preview-image" />
                </div>
            </div>
        `;
    }

    /**
     * Load PNG components summary
     */
    loadPngComponentsSummary() {
        const uploadData = this.stateManager.getStepData('upload');
        const pngData = this.stateManager.getStepData('pngComponents');
        
        // Only show for PNG files
        if (uploadData.fileType !== 'image/png') {
            this.elements.pngComponentsSummary.style.display = 'none';
            return;
        }

        this.elements.pngComponentsSummary.style.display = 'block';

        if (!pngData.components || pngData.components.length === 0) {
            this.elements.pngComponentsSummaryContent.innerHTML = `
                <div class="summary-warning">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>No interactive components defined</span>
                </div>
            `;
            return;
        }

        const componentsHtml = pngData.components.map((component, index) => `
            <div class="component-summary">
                <div class="component-header">
                    <span class="component-number">${index + 1}</span>
                    <span class="component-name">${this.escapeHtml(component.name)}</span>
                    <span class="component-type">${component.type}</span>
                </div>
                ${component.description ? `
                    <div class="component-description">
                        ${this.escapeHtml(component.description)}
                    </div>
                ` : ''}
            </div>
        `).join('');

        this.elements.pngComponentsSummaryContent.innerHTML = `
            <div class="components-count">
                <strong>${pngData.components.length}</strong> interactive component${pngData.components.length !== 1 ? 's' : ''} defined
            </div>
            <div class="components-list">
                ${componentsHtml}
            </div>
        `;
    }

    /**
     * Load metadata summary
     */
    loadMetadataSummary() {
        const metadata = this.stateManager.getStepData('metadata');
        
        if (!metadata.name) {
            this.elements.metadataSummaryContent.innerHTML = `
                <div class="summary-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>No metadata provided</span>
                </div>
            `;
            return;
        }

        const tagsHtml = metadata.tags && metadata.tags.length > 0 
            ? metadata.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')
            : '<span class="no-tags">No tags added</span>';

        this.elements.metadataSummaryContent.innerHTML = `
            <div class="summary-item">
                <div class="item-label">Template Name:</div>
                <div class="item-value">${this.escapeHtml(metadata.name)}</div>
            </div>
            <div class="summary-item">
                <div class="item-label">Description:</div>
                <div class="item-value">${this.escapeHtml(metadata.description)}</div>
            </div>
            <div class="summary-item">
                <div class="item-label">Category:</div>
                <div class="item-value">${this.escapeHtml(metadata.categoryName)}</div>
            </div>
            <div class="summary-item">
                <div class="item-label">Tags:</div>
                <div class="item-value">
                    <div class="tags-container">${tagsHtml}</div>
                </div>
            </div>
        `;
    }

    /**
     * Handle confirmation checkbox change
     */
    handleConfirmationChange() {
        this.updateConfirmationState();
    }

    /**
     * Update confirmation state
     */
    updateConfirmationState() {
        const isConfirmed = this.elements.confirmCheckbox.checked;
        
        this.stateManager.updateStepData('summary', {
            isReviewed: isConfirmed,
            error: isConfirmed ? null : 'Please confirm that you have reviewed all information'
        });
        
        if (isConfirmed && this.options.onStepComplete) {
            this.options.onStepComplete();
        }
    }

    /**
     * Edit step (placeholder for navigation)
     */
    editStep(stepNumber) {
        // This would typically trigger navigation back to the specified step
        // For now, we'll just show an alert
        alert(`This would navigate back to step ${stepNumber} for editing.`);
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
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Destroy the component
     */
    destroy() {
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SummaryStep;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.SummaryStep = SummaryStep;
}
