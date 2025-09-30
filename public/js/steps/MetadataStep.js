/**
 * Metadata Step Component
 * Work Order #47: Implement Multi-Step Template Upload Wizard with State Management
 * 
 * Handles template metadata collection including name, description, category,
 * and tags for the template creation wizard.
 */

class MetadataStep {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            stateManager: null,
            onStepComplete: null,
            ...options
        };

        if (!this.container) {
            console.error('MetadataStep: Container not found:', containerId);
            return;
        }

        if (!this.options.stateManager) {
            console.error('MetadataStep: State manager is required');
            return;
        }

        this.stateManager = this.options.stateManager;
        this.elements = {};
        this.categories = [];
        this.tags = [];

        this.init();
    }

    /**
     * Initialize the metadata step
     */
    init() {
        this.render();
        this.setupEventListeners();
        this.loadCategories();
        this.loadExistingData();
    }

    /**
     * Render the metadata step UI
     */
    render() {
        this.container.innerHTML = `
            <div class="metadata-step">
                <div class="step-header">
                    <h3 class="step-title">
                        <i class="fas fa-info-circle"></i>
                        Template Metadata
                    </h3>
                    <p class="step-description">
                        Provide information about your template to help users find and understand it.
                    </p>
                </div>

                <div class="metadata-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="template-name" class="required">Template Name</label>
                            <input type="text" id="template-name" class="form-control" 
                                   placeholder="Enter a descriptive name for your template" 
                                   maxlength="100" required>
                            <div class="form-help">Choose a clear, descriptive name that explains what the template is for.</div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="template-description" class="required">Description</label>
                            <textarea id="template-description" class="form-control" rows="4" 
                                      placeholder="Describe your template, its purpose, and key features" 
                                      maxlength="500" required></textarea>
                            <div class="form-help">Provide a detailed description to help users understand when to use this template.</div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="template-category" class="required">Category</label>
                            <div class="category-selector">
                                <select id="template-category" class="form-control" required>
                                    <option value="">Select a category</option>
                                </select>
                                <button type="button" class="btn btn-secondary btn-sm" id="create-category-btn">
                                    <i class="fas fa-plus"></i>
                                    Create New
                                </button>
                            </div>
                            <div class="form-help">Choose the most appropriate category for your template.</div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="template-tags">Tags</label>
                            <div class="tags-input-container">
                                <div class="tags-display" id="tags-display"></div>
                                <input type="text" id="template-tags" class="form-control" 
                                       placeholder="Type a tag and press Enter to add it">
                            </div>
                            <div class="form-help">Add relevant tags to help users find your template. Press Enter to add each tag.</div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Template Preview</label>
                            <div class="template-preview" id="template-preview">
                                <div class="preview-placeholder">
                                    <i class="fas fa-image"></i>
                                    <p>Template preview will appear here</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <div class="metadata-help">
                        <h5>Tips for Great Metadata:</h5>
                        <ul>
                            <li><strong>Name:</strong> Be specific and descriptive (e.g., "E-commerce Product Page" not just "Product Page")</li>
                            <li><strong>Description:</strong> Explain the template's purpose, target audience, and key features</li>
                            <li><strong>Category:</strong> Choose the most relevant category to help users find your template</li>
                            <li><strong>Tags:</strong> Add 3-5 relevant tags that describe the template's use case or style</li>
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
            templateName: document.getElementById('template-name'),
            templateDescription: document.getElementById('template-description'),
            templateCategory: document.getElementById('template-category'),
            createCategoryBtn: document.getElementById('create-category-btn'),
            templateTags: document.getElementById('template-tags'),
            tagsDisplay: document.getElementById('tags-display'),
            templatePreview: document.getElementById('template-preview')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form inputs
        this.elements.templateName.addEventListener('input', () => this.handleInputChange());
        this.elements.templateDescription.addEventListener('input', () => this.handleInputChange());
        this.elements.templateCategory.addEventListener('change', () => this.handleInputChange());

        // Tags input
        this.elements.templateTags.addEventListener('keydown', (e) => this.handleTagInput(e));
        this.elements.templateTags.addEventListener('blur', () => this.handleTagInputBlur());

        // Create category button
        this.elements.createCategoryBtn.addEventListener('click', () => this.showCreateCategoryModal());
    }

    /**
     * Load categories from API
     */
    async loadCategories() {
        try {
            const response = await fetch('/api/admin/categories', {
                headers: {
                    'Authorization': 'Bearer mock-admin-token-123'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load categories');
            }

            const result = await response.json();
            this.categories = result.data || [];
            this.populateCategorySelect();
        } catch (error) {
            console.error('MetadataStep: Error loading categories:', error);
            this.showError('Failed to load categories. Please refresh the page.');
        }
    }

    /**
     * Populate category select
     */
    populateCategorySelect() {
        this.elements.templateCategory.innerHTML = '<option value="">Select a category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            this.elements.templateCategory.appendChild(option);
        });
    }

    /**
     * Load existing data from state
     */
    loadExistingData() {
        const metadata = this.stateManager.getStepData('metadata');
        
        if (metadata.name) {
            this.elements.templateName.value = metadata.name;
        }
        
        if (metadata.description) {
            this.elements.templateDescription.value = metadata.description;
        }
        
        if (metadata.categoryId) {
            this.elements.templateCategory.value = metadata.categoryId;
        }
        
        if (metadata.tags && metadata.tags.length > 0) {
            this.tags = [...metadata.tags];
            this.updateTagsDisplay();
        }

        // Load template preview
        this.loadTemplatePreview();
    }

    /**
     * Load template preview
     */
    loadTemplatePreview() {
        const uploadData = this.stateManager.getStepData('upload');
        
        if (uploadData.publicUrl) {
            this.elements.templatePreview.innerHTML = `
                <div class="preview-image">
                    <img src="${uploadData.publicUrl}" alt="Template preview" />
                </div>
            `;
        }
    }

    /**
     * Handle input change
     */
    handleInputChange() {
        this.validateForm();
        this.updateState();
    }

    /**
     * Handle tag input
     */
    handleTagInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addTag();
        }
    }

    /**
     * Handle tag input blur
     */
    handleTagInputBlur() {
        // Add tag if there's text in the input
        if (this.elements.templateTags.value.trim()) {
            this.addTag();
        }
    }

    /**
     * Add tag
     */
    addTag() {
        const tagText = this.elements.templateTags.value.trim();
        
        if (!tagText) return;
        
        // Check if tag already exists
        if (this.tags.includes(tagText)) {
            this.elements.templateTags.value = '';
            return;
        }
        
        // Limit number of tags
        if (this.tags.length >= 10) {
            alert('Maximum 10 tags allowed');
            return;
        }
        
        this.tags.push(tagText);
        this.elements.templateTags.value = '';
        this.updateTagsDisplay();
        this.updateState();
    }

    /**
     * Remove tag
     */
    removeTag(tagText) {
        const index = this.tags.indexOf(tagText);
        if (index > -1) {
            this.tags.splice(index, 1);
            this.updateTagsDisplay();
            this.updateState();
        }
    }

    /**
     * Update tags display
     */
    updateTagsDisplay() {
        if (this.tags.length === 0) {
            this.elements.tagsDisplay.innerHTML = '<div class="no-tags">No tags added yet</div>';
            return;
        }
        
        const tagsHtml = this.tags.map(tag => `
            <span class="tag">
                ${this.escapeHtml(tag)}
                <button type="button" class="tag-remove" onclick="this.removeTag('${this.escapeHtml(tag)}')">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
        
        this.elements.tagsDisplay.innerHTML = tagsHtml;
    }

    /**
     * Show create category modal
     */
    showCreateCategoryModal() {
        const categoryName = prompt('Enter new category name:');
        
        if (!categoryName || !categoryName.trim()) {
            return;
        }
        
        this.createCategory(categoryName.trim());
    }

    /**
     * Create new category
     */
    async createCategory(name) {
        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-admin-token-123'
                },
                body: JSON.stringify({
                    name: name,
                    description: `Category for ${name} templates`
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create category');
            }

            const result = await response.json();
            const newCategory = result.data;
            
            // Add to categories list
            this.categories.push(newCategory);
            
            // Update select
            this.populateCategorySelect();
            
            // Select the new category
            this.elements.templateCategory.value = newCategory.id;
            
            this.updateState();
            
        } catch (error) {
            console.error('MetadataStep: Error creating category:', error);
            alert('Failed to create category: ' + error.message);
        }
    }

    /**
     * Validate form
     */
    validateForm() {
        const name = this.elements.templateName.value.trim();
        const description = this.elements.templateDescription.value.trim();
        const categoryId = this.elements.templateCategory.value;
        
        const isValid = name.length > 0 && description.length > 0 && categoryId.length > 0;
        
        // Update state with validation result
        this.stateManager.updateStepData('metadata', {
            isCompleted: isValid,
            error: isValid ? null : 'Please fill in all required fields'
        });
        
        return isValid;
    }

    /**
     * Update state
     */
    updateState() {
        const name = this.elements.templateName.value.trim();
        const description = this.elements.templateDescription.value.trim();
        const categoryId = this.elements.templateCategory.value;
        const categoryName = this.elements.templateCategory.selectedOptions[0]?.text || '';
        
        this.stateManager.updateStepData('metadata', {
            name,
            description,
            categoryId,
            categoryName,
            tags: [...this.tags]
        });
        
        // Check if step is complete
        if (this.validateForm() && this.options.onStepComplete) {
            this.options.onStepComplete();
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // You could implement a more sophisticated error display here
        alert(message);
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
    module.exports = MetadataStep;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.MetadataStep = MetadataStep;
}
