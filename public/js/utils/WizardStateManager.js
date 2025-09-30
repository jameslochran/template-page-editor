/**
 * Wizard State Manager
 * Work Order #47: Implement Multi-Step Template Upload Wizard with State Management
 * 
 * Centralized state management for the template upload wizard, providing
 * data persistence across steps and state validation.
 */

class WizardStateManager {
    constructor() {
        this.state = {
            // Current wizard state
            currentStep: 1,
            totalSteps: 5,
            isCompleted: false,
            isCancelled: false,
            
            // Step 1: Upload data
            upload: {
                file: null,
                uploadId: null,
                fileName: null,
                fileType: null,
                fileSize: null,
                publicUrl: null,
                isUploaded: false,
                uploadProgress: 0,
                error: null
            },
            
            // Step 2: PNG Component Definition (conditional)
            pngComponents: {
                isRequired: false,
                components: [],
                regions: [],
                isCompleted: false,
                error: null
            },
            
            // Step 3: Metadata
            metadata: {
                name: '',
                description: '',
                categoryId: '',
                categoryName: '',
                tags: [],
                isCompleted: false,
                error: null
            },
            
            // Step 4: Summary (read-only)
            summary: {
                isReviewed: false,
                error: null
            },
            
            // Step 5: Completion
            completion: {
                isSubmitted: false,
                templateId: null,
                success: false,
                error: null
            }
        };
        
        this.listeners = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the state manager
     */
    init() {
        if (this.isInitialized) return;
        
        // Load any existing state from localStorage
        this.loadState();
        this.isInitialized = true;
        
        console.log('WizardStateManager initialized');
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get specific step data
     */
    getStepData(stepName) {
        return { ...this.state[stepName] };
    }

    /**
     * Update specific step data
     */
    updateStepData(stepName, data) {
        if (!this.state[stepName]) {
            console.error(`WizardStateManager: Invalid step name: ${stepName}`);
            return false;
        }

        const oldState = { ...this.state };
        this.state[stepName] = { ...this.state[stepName], ...data };
        
        // Save to localStorage
        this.saveState();
        
        // Notify listeners
        this.notifyListeners('stepDataUpdated', {
            stepName,
            oldData: oldState[stepName],
            newData: this.state[stepName]
        });
        
        return true;
    }

    /**
     * Set current step
     */
    setCurrentStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.state.totalSteps) {
            console.error(`WizardStateManager: Invalid step number: ${stepNumber}`);
            return false;
        }

        const oldStep = this.state.currentStep;
        this.state.currentStep = stepNumber;
        
        this.saveState();
        
        this.notifyListeners('stepChanged', {
            oldStep,
            newStep: stepNumber
        });
        
        return true;
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.state.currentStep < this.state.totalSteps) {
            return this.setCurrentStep(this.state.currentStep + 1);
        }
        return false;
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.state.currentStep > 1) {
            return this.setCurrentStep(this.state.currentStep - 1);
        }
        return false;
    }

    /**
     * Check if step is completed
     */
    isStepCompleted(stepNumber) {
        switch (stepNumber) {
            case 1: // Upload
                return this.state.upload.isUploaded && !this.state.upload.error;
            case 2: // PNG Components (conditional)
                if (!this.state.upload.fileType || this.state.upload.fileType !== 'image/png') {
                    return true; // Skip for non-PNG files
                }
                return this.state.pngComponents.isCompleted && !this.state.pngComponents.error;
            case 3: // Metadata
                return this.state.metadata.isCompleted && !this.state.metadata.error;
            case 4: // Summary
                return this.state.summary.isReviewed && !this.state.summary.error;
            case 5: // Completion
                return this.state.completion.isSubmitted;
            default:
                return false;
        }
    }

    /**
     * Check if can proceed to next step
     */
    canProceedToNextStep() {
        return this.isStepCompleted(this.state.currentStep);
    }

    /**
     * Get step validation errors
     */
    getStepErrors(stepNumber) {
        switch (stepNumber) {
            case 1:
                return this.state.upload.error;
            case 2:
                return this.state.pngComponents.error;
            case 3:
                return this.state.metadata.error;
            case 4:
                return this.state.summary.error;
            case 5:
                return this.state.completion.error;
            default:
                return null;
        }
    }

    /**
     * Set step error
     */
    setStepError(stepNumber, error) {
        const stepNames = ['upload', 'pngComponents', 'metadata', 'summary', 'completion'];
        const stepName = stepNames[stepNumber - 1];
        
        if (stepName) {
            this.updateStepData(stepName, { error });
        }
    }

    /**
     * Clear step error
     */
    clearStepError(stepNumber) {
        this.setStepError(stepNumber, null);
    }

    /**
     * Check if PNG component definition is required
     */
    isPngComponentDefinitionRequired() {
        return this.state.upload.fileType === 'image/png';
    }

    /**
     * Get total steps (dynamic based on file type)
     */
    getTotalSteps() {
        // If PNG file, include component definition step
        if (this.isPngComponentDefinitionRequired()) {
            return 5;
        }
        // For Figma files, skip component definition
        return 4;
    }

    /**
     * Get step title
     */
    getStepTitle(stepNumber) {
        const titles = {
            1: 'Upload File',
            2: 'Define Components',
            3: 'Template Metadata',
            4: 'Review & Submit',
            5: 'Complete'
        };
        
        // Adjust for non-PNG files
        if (!this.isPngComponentDefinitionRequired() && stepNumber >= 2) {
            stepNumber += 1;
        }
        
        return titles[stepNumber] || `Step ${stepNumber}`;
    }

    /**
     * Get step description
     */
    getStepDescription(stepNumber) {
        const descriptions = {
            1: 'Upload your template file (PNG or Figma)',
            2: 'Define interactive components for PNG templates',
            3: 'Set template name, description, and category',
            4: 'Review all information before submitting',
            5: 'Template creation completed'
        };
        
        // Adjust for non-PNG files
        if (!this.isPngComponentDefinitionRequired() && stepNumber >= 2) {
            stepNumber += 1;
        }
        
        return descriptions[stepNumber] || '';
    }

    /**
     * Mark wizard as completed
     */
    markCompleted(templateId) {
        this.state.isCompleted = true;
        this.state.completion.isSubmitted = true;
        this.state.completion.success = true;
        this.state.completion.templateId = templateId;
        
        this.saveState();
        
        this.notifyListeners('wizardCompleted', {
            templateId,
            state: this.getState()
        });
    }

    /**
     * Mark wizard as cancelled
     */
    markCancelled() {
        this.state.isCancelled = true;
        
        this.saveState();
        
        this.notifyListeners('wizardCancelled', {
            state: this.getState()
        });
    }

    /**
     * Reset wizard state
     */
    reset() {
        this.state = {
            currentStep: 1,
            totalSteps: 5,
            isCompleted: false,
            isCancelled: false,
            upload: {
                file: null,
                uploadId: null,
                fileName: null,
                fileType: null,
                fileSize: null,
                publicUrl: null,
                isUploaded: false,
                uploadProgress: 0,
                error: null
            },
            pngComponents: {
                isRequired: false,
                components: [],
                regions: [],
                isCompleted: false,
                error: null
            },
            metadata: {
                name: '',
                description: '',
                categoryId: '',
                categoryName: '',
                tags: [],
                isCompleted: false,
                error: null
            },
            summary: {
                isReviewed: false,
                error: null
            },
            completion: {
                isSubmitted: false,
                templateId: null,
                success: false,
                error: null
            }
        };
        
        this.saveState();
        
        this.notifyListeners('wizardReset', {
            state: this.getState()
        });
    }

    /**
     * Get final template data for submission
     */
    getTemplateData() {
        const templateData = {
            name: this.state.metadata.name,
            description: this.state.metadata.description,
            categoryId: this.state.metadata.categoryId,
            previewImageUrl: this.state.upload.publicUrl,
            components: []
        };

        // Add PNG components if available
        if (this.state.pngComponents.components.length > 0) {
            templateData.components = this.state.pngComponents.components;
        }

        return templateData;
    }

    /**
     * Add event listener
     */
    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Notify listeners
     */
    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`WizardStateManager: Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem('templateWizardState', JSON.stringify(this.state));
        } catch (error) {
            console.warn('WizardStateManager: Could not save state to localStorage:', error);
        }
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('templateWizardState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.state = { ...this.state, ...parsedState };
            }
        } catch (error) {
            console.warn('WizardStateManager: Could not load state from localStorage:', error);
        }
    }

    /**
     * Clear saved state
     */
    clearSavedState() {
        try {
            localStorage.removeItem('templateWizardState');
        } catch (error) {
            console.warn('WizardStateManager: Could not clear saved state:', error);
        }
    }
}

// Create singleton instance
const wizardStateManager = new WizardStateManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WizardStateManager;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.WizardStateManager = WizardStateManager;
    window.wizardStateManager = wizardStateManager;
}
