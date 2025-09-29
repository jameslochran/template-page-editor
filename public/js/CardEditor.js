/**
 * CardEditor Component
 * Work Order #15: Implement CardEditor Component for Card Content Editing
 * 
 * This component provides editing interface for CardComponents,
 * including title input, rich text description editing, and link configuration.
 */

class CardEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.cardData = options.cardData || options.componentData || null;
        this.onTitleChange = options.onTitleChange || (() => {});
        this.onDescriptionChange = options.onDescriptionChange || (() => {});
        this.onLinkChange = options.onLinkChange || (() => {});
        this.onUpdate = options.onUpdate || (() => {});
        this.onClose = options.onClose || (() => {});
        
        this.isEditing = false;
        this.originalData = null;
        this.quill = null;
        this.isQuillReady = false;
        this.quillRetryCount = 0;
        this.maxQuillRetries = 50;
        
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the CardEditor interface
     */
    render() {
        this.container.innerHTML = '';
        this.container.className = 'card-editor';
        
        if (!this.cardData) {
            this.renderEmptyState();
            return;
        }

        // Store original data for cancel functionality
        this.originalData = JSON.parse(JSON.stringify(this.cardData));

        const editorHTML = `
            <div class="card-editor-container">
                <div class="editor-header">
                    <h4>Edit Card Component</h4>
                    <p class="editor-description">Modify the title, description, and link properties of this card.</p>
                </div>
                
                <div class="editor-content">
                    <div class="form-group">
                        <label for="card-title">Title</label>
                        <input 
                            type="text" 
                            id="card-title" 
                            class="form-control" 
                            value="${this.escapeHtml(this.cardData.title || '')}"
                            placeholder="Enter card title..."
                            maxlength="255"
                        />
                        <small class="form-text text-muted">
                            Maximum 255 characters
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="card-description">Description</label>
                        <div class="quill-editor-container">
                            <div id="quill-editor-${this.cardData.id}" class="quill-editor"></div>
                        </div>
                        <div class="editor-help">
                            <small class="text-muted">
                                <i class="fas fa-info-circle"></i>
                                Use the toolbar above to format your description with rich text editing capabilities.
                            </small>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Link Configuration</label>
                        <div class="link-config-section">
                            <div class="form-row">
                                <div class="form-col">
                                    <label for="link-url">URL</label>
                                    <input 
                                        type="url" 
                                        id="link-url" 
                                        class="form-control" 
                                        value="${this.escapeHtml(this.cardData.linkUrl || '')}"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div class="form-col">
                                    <label for="link-text">Link Text</label>
                                    <input 
                                        type="text" 
                                        id="link-text" 
                                        class="form-control" 
                                        value="${this.escapeHtml(this.cardData.linkText || '')}"
                                        placeholder="Learn More"
                                        maxlength="100"
                                    />
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-col">
                                    <label for="link-target">Target</label>
                                    <select id="link-target" class="form-control">
                                        <option value="_self" ${this.cardData.linkTarget === '_self' ? 'selected' : ''}>Same Window</option>
                                        <option value="_blank" ${this.cardData.linkTarget === '_blank' ? 'selected' : ''}>New Window</option>
                                    </select>
                                </div>
                                <div class="form-col">
                                    <div class="link-preview">
                                        <label>Preview</label>
                                        <div class="link-preview-content">
                                            ${this.getLinkPreview()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="editor-actions">
                    <button type="button" class="btn btn-secondary" data-action="cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-primary" data-action="save">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        `;

        this.container.innerHTML = editorHTML;
        this.setupEventListeners();
        this.initializeQuillEditor();
    }

    /**
     * Initialize Quill.js editor for description editing
     */
    initializeQuillEditor() {
        // Check if Quill is available, with retry mechanism
        if (typeof Quill === 'undefined') {
            this.quillRetryCount++;
            if (this.quillRetryCount >= this.maxQuillRetries) {
                console.error('Quill.js failed to load after maximum retries. Falling back to basic editor.');
                this.initializeFallbackEditor();
                return;
            }
            console.warn(`Quill.js not yet loaded, retrying in 100ms... (${this.quillRetryCount}/${this.maxQuillRetries})`);
            setTimeout(() => {
                this.initializeQuillEditor();
            }, 100);
            return;
        }

        console.log('Quill.js loaded successfully, initializing CardEditor...');
        
        const quillContainer = this.container.querySelector(`#quill-editor-${this.cardData.id}`);
        if (!quillContainer) {
            console.error('Quill editor container not found');
            return;
        }

        try {
            // Initialize Quill with basic toolbar
            this.quill = new Quill(quillContainer, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                    ]
                },
                placeholder: 'Enter card description...'
            });

            // Set initial content
            const description = this.cardData.description || {};
            if (description.data) {
                this.quill.root.innerHTML = description.data;
            }

            // Listen for content changes
            this.quill.on('text-change', () => {
                this.handleDescriptionChange();
            });

            this.isQuillReady = true;
            console.log('CardEditor Quill editor initialized successfully');

        } catch (error) {
            console.error('Error initializing Quill editor:', error);
            this.initializeFallbackEditor();
        }
    }

    /**
     * Initialize fallback editor when Quill.js is not available
     */
    initializeFallbackEditor() {
        const quillContainer = this.container.querySelector(`#quill-editor-${this.cardData.id}`);
        if (!quillContainer) return;

        quillContainer.innerHTML = `
            <div class="fallback-editor">
                <textarea 
                    class="form-control" 
                    rows="4" 
                    placeholder="Enter card description..."
                    style="min-height: 120px; resize: vertical;"
                >${this.escapeHtml(this.cardData.description?.data || '')}</textarea>
            </div>
        `;

        // Add event listener for fallback editor
        const textarea = quillContainer.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('input', () => {
                this.handleDescriptionChange();
            });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Title input change
        const titleInput = this.container.querySelector('#card-title');
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                this.handleTitleChange(e.target.value);
            });
        }

        // Link configuration changes
        const linkUrlInput = this.container.querySelector('#link-url');
        const linkTextInput = this.container.querySelector('#link-text');
        const linkTargetSelect = this.container.querySelector('#link-target');

        if (linkUrlInput) {
            linkUrlInput.addEventListener('input', () => {
                this.handleLinkChange();
            });
        }

        if (linkTextInput) {
            linkTextInput.addEventListener('input', () => {
                this.handleLinkChange();
            });
        }

        if (linkTargetSelect) {
            linkTargetSelect.addEventListener('change', () => {
                this.handleLinkChange();
            });
        }

        // Action buttons
        this.container.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;

            switch (action) {
                case 'save':
                    this.saveChanges();
                    break;
                case 'cancel':
                    this.cancelChanges();
                    break;
            }
        });
    }

    /**
     * Handle title input changes
     */
    handleTitleChange(newTitle) {
        if (!this.cardData) return;

        // Validate title length
        if (newTitle.length > 255) {
            newTitle = newTitle.substring(0, 255);
            const titleInput = this.container.querySelector('#card-title');
            if (titleInput) {
                titleInput.value = newTitle;
            }
        }

        // Update card data
        this.cardData.title = newTitle;
        
        // Notify parent of title change
        this.onTitleChange(this.cardData.id, newTitle);
    }

    /**
     * Handle description changes
     */
    handleDescriptionChange() {
        if (!this.cardData) return;

        let descriptionData = '';
        
        if (this.quill && this.isQuillReady) {
            // Get content from Quill editor
            descriptionData = this.quill.root.innerHTML;
        } else {
            // Get content from fallback editor
            const textarea = this.container.querySelector('.fallback-editor textarea');
            if (textarea) {
                descriptionData = textarea.value;
            }
        }

        // Update card data
        this.cardData.description = {
            format: 'html',
            data: descriptionData,
            metadata: {
                version: '1.0',
                created: this.cardData.description?.metadata?.created || new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        };

        // Notify parent of description change
        this.onDescriptionChange(this.cardData.id, this.cardData.description);
    }

    /**
     * Handle link configuration changes
     */
    handleLinkChange() {
        if (!this.cardData) return;

        const linkUrlInput = this.container.querySelector('#link-url');
        const linkTextInput = this.container.querySelector('#link-text');
        const linkTargetSelect = this.container.querySelector('#link-target');

        if (!linkUrlInput || !linkTextInput || !linkTargetSelect) return;

        const linkData = {
            linkUrl: linkUrlInput.value,
            linkText: linkTextInput.value,
            linkTarget: linkTargetSelect.value
        };

        // Update card data
        this.cardData.linkUrl = linkData.linkUrl;
        this.cardData.linkText = linkData.linkText;
        this.cardData.linkTarget = linkData.linkTarget;

        // Update link preview
        this.updateLinkPreview();

        // Notify parent of link change
        this.onLinkChange(this.cardData.id, linkData);
    }

    /**
     * Get link preview HTML
     */
    getLinkPreview() {
        if (!this.cardData.linkUrl || !this.cardData.linkText) {
            return '<span class="text-muted">No link configured</span>';
        }

        const target = this.cardData.linkTarget === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${this.escapeHtml(this.cardData.linkUrl)}"${target}>${this.escapeHtml(this.cardData.linkText)}</a>`;
    }

    /**
     * Update link preview
     */
    updateLinkPreview() {
        const previewContainer = this.container.querySelector('.link-preview-content');
        if (previewContainer) {
            previewContainer.innerHTML = this.getLinkPreview();
        }
    }

    /**
     * Save changes
     */
    saveChanges() {
        if (!this.cardData) return;

        // Validate data
        const validation = this.validateData();
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        // Notify parent of complete update
        this.onUpdate(this.cardData);
        
        // Show success feedback
        this.showSuccessMessage('Changes saved successfully');
    }

    /**
     * Cancel changes
     */
    cancelChanges() {
        if (!this.originalData) return;

        // Restore original data
        this.cardData = JSON.parse(JSON.stringify(this.originalData));
        
        // Re-render with original data
        this.render();
    }

    /**
     * Validate card data
     */
    validateData() {
        const errors = [];

        if (!this.cardData) {
            errors.push('Card data is required');
            return { isValid: false, errors };
        }

        // Validate title
        if (!this.cardData.title || this.cardData.title.trim().length === 0) {
            errors.push('Title is required');
        } else if (this.cardData.title.length > 255) {
            errors.push('Title must be 255 characters or less');
        }

        // Validate description
        if (!this.cardData.description || !this.cardData.description.data) {
            errors.push('Description is required');
        }

        // Validate link URL if link text is provided
        if (this.cardData.linkText && this.cardData.linkText.trim().length > 0) {
            if (!this.cardData.linkUrl || this.cardData.linkUrl.trim().length === 0) {
                errors.push('Link URL is required when link text is provided');
            } else if (!this.isValidUrl(this.cardData.linkUrl)) {
                errors.push('Link URL must be a valid URL');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate URL format
     */
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Show validation errors
     */
    showValidationErrors(errors) {
        // Remove existing error display
        const existingErrors = this.container.querySelector('.validation-errors');
        if (existingErrors) {
            existingErrors.remove();
        }

        // Create error display
        const errorHTML = `
            <div class="validation-errors alert alert-danger">
                <h6><i class="fas fa-exclamation-triangle"></i> Validation Errors:</h6>
                <ul class="mb-0">
                    ${errors.map(error => `<li>${this.escapeHtml(error)}</li>`).join('')}
                </ul>
            </div>
        `;

        // Insert before actions
        const actions = this.container.querySelector('.editor-actions');
        if (actions) {
            actions.insertAdjacentHTML('beforebegin', errorHTML);
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        // Remove existing success message
        const existingSuccess = this.container.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        // Create success message
        const successHTML = `
            <div class="success-message alert alert-success">
                <i class="fas fa-check-circle"></i> ${this.escapeHtml(message)}
            </div>
        `;

        // Insert before actions
        const actions = this.container.querySelector('.editor-actions');
        if (actions) {
            actions.insertAdjacentHTML('beforebegin', successHTML);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                const successMsg = this.container.querySelector('.success-message');
                if (successMsg) {
                    successMsg.remove();
                }
            }, 3000);
        }
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="empty-state-text">
                    <h6>No Card Data</h6>
                    <p>No card data available for editing.</p>
                </div>
            </div>
        `;
    }

    /**
     * Update card data
     */
    updateData(newCardData) {
        this.cardData = newCardData;
        this.originalData = JSON.parse(JSON.stringify(newCardData));
        this.render();
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add CSS styles
     */
    addStyles() {
        if (document.getElementById('card-editor-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'card-editor-styles';
        style.textContent = `
            .card-editor {
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .card-editor-container {
                padding: 0;
            }
            
            .editor-header {
                padding: 16px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }
            
            .editor-header h4 {
                margin: 0 0 4px 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }
            
            .editor-description {
                margin: 0;
                font-size: 14px;
                color: #6c757d;
            }
            
            .editor-content {
                padding: 16px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group:last-child {
                margin-bottom: 0;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #333;
                font-size: 14px;
            }
            
            .form-control {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 14px;
                transition: border-color 0.2s ease;
            }
            
            .form-control:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
            }
            
            .form-text {
                font-size: 12px;
                color: #6c757d;
                margin-top: 4px;
            }
            
            .quill-editor-container {
                border: 1px solid #ced4da;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .quill-editor {
                min-height: 120px;
            }
            
            .fallback-editor textarea {
                border: none;
                outline: none;
                padding: 12px;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .editor-help {
                margin-top: 8px;
            }
            
            .editor-help small {
                font-size: 12px;
            }
            
            .link-config-section {
                background: #f8f9fa;
                padding: 16px;
                border-radius: 6px;
                border: 1px solid #e9ecef;
            }
            
            .form-row {
                display: flex;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            .form-row:last-child {
                margin-bottom: 0;
            }
            
            .form-col {
                flex: 1;
            }
            
            .form-col label {
                font-size: 13px;
                margin-bottom: 4px;
            }
            
            .link-preview {
                display: flex;
                flex-direction: column;
            }
            
            .link-preview-content {
                padding: 8px 12px;
                background: #fff;
                border: 1px solid #ced4da;
                border-radius: 4px;
                min-height: 38px;
                display: flex;
                align-items: center;
            }
            
            .link-preview-content a {
                color: #007bff;
                text-decoration: none;
            }
            
            .link-preview-content a:hover {
                text-decoration: underline;
            }
            
            .editor-actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                padding: 16px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }
            
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                border: 1px solid transparent;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .btn-primary {
                background: #007bff;
                color: #fff;
                border-color: #007bff;
            }
            
            .btn-primary:hover {
                background: #0056b3;
                border-color: #0056b3;
            }
            
            .btn-secondary {
                background: #6c757d;
                color: #fff;
                border-color: #6c757d;
            }
            
            .btn-secondary:hover {
                background: #545b62;
                border-color: #545b62;
            }
            
            .validation-errors {
                margin: 16px;
                padding: 12px;
                border-radius: 4px;
            }
            
            .validation-errors h6 {
                margin: 0 0 8px 0;
                font-size: 14px;
                font-weight: 600;
            }
            
            .validation-errors ul {
                margin: 0;
                padding-left: 16px;
            }
            
            .validation-errors li {
                font-size: 13px;
                margin-bottom: 4px;
            }
            
            .success-message {
                margin: 16px;
                padding: 12px;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #6c757d;
            }
            
            .empty-state-icon {
                font-size: 32px;
                margin-bottom: 12px;
                opacity: 0.5;
            }
            
            .empty-state-text h6 {
                margin: 0 0 8px 0;
                color: #495057;
            }
            
            .empty-state-text p {
                margin: 0;
                font-size: 14px;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Destroy the editor
     */
    destroy() {
        if (this.quill) {
            this.quill = null;
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other scripts
window.CardEditor = CardEditor;
