/**
 * SaveVersionModal Component - Work Order 29
 * 
 * A modal component for saving page versions with optional metadata.
 * Provides form inputs for version name and change description,
 * with validation, loading states, and API integration.
 */

class SaveVersionModal {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            pageId: options.pageId || null,
            onSave: options.onSave || (() => {}),
            onCancel: options.onCancel || (() => {}),
            onClose: options.onClose || (() => {}),
            ...options
        };
        
        this.isVisible = false;
        this.isLoading = false;
        this.formData = {
            versionName: '',
            changeDescription: ''
        };
        this.validationErrors = {};
        
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the modal
     */
    render() {
        this.container.innerHTML = `
            <div class="save-version-modal-overlay" style="display: none;">
                <div class="save-version-modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Save Page Version</h3>
                        <button type="button" class="modal-close-btn" data-action="close-modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form class="save-version-form" data-action="save-version-form">
                            <div class="form-group">
                                <label for="version-name" class="form-label">
                                    Version Name <span class="optional">(optional)</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="version-name" 
                                    name="versionName"
                                    class="form-input"
                                    placeholder="e.g., v1.2.0, Major Update, etc."
                                    maxlength="100"
                                    value="${this.formData.versionName}"
                                >
                                <div class="char-counter">
                                    <span class="current-count">0</span>/100 characters
                                </div>
                                <div class="error-message" id="version-name-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="change-description" class="form-label">
                                    Change Description <span class="optional">(optional)</span>
                                </label>
                                <textarea 
                                    id="change-description" 
                                    name="changeDescription"
                                    class="form-textarea"
                                    placeholder="Describe what changes were made in this version..."
                                    maxlength="500"
                                    rows="4"
                                >${this.formData.changeDescription}</textarea>
                                <div class="char-counter">
                                    <span class="current-count">0</span>/500 characters
                                </div>
                                <div class="error-message" id="change-description-error"></div>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-action="cancel">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-primary" data-action="save" disabled>
                            <span class="btn-text">Save Version</span>
                            <span class="btn-spinner" style="display: none;">⏳</span>
                        </button>
                    </div>
                    
                    <div class="modal-status" style="display: none;">
                        <div class="status-message"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const overlay = this.container.querySelector('.save-version-modal-overlay');
        const closeBtn = this.container.querySelector('[data-action="close-modal"]');
        const cancelBtn = this.container.querySelector('[data-action="cancel"]');
        const saveBtn = this.container.querySelector('[data-action="save"]');
        const form = this.container.querySelector('.save-version-form');
        const versionNameInput = this.container.querySelector('#version-name');
        const changeDescriptionInput = this.container.querySelector('#change-description');

        // Close modal events
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancel());
        }

        // Save button
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        // Form input events
        if (versionNameInput) {
            versionNameInput.addEventListener('input', (e) => {
                this.handleVersionNameChange(e.target.value);
            });
        }

        if (changeDescriptionInput) {
            changeDescriptionInput.addEventListener('input', (e) => {
                this.handleChangeDescriptionChange(e.target.value);
            });
        }

        // Form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSave();
            });
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.isVisible) {
                if (e.key === 'Escape') {
                    this.close();
                } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.handleSave();
                }
            }
        });
    }

    /**
     * Handle version name input change
     */
    handleVersionNameChange(value) {
        this.formData.versionName = value;
        this.updateCharCounter('#version-name', value.length, 100);
        this.validateForm();
    }

    /**
     * Handle change description input change
     */
    handleChangeDescriptionChange(value) {
        this.formData.changeDescription = value;
        this.updateCharCounter('#change-description', value.length, 500);
        this.validateForm();
    }

    /**
     * Update character counter
     */
    updateCharCounter(selector, current, max) {
        const counter = this.container.querySelector(`${selector} + .char-counter .current-count`);
        if (counter) {
            counter.textContent = current;
            counter.parentElement.classList.toggle('over-limit', current > max);
        }
    }

    /**
     * Validate form data
     */
    validateForm() {
        this.validationErrors = {};

        // Validate version name
        if (this.formData.versionName.length > 100) {
            this.validationErrors.versionName = 'Version name must be 100 characters or less';
        }

        // Validate change description
        if (this.formData.changeDescription.length > 500) {
            this.validationErrors.changeDescription = 'Change description must be 500 characters or less';
        }

        // Update UI
        this.updateValidationErrors();
        this.updateSaveButtonState();

        return Object.keys(this.validationErrors).length === 0;
    }

    /**
     * Update validation error display
     */
    updateValidationErrors() {
        // Clear all errors
        const errorElements = this.container.querySelectorAll('.error-message');
        errorElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });

        // Show current errors
        Object.entries(this.validationErrors).forEach(([field, message]) => {
            const errorElement = this.container.querySelector(`#${field}-error`);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
            }
        });
    }

    /**
     * Update save button state
     */
    updateSaveButtonState() {
        const saveBtn = this.container.querySelector('[data-action="save"]');
        if (saveBtn) {
            const isValid = Object.keys(this.validationErrors).length === 0;
            saveBtn.disabled = !isValid || this.isLoading;
        }
    }

    /**
     * Handle save action
     */
    async handleSave() {
        if (!this.validateForm() || this.isLoading) {
            return;
        }

        this.setLoading(true);
        this.hideStatus();

        try {
            // Call the onSave callback with form data
            const result = await this.options.onSave({
                pageId: this.options.pageId,
                versionName: this.formData.versionName.trim() || null,
                changeDescription: this.formData.changeDescription.trim() || null
            });

            // The API returns the version data directly, not wrapped in a success object
            if (result && result.id) {
                this.showStatus('Version saved successfully!', 'success');
                setTimeout(() => {
                    this.close();
                }, 1500);
            } else {
                throw new Error(result?.message || 'Failed to save version');
            }
        } catch (error) {
            console.error('Save version error:', error);
            this.showStatus(error.message || 'Failed to save version. Please try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle cancel action
     */
    cancel() {
        this.options.onCancel();
        this.close();
    }

    /**
     * Show the modal
     */
    show(pageId = null) {
        if (pageId) {
            this.options.pageId = pageId;
        }

        this.isVisible = true;
        const overlay = this.container.querySelector('.save-version-modal-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            // Focus on first input
            setTimeout(() => {
                const firstInput = overlay.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }

        // Reset form
        this.resetForm();
    }

    /**
     * Close the modal
     */
    close() {
        this.isVisible = false;
        const overlay = this.container.querySelector('.save-version-modal-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        this.options.onClose();
    }

    /**
     * Reset form data
     */
    resetForm() {
        this.formData = {
            versionName: '',
            changeDescription: ''
        };
        this.validationErrors = {};

        // Update inputs
        const versionNameInput = this.container.querySelector('#version-name');
        const changeDescriptionInput = this.container.querySelector('#change-description');
        
        if (versionNameInput) {
            versionNameInput.value = '';
        }
        if (changeDescriptionInput) {
            changeDescriptionInput.value = '';
        }

        // Update counters
        this.updateCharCounter('#version-name', 0, 100);
        this.updateCharCounter('#change-description', 0, 500);

        // Clear errors and update button state
        this.updateValidationErrors();
        this.updateSaveButtonState();
        this.hideStatus();
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const saveBtn = this.container.querySelector('[data-action="save"]');
        const btnText = this.container.querySelector('.btn-text');
        const btnSpinner = this.container.querySelector('.btn-spinner');

        if (saveBtn) {
            saveBtn.disabled = loading;
        }

        if (btnText && btnSpinner) {
            btnText.style.display = loading ? 'none' : 'inline';
            btnSpinner.style.display = loading ? 'inline' : 'none';
        }

        this.updateSaveButtonState();
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        const statusContainer = this.container.querySelector('.modal-status');
        const statusMessage = this.container.querySelector('.status-message');

        if (statusContainer && statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}`;
            statusContainer.style.display = 'block';
        }
    }

    /**
     * Hide status message
     */
    hideStatus() {
        const statusContainer = this.container.querySelector('.modal-status');
        if (statusContainer) {
            statusContainer.style.display = 'none';
        }
    }

    /**
     * Update page ID
     */
    setPageId(pageId) {
        this.options.pageId = pageId;
    }

    /**
     * Destroy the component
     */
    destroy() {
        document.removeEventListener('keydown', this.handleKeydown);
        this.container.innerHTML = '';
    }
}

// Make SaveVersionModal available globally
window.SaveVersionModal = SaveVersionModal;
