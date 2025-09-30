/**
 * Template Upload Wizard
 * Work Order #47: Implement Multi-Step Template Upload Wizard with State Management
 * 
 * Main orchestrator component that manages the multi-step template creation workflow,
 * including step navigation, validation, and conditional step logic.
 */

class TemplateUploadWizard {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            onWizardComplete: null,
            onWizardCancel: null,
            onWizardReset: null,
            ...options
        };

        if (!this.container) {
            console.error('TemplateUploadWizard: Container not found:', containerId);
            return;
        }

        // Initialize state manager
        this.stateManager = options.stateManager || window.wizardStateManager;
        if (!this.stateManager) {
            console.error('TemplateUploadWizard: WizardStateManager not available');
            return;
        }

        // Step components
        this.stepComponents = new Map();
        this.currentStepComponent = null;

        // UI elements
        this.elements = {};

        // Event listeners
        this.eventListeners = new Map();

        this.init();
    }

    /**
     * Initialize the wizard
     */
    init() {
        this.render();
        this.setupEventListeners();
        this.loadCurrentStep();
        
        console.log('TemplateUploadWizard initialized');
    }

    /**
     * Render the wizard UI
     */
    render() {
        this.container.innerHTML = `
            <div class="template-upload-wizard">
                <div class="wizard-header">
                    <h2 class="wizard-title">
                        <i class="fas fa-magic"></i>
                        Create New Template
                    </h2>
                    <p class="wizard-subtitle">Follow the steps below to create your template</p>
                </div>

                <div class="wizard-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="wizard-progress-fill"></div>
                    </div>
                    <div class="step-indicators" id="wizard-step-indicators">
                        <!-- Step indicators will be populated dynamically -->
                    </div>
                </div>

                <div class="wizard-content">
                    <div class="step-content" id="wizard-step-content">
                        <!-- Current step content will be loaded here -->
                    </div>
                </div>

                <div class="wizard-navigation">
                    <div class="nav-buttons">
                        <button class="btn btn-secondary" id="wizard-cancel-btn">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button class="btn btn-secondary" id="wizard-back-btn" disabled>
                            <i class="fas fa-arrow-left"></i>
                            Back
                        </button>
                        <button class="btn btn-primary" id="wizard-next-btn" disabled>
                            Next
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div class="wizard-footer">
                    <div class="step-info">
                        <span class="current-step" id="wizard-current-step">Step 1 of 5</span>
                        <span class="step-description" id="wizard-step-description">Upload your template file</span>
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
            progressFill: document.getElementById('wizard-progress-fill'),
            stepIndicators: document.getElementById('wizard-step-indicators'),
            stepContent: document.getElementById('wizard-step-content'),
            cancelBtn: document.getElementById('wizard-cancel-btn'),
            backBtn: document.getElementById('wizard-back-btn'),
            nextBtn: document.getElementById('wizard-next-btn'),
            currentStep: document.getElementById('wizard-current-step'),
            stepDescription: document.getElementById('wizard-step-description')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        this.addEventListener(this.elements.cancelBtn, 'click', () => this.handleCancel());
        this.addEventListener(this.elements.backBtn, 'click', () => this.handleBack());
        this.addEventListener(this.elements.nextBtn, 'click', () => this.handleNext());

        // State manager events
        this.stateManager.addEventListener('stepChanged', (data) => this.handleStepChanged(data));
        this.stateManager.addEventListener('stepDataUpdated', (data) => this.handleStepDataUpdated(data));
        this.stateManager.addEventListener('wizardCompleted', (data) => this.handleWizardCompleted(data));
        this.stateManager.addEventListener('wizardCancelled', (data) => this.handleWizardCancelled(data));
    }

    /**
     * Add event listener with cleanup tracking
     */
    addEventListener(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
            if (!this.eventListeners.has(element)) {
                this.eventListeners.set(element, []);
            }
            this.eventListeners.get(element).push({ event, handler });
        }
    }

    /**
     * Load current step
     */
    loadCurrentStep() {
        const currentStep = this.stateManager.getState().currentStep;
        this.renderStepIndicators();
        this.updateProgress();
        this.updateNavigation();
        this.loadStepComponent(currentStep);
        this.updateStepInfo();
    }

    /**
     * Render step indicators
     */
    renderStepIndicators() {
        const totalSteps = this.stateManager.getTotalSteps();
        const currentStep = this.stateManager.getState().currentStep;
        const isPngRequired = this.stateManager.isPngComponentDefinitionRequired();

        let indicatorsHtml = '';
        
        for (let i = 1; i <= totalSteps; i++) {
            let stepNumber = i;
            let stepTitle = this.stateManager.getStepTitle(i);
            let isCompleted = this.stateManager.isStepCompleted(i);
            let isCurrent = i === currentStep;
            let isDisabled = i > currentStep && !isCompleted;

            // Adjust for non-PNG files (skip component definition step)
            if (!isPngRequired && i >= 2) {
                stepNumber = i + 1;
                stepTitle = this.stateManager.getStepTitle(stepNumber);
            }

            const stepClass = [
                'step-indicator',
                isCompleted ? 'completed' : '',
                isCurrent ? 'current' : '',
                isDisabled ? 'disabled' : ''
            ].filter(Boolean).join(' ');

            indicatorsHtml += `
                <div class="${stepClass}" data-step="${i}">
                    <div class="step-number">
                        ${isCompleted ? '<i class="fas fa-check"></i>' : stepNumber}
                    </div>
                    <div class="step-title">${stepTitle}</div>
                </div>
            `;
        }

        this.elements.stepIndicators.innerHTML = indicatorsHtml;
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const currentStep = this.stateManager.getState().currentStep;
        const totalSteps = this.stateManager.getTotalSteps();
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
        
        this.elements.progressFill.style.width = `${progress}%`;
    }

    /**
     * Update navigation buttons
     */
    updateNavigation() {
        const currentStep = this.stateManager.getState().currentStep;
        const totalSteps = this.stateManager.getTotalSteps();
        const canProceed = this.stateManager.canProceedToNextStep();

        // Back button
        this.elements.backBtn.disabled = currentStep <= 1;

        // Next button
        if (currentStep >= totalSteps) {
            this.elements.nextBtn.innerHTML = `
                <i class="fas fa-check"></i>
                Complete
            `;
            this.elements.nextBtn.disabled = !canProceed;
        } else {
            this.elements.nextBtn.innerHTML = `
                Next
                <i class="fas fa-arrow-right"></i>
            `;
            this.elements.nextBtn.disabled = !canProceed;
        }
    }

    /**
     * Update step info
     */
    updateStepInfo() {
        const currentStep = this.stateManager.getState().currentStep;
        const totalSteps = this.stateManager.getTotalSteps();
        const stepTitle = this.stateManager.getStepTitle(currentStep);
        const stepDescription = this.stateManager.getStepDescription(currentStep);

        this.elements.currentStep.textContent = `Step ${currentStep} of ${totalSteps}`;
        this.elements.stepDescription.textContent = stepDescription;
    }

    /**
     * Load step component
     */
    loadStepComponent(stepNumber) {
        // Clean up current step component
        if (this.currentStepComponent && typeof this.currentStepComponent.destroy === 'function') {
            this.currentStepComponent.destroy();
        }

        // Clear step content
        this.elements.stepContent.innerHTML = '';

        // Load appropriate step component
        let stepComponent = null;
        
        switch (stepNumber) {
            case 1:
                stepComponent = this.loadUploadStep();
                break;
            case 2:
                if (this.stateManager.isPngComponentDefinitionRequired()) {
                    stepComponent = this.loadPngComponentDefinitionStep();
                } else {
                    stepComponent = this.loadMetadataStep();
                }
                break;
            case 3:
                if (this.stateManager.isPngComponentDefinitionRequired()) {
                    stepComponent = this.loadMetadataStep();
                } else {
                    stepComponent = this.loadSummaryStep();
                }
                break;
            case 4:
                if (this.stateManager.isPngComponentDefinitionRequired()) {
                    stepComponent = this.loadSummaryStep();
                } else {
                    stepComponent = this.loadCompletionStep();
                }
                break;
            case 5:
                stepComponent = this.loadCompletionStep();
                break;
            default:
                console.error('TemplateUploadWizard: Invalid step number:', stepNumber);
                return;
        }

        this.currentStepComponent = stepComponent;
    }

    /**
     * Load upload step component
     */
    loadUploadStep() {
        if (!window.UploadStep) {
            console.error('TemplateUploadWizard: UploadStep component not available');
            return null;
        }

        return new window.UploadStep('wizard-step-content', {
            stateManager: this.stateManager,
            onStepComplete: () => this.handleStepComplete(1)
        });
    }

    /**
     * Load PNG component definition step
     */
    loadPngComponentDefinitionStep() {
        if (!window.PngComponentDefinitionStep) {
            console.error('TemplateUploadWizard: PngComponentDefinitionStep component not available');
            return null;
        }

        return new window.PngComponentDefinitionStep('wizard-step-content', {
            stateManager: this.stateManager,
            onStepComplete: () => this.handleStepComplete(2)
        });
    }

    /**
     * Load metadata step component
     */
    loadMetadataStep() {
        if (!window.MetadataStep) {
            console.error('TemplateUploadWizard: MetadataStep component not available');
            return null;
        }

        return new window.MetadataStep('wizard-step-content', {
            stateManager: this.stateManager,
            onStepComplete: () => this.handleStepComplete(3)
        });
    }

    /**
     * Load summary step component
     */
    loadSummaryStep() {
        if (!window.SummaryStep) {
            console.error('TemplateUploadWizard: SummaryStep component not available');
            return null;
        }

        return new window.SummaryStep('wizard-step-content', {
            stateManager: this.stateManager,
            onStepComplete: () => this.handleStepComplete(4)
        });
    }

    /**
     * Load completion step component
     */
    loadCompletionStep() {
        if (!window.CompletionStep) {
            console.error('TemplateUploadWizard: CompletionStep component not available');
            return null;
        }

        return new window.CompletionStep('wizard-step-content', {
            stateManager: this.stateManager,
            onStepComplete: () => this.handleStepComplete(5)
        });
    }

    /**
     * Handle step completion
     */
    handleStepComplete(stepNumber) {
        console.log(`TemplateUploadWizard: Step ${stepNumber} completed`);
        
        // Clear any step errors
        this.stateManager.clearStepError(stepNumber);
        
        // Auto-advance to next step if not the last step
        const totalSteps = this.stateManager.getTotalSteps();
        if (stepNumber < totalSteps) {
            this.stateManager.nextStep();
        }
    }

    /**
     * Handle back button click
     */
    handleBack() {
        this.stateManager.previousStep();
    }

    /**
     * Handle next button click
     */
    handleNext() {
        const currentStep = this.stateManager.getState().currentStep;
        const totalSteps = this.stateManager.getTotalSteps();

        if (currentStep >= totalSteps) {
            // Complete wizard
            this.completeWizard();
        } else {
            // Go to next step
            this.stateManager.nextStep();
        }
    }

    /**
     * Handle cancel button click
     */
    handleCancel() {
        if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
            this.stateManager.markCancelled();
        }
    }

    /**
     * Complete the wizard
     */
    async completeWizard() {
        try {
            this.elements.nextBtn.disabled = true;
            this.elements.nextBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Creating Template...
            `;

            const templateData = this.stateManager.getTemplateData();
            
            // Submit template data
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
            
            // Mark wizard as completed
            this.stateManager.markCompleted(result.data.id);
            
        } catch (error) {
            console.error('TemplateUploadWizard: Error completing wizard:', error);
            this.stateManager.setStepError(5, error.message);
            
            // Reset button
            this.elements.nextBtn.disabled = false;
            this.elements.nextBtn.innerHTML = `
                <i class="fas fa-check"></i>
                Complete
            `;
        }
    }

    /**
     * Handle step changed event
     */
    handleStepChanged(data) {
        console.log('TemplateUploadWizard: Step changed:', data);
        this.loadCurrentStep();
    }

    /**
     * Handle step data updated event
     */
    handleStepDataUpdated(data) {
        console.log('TemplateUploadWizard: Step data updated:', data);
        this.updateNavigation();
    }

    /**
     * Handle wizard completed event
     */
    handleWizardCompleted(data) {
        console.log('TemplateUploadWizard: Wizard completed:', data);
        
        if (this.options.onWizardComplete) {
            this.options.onWizardComplete(data);
        }
    }

    /**
     * Handle wizard cancelled event
     */
    handleWizardCancelled(data) {
        console.log('TemplateUploadWizard: Wizard cancelled:', data);
        
        if (this.options.onWizardCancel) {
            this.options.onWizardCancel(data);
        }
    }

    /**
     * Reset the wizard
     */
    reset() {
        this.stateManager.reset();
        
        if (this.options.onWizardReset) {
            this.options.onWizardReset();
        }
    }

    /**
     * Show the wizard
     */
    show() {
        this.container.style.display = 'block';
        this.loadCurrentStep();
    }

    /**
     * Hide the wizard
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * Destroy the wizard
     */
    destroy() {
        // Clean up current step component
        if (this.currentStepComponent && typeof this.currentStepComponent.destroy === 'function') {
            this.currentStepComponent.destroy();
        }

        // Remove event listeners
        this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateUploadWizard;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.TemplateUploadWizard = TemplateUploadWizard;
}
