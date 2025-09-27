/**
 * TextEditor - Enhanced Rich text editing component with Quill.js
 * Work Order 11: Implement TextEditor Component with Rich Text Editing Capabilities
 * Work Order 16: Implement Component-Specific Editors for Content Types
 * 
 * This editor provides professional rich text editing capabilities for TextComponent
 * using Quill.js with real-time updates and validation.
 */

class TextEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.isEditing = false;
        this.originalContent = null;
        this.validationErrors = [];
        this.quill = null;
        this.isQuillReady = false;
        this.quillRetryCount = 0;
        this.maxQuillRetries = 50; // 5 seconds max wait time
    }

    /**
     * Render the text editor with Quill.js
     */
    render() {
        this.container.innerHTML = '';

        // Get component data with defaults
        const componentData = this.options.componentData || {};
        const content = componentData.data || componentData.content || this.getDefaultContent();

        // Store original content for cancel functionality
        this.originalContent = JSON.parse(JSON.stringify(content));

        // Create editor structure with Quill.js
        const editorHTML = `
            <div class="text-editor-container">
                <div class="editor-header">
                    <h4>Edit Text Component</h4>
                    <p class="editor-description">Modify the content of your text block using the professional rich text editor below.</p>
                </div>
                
                <div class="editor-content">
                    <div class="form-group">
                        <label for="text-format">Content Format</label>
                        <select id="text-format" class="form-control">
                            <option value="html" ${content.format === 'html' ? 'selected' : ''}>HTML</option>
                            <option value="markdown" ${content.format === 'markdown' ? 'selected' : ''}>Markdown</option>
                            <option value="plain" ${content.format === 'plain' ? 'selected' : ''}>Plain Text</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="text-content">Content</label>
                        <div class="quill-editor-container">
                            <div id="quill-editor" class="quill-editor"></div>
                        </div>
                        <div class="editor-help">
                            <small class="text-muted">
                                <i class="fas fa-info-circle"></i>
                                Use the toolbar above to format your text with professional rich text editing capabilities.
                            </small>
                        </div>
                    </div>

                    <div class="validation-errors" id="text-validation-errors" style="display: none;">
                        <!-- Validation errors will be displayed here -->
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
     * Initialize Quill.js editor
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

        console.log('Quill.js loaded successfully, initializing editor...');
        
        const quillContainer = this.container.querySelector('#quill-editor');
        if (!quillContainer) {
            console.error('Quill editor container not found');
            return;
        }

        // Configure Quill with enhanced toolbar
        const toolbarOptions = [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean']
        ];

        // Initialize Quill
        this.quill = new Quill(quillContainer, {
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions
            },
            placeholder: 'Enter your text content here...'
        });

        // Set initial content
        const content = this.originalContent;
        if (content && content.data) {
            this.quill.root.innerHTML = content.data;
        }

        // Setup Quill event listeners
        this.quill.on('text-change', () => {
            this.handleContentChange();
        });

        this.quill.on('selection-change', (range) => {
            this.isEditing = range !== null;
        });

        this.isQuillReady = true;
    }

    /**
     * Initialize fallback editor if Quill is not available
     */
    initializeFallbackEditor() {
        const quillContainer = this.container.querySelector('#quill-editor');
        if (quillContainer) {
            quillContainer.innerHTML = `
                <div class="fallback-editor">
                    <div class="editor-toolbar">
                        <button type="button" class="btn btn-sm" data-command="bold" title="Bold">
                            <i class="fas fa-bold"></i>
                        </button>
                        <button type="button" class="btn btn-sm" data-command="italic" title="Italic">
                            <i class="fas fa-italic"></i>
                        </button>
                        <button type="button" class="btn btn-sm" data-command="underline" title="Underline">
                            <i class="fas fa-underline"></i>
                        </button>
                        <div class="toolbar-separator"></div>
                        <button type="button" class="btn btn-sm" data-command="insertUnorderedList" title="Bullet List">
                            <i class="fas fa-list-ul"></i>
                        </button>
                        <button type="button" class="btn btn-sm" data-command="insertOrderedList" title="Numbered List">
                            <i class="fas fa-list-ol"></i>
                        </button>
                        <div class="toolbar-separator"></div>
                        <button type="button" class="btn btn-sm" data-command="createLink" title="Insert Link">
                            <i class="fas fa-link"></i>
                        </button>
                    </div>
                    <div 
                        class="fallback-content-editor" 
                        contenteditable="true"
                        data-placeholder="Enter your text content here..."
                    >${this.originalContent?.data || ''}</div>
                </div>
            `;
            this.setupFallbackEditor();
        }
    }

    /**
     * Setup fallback editor event listeners
     */
    setupFallbackEditor() {
        const toolbar = this.container.querySelector('.editor-toolbar');
        if (toolbar) {
            toolbar.addEventListener('click', (e) => {
                const button = e.target.closest('[data-command]');
                if (!button) return;

                e.preventDefault();
                const command = button.dataset.command;
                this.executeFallbackCommand(command);
            });
        }

        const contentEditor = this.container.querySelector('.fallback-content-editor');
        if (contentEditor) {
            contentEditor.addEventListener('input', () => {
                this.handleContentChange();
            });
        }
    }

    /**
     * Execute fallback editor command
     */
    executeFallbackCommand(command) {
        const contentEditor = this.container.querySelector('.fallback-content-editor');
        if (!contentEditor) return;

        contentEditor.focus();

        if (command === 'createLink') {
            const url = prompt('Enter the URL:');
            if (url) {
                document.execCommand('createLink', false, url);
            }
        } else {
            document.execCommand(command, false, null);
        }
        
        this.handleContentChange();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Format change handler
        const formatSelect = this.container.querySelector('#text-format');
        if (formatSelect) {
            formatSelect.addEventListener('change', (e) => {
                this.handleFormatChange(e.target.value);
            });
        }

        // Action buttons
        const cancelBtn = this.container.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancel();
            });
        }

        const saveBtn = this.container.querySelector('[data-action="save"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.save();
            });
        }
    }


    /**
     * Handle format change
     * @param {string} format - New format
     */
    handleFormatChange(format) {
        const contentEditor = this.container.querySelector('#text-content');
        if (!contentEditor) return;

        // Update the content based on format
        const currentContent = contentEditor.innerHTML;
        
        // For now, we'll keep the same content but update the format
        // In a full implementation, you might want to convert between formats
        this.handleContentChange();
    }

    /**
     * Handle content change
     */
    handleContentChange() {
        const formatSelect = this.container.querySelector('#text-format');
        if (!formatSelect) return;

        let contentData = '';
        
        if (this.isQuillReady && this.quill) {
            // Get content from Quill editor
            contentData = this.quill.root.innerHTML;
        } else {
            // Get content from fallback editor
            const fallbackEditor = this.container.querySelector('.fallback-content-editor');
            if (fallbackEditor) {
                contentData = fallbackEditor.innerHTML;
            }
        }

        const content = {
            format: formatSelect.value,
            data: contentData
        };

        // Validate content
        this.validateContent(content);

        // Emit update event for real-time preview
        this.emitUpdate(content);
    }

    /**
     * Validate content
     * @param {Object} content - Content to validate
     */
    validateContent(content) {
        if (!window.ValidationUtils) {
            console.warn('ValidationUtils not available');
            return;
        }

        const validation = window.ValidationUtils.validateTextContent(content);
        this.validationErrors = validation.errors;
        this.displayValidationErrors();
    }

    /**
     * Display validation errors
     */
    displayValidationErrors() {
        const errorContainer = this.container.querySelector('#text-validation-errors');
        if (!errorContainer) return;

        if (this.validationErrors.length === 0) {
            errorContainer.style.display = 'none';
            errorContainer.innerHTML = '';
            return;
        }

        const errorHTML = this.validationErrors.map(error => `
            <div class="validation-error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${error.message}</span>
            </div>
        `).join('');

        errorContainer.innerHTML = errorHTML;
        errorContainer.style.display = 'block';
    }

    /**
     * Get current content data
     * @returns {Object} Current content data
     */
    getCurrentContent() {
        const formatSelect = this.container.querySelector('#text-format');
        if (!formatSelect) {
            return this.getDefaultContent();
        }

        let contentData = '';
        
        if (this.isQuillReady && this.quill) {
            // Get content from Quill editor
            contentData = this.quill.root.innerHTML;
        } else {
            // Get content from fallback editor
            const fallbackEditor = this.container.querySelector('.fallback-content-editor');
            if (fallbackEditor) {
                contentData = fallbackEditor.innerHTML;
            }
        }

        return {
            format: formatSelect.value,
            data: contentData
        };
    }

    /**
     * Get default content
     * @returns {Object} Default content structure
     */
    getDefaultContent() {
        return {
            format: 'html',
            data: '<p>Enter your text content here...</p>',
            metadata: {
                version: '1.0',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        };
    }

    /**
     * Save changes
     */
    save() {
        const content = this.getCurrentContent();
        
        // Validate before saving
        if (window.ValidationUtils) {
            const validation = window.ValidationUtils.validateTextContent(content);
            if (!validation.isValid) {
                this.validationErrors = validation.errors;
                this.displayValidationErrors();
                return;
            }
        }

        // Update metadata
        content.metadata = {
            version: '1.0',
            created: this.originalContent.metadata?.created || new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        // Emit save event
        this.emitUpdate(content);
        
        // Show success feedback
        this.showSuccessMessage('Text content saved successfully');
    }

    /**
     * Cancel changes
     */
    cancel() {
        // Restore original content
        const formatSelect = this.container.querySelector('#text-format');
        
        if (formatSelect && this.originalContent) {
            formatSelect.value = this.originalContent.format || 'html';
            
            if (this.isQuillReady && this.quill) {
                // Restore Quill editor content
                this.quill.root.innerHTML = this.originalContent.data || '';
            } else {
                // Restore fallback editor content
                const fallbackEditor = this.container.querySelector('.fallback-content-editor');
                if (fallbackEditor) {
                    fallbackEditor.innerHTML = this.originalContent.data || '';
                }
            }
        }

        // Clear validation errors
        this.validationErrors = [];
        this.displayValidationErrors();

        // Emit cancel event
        this.emitClose();
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(successDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    /**
     * Update editor with new data
     * @param {Object} newData - New component data
     */
    update(newData) {
        this.options.componentData = newData;
        this.render();
    }

    /**
     * Destroy the editor
     */
    destroy() {
        // Clean up Quill instance
        if (this.quill) {
            this.quill = null;
        }
        
        this.isQuillReady = false;

        super.destroy();
    }
}

// Export the TextEditor class
window.TextEditor = TextEditor;
