/**
 * AccordionItemEditor Component
 * Work Order #21: Implement AccordionItemEditor Component for Individual Item Editing
 * 
 * This component provides editing interface for individual accordion items,
 * including header input, rich text content editing, and item removal functionality.
 */

class AccordionItemEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.itemData = options.itemData || null;
        this.onHeaderChange = options.onHeaderChange || (() => {});
        this.onContentChange = options.onContentChange || (() => {});
        this.onRemove = options.onRemove || (() => {});
        this.onUpdate = options.onUpdate || (() => {});
        
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
     * Render the AccordionItemEditor interface
     */
    render() {
        this.container.innerHTML = '';
        this.container.className = 'accordion-item-editor';
        
        if (!this.itemData) {
            this.renderEmptyState();
            return;
        }

        // Store original data for cancel functionality
        this.originalData = JSON.parse(JSON.stringify(this.itemData));

        const editorHTML = `
            <div class="accordion-item-editor-container">
                <div class="editor-header">
                    <h5>Edit Accordion Item</h5>
                    <p class="editor-description">Modify the header and content of this accordion item.</p>
                </div>
                
                <div class="editor-content">
                    <div class="form-group">
                        <label for="item-header">Header</label>
                        <input 
                            type="text" 
                            id="item-header" 
                            class="form-control" 
                            value="${this.escapeHtml(this.itemData.header || '')}"
                            placeholder="Enter accordion item header..."
                            maxlength="255"
                        />
                        <small class="form-text text-muted">
                            Maximum 255 characters
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="item-content">Content</label>
                        <div class="quill-editor-container">
                            <div id="quill-editor-${this.itemData.id}" class="quill-editor"></div>
                        </div>
                        <div class="editor-help">
                            <small class="text-muted">
                                <i class="fas fa-info-circle"></i>
                                Use the toolbar above to format your content with rich text editing capabilities.
                            </small>
                        </div>
                    </div>
                </div>

                <div class="editor-actions">
                    <button type="button" class="btn btn-outline-danger btn-sm" data-action="remove">
                        <i class="fas fa-trash"></i> Remove Item
                    </button>
                    <div class="action-spacer"></div>
                    <button type="button" class="btn btn-secondary btn-sm" data-action="cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" data-action="save">
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
     * Initialize Quill.js editor for content editing
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

        console.log('Quill.js loaded successfully, initializing AccordionItemEditor...');
        
        const quillContainer = this.container.querySelector(`#quill-editor-${this.itemData.id}`);
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
                placeholder: 'Enter accordion item content...'
            });

            // Set initial content
            const content = this.itemData.content || {};
            if (content.data) {
                this.quill.root.innerHTML = content.data;
            }

            // Listen for content changes
            this.quill.on('text-change', () => {
                this.handleContentChange();
            });

            this.isQuillReady = true;
            console.log('AccordionItemEditor Quill editor initialized successfully');

        } catch (error) {
            console.error('Error initializing Quill editor:', error);
            this.initializeFallbackEditor();
        }
    }

    /**
     * Initialize fallback editor when Quill.js is not available
     */
    initializeFallbackEditor() {
        const quillContainer = this.container.querySelector(`#quill-editor-${this.itemData.id}`);
        if (!quillContainer) return;

        quillContainer.innerHTML = `
            <div class="fallback-editor">
                <textarea 
                    class="form-control" 
                    rows="4" 
                    placeholder="Enter accordion item content..."
                    style="min-height: 100px; resize: vertical;"
                >${this.escapeHtml(this.itemData.content?.data || '')}</textarea>
            </div>
        `;

        // Add event listener for fallback editor
        const textarea = quillContainer.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('input', () => {
                this.handleContentChange();
            });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Header input change
        const headerInput = this.container.querySelector('#item-header');
        if (headerInput) {
            headerInput.addEventListener('input', (e) => {
                this.handleHeaderChange(e.target.value);
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
                case 'remove':
                    this.removeItem();
                    break;
            }
        });
    }

    /**
     * Handle header input changes
     */
    handleHeaderChange(newHeader) {
        if (!this.itemData) return;

        // Validate header length
        if (newHeader.length > 255) {
            newHeader = newHeader.substring(0, 255);
            const headerInput = this.container.querySelector('#item-header');
            if (headerInput) {
                headerInput.value = newHeader;
            }
        }

        // Update item data
        this.itemData.header = newHeader;
        
        // Notify parent of header change
        this.onHeaderChange(this.itemData.id, newHeader);
    }

    /**
     * Handle content changes
     */
    handleContentChange() {
        if (!this.itemData) return;

        let contentData = '';
        
        if (this.quill && this.isQuillReady) {
            // Get content from Quill editor
            contentData = this.quill.root.innerHTML;
        } else {
            // Get content from fallback editor
            const textarea = this.container.querySelector('.fallback-editor textarea');
            if (textarea) {
                contentData = textarea.value;
            }
        }

        // Update item data
        this.itemData.content = {
            format: 'html',
            data: contentData,
            metadata: {
                version: '1.0',
                created: this.itemData.content?.metadata?.created || new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        };

        // Notify parent of content change
        this.onContentChange(this.itemData.id, this.itemData.content);
    }

    /**
     * Save changes
     */
    saveChanges() {
        if (!this.itemData) return;

        // Validate data
        const validation = this.validateData();
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        // Notify parent of complete update
        this.onUpdate(this.itemData);
        
        // Show success feedback
        this.showSuccessMessage('Changes saved successfully');
    }

    /**
     * Cancel changes
     */
    cancelChanges() {
        if (!this.originalData) return;

        // Restore original data
        this.itemData = JSON.parse(JSON.stringify(this.originalData));
        
        // Re-render with original data
        this.render();
    }

    /**
     * Remove item
     */
    removeItem() {
        if (!this.itemData) return;

        if (confirm('Are you sure you want to remove this accordion item? This action cannot be undone.')) {
            this.onRemove(this.itemData.id);
        }
    }

    /**
     * Validate item data
     */
    validateData() {
        const errors = [];

        if (!this.itemData) {
            errors.push('Item data is required');
            return { isValid: false, errors };
        }

        // Validate header
        if (!this.itemData.header || this.itemData.header.trim().length === 0) {
            errors.push('Header is required');
        } else if (this.itemData.header.length > 255) {
            errors.push('Header must be 255 characters or less');
        }

        // Validate content
        if (!this.itemData.content || !this.itemData.content.data) {
            errors.push('Content is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
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
                    <h6>No Item Data</h6>
                    <p>No accordion item data available for editing.</p>
                </div>
            </div>
        `;
    }

    /**
     * Update item data
     */
    updateData(newItemData) {
        this.itemData = newItemData;
        this.originalData = JSON.parse(JSON.stringify(newItemData));
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
        if (document.getElementById('accordion-item-editor-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'accordion-item-editor-styles';
        style.textContent = `
            .accordion-item-editor {
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .accordion-item-editor-container {
                padding: 0;
            }
            
            .editor-header {
                padding: 16px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }
            
            .editor-header h5 {
                margin: 0 0 4px 0;
                font-size: 16px;
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
                margin-bottom: 16px;
            }
            
            .form-group:last-child {
                margin-bottom: 0;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 4px;
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
            
            .editor-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                background: #f8f9fa;
                border-top: 1px solid #e9ecef;
            }
            
            .action-spacer {
                flex: 1;
            }
            
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                border: 1px solid transparent;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .btn-sm {
                padding: 4px 8px;
                font-size: 12px;
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
            
            .btn-outline-danger {
                background: transparent;
                color: #dc3545;
                border-color: #dc3545;
            }
            
            .btn-outline-danger:hover {
                background: #dc3545;
                color: #fff;
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
window.AccordionItemEditor = AccordionItemEditor;
