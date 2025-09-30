/**
 * Completion Step Component
 * Work Order #47: Implement Multi-Step Template Upload Wizard with State Management
 * 
 * Handles the final step of the wizard, showing submission progress, success/error states,
 * and providing options to create another template or return to the dashboard.
 */

class CompletionStep {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            stateManager: null,
            onStepComplete: null,
            ...options
        };

        if (!this.container) {
            console.error('CompletionStep: Container not found:', containerId);
            return;
        }

        if (!this.options.stateManager) {
            console.error('CompletionStep: State manager is required');
            return;
        }

        this.stateManager = this.options.stateManager;
        this.elements = {};
        this.isSubmitting = false;

        this.init();
    }

    /**
     * Initialize the completion step
     */
    init() {
        this.render();
        this.setupEventListeners();
        this.checkSubmissionStatus();
    }

    /**
     * Render the completion step UI
     */
    render() {
        this.container.innerHTML = `
            <div class="completion-step">
                <div class="step-header">
                    <h3 class="step-title">
                        <i class="fas fa-check-circle"></i>
                        Template Creation Complete
                    </h3>
                    <p class="step-description">
                        Your template has been successfully created and is ready to use.
                    </p>
                </div>

                <div class="completion-content">
                    <!-- Success State -->
                    <div class="completion-success" id="completion-success" style="display: none;">
                        <div class="success-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="success-content">
                            <h4 class="success-title">Template Created Successfully!</h4>
                            <p class="success-message" id="success-message">
                                Your template has been created and is now available in the template library.
                            </p>
                            <div class="template-details" id="template-details">
                                <!-- Template details will be populated dynamically -->
                            </div>
                        </div>
                    </div>

                    <!-- Error State -->
                    <div class="completion-error" id="completion-error" style="display: none;">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="error-content">
                            <h4 class="error-title">Template Creation Failed</h4>
                            <p class="error-message" id="error-message">
                                There was an error creating your template. Please try again.
                            </p>
                            <div class="error-actions">
                                <button class="btn btn-primary" id="retry-submission">
                                    <i class="fas fa-redo"></i>
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div class="completion-loading" id="completion-loading" style="display: none;">
                        <div class="loading-icon">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <div class="loading-content">
                            <h4 class="loading-title">Creating Template...</h4>
                            <p class="loading-message">
                                Please wait while we create your template. This may take a few moments.
                            </p>
                            <div class="loading-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="loading-progress-fill"></div>
                                </div>
                                <div class="progress-text" id="loading-progress-text">Initializing...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="completion-actions">
                    <!-- Success Actions -->
                    <div class="success-actions" id="success-actions" style="display: none;">
                        <button class="btn btn-primary" id="view-template">
                            <i class="fas fa-eye"></i>
                            View Template
                        </button>
                        <button class="btn btn-secondary" id="create-another">
                            <i class="fas fa-plus"></i>
                            Create Another Template
                        </button>
                        <button class="btn btn-outline" id="return-dashboard">
                            <i class="fas fa-home"></i>
                            Return to Dashboard
                        </button>
                    </div>

                    <!-- Error Actions -->
                    <div class="error-actions" id="error-actions" style="display: none;">
                        <button class="btn btn-primary" id="retry-button">
                            <i class="fas fa-redo"></i>
                            Retry Submission
                        </button>
                        <button class="btn btn-secondary" id="edit-template">
                            <i class="fas fa-edit"></i>
                            Edit Template
                        </button>
                        <button class="btn btn-outline" id="cancel-creation">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                    </div>
                </div>

                <div class="step-actions">
                    <div class="completion-help">
                        <h5>What's Next?</h5>
                        <ul>
                            <li><strong>View Template:</strong> See your template in the template library</li>
                            <li><strong>Create Another:</strong> Start the wizard again to create another template</li>
                            <li><strong>Edit Template:</strong> Make changes to your template's metadata or components</li>
                            <li><strong>Share Template:</strong> Share your template with other users</li>
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
            completionSuccess: document.getElementById('completion-success'),
            completionError: document.getElementById('completion-error'),
            completionLoading: document.getElementById('completion-loading'),
            successMessage: document.getElementById('success-message'),
            templateDetails: document.getElementById('template-details'),
            errorMessage: document.getElementById('error-message'),
            loadingProgressFill: document.getElementById('loading-progress-fill'),
            loadingProgressText: document.getElementById('loading-progress-text'),
            successActions: document.getElementById('success-actions'),
            errorActions: document.getElementById('error-actions'),
            viewTemplateBtn: document.getElementById('view-template'),
            createAnotherBtn: document.getElementById('create-another'),
            returnDashboardBtn: document.getElementById('return-dashboard'),
            retryButton: document.getElementById('retry-button'),
            editTemplateBtn: document.getElementById('edit-template'),
            cancelCreationBtn: document.getElementById('cancel-creation')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Success actions
        this.elements.viewTemplateBtn.addEventListener('click', () => this.handleViewTemplate());
        this.elements.createAnotherBtn.addEventListener('click', () => this.handleCreateAnother());
        this.elements.returnDashboardBtn.addEventListener('click', () => this.handleReturnDashboard());

        // Error actions
        this.elements.retryButton.addEventListener('click', () => this.handleRetrySubmission());
        this.elements.editTemplateBtn.addEventListener('click', () => this.handleEditTemplate());
        this.elements.cancelCreationBtn.addEventListener('click', () => this.handleCancelCreation());
    }

    /**
     * Check submission status
     */
    checkSubmissionStatus() {
        const completionData = this.stateManager.getStepData('completion');
        
        if (completionData.isSubmitted) {
            if (completionData.success) {
                this.showSuccessState(completionData);
            } else {
                this.showErrorState(completionData.error);
            }
        } else {
            // Start submission process
            this.startSubmission();
        }
    }

    /**
     * Start submission process
     */
    async startSubmission() {
        try {
            this.isSubmitting = true;
            this.showLoadingState();
            
            // Simulate submission progress
            await this.simulateSubmissionProgress();
            
            // Submit template data
            const templateData = this.stateManager.getTemplateData();
            
            const response = await fetch('/api/admin/templates/wizard', {
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
            
            // Mark as successful
            this.stateManager.updateStepData('completion', {
                isSubmitted: true,
                success: true,
                templateId: result.data.id,
                error: null
            });
            
            this.showSuccessState({
                templateId: result.data.id,
                templateData: result.data
            });
            
        } catch (error) {
            console.error('CompletionStep: Submission failed:', error);
            
            this.stateManager.updateStepData('completion', {
                isSubmitted: true,
                success: false,
                error: error.message
            });
            
            this.showErrorState(error.message);
        } finally {
            this.isSubmitting = false;
        }
    }

    /**
     * Simulate submission progress
     */
    async simulateSubmissionProgress() {
        const steps = [
            { progress: 20, text: 'Validating template data...' },
            { progress: 40, text: 'Processing template file...' },
            { progress: 60, text: 'Creating template record...' },
            { progress: 80, text: 'Generating preview...' },
            { progress: 100, text: 'Finalizing template...' }
        ];

        for (const step of steps) {
            this.updateLoadingProgress(step.progress, step.text);
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    /**
     * Update loading progress
     */
    updateLoadingProgress(percentage, text) {
        this.elements.loadingProgressFill.style.width = `${percentage}%`;
        this.elements.loadingProgressText.textContent = text;
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.elements.completionSuccess.style.display = 'none';
        this.elements.completionError.style.display = 'none';
        this.elements.completionLoading.style.display = 'block';
        this.elements.successActions.style.display = 'none';
        this.elements.errorActions.style.display = 'none';
    }

    /**
     * Show success state
     */
    showSuccessState(data) {
        this.elements.completionSuccess.style.display = 'block';
        this.elements.completionError.style.display = 'none';
        this.elements.completionLoading.style.display = 'none';
        this.elements.successActions.style.display = 'block';
        this.elements.errorActions.style.display = 'none';

        // Populate template details
        const metadata = this.stateManager.getStepData('metadata');
        const uploadData = this.stateManager.getStepData('upload');
        
        this.elements.templateDetails.innerHTML = `
            <div class="template-info">
                <div class="info-item">
                    <span class="info-label">Template Name:</span>
                    <span class="info-value">${this.escapeHtml(metadata.name)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Template ID:</span>
                    <span class="info-value">${data.templateId}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category:</span>
                    <span class="info-value">${this.escapeHtml(metadata.categoryName)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">File Type:</span>
                    <span class="info-value">${uploadData.fileType === 'image/png' ? 'PNG Image' : 'Figma File'}</span>
                </div>
            </div>
        `;

        // Mark step as complete
        if (this.options.onStepComplete) {
            this.options.onStepComplete();
        }
    }

    /**
     * Show error state
     */
    showErrorState(errorMessage) {
        this.elements.completionSuccess.style.display = 'none';
        this.elements.completionError.style.display = 'block';
        this.elements.completionLoading.style.display = 'none';
        this.elements.successActions.style.display = 'none';
        this.elements.errorActions.style.display = 'block';

        this.elements.errorMessage.textContent = errorMessage;
    }

    /**
     * Handle view template
     */
    handleViewTemplate() {
        const completionData = this.stateManager.getStepData('completion');
        if (completionData.templateId) {
            // Navigate to template view
            window.location.href = `/templates/${completionData.templateId}`;
        }
    }

    /**
     * Handle create another template
     */
    handleCreateAnother() {
        // Reset wizard state
        this.stateManager.reset();
        
        // Navigate back to first step
        this.stateManager.setCurrentStep(1);
    }

    /**
     * Handle return to dashboard
     */
    handleReturnDashboard() {
        // Navigate to admin dashboard
        window.location.href = '/admin/templates';
    }

    /**
     * Handle retry submission
     */
    handleRetrySubmission() {
        // Reset completion state
        this.stateManager.updateStepData('completion', {
            isSubmitted: false,
            success: false,
            templateId: null,
            error: null
        });
        
        // Start submission again
        this.startSubmission();
    }

    /**
     * Handle edit template
     */
    handleEditTemplate() {
        // Navigate back to metadata step
        this.stateManager.setCurrentStep(3);
    }

    /**
     * Handle cancel creation
     */
    handleCancelCreation() {
        if (confirm('Are you sure you want to cancel template creation? All progress will be lost.')) {
            this.stateManager.markCancelled();
        }
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
    module.exports = CompletionStep;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.CompletionStep = CompletionStep;
}
