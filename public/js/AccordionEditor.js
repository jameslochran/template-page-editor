/**
 * AccordionEditor Component
 * Work Order #17: Implement AccordionEditor Component for Managing Accordion Items
 * 
 * This component provides UI controls for managing accordion items within the EditingPanel.
 * It allows users to add, remove, and reorder accordion items with real-time updates.
 */

class AccordionEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.accordionData = options.accordionData || options.componentData || null;
        this.onUpdate = options.onUpdate || (() => {});
        this.onReorder = options.onReorder || (() => {});
        this.onAddItem = options.onAddItem || (() => {});
        this.onRemoveItem = options.onRemoveItem || (() => {});
        this.onClose = options.onClose || (() => {});
        
        this.accordionItemEditors = new Map();
        this.isDragging = false;
        this.draggedElement = null;
        this.dragOverElement = null;
        
        // Debug logging
        console.log('AccordionEditor initialized with data:', this.accordionData);
        
        this.render();
        this.setupEventListeners();
        this.addStyles();
    }

    /**
     * Render the AccordionEditor interface
     */
    render() {
        this.container.innerHTML = '';
        this.container.className = 'accordion-editor';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'accordion-editor-header';
        header.innerHTML = `
            <h3>Accordion Items</h3>
            <button type="button" class="btn btn-primary btn-sm" id="add-accordion-item">
                <i class="icon-plus"></i> Add Item
            </button>
        `;
        this.container.appendChild(header);

        // Create items container
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'accordion-items-container';
        itemsContainer.id = 'accordion-items-list';
        this.container.appendChild(itemsContainer);

        // Render accordion items
        this.renderAccordionItems();

        // Add styles if not already added
        this.addStyles();
    }

    /**
     * Render all accordion items
     */
    renderAccordionItems() {
        const itemsContainer = this.container.querySelector('#accordion-items-list');
        itemsContainer.innerHTML = '';

        if (!this.accordionData || !this.accordionData.data || !this.accordionData.data.items) {
            this.renderEmptyState();
            return;
        }

        const items = this.accordionData.data.items;
        
        if (items.length === 0) {
            this.renderEmptyState();
            return;
        }

        // Sort items by order
        const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

        sortedItems.forEach((item, index) => {
            const itemElement = this.createAccordionItemElement(item, index);
            itemsContainer.appendChild(itemElement);
        });
    }

    /**
     * Create accordion item element
     */
    createAccordionItemElement(item, index) {
        const itemElement = document.createElement('div');
        itemElement.className = 'accordion-item-editor';
        itemElement.draggable = true;
        itemElement.dataset.itemId = item.id;
        itemElement.dataset.order = item.order || index + 1;

        itemElement.innerHTML = `
            <div class="accordion-item-header">
                <div class="drag-handle" title="Drag to reorder">
                    <i class="icon-drag"></i>
                </div>
                <div class="item-info">
                    <span class="item-order">${index + 1}</span>
                    <span class="item-title">${this.escapeHtml(item.header || 'Untitled Item')}</span>
                </div>
                <div class="item-actions">
                    <button type="button" class="btn btn-sm btn-outline-secondary toggle-item" title="Toggle item">
                        <i class="icon-${item.isOpen ? 'chevron-up' : 'chevron-down'}"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-item" title="Remove item">
                        <i class="icon-trash"></i>
                    </button>
                </div>
            </div>
            <div class="accordion-item-content ${item.isOpen ? 'expanded' : 'collapsed'}">
                <div class="item-editor-container" data-item-id="${item.id}">
                    <!-- AccordionItemEditor will be rendered here -->
                </div>
            </div>
        `;

        // Create AccordionItemEditor for this item
        this.createAccordionItemEditor(item, itemElement);

        return itemElement;
    }

    /**
     * Create AccordionItemEditor for a specific item
     */
    createAccordionItemEditor(item, itemElement) {
        const editorContainer = itemElement.querySelector('.item-editor-container');
        
        if (window.AccordionItemEditor) {
            const itemEditor = new window.AccordionItemEditor(editorContainer, {
                itemData: item,
                onHeaderChange: (itemId, newHeader) => {
                    this.updateAccordionItem(itemId, { header: newHeader });
                },
                onContentChange: (itemId, newContent) => {
                    this.updateAccordionItem(itemId, { content: newContent });
                },
                onRemove: (itemId) => {
                    this.removeItem(itemId);
                },
                onUpdate: (updatedItem) => {
                    this.updateAccordionItem(updatedItem.id, updatedItem);
                }
            });
            this.accordionItemEditors.set(item.id, itemEditor);
        } else {
            // Fallback to basic editor if AccordionItemEditor is not available
            this.createFallbackItemEditor(item, editorContainer);
        }
    }

    /**
     * Create fallback item editor
     */
    createFallbackItemEditor(item, container) {
        container.innerHTML = `
            <div class="fallback-item-editor">
                <div class="form-group">
                    <label>Header:</label>
                    <input type="text" class="form-control item-header" value="${this.escapeHtml(item.header || '')}" 
                           data-item-id="${item.id}">
                </div>
                <div class="form-group">
                    <label>Content:</label>
                    <textarea class="form-control item-content" rows="3" data-item-id="${item.id}">${this.escapeHtml(item.content?.data || '')}</textarea>
                </div>
            </div>
        `;
    }

    /**
     * Render empty state when no items exist
     */
    renderEmptyState() {
        const itemsContainer = this.container.querySelector('#accordion-items-list');
        itemsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="icon-accordion"></i>
                </div>
                <div class="empty-state-text">
                    <h4>No accordion items</h4>
                    <p>Click "Add Item" to create your first accordion item.</p>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add item button
        const addButton = this.container.querySelector('#add-accordion-item');
        if (addButton) {
            addButton.addEventListener('click', () => this.addNewItem());
        }

        // Delegate events for item actions
        const itemsContainer = this.container.querySelector('#accordion-items-list');
        if (itemsContainer) {
            itemsContainer.addEventListener('click', (e) => this.handleItemAction(e));
            itemsContainer.addEventListener('dragstart', (e) => this.handleDragStart(e));
            itemsContainer.addEventListener('dragover', (e) => this.handleDragOver(e));
            itemsContainer.addEventListener('drop', (e) => this.handleDrop(e));
            itemsContainer.addEventListener('dragend', (e) => this.handleDragEnd(e));
        }

        // Handle fallback editor changes
        this.container.addEventListener('input', (e) => this.handleFallbackEditorChange(e));
    }

    /**
     * Handle item action clicks
     */
    handleItemAction(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const itemElement = target.closest('.accordion-item-editor');
        if (!itemElement) return;

        const itemId = itemElement.dataset.itemId;

        if (target.classList.contains('toggle-item')) {
            this.toggleItem(itemElement);
        } else if (target.classList.contains('remove-item')) {
            this.removeItem(itemId);
        }
    }

    /**
     * Toggle item expanded/collapsed state
     */
    toggleItem(itemElement) {
        const content = itemElement.querySelector('.accordion-item-content');
        const toggleButton = itemElement.querySelector('.toggle-item i');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            content.classList.add('collapsed');
            toggleButton.className = 'icon-chevron-down';
        } else {
            content.classList.remove('collapsed');
            content.classList.add('expanded');
            toggleButton.className = 'icon-chevron-up';
        }
    }

    /**
     * Add new accordion item
     */
    addNewItem() {
        if (!this.accordionData) {
            console.error('AccordionEditor: No accordion data available');
            return;
        }

        // Ensure data structure exists
        if (!this.accordionData.data) {
            this.accordionData.data = {};
        }
        if (!this.accordionData.data.items) {
            this.accordionData.data.items = [];
        }

        const newItem = {
            id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            header: 'New Accordion Item',
            content: {
                format: 'html',
                data: '<p>Click to edit content</p>',
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            },
            isOpen: false,
            order: this.accordionData.data.items.length + 1
        };

        // Update the accordion data
        this.accordionData.data.items.push(newItem);
        
        // Notify parent of the update
        this.onUpdate(this.accordionData);
    }

    /**
     * Remove accordion item
     */
    removeItem(itemId) {
        if (!this.accordionData || !this.accordionData.data || !this.accordionData.data.items || this.accordionData.data.items.length <= 1) {
            alert('Cannot remove the last accordion item');
            return;
        }

        if (confirm('Are you sure you want to remove this accordion item?')) {
            // Remove the item from the accordion data
            const itemIndex = this.accordionData.data.items.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                this.accordionData.data.items.splice(itemIndex, 1);
                
                // Update order values
                this.accordionData.data.items.forEach((item, index) => {
                    item.order = index + 1;
                });
                
                // Notify parent of the update
                this.onUpdate(this.accordionData);
            }
        }
    }

    /**
     * Update accordion item
     */
    updateAccordionItem(itemId, updatedItem) {
        if (!this.accordionData || !this.accordionData.data || !this.accordionData.data.items) return;

        // Find and update the item
        const itemIndex = this.accordionData.data.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            this.accordionData.data.items[itemIndex] = {
                ...this.accordionData.data.items[itemIndex],
                ...updatedItem
            };
            
            // Notify parent of the update
            this.onUpdate(this.accordionData);
        }
    }

    /**
     * Handle drag start
     */
    handleDragStart(e) {
        if (!e.target.closest('.drag-handle')) return;
        
        this.isDragging = true;
        this.draggedElement = e.target.closest('.accordion-item-editor');
        this.draggedElement.classList.add('dragging');
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.draggedElement.outerHTML);
    }

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const targetElement = e.target.closest('.accordion-item-editor');
        if (targetElement && targetElement !== this.draggedElement) {
            this.dragOverElement = targetElement;
            targetElement.classList.add('drag-over');
        }
    }

    /**
     * Handle drop
     */
    handleDrop(e) {
        e.preventDefault();
        
        if (!this.draggedElement || !this.dragOverElement) return;
        
        const draggedId = this.draggedElement.dataset.itemId;
        const targetId = this.dragOverElement.dataset.itemId;
        
        if (draggedId !== targetId) {
            this.reorderItems(draggedId, targetId);
        }
    }

    /**
     * Handle drag end
     */
    handleDragEnd(e) {
        this.isDragging = false;
        
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }
        
        if (this.dragOverElement) {
            this.dragOverElement.classList.remove('drag-over');
            this.dragOverElement = null;
        }
    }

    /**
     * Reorder items
     */
    reorderItems(draggedId, targetId) {
        if (!this.accordionData || !this.accordionData.data || !this.accordionData.data.items) return;

        const items = [...this.accordionData.data.items];
        const draggedIndex = items.findIndex(item => item.id === draggedId);
        const targetIndex = items.findIndex(item => item.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Remove dragged item and insert at target position
        const draggedItem = items.splice(draggedIndex, 1)[0];
        items.splice(targetIndex, 0, draggedItem);
        
        // Update order values
        items.forEach((item, index) => {
            item.order = index + 1;
        });
        
        // Update the accordion data
        this.accordionData.data.items = items;
        
        // Notify parent of the update
        this.onUpdate(this.accordionData);
    }

    /**
     * Handle fallback editor changes
     */
    handleFallbackEditorChange(e) {
        if (!e.target.matches('.item-header, .item-content')) return;
        
        const itemId = e.target.dataset.itemId;
        const field = e.target.classList.contains('item-header') ? 'header' : 'content';
        const value = e.target.value;
        
        if (field === 'content') {
            this.updateAccordionItem(itemId, {
                content: {
                    format: 'html',
                    data: value,
                    metadata: {
                        version: '1.0',
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString()
                    }
                }
            });
        } else {
            this.updateAccordionItem(itemId, { [field]: value });
        }
    }

    /**
     * Update accordion data
     */
    updateData(newAccordionData) {
        this.accordionData = newAccordionData;
        this.renderAccordionItems();
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
     * Add CSS styles
     */
    addStyles() {
        if (document.getElementById('accordion-editor-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'accordion-editor-styles';
        style.textContent = `
            .accordion-editor {
                padding: 0;
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .accordion-editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }
            
            .accordion-editor-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
            
            .accordion-items-container {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .accordion-item-editor {
                border-bottom: 1px solid #e9ecef;
                transition: all 0.2s ease;
            }
            
            .accordion-item-editor:last-child {
                border-bottom: none;
            }
            
            .accordion-item-editor.dragging {
                opacity: 0.5;
                transform: rotate(2deg);
            }
            
            .accordion-item-editor.drag-over {
                border-top: 2px solid #007bff;
            }
            
            .accordion-item-header {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                background: #fff;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            
            .accordion-item-header:hover {
                background: #f8f9fa;
            }
            
            .drag-handle {
                margin-right: 12px;
                color: #6c757d;
                cursor: grab;
                padding: 4px;
            }
            
            .drag-handle:active {
                cursor: grabbing;
            }
            
            .item-info {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .item-order {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                background: #e9ecef;
                color: #6c757d;
                border-radius: 50%;
                font-size: 12px;
                font-weight: 600;
            }
            
            .item-title {
                font-weight: 500;
                color: #333;
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .item-actions {
                display: flex;
                gap: 4px;
            }
            
            .accordion-item-content {
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
                transition: all 0.3s ease;
                overflow: hidden;
            }
            
            .accordion-item-content.collapsed {
                max-height: 0;
                padding: 0 16px;
            }
            
            .accordion-item-content.expanded {
                max-height: 500px;
                padding: 16px;
            }
            
            .item-editor-container {
                background: #fff;
                border-radius: 6px;
                padding: 16px;
            }
            
            .fallback-item-editor .form-group {
                margin-bottom: 16px;
            }
            
            .fallback-item-editor .form-group:last-child {
                margin-bottom: 0;
            }
            
            .fallback-item-editor label {
                display: block;
                margin-bottom: 4px;
                font-weight: 500;
                color: #333;
            }
            
            .fallback-item-editor .form-control {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 14px;
                transition: border-color 0.2s ease;
            }
            
            .fallback-item-editor .form-control:focus {
                outline: none;
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
            }
            
            .empty-state {
                text-align: center;
                padding: 40px 20px;
                color: #6c757d;
            }
            
            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 16px;
                opacity: 0.5;
            }
            
            .empty-state-text h4 {
                margin: 0 0 8px 0;
                color: #495057;
            }
            
            .empty-state-text p {
                margin: 0;
                font-size: 14px;
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
            
            .btn-primary {
                background: #007bff;
                color: #fff;
                border-color: #007bff;
            }
            
            .btn-primary:hover {
                background: #0056b3;
                border-color: #0056b3;
            }
            
            .btn-outline-secondary {
                background: transparent;
                color: #6c757d;
                border-color: #6c757d;
            }
            
            .btn-outline-secondary:hover {
                background: #6c757d;
                color: #fff;
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
            
            .btn-sm {
                padding: 4px 8px;
                font-size: 12px;
            }
            
            .icon-plus::before { content: '+'; }
            .icon-drag::before { content: '⋮⋮'; }
            .icon-chevron-up::before { content: '▲'; }
            .icon-chevron-down::before { content: '▼'; }
            .icon-trash::before { content: '🗑'; }
            .icon-accordion::before { content: '📋'; }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Destroy the editor
     */
    destroy() {
        this.accordionItemEditors.forEach(editor => {
            if (editor.destroy) {
                editor.destroy();
            }
        });
        this.accordionItemEditors.clear();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other scripts
window.AccordionEditor = AccordionEditor;
