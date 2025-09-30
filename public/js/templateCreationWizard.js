/**
 * Template Creation Wizard
 * Work Order #38: Implement File Upload Step for Template Creation Wizard
 * 
 * Orchestrates the template creation workflow including file upload,
 * template configuration, and final template creation.
 */

class TemplateCreationWizard {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            onWizardComplete: null,
            onWizardCancel: null,
            ...options
        };

        this.state = {
            currentStep: 1,
            totalSteps: 3,
            uploadedFile: null,
            uploadData: null,
            templateData: {
                name: '',
                description: '',
                categoryId: '',
                components: []
            },
            isSubmitting: false
        };

        this.steps = [
            { id: 1, title: 'Upload File', description: 'Upload your template file' },
            { id: 2, title: 'Configure Template', description: 'Set template details' },
            { id: 3, title: 'Review & Create', description: 'Review and create template' }
        ];

        this.fileUploadComponent = null;
        this.eventListeners = new Map();
        this.init();
    }

    init() {
        if (!this.container) {
            console.error(`TemplateCreationWizard: Container element with ID "${this.containerId}" not found.`);
            return;
        }

        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="template-creation-wizard">
                <div class="wizard-header">
                    <h2>Create New Template</h2>
                    <p>Follow the steps below to create a new template from your uploaded file</p>
                </div>

                <div class="wizard-progress">
                    ${this.renderProgressSteps()}
                </div>

                <div class="wizard-content">
                    ${this.renderCurrentStep()}
                </div>

                <div class="wizard-actions">
                    ${this.renderActionButtons()}
                </div>
            </div>
        `;

        // Initialize step-specific components
        this.initializeStepComponents();
    }

    renderProgressSteps() {
        return this.steps.map(step => `
            <div class="wizard-step ${step.id === this.state.currentStep ? 'active' : ''} ${step.id < this.state.currentStep ? 'completed' : ''}">
                <div class="wizard-step-number">
                    ${step.id < this.state.currentStep ? '<i class="fas fa-check"></i>' : step.id}
                </div>
                <div class="wizard-step-content">
                    <h4>${step.title}</h4>
                    <p>${step.description}</p>
                </div>
            </div>
        `).join('');
    }

    renderCurrentStep() {
        switch (this.state.currentStep) {
            case 1:
                return this.renderFileUploadStep();
            case 2:
                return this.renderConfigurationStep();
            case 3:
                return this.renderReviewStep();
            default:
                return '<div class="wizard-error">Invalid step</div>';
        }
    }

    renderFileUploadStep() {
        return `
            <div class="wizard-step-content" id="file-upload-step">
                <div class="step-header">
                    <h3>Upload Template File</h3>
                    <p>Upload your Figma (.fig) or PNG (.png) template file to get started.</p>
                </div>
                <div id="template-file-upload-container"></div>
            </div>
        `;
    }

    renderConfigurationStep() {
        return `
            <div class="wizard-step-content" id="configuration-step">
                <div class="step-header">
                    <h3>Configure Template</h3>
                    <p>Provide details about your template.</p>
                </div>
                
                <div class="wizard-form">
                    <div class="form-group">
                        <label for="template-name">Template Name *</label>
                        <input type="text" 
                               id="template-name" 
                               class="form-input" 
                               placeholder="Enter template name"
                               value="${this.state.templateData.name}"
                               required>
                    </div>

                    <div class="form-group">
                        <label for="template-description">Description</label>
                        <textarea id="template-description" 
                                  class="form-textarea" 
                                  placeholder="Describe your template..."
                                  rows="3">${this.state.templateData.description}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="template-category">Category *</label>
                        <select id="template-category" class="form-select" required>
                            <option value="">Select a category</option>
                            <option value="550e8400-e29b-41d4-a716-446655440001" ${this.state.templateData.categoryId === '550e8400-e29b-41d4-a716-446655440001' ? 'selected' : ''}>Web Design</option>
                            <option value="550e8400-e29b-41d4-a716-446655440002" ${this.state.templateData.categoryId === '550e8400-e29b-41d4-a716-446655440002' ? 'selected' : ''}>Mobile Design</option>
                            <option value="550e8400-e29b-41d4-a716-446655440003" ${this.state.templateData.categoryId === '550e8400-e29b-41d4-a716-446655440003' ? 'selected' : ''}>Print Design</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    renderReviewStep() {
        return `
            <div class="wizard-step-content" id="review-step">
                <div class="step-header">
                    <h3>Review & Create</h3>
                    <p>Review your template details before creating.</p>
                </div>

                <div class="wizard-review">
                    <div class="review-section">
                        <h4>Uploaded File</h4>
                        <div class="review-file-info">
                            <div class="file-icon">
                                <i class="fas ${this.getFileIcon(this.state.uploadedFile?.name)}"></i>
                            </div>
                            <div class="file-details">
                                <h5>${this.state.uploadedFile?.name || 'No file uploaded'}</h5>
                                <p>${this.state.uploadedFile ? this.formatFileSize(this.state.uploadedFile.size) : ''} • ${this.state.uploadedFile ? this.getFileType(this.state.uploadedFile.name) : ''}</p>
                            </div>
                        </div>
                    </div>

                    <div class="review-section">
                        <h4>Template Details</h4>
                        <div class="review-details">
                            <div class="detail-item">
                                <label>Name:</label>
                                <span>${this.state.templateData.name || 'Not specified'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Description:</label>
                                <span>${this.state.templateData.description || 'No description'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Category:</label>
                                <span>${this.getCategoryName(this.state.templateData.categoryId) || 'Not selected'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderActionButtons() {
        const isFirstStep = this.state.currentStep === 1;
        const isLastStep = this.state.currentStep === this.state.totalSteps;
        const canProceed = this.canProceedToNextStep();

        return `
            <div class="wizard-buttons">
                <button class="wizard-btn wizard-btn-secondary" 
                        data-action="cancel"
                        ${this.state.isSubmitting ? 'disabled' : ''}>
                    <i class="fas fa-times"></i>
                    Cancel
                </button>
                
                <div class="wizard-buttons-primary">
                    ${!isFirstStep ? `
                        <button class="wizard-btn wizard-btn-outline" 
                                data-action="previous"
                                ${this.state.isSubmitting ? 'disabled' : ''}>
                            <i class="fas fa-arrow-left"></i>
                            Previous
                        </button>
                    ` : ''}
                    
                    ${!isLastStep ? `
                        <button class="wizard-btn wizard-btn-primary" 
                                data-action="next"
                                ${!canProceed || this.state.isSubmitting ? 'disabled' : ''}>
                            Next
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    ` : `
                        <button class="wizard-btn wizard-btn-primary" 
                                data-action="create"
                                ${!canProceed || this.state.isSubmitting ? 'disabled' : ''}>
                            ${this.state.isSubmitting ? '<i class="fas fa-spinner fa-spin"></i> Creating...' : '<i class="fas fa-plus"></i> Create Template'}
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    initializeStepComponents() {
        if (this.state.currentStep === 1) {
            this.initializeFileUploadComponent();
        }
    }

    initializeFileUploadComponent() {
        const container = document.getElementById('template-file-upload-container');
        if (container && window.TemplateFileUploadComponent) {
            this.fileUploadComponent = new TemplateFileUploadComponent('template-file-upload-container', {
                onFileSelect: (file) => {
                    this.state.uploadedFile = file;
                    this.updateActionButtons();
                },
                onUploadComplete: (uploadData) => {
                    this.state.uploadData = uploadData;
                    this.updateActionButtons();
                },
                onUploadError: (error) => {
                    console.error('File upload error:', error);
                    this.showError('File upload failed. Please try again.');
                }
            });
        }
    }

    attachEventListeners() {
        // Action button clicks
        this.container.addEventListener('click', this.handleActionClick.bind(this));

        // Form input changes
        this.container.addEventListener('input', this.handleFormInput.bind(this));
    }

    handleActionClick(event) {
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        switch (action) {
            case 'cancel':
                this.cancelWizard();
                break;
            case 'previous':
                this.previousStep();
                break;
            case 'next':
                this.nextStep();
                break;
            case 'create':
                this.createTemplate();
                break;
        }
    }

    handleFormInput(event) {
        const { id, value } = event.target;
        
        switch (id) {
            case 'template-name':
                this.state.templateData.name = value;
                break;
            case 'template-description':
                this.state.templateData.description = value;
                break;
            case 'template-category':
                this.state.templateData.categoryId = value;
                break;
        }

        this.updateActionButtons();
    }

    canProceedToNextStep() {
        switch (this.state.currentStep) {
            case 1:
                return this.state.uploadedFile && this.state.uploadData;
            case 2:
                return this.state.templateData.name.trim() && this.state.templateData.categoryId;
            case 3:
                return this.state.uploadedFile && this.state.templateData.name.trim() && this.state.templateData.categoryId;
            default:
                return false;
        }
    }

    nextStep() {
        if (this.state.currentStep < this.state.totalSteps && this.canProceedToNextStep()) {
            this.state.currentStep++;
            this.render();
        }
    }

    previousStep() {
        if (this.state.currentStep > 1) {
            this.state.currentStep--;
            this.render();
        }
    }

    async createTemplate() {
        if (!this.canProceedToNextStep() || this.state.isSubmitting) return;

        try {
            this.setState({ isSubmitting: true });

            // Prepare template data
            const templateData = {
                name: this.state.templateData.name.trim(),
                description: this.state.templateData.description.trim(),
                categoryId: this.state.templateData.categoryId,
                previewImageUrl: this.state.uploadData.publicUrl,
                components: [] // Empty components array for now
            };

            // Create template via API
            const response = await fetch('/api/admin/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-admin-token-123'
                },
                body: JSON.stringify(templateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create template');
            }

            const result = await response.json();

            // Call completion callback
            if (this.options.onWizardComplete) {
                this.options.onWizardComplete(result.data);
            }

            this.showSuccess('Template created successfully!');

        } catch (error) {
            console.error('TemplateCreationWizard: Error creating template:', error);
            this.showError(error.message || 'Failed to create template. Please try again.');
        } finally {
            this.setState({ isSubmitting: false });
        }
    }

    cancelWizard() {
        if (this.options.onWizardCancel) {
            this.options.onWizardCancel();
        }
    }

    updateActionButtons() {
        const nextButton = this.container.querySelector('[data-action="next"]');
        const createButton = this.container.querySelector('[data-action="create"]');
        const canProceed = this.canProceedToNextStep();

        if (nextButton) {
            nextButton.disabled = !canProceed;
        }
        if (createButton) {
            createButton.disabled = !canProceed;
        }
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.updateActionButtons();
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Simple success display - could be enhanced with a proper notification system
        alert(`Success: ${message}`);
    }

    // Utility methods
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

    getCategoryName(categoryId) {
        const categories = {
            '550e8400-e29b-41d4-a716-446655440001': 'Web Design',
            '550e8400-e29b-41d4-a716-446655440002': 'Mobile Design',
            '550e8400-e29b-41d4-a716-446655440003': 'Print Design'
        };
        return categories[categoryId] || 'Unknown';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    destroy() {
        // Clean up file upload component
        if (this.fileUploadComponent) {
            this.fileUploadComponent.destroy();
        }

        // Remove event listeners
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
    reset() {
        this.state = {
            currentStep: 1,
            totalSteps: 3,
            uploadedFile: null,
            uploadData: null,
            templateData: {
                name: '',
                description: '',
                categoryId: '',
                components: []
            },
            isSubmitting: false
        };
        this.render();
    }

    getWizardState() {
        return { ...this.state };
    }
}

// Export for use in other modules
window.TemplateCreationWizard = TemplateCreationWizard;
