/**
 * AccordionEditor - Accordion editing component
 * Work Order 16: Implement Component-Specific Editors for Content Types
 * 
 * This editor provides accordion editing capabilities for AccordionComponent
 * with item management, reordering, and content editing functionality.
 */

class AccordionEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.originalData = null;
        this.validationErrors = [];
        this.draggedItem = null;
    }

    /**
     * Render the accordion editor
     */
    render() {
        this.container.innerHTML = '';

        // Get component data with defaults
        const componentData = this.options.componentData || {};
        const data = componentData.data || componentData || this.getDefaultData();

        // Store original data for cancel functionality
        this.originalData = JSON.parse(JSON.stringify(data));

        // Create editor structure
        const editorHTML = `
            <div class="accordion-editor-container">
                <div class="editor-header">
                    <h4>Edit Accordion Component</h4>
                    <p class="editor-description">Manage the title and content of each accordion item.</p>
                </div>
                
                <div class="editor-content">
                    <div class="form-group">
                        <label for="accordion-title">Accordion Title (Optional)</label>
                        <input 
                            type="text" 
                            id="accordion-title" 
                            class="form-control" 
                            placeholder="Enter accordion title"
                            value="${data.title || ''}"
                            maxlength="200"
                        >
                        <small class="form-text text-muted">
                            Optional title that appears above the accordion
                        </small>
                    </div>

                    <div class="form-group">
                        <label>Accordion Items</label>
                        <div class="accordion-items-container" id="accordion-items-container">
                            ${this.renderAccordionItems(data.items || [])}
                        </div>
                        <button type="button" class="btn btn-sm btn-primary" data-action="add-item">
                            <i class="fas fa-plus"></i> Add Item
                        </button>
                    </div>

                    <div class="validation-errors" id="accordion-validation-errors" style="display: none;">
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
        this.setupDragAndDrop();
    }

    /**
     * Render accordion items
     * @param {Array} items - Accordion items
     * @returns {string} HTML string
     */
    renderAccordionItems(items) {
        if (!items || items.length === 0) {
            return `
                <div class="no-items-message">
                    <i class="fas fa-info-circle"></i>
                    <p>No accordion items yet. Click "Add Item" to create your first item.</p>
                </div>
            `;
        }

        return items.map((item, index) => `
            <div class="accordion-item-editor" data-index="${index}" draggable="true">
                <div class="item-header">
                    <div class="item-handle">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="item-title-input">
                        <input 
                            type="text" 
                            class="form-control item-title" 
                            placeholder="Item title"
                            value="${item.title || ''}"
                            data-index="${index}"
                        >
                    </div>
                    <div class="item-actions">
                        <button type="button" class="btn btn-sm btn-outline-danger" data-action="remove-item" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="item-content-editor">
                    <label class="item-content-label">Content</label>
                    <div class="rich-text-editor">
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
                        </div>
                        <div 
                            class="item-content-editor" 
                            contenteditable="true"
                            data-placeholder="Enter item content here..."
                            data-index="${index}"
                        >${item.content?.data || ''}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Title input handler
        const titleInput = this.container.querySelector('#accordion-title');
        if (titleInput) {
            titleInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Item title handlers
        this.container.addEventListener('input', (e) => {
            if (e.target.classList.contains('item-title')) {
                this.handleDataChange();
            }
        });

        // Item content handlers
        this.container.addEventListener('input', (e) => {
            if (e.target.classList.contains('item-content-editor')) {
                this.handleDataChange();
            }
        });

        // Add item button
        const addBtn = this.container.querySelector('[data-action="add-item"]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addItem();
            });
        }

        // Remove item buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="remove-item"]')) {
                const button = e.target.closest('[data-action="remove-item"]');
                const index = parseInt(button.dataset.index);
                this.removeItem(index);
            }
        });

        // Rich text editor toolbar
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('[data-command]');
            if (button) {
                e.preventDefault();
                const command = button.dataset.command;
                this.executeCommand(command, button);
            }
        });

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
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        const container = this.container.querySelector('#accordion-items-container');
        if (!container) return;

        // Drag start
        container.addEventListener('dragstart', (e) => {
            if (e.target.closest('.accordion-item-editor')) {
                this.draggedItem = e.target.closest('.accordion-item-editor');
                this.draggedItem.classList.add('dragging');
            }
        });

        // Drag end
        container.addEventListener('dragend', (e) => {
            if (this.draggedItem) {
                this.draggedItem.classList.remove('dragging');
                this.draggedItem = null;
            }
        });

        // Drag over
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            if (this.draggedItem) {
                if (afterElement == null) {
                    container.appendChild(this.draggedItem);
                } else {
                    container.insertBefore(this.draggedItem, afterElement);
                }
            }
        });

        // Drop
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedItem) {
                this.handleDataChange(); // Update data after reordering
            }
        });
    }

    /**
     * Get element after which to insert dragged item
     * @param {HTMLElement} container - Container element
     * @param {number} y - Y coordinate
     * @returns {HTMLElement|null} Element after which to insert
     */
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.accordion-item-editor:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Execute rich text command
     * @param {string} command - Command to execute
     * @param {HTMLElement} button - Button element
     */
    executeCommand(command, button) {
        // Find the content editor for this item
        const itemEditor = button.closest('.accordion-item-editor');
        const contentEditor = itemEditor.querySelector('.item-content-editor');
        
        if (!contentEditor) return;

        // Focus the editor
        contentEditor.focus();

        // Execute command
        document.execCommand(command, false, null);
        this.handleDataChange();
    }

    /**
     * Add new item
     */
    addItem() {
        const container = this.container.querySelector('#accordion-items-container');
        if (!container) return;

        // Remove no-items message if present
        const noItemsMessage = container.querySelector('.no-items-message');
        if (noItemsMessage) {
            noItemsMessage.remove();
        }

        // Create new item element
        const newIndex = container.querySelectorAll('.accordion-item-editor').length;
        const newItemHTML = `
            <div class="accordion-item-editor" data-index="${newIndex}" draggable="true">
                <div class="item-header">
                    <div class="item-handle">
                        <i class="fas fa-grip-vertical"></i>
                    </div>
                    <div class="item-title-input">
                        <input 
                            type="text" 
                            class="form-control item-title" 
                            placeholder="Item title"
                            value="New Item"
                            data-index="${newIndex}"
                        >
                    </div>
                    <div class="item-actions">
                        <button type="button" class="btn btn-sm btn-outline-danger" data-action="remove-item" data-index="${newIndex}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="item-content-editor">
                    <label class="item-content-label">Content</label>
                    <div class="rich-text-editor">
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
                        </div>
                        <div 
                            class="item-content-editor" 
                            contenteditable="true"
                            data-placeholder="Enter item content here..."
                            data-index="${newIndex}"
                        ><p>Enter content for this item...</p></div>
                    </div>
                </div>
            </div>
        `;

        // Insert new item
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newItemHTML;
        const newItem = tempDiv.firstElementChild;
        container.appendChild(newItem);

        // Focus the title input
        const titleInput = newItem.querySelector('.item-title');
        if (titleInput) {
            titleInput.focus();
            titleInput.select();
        }

        // Update data indices
        this.updateItemIndices();
        this.handleDataChange();
    }

    /**
     * Remove item
     * @param {number} index - Item index to remove
     */
    removeItem(index) {
        const container = this.container.querySelector('#accordion-items-container');
        if (!container) return;

        const item = container.querySelector(`[data-index="${index}"]`);
        if (!item) return;

        // Confirm removal
        if (confirm('Are you sure you want to remove this accordion item?')) {
            item.remove();
            this.updateItemIndices();
            this.handleDataChange();
        }
    }

    /**
     * Update item indices after add/remove/reorder
     */
    updateItemIndices() {
        const container = this.container.querySelector('#accordion-items-container');
        if (!container) return;

        const items = container.querySelectorAll('.accordion-item-editor');
        items.forEach((item, index) => {
            item.dataset.index = index;
            
            // Update input indices
            const titleInput = item.querySelector('.item-title');
            const contentEditor = item.querySelector('.item-content-editor');
            const removeBtn = item.querySelector('[data-action="remove-item"]');
            
            if (titleInput) titleInput.dataset.index = index;
            if (contentEditor) contentEditor.dataset.index = index;
            if (removeBtn) removeBtn.dataset.index = index;
        });
    }

    /**
     * Handle data change
     */
    handleDataChange() {
        const data = this.getCurrentData();
        this.validateData(data);
        this.emitUpdate(data);
    }

    /**
     * Validate data
     * @param {Object} data - Data to validate
     */
    validateData(data) {
        if (!window.ValidationUtils) {
            console.warn('ValidationUtils not available');
            return;
        }

        const validation = window.ValidationUtils.validateAccordionData(data);
        this.validationErrors = validation.errors;
        this.displayValidationErrors();
    }

    /**
     * Display validation errors
     */
    displayValidationErrors() {
        const errorContainer = this.container.querySelector('#accordion-validation-errors');
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
     * Get current data
     * @returns {Object} Current data
     */
    getCurrentData() {
        const titleInput = this.container.querySelector('#accordion-title');
        const container = this.container.querySelector('#accordion-items-container');
        
        const title = titleInput ? titleInput.value : '';
        const items = [];

        if (container) {
            const itemElements = container.querySelectorAll('.accordion-item-editor');
            itemElements.forEach((itemElement, index) => {
                const titleInput = itemElement.querySelector('.item-title');
                const contentEditor = itemElement.querySelector('.item-content-editor');
                
                items.push({
                    title: titleInput ? titleInput.value : '',
                    content: {
                        format: 'html',
                        data: contentEditor ? contentEditor.innerHTML : ''
                    },
                    order: index
                });
            });
        }

        return {
            title: title,
            items: items
        };
    }

    /**
     * Get default data
     * @returns {Object} Default data structure
     */
    getDefaultData() {
        return {
            title: '',
            items: [
                {
                    title: 'Sample Item 1',
                    content: {
                        format: 'html',
                        data: '<p>Content for the first accordion item...</p>'
                    },
                    order: 0
                },
                {
                    title: 'Sample Item 2',
                    content: {
                        format: 'html',
                        data: '<p>Content for the second accordion item...</p>'
                    },
                    order: 1
                }
            ]
        };
    }

    /**
     * Save changes
     */
    save() {
        const data = this.getCurrentData();
        
        // Validate before saving
        if (window.ValidationUtils) {
            const validation = window.ValidationUtils.validateAccordionData(data);
            if (!validation.isValid) {
                this.validationErrors = validation.errors;
                this.displayValidationErrors();
                return;
            }
        }

        // Emit save event
        this.emitUpdate(data);
        
        // Show success feedback
        this.showSuccessMessage('Accordion saved successfully');
    }

    /**
     * Cancel changes
     */
    cancel() {
        // Restore original data
        if (this.originalData) {
            this.options.componentData = this.originalData;
            this.render();
        }

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
        // Clean up event listeners
        this.container.removeEventListener('input', this.handleDataChange);
        this.container.removeEventListener('click', this.handleDataChange);

        super.destroy();
    }
}

// Export the AccordionEditor class
window.AccordionEditor = AccordionEditor;
