/**
 * Template Metadata Form Component - Work Order 46
 * Handles template metadata collection including name, description, and category assignment
 */

class TemplateMetadataForm {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`TemplateMetadataForm: Container element with ID "${containerId}" not found.`);
            return;
        }

        this.options = {
            onSave: () => {},
            onCancel: () => {},
            onError: () => {},
            ...options
        };

        this.categories = [];
        this.isLoading = false;
        this.formData = {
            name: '',
            description: '',
            categoryId: '',
            newCategory: null
        };

        this.init();
    }

    /**
     * Initialize the form component
     */
    async init() {
        try {
            await this.loadCategories();
            this.render();
            this.setupEventListeners();
            this.setupValidation();
        } catch (error) {
            console.error('Error initializing TemplateMetadataForm:', error);
            this.showError('Failed to initialize form. Please refresh the page.');
        }
    }

    /**
     * Load categories from the API
     */
    async loadCategories() {
        try {
            const response = await fetch('/api/admin/categories', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-admin-token-123' // Mock admin authentication
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load categories: ${response.status}`);
            }

            const result = await response.json();
            this.categories = result.data || [];
        } catch (error) {
            console.error('Error loading categories:', error);
            throw error;
        }
    }

    /**
     * Render the form HTML
     */
    render() {
        this.container.innerHTML = `
            <div class="template-metadata-form-container">
                <div class="form-header">
                    <h2 class="form-title">Template Metadata</h2>
                    <p class="form-description">Configure the basic information for your template including name, description, and category assignment.</p>
                </div>

                <form id="template-metadata-form" class="template-metadata-form" novalidate>
                    <!-- Template Name Field -->
                    <div class="form-group">
                        <label for="template-name" class="form-label required">
                            Template Name
                            <span class="required-indicator">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="template-name" 
                            name="name" 
                            class="form-control" 
                            placeholder="Enter template name"
                            maxlength="255"
                            required
                            autocomplete="off"
                        >
                        <div class="form-feedback" id="template-name-feedback"></div>
                        <div class="form-help">
                            <span class="character-count" id="template-name-count">0</span>/255 characters
                        </div>
                    </div>

                    <!-- Template Description Field -->
                    <div class="form-group">
                        <label for="template-description" class="form-label required">
                            Template Description
                            <span class="required-indicator">*</span>
                        </label>
                        <textarea 
                            id="template-description" 
                            name="description" 
                            class="form-control form-textarea" 
                            placeholder="Describe your template and its purpose"
                            maxlength="1000"
                            rows="4"
                            required
                        ></textarea>
                        <div class="form-feedback" id="template-description-feedback"></div>
                        <div class="form-help">
                            <span class="character-count" id="template-description-count">0</span>/1000 characters
                        </div>
                    </div>

                    <!-- Category Selection -->
                    <div class="form-group">
                        <label class="form-label required">
                            Category
                            <span class="required-indicator">*</span>
                        </label>
                        
                        <!-- Category Selection Options -->
                        <div class="category-selection">
                            <div class="category-option">
                                <input 
                                    type="radio" 
                                    id="existing-category" 
                                    name="category-type" 
                                    value="existing" 
                                    class="form-radio"
                                    checked
                                >
                                <label for="existing-category" class="form-radio-label">
                                    Use existing category
                                </label>
                            </div>
                            
                            <div class="category-option">
                                <input 
                                    type="radio" 
                                    id="new-category" 
                                    name="category-type" 
                                    value="new" 
                                    class="form-radio"
                                >
                                <label for="new-category" class="form-radio-label">
                                    Create new category
                                </label>
                            </div>
                        </div>

                        <!-- Existing Category Dropdown -->
                        <div class="category-dropdown-container" id="existing-category-container">
                            <select 
                                id="category-select" 
                                name="categoryId" 
                                class="form-control form-select"
                            >
                                <option value="">Select a category...</option>
                                ${this.categories.map(category => 
                                    `<option value="${category.id}">${this.escapeHtml(category.name)}</option>`
                                ).join('')}
                            </select>
                            <div class="form-feedback" id="category-select-feedback"></div>
                        </div>

                        <!-- New Category Fields -->
                        <div class="new-category-container" id="new-category-container" style="display: none;">
                            <div class="new-category-fields">
                                <div class="form-group">
                                    <label for="new-category-name" class="form-label required">
                                        Category Name
                                        <span class="required-indicator">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        id="new-category-name" 
                                        name="newCategoryName" 
                                        class="form-control" 
                                        placeholder="Enter category name"
                                        maxlength="100"
                                        autocomplete="off"
                                    >
                                    <div class="form-feedback" id="new-category-name-feedback"></div>
                                    <div class="form-help">
                                        <span class="character-count" id="new-category-name-count">0</span>/100 characters
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="new-category-description" class="form-label required">
                                        Category Description
                                        <span class="required-indicator">*</span>
                                    </label>
                                    <textarea 
                                        id="new-category-description" 
                                        name="newCategoryDescription" 
                                        class="form-control form-textarea" 
                                        placeholder="Describe this category"
                                        maxlength="500"
                                        rows="3"
                                    ></textarea>
                                    <div class="form-feedback" id="new-category-description-feedback"></div>
                                    <div class="form-help">
                                        <span class="character-count" id="new-category-description-count">0</span>/500 characters
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Form Actions -->
                    <div class="form-actions">
                        <button 
                            type="button" 
                            id="cancel-button" 
                            class="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            id="save-button" 
                            class="btn btn-primary"
                            disabled
                        >
                            <span class="btn-text">Save Template</span>
                            <span class="btn-loading" style="display: none;">
                                <i class="fas fa-spinner fa-spin"></i>
                                Saving...
                            </span>
                        </button>
                    </div>
                </form>

                <!-- Success/Error Messages -->
                <div class="form-messages" id="form-messages" style="display: none;">
                    <div class="message-content"></div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const form = this.container.querySelector('#template-metadata-form');
        const cancelButton = this.container.querySelector('#cancel-button');
        const saveButton = this.container.querySelector('#save-button');

        // Form submission
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Cancel button
        cancelButton.addEventListener('click', () => this.handleCancel());

        // Category type radio buttons
        const existingCategoryRadio = this.container.querySelector('#existing-category');
        const newCategoryRadio = this.container.querySelector('#new-category');
        
        existingCategoryRadio.addEventListener('change', () => this.toggleCategoryType('existing'));
        newCategoryRadio.addEventListener('change', () => this.toggleCategoryType('new'));

        // Real-time validation and character counting
        this.setupFieldListeners();

        // Save button state management
        this.updateSaveButtonState();
    }

    /**
     * Setup field listeners for real-time validation
     */
    setupFieldListeners() {
        const fields = [
            { id: 'template-name', maxLength: 255 },
            { id: 'template-description', maxLength: 1000 },
            { id: 'new-category-name', maxLength: 100 },
            { id: 'new-category-description', maxLength: 500 }
        ];

        fields.forEach(field => {
            const input = this.container.querySelector(`#${field.id}`);
            if (input) {
                input.addEventListener('input', () => {
                    this.updateCharacterCount(field.id, field.maxLength);
                    this.validateField(field.id);
                    this.updateSaveButtonState();
                });

                input.addEventListener('blur', () => {
                    this.validateField(field.id);
                    this.updateSaveButtonState();
                });
            }
        });

        // Category select
        const categorySelect = this.container.querySelector('#category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                this.validateField('category-select');
                this.updateSaveButtonState();
            });
        }
    }

    /**
     * Setup validation using ValidationUtils
     */
    setupValidation() {
        if (!window.ValidationUtils) {
            console.warn('ValidationUtils not available. Form validation will be limited.');
        }
    }

    /**
     * Toggle between existing and new category options
     */
    toggleCategoryType(type) {
        const existingContainer = this.container.querySelector('#existing-category-container');
        const newContainer = this.container.querySelector('#new-category-container');

        if (type === 'existing') {
            existingContainer.style.display = 'block';
            newContainer.style.display = 'none';
            this.clearNewCategoryFields();
        } else {
            existingContainer.style.display = 'none';
            newContainer.style.display = 'block';
            this.clearExistingCategorySelection();
        }

        this.updateSaveButtonState();
    }

    /**
     * Clear new category fields
     */
    clearNewCategoryFields() {
        const newCategoryName = this.container.querySelector('#new-category-name');
        const newCategoryDescription = this.container.querySelector('#new-category-description');
        
        if (newCategoryName) newCategoryName.value = '';
        if (newCategoryDescription) newCategoryDescription.value = '';
        
        this.clearFieldFeedback('new-category-name');
        this.clearFieldFeedback('new-category-description');
    }

    /**
     * Clear existing category selection
     */
    clearExistingCategorySelection() {
        const categorySelect = this.container.querySelector('#category-select');
        if (categorySelect) {
            categorySelect.value = '';
        }
        this.clearFieldFeedback('category-select');
    }

    /**
     * Update character count display
     */
    updateCharacterCount(fieldId, maxLength) {
        const input = this.container.querySelector(`#${fieldId}`);
        const countElement = this.container.querySelector(`#${fieldId.replace('-', '-')}-count`);
        
        if (input && countElement) {
            const currentLength = input.value.length;
            countElement.textContent = currentLength;
            
            // Update color based on length
            if (currentLength > maxLength * 0.9) {
                countElement.style.color = '#dc2626'; // Red
            } else if (currentLength > maxLength * 0.8) {
                countElement.style.color = '#f59e0b'; // Orange
            } else {
                countElement.style.color = '#6b7280'; // Gray
            }
        }
    }

    /**
     * Validate a specific field
     */
    validateField(fieldId) {
        if (!window.ValidationUtils) return;

        const input = this.container.querySelector(`#${fieldId}`);
        if (!input) return;

        let validationResult;

        switch (fieldId) {
            case 'template-name':
                validationResult = window.ValidationUtils.validateTemplateName(input.value);
                break;
            case 'template-description':
                validationResult = window.ValidationUtils.validateTemplateDescription(input.value);
                break;
            case 'new-category-name':
                validationResult = window.ValidationUtils.validateCategoryName(input.value);
                break;
            case 'new-category-description':
                validationResult = window.ValidationUtils.validateCategoryDescription(input.value);
                break;
            case 'category-select':
                // Custom validation for category selection
                validationResult = this.validateCategorySelection();
                break;
            default:
                return;
        }

        this.displayFieldValidation(fieldId, validationResult);
    }

    /**
     * Validate category selection
     */
    validateCategorySelection() {
        const existingCategoryRadio = this.container.querySelector('#existing-category');
        const categorySelect = this.container.querySelector('#category-select');
        const newCategoryRadio = this.container.querySelector('#new-category');
        const newCategoryName = this.container.querySelector('#new-category-name');
        const newCategoryDescription = this.container.querySelector('#new-category-description');

        const result = new window.ValidationUtils.ValidationResult(true);

        if (existingCategoryRadio && existingCategoryRadio.checked) {
            if (!categorySelect.value) {
                result.addError('categoryId', 'Please select a category');
            }
        } else if (newCategoryRadio && newCategoryRadio.checked) {
            if (!newCategoryName.value.trim()) {
                result.addError('newCategoryName', 'Category name is required');
            }
            if (!newCategoryDescription.value.trim()) {
                result.addError('newCategoryDescription', 'Category description is required');
            }
        } else {
            result.addError('category', 'Please select a category option');
        }

        return result;
    }

    /**
     * Display field validation result
     */
    displayFieldValidation(fieldId, validationResult) {
        const feedbackElement = this.container.querySelector(`#${fieldId}-feedback`);
        if (!feedbackElement) return;

        this.clearFieldFeedback(fieldId);

        if (!validationResult.isValid) {
            const firstError = validationResult.getFirstError();
            if (firstError) {
                feedbackElement.textContent = firstError.message;
                feedbackElement.className = 'form-feedback form-feedback-error';
                feedbackElement.style.display = 'block';
            }
        }
    }

    /**
     * Clear field feedback
     */
    clearFieldFeedback(fieldId) {
        const feedbackElement = this.container.querySelector(`#${fieldId}-feedback`);
        if (feedbackElement) {
            feedbackElement.textContent = '';
            feedbackElement.className = 'form-feedback';
            feedbackElement.style.display = 'none';
        }
    }

    /**
     * Update save button state based on form validity
     */
    updateSaveButtonState() {
        const saveButton = this.container.querySelector('#save-button');
        if (!saveButton) return;

        const isFormValid = this.isFormValid();
        saveButton.disabled = !isFormValid || this.isLoading;
    }

    /**
     * Check if form is valid
     */
    isFormValid() {
        const name = this.container.querySelector('#template-name').value.trim();
        const description = this.container.querySelector('#template-description').value.trim();
        const existingCategoryRadio = this.container.querySelector('#existing-category');
        const newCategoryRadio = this.container.querySelector('#new-category');

        // Check required fields
        if (!name || !description) {
            return false;
        }

        // Check category selection
        if (existingCategoryRadio && existingCategoryRadio.checked) {
            const categorySelect = this.container.querySelector('#category-select');
            return categorySelect && categorySelect.value;
        } else if (newCategoryRadio && newCategoryRadio.checked) {
            const newCategoryName = this.container.querySelector('#new-category-name').value.trim();
            const newCategoryDescription = this.container.querySelector('#new-category-description').value.trim();
            return newCategoryName && newCategoryDescription;
        }

        return false;
    }

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;

        try {
            this.setLoading(true);
            this.hideMessages();

            const formData = this.getFormData();
            const validationResult = this.validateFormData(formData);

            if (!validationResult.isValid) {
                this.displayValidationErrors(validationResult);
                return;
            }

            // If creating new category, create it first
            let categoryId = formData.categoryId;
            if (formData.newCategory) {
                categoryId = await this.createNewCategory(formData.newCategory);
            }

            // Prepare template data
            const templateData = {
                name: formData.name,
                description: formData.description,
                categoryId: categoryId,
                previewImageUrl: 'https://example.com/placeholder.png', // Placeholder
                components: [] // Empty components array for now
            };

            // Save template
            await this.saveTemplate(templateData);
            this.showSuccess('Template metadata saved successfully!');
            
            // Call success callback
            if (this.options.onSave) {
                this.options.onSave(templateData);
            }

        } catch (error) {
            console.error('Error saving template metadata:', error);
            this.showError(error.message || 'Failed to save template metadata. Please try again.');
            
            if (this.options.onError) {
                this.options.onError(error);
            }
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        const existingCategoryRadio = this.container.querySelector('#existing-category');
        const newCategoryRadio = this.container.querySelector('#new-category');

        const data = {
            name: this.container.querySelector('#template-name').value.trim(),
            description: this.container.querySelector('#template-description').value.trim(),
            categoryId: '',
            newCategory: null
        };

        if (existingCategoryRadio && existingCategoryRadio.checked) {
            data.categoryId = this.container.querySelector('#category-select').value;
        } else if (newCategoryRadio && newCategoryRadio.checked) {
            data.newCategory = {
                name: this.container.querySelector('#new-category-name').value.trim(),
                description: this.container.querySelector('#new-category-description').value.trim()
            };
        }

        return data;
    }

    /**
     * Validate form data
     */
    validateFormData(formData) {
        if (!window.ValidationUtils) {
            // Basic validation without ValidationUtils
            const result = new window.ValidationUtils.ValidationResult(true);
            if (!formData.name) result.addError('name', 'Template name is required');
            if (!formData.description) result.addError('description', 'Template description is required');
            if (!formData.categoryId && !formData.newCategory) {
                result.addError('category', 'Category selection is required');
            }
            return result;
        }

        return window.ValidationUtils.validateTemplateMetadata(formData);
    }

    /**
     * Display validation errors
     */
    displayValidationErrors(validationResult) {
        validationResult.errors.forEach(error => {
            this.displayFieldValidation(error.field, validationResult);
        });
    }

    /**
     * Create new category
     */
    async createNewCategory(categoryData) {
        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-admin-token-123'
                },
                body: JSON.stringify(categoryData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create category');
            }

            const result = await response.json();
            return result.data.id;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }

    /**
     * Save template
     */
    async saveTemplate(templateData) {
        try {
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
                throw new Error(errorData.error || 'Failed to save template');
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error saving template:', error);
            throw error;
        }
    }

    /**
     * Handle cancel
     */
    handleCancel() {
        if (this.options.onCancel) {
            this.options.onCancel();
        }
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        const saveButton = this.container.querySelector('#save-button');
        const btnText = saveButton.querySelector('.btn-text');
        const btnLoading = saveButton.querySelector('.btn-loading');

        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-flex';
            saveButton.disabled = true;
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            this.updateSaveButtonState();
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show message
     */
    showMessage(message, type) {
        const messagesContainer = this.container.querySelector('#form-messages');
        const messageContent = messagesContainer.querySelector('.message-content');
        
        if (messagesContainer && messageContent) {
            messageContent.textContent = message;
            messageContent.className = `message-content message-${type}`;
            messagesContainer.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => this.hideMessages(), 5000);
            }
        }
    }

    /**
     * Hide messages
     */
    hideMessages() {
        const messagesContainer = this.container.querySelector('#form-messages');
        if (messagesContainer) {
            messagesContainer.style.display = 'none';
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Reset form
     */
    reset() {
        const form = this.container.querySelector('#template-metadata-form');
        if (form) {
            form.reset();
        }
        
        this.toggleCategoryType('existing');
        this.hideMessages();
        this.updateSaveButtonState();
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

// Export for use in other modules
window.TemplateMetadataForm = TemplateMetadataForm;
