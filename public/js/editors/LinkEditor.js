/**
 * LinkEditor Component - Work Order 27
 * 
 * Provides editing interface for individual links within a LinkGroupComponent.
 * Handles link text, URL, target, and removal functionality.
 */

class LinkEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.linkData = options.linkData || null;
        this.linkIndex = options.linkIndex || 0;
        this.onLinkChange = options.onLinkChange || (() => {});
        this.onLinkRemove = options.onLinkRemove || (() => {});
        this.onLinkMove = options.onLinkMove || (() => {});
        this.onUpdate = options.onUpdate || (() => {});
        
        this.validationErrors = [];
        this.isEditing = false;
        
        // Debug logging
        console.log('LinkEditor initialized with data:', this.linkData);
        
        this.render();
        this.setupEventListeners();
        this.addStyles();
    }

    /**
     * Render the LinkEditor interface
     */
    render() {
        if (!this.linkData) {
            this.container.innerHTML = '<div class="link-editor-error">No link data available</div>';
            return;
        }

        this.container.innerHTML = `
            <div class="link-editor" data-link-id="${this.linkData.id}">
                <div class="link-editor-header">
                    <div class="link-editor-drag-handle" title="Drag to reorder">
                        <span class="drag-icon">⋮⋮</span>
                    </div>
                    <div class="link-editor-title">Link ${this.linkIndex + 1}</div>
                    <div class="link-editor-controls">
                        <button type="button" class="link-editor-move-up" title="Move Up" ${this.linkIndex === 0 ? 'disabled' : ''}>
                            <span>↑</span>
                        </button>
                        <button type="button" class="link-editor-move-down" title="Move Down">
                            <span>↓</span>
                        </button>
                        <button type="button" class="link-editor-remove" title="Remove Link">
                            <span>×</span>
                        </button>
                    </div>
                </div>
                
                <div class="link-editor-content">
                    <div class="link-editor-field">
                        <label for="link-text-${this.linkData.id}" class="link-editor-label">
                            Link Text
                        </label>
                        <input 
                            type="text" 
                            id="link-text-${this.linkData.id}" 
                            class="link-editor-input" 
                            value="${this.escapeHtml(this.linkData.linkText || '')}"
                            placeholder="Enter link text..."
                            maxlength="255"
                        >
                        <div class="link-editor-help">Maximum 255 characters</div>
                    </div>

                    <div class="link-editor-field">
                        <label for="link-url-${this.linkData.id}" class="link-editor-label">
                            Link URL
                        </label>
                        <input 
                            type="url" 
                            id="link-url-${this.linkData.id}" 
                            class="link-editor-input" 
                            value="${this.escapeHtml(this.linkData.linkUrl || '')}"
                            placeholder="https://example.com"
                        >
                        <div class="link-editor-help">Enter a valid URL</div>
                        <div id="link-url-error-${this.linkData.id}" class="link-editor-error" style="display: none;"></div>
                    </div>

                    <div class="link-editor-field">
                        <label for="link-target-${this.linkData.id}" class="link-editor-label">
                            Link Target
                        </label>
                        <select id="link-target-${this.linkData.id}" class="link-editor-select">
                            <option value="_self" ${this.linkData.linkTarget === '_self' ? 'selected' : ''}>Same Window</option>
                            <option value="_blank" ${this.linkData.linkTarget === '_blank' ? 'selected' : ''}>New Window</option>
                        </select>
                        <div class="link-editor-help">Choose how the link opens</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for the LinkEditor
     */
    setupEventListeners() {
        // Link text input
        const textInput = this.container.querySelector(`#link-text-${this.linkData.id}`);
        if (textInput) {
            textInput.addEventListener('input', (e) => this.handleLinkChange());
        }

        // Link URL input
        const urlInput = this.container.querySelector(`#link-url-${this.linkData.id}`);
        if (urlInput) {
            urlInput.addEventListener('input', (e) => this.handleLinkChange());
            urlInput.addEventListener('blur', (e) => this.validateUrl(e.target.value));
        }

        // Link target select
        const targetSelect = this.container.querySelector(`#link-target-${this.linkData.id}`);
        if (targetSelect) {
            targetSelect.addEventListener('change', (e) => this.handleLinkChange());
        }

        // Remove button
        const removeBtn = this.container.querySelector('.link-editor-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.handleRemove());
        }

        // Move up button
        const moveUpBtn = this.container.querySelector('.link-editor-move-up');
        if (moveUpBtn) {
            moveUpBtn.addEventListener('click', () => this.handleMoveUp());
        }

        // Move down button
        const moveDownBtn = this.container.querySelector('.link-editor-move-down');
        if (moveDownBtn) {
            moveDownBtn.addEventListener('click', () => this.handleMoveDown());
        }

        // Drag handle
        const dragHandle = this.container.querySelector('.link-editor-drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', (e) => this.handleDragStart(e));
        }
    }

    /**
     * Handle link data changes
     */
    handleLinkChange() {
        if (!this.linkData) return;

        const textInput = this.container.querySelector(`#link-text-${this.linkData.id}`);
        const urlInput = this.container.querySelector(`#link-url-${this.linkData.id}`);
        const targetSelect = this.container.querySelector(`#link-target-${this.linkData.id}`);

        if (!textInput || !urlInput || !targetSelect) return;

        const updatedLink = {
            ...this.linkData,
            linkText: textInput.value,
            linkUrl: urlInput.value,
            linkTarget: targetSelect.value,
            updatedAt: new Date().toISOString()
        };

        // Update the link data
        this.linkData = updatedLink;
        
        // Notify parent of the change
        this.onLinkChange(this.linkIndex, updatedLink);
        this.onUpdate(updatedLink);
    }

    /**
     * Handle link removal
     */
    handleRemove() {
        if (confirm('Are you sure you want to remove this link?')) {
            this.onLinkRemove(this.linkIndex);
        }
    }

    /**
     * Handle move up
     */
    handleMoveUp() {
        if (this.linkIndex > 0) {
            this.onLinkMove(this.linkIndex, this.linkIndex - 1);
        }
    }

    /**
     * Handle move down
     */
    handleMoveDown() {
        this.onLinkMove(this.linkIndex, this.linkIndex + 1);
    }

    /**
     * Handle drag start
     * @param {Event} e - Mouse event
     */
    handleDragStart(e) {
        e.preventDefault();
        // Drag functionality can be implemented here if needed
        console.log('Drag start for link:', this.linkData.id);
    }

    /**
     * Validate URL input
     * @param {string} url - URL to validate
     */
    validateUrl(url) {
        const errorElement = this.container.querySelector(`#link-url-error-${this.linkData.id}`);
        if (!errorElement) return;

        if (!url) {
            this.hideValidationError();
            return;
        }

        try {
            new URL(url);
            this.hideValidationError();
        } catch (e) {
            this.showValidationError('Please enter a valid URL (e.g., https://example.com)');
        }
    }

    /**
     * Show validation error message
     * @param {string} message - Error message to show
     */
    showValidationError(message) {
        const errorElement = this.container.querySelector(`#link-url-error-${this.linkData.id}`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Hide validation error message
     */
    hideValidationError() {
        const errorElement = this.container.querySelector(`#link-url-error-${this.linkData.id}`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Update link index (for reordering)
     * @param {number} newIndex - New index position
     */
    updateIndex(newIndex) {
        this.linkIndex = newIndex;
        
        // Update the title
        const titleElement = this.container.querySelector('.link-editor-title');
        if (titleElement) {
            titleElement.textContent = `Link ${newIndex + 1}`;
        }

        // Update move up button state
        const moveUpBtn = this.container.querySelector('.link-editor-move-up');
        if (moveUpBtn) {
            moveUpBtn.disabled = newIndex === 0;
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add CSS styles for the LinkEditor
     */
    addStyles() {
        if (document.getElementById('link-editor-styles')) return;

        const style = document.createElement('style');
        style.id = 'link-editor-styles';
        style.textContent = `
            .link-editor {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                margin-bottom: 16px;
                overflow: hidden;
                transition: all 0.2s ease;
            }

            .link-editor:hover {
                border-color: #cbd5e0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .link-editor-header {
                background: #f8fafc;
                padding: 12px 16px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .link-editor-drag-handle {
                cursor: grab;
                color: #718096;
                font-size: 16px;
                user-select: none;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .link-editor-drag-handle:hover {
                background: #e2e8f0;
                color: #4a5568;
            }

            .link-editor-drag-handle:active {
                cursor: grabbing;
            }

            .link-editor-title {
                flex: 1;
                font-weight: 600;
                color: #2d3748;
                font-size: 14px;
            }

            .link-editor-controls {
                display: flex;
                gap: 4px;
            }

            .link-editor-move-up,
            .link-editor-move-down,
            .link-editor-remove {
                background: none;
                border: none;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: #718096;
                transition: all 0.2s ease;
            }

            .link-editor-move-up:hover,
            .link-editor-move-down:hover {
                background: #e2e8f0;
                color: #4a5568;
            }

            .link-editor-remove:hover {
                background: #fed7d7;
                color: #c53030;
            }

            .link-editor-move-up:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .link-editor-content {
                padding: 16px;
            }

            .link-editor-field {
                margin-bottom: 16px;
            }

            .link-editor-field:last-child {
                margin-bottom: 0;
            }

            .link-editor-label {
                display: block;
                margin-bottom: 6px;
                color: #4a5568;
                font-size: 14px;
                font-weight: 500;
            }

            .link-editor-input,
            .link-editor-select {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                box-sizing: border-box;
            }

            .link-editor-input:focus,
            .link-editor-select:focus {
                outline: none;
                border-color: #3182ce;
                box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
            }

            .link-editor-help {
                margin-top: 4px;
                color: #718096;
                font-size: 12px;
            }

            .link-editor-error {
                margin-top: 4px;
                color: #e53e3e;
                font-size: 12px;
                font-weight: 500;
            }

            .link-editor-error {
                background: #fed7d7;
                color: #c53030;
                padding: 8px 12px;
                border-radius: 4px;
                margin-top: 8px;
                font-size: 12px;
            }
        `;

        document.head.appendChild(style);
    }
}

// Expose LinkEditor globally
window.LinkEditor = LinkEditor;
