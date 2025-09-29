/**
 * LinkGroupEditor Component - Work Order 27
 * 
 * Provides editing interface for LinkGroupComponents, allowing users to
 * add, remove, modify, and reorder links with real-time preview updates.
 */

class LinkGroupEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.linkGroupData = options.componentData || null;
        this.onUpdate = options.onUpdate || (() => {});
        this.onClose = options.onClose || (() => {});
        
        this.linkEditors = new Map();
        this.isDragging = false;
        this.draggedElement = null;
        this.dragOverElement = null;
        
        // Debug logging
        console.log('LinkGroupEditor initialized with data:', this.linkGroupData);
        
        this.render();
        this.setupEventListeners();
        this.addStyles();
    }

    /**
     * Render the LinkGroupEditor interface
     */
    render() {
        if (!this.linkGroupData) {
            this.container.innerHTML = '<div class="linkgroup-editor-error">No link group data available</div>';
            return;
        }

        const links = this.linkGroupData.data?.links || [];
        
        this.container.innerHTML = `
            <div class="linkgroup-editor">
                <div class="linkgroup-editor-header">
                    <h3>Link Group Editor</h3>
                    <button type="button" class="linkgroup-editor-close" title="Close Editor">
                        <span>×</span>
                    </button>
                </div>
                
                <div class="linkgroup-editor-content">
                    <!-- Title Section -->
                    <div class="linkgroup-editor-section">
                        <label for="linkgroup-title" class="linkgroup-editor-label">
                            Group Title
                        </label>
                        <input 
                            type="text" 
                            id="linkgroup-title" 
                            class="linkgroup-editor-input" 
                            value="${this.escapeHtml(this.linkGroupData.data?.title || '')}"
                            placeholder="Enter link group title..."
                            maxlength="255"
                        >
                        <div class="linkgroup-editor-help">Maximum 255 characters</div>
                    </div>

                    <!-- Links Section -->
                    <div class="linkgroup-editor-section">
                        <div class="linkgroup-editor-links-header">
                            <h4 class="linkgroup-editor-subtitle">Links (${links.length})</h4>
                            <button type="button" class="linkgroup-editor-add-link">
                                <span>+</span> Add Link
                            </button>
                        </div>
                        
                        <div class="linkgroup-editor-links-container" id="links-container">
                            ${links.length === 0 ? '<div class="linkgroup-editor-empty">No links added yet. Click "Add Link" to get started.</div>' : ''}
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="linkgroup-editor-actions">
                        <button type="button" class="linkgroup-editor-save" disabled>
                            Save Changes
                        </button>
                        <button type="button" class="linkgroup-editor-cancel">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Render individual link editors
        this.renderLinkEditors();
    }

    /**
     * Render individual link editors
     */
    renderLinkEditors() {
        const linksContainer = this.container.querySelector('#links-container');
        if (!linksContainer) return;

        const links = this.linkGroupData.data?.links || [];
        
        // Clear existing content
        linksContainer.innerHTML = '';
        
        if (links.length === 0) {
            linksContainer.innerHTML = '<div class="linkgroup-editor-empty">No links added yet. Click "Add Link" to get started.</div>';
            return;
        }

        // Create link editors for each link
        links.forEach((link, index) => {
            const linkEditorContainer = document.createElement('div');
            linkEditorContainer.className = 'link-editor-container';
            linkEditorContainer.setAttribute('data-link-index', index);
            
            if (window.LinkEditor) {
                const linkEditor = new window.LinkEditor(linkEditorContainer, {
                    linkData: link,
                    linkIndex: index,
                    onLinkChange: (linkIndex, updatedLink) => {
                        this.updateLink(linkIndex, updatedLink);
                    },
                    onLinkRemove: (linkIndex) => {
                        this.removeLink(linkIndex);
                    },
                    onLinkMove: (fromIndex, toIndex) => {
                        this.moveLink(fromIndex, toIndex);
                    },
                    onUpdate: (updatedLink) => {
                        this.handleLinkUpdate(updatedLink);
                    }
                });
                
                this.linkEditors.set(link.id, linkEditor);
            } else {
                // Fallback to basic editor if LinkEditor is not available
                this.createFallbackLinkEditor(link, linkEditorContainer, index);
            }
            
            linksContainer.appendChild(linkEditorContainer);
        });
    }

    /**
     * Create fallback link editor
     * @param {Object} link - Link data
     * @param {HTMLElement} container - Container element
     * @param {number} index - Link index
     */
    createFallbackLinkEditor(link, container, index) {
        container.innerHTML = `
            <div class="link-editor-fallback">
                <div class="link-editor-header">
                    <div class="link-editor-title">Link ${index + 1}</div>
                    <button type="button" class="link-editor-remove" data-index="${index}">×</button>
                </div>
                <div class="link-editor-content">
                    <input type="text" value="${this.escapeHtml(link.linkText || '')}" placeholder="Link text..." class="link-editor-input" data-field="linkText" data-index="${index}">
                    <input type="url" value="${this.escapeHtml(link.linkUrl || '')}" placeholder="https://example.com" class="link-editor-input" data-field="linkUrl" data-index="${index}">
                    <select class="link-editor-select" data-field="linkTarget" data-index="${index}">
                        <option value="_self" ${link.linkTarget === '_self' ? 'selected' : ''}>Same Window</option>
                        <option value="_blank" ${link.linkTarget === '_blank' ? 'selected' : ''}>New Window</option>
                    </select>
                </div>
            </div>
        `;

        // Add event listeners for fallback editor
        const inputs = container.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.handleFallbackLinkChange(index, input.dataset.field, input.value);
            });
        });

        const removeBtn = container.querySelector('.link-editor-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeLink(index);
            });
        }
    }

    /**
     * Setup event listeners for the LinkGroupEditor
     */
    setupEventListeners() {
        // Close button
        const closeBtn = this.container.querySelector('.linkgroup-editor-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.handleClose());
        }

        // Title input
        const titleInput = this.container.querySelector('#linkgroup-title');
        if (titleInput) {
            titleInput.addEventListener('input', (e) => this.handleTitleChange(e.target.value));
        }

        // Add link button
        const addLinkBtn = this.container.querySelector('.linkgroup-editor-add-link');
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', () => this.addNewLink());
        }

        // Action buttons
        const saveBtn = this.container.querySelector('.linkgroup-editor-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        const cancelBtn = this.container.querySelector('.linkgroup-editor-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }
    }

    /**
     * Handle title changes
     * @param {string} title - New title
     */
    handleTitleChange(title) {
        if (!this.linkGroupData) return;

        // Update the link group data
        this.linkGroupData.data.title = title;
        
        // Notify parent of the change
        this.onUpdate(this.linkGroupData);
        this.enableSaveButton();
    }

    /**
     * Add new link
     */
    addNewLink() {
        if (!this.linkGroupData) {
            console.error('LinkGroupEditor: No link group data available');
            return;
        }

        // Ensure data structure exists
        if (!this.linkGroupData.data) {
            this.linkGroupData.data = {};
        }
        if (!this.linkGroupData.data.links) {
            this.linkGroupData.data.links = [];
        }

        const newLink = {
            id: 'link-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            linkText: 'New Link',
            linkUrl: '',
            linkTarget: '_self',
            order: this.linkGroupData.data.links.length + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add the new link to the link group data
        this.linkGroupData.data.links.push(newLink);
        
        // Re-render the link editors
        this.renderLinkEditors();
        
        // Notify parent of the update
        this.onUpdate(this.linkGroupData);
        this.enableSaveButton();
    }

    /**
     * Remove link
     * @param {number} linkIndex - Index of link to remove
     */
    removeLink(linkIndex) {
        if (!this.linkGroupData || !this.linkGroupData.data || !this.linkGroupData.data.links) return;

        if (this.linkGroupData.data.links.length <= 1) {
            alert('Cannot remove the last link. A link group must have at least one link.');
            return;
        }

        if (confirm('Are you sure you want to remove this link?')) {
            // Remove the link from the link group data
            this.linkGroupData.data.links.splice(linkIndex, 1);
            
            // Update order values
            this.linkGroupData.data.links.forEach((link, index) => {
                link.order = index + 1;
            });
            
            // Re-render the link editors
            this.renderLinkEditors();
            
            // Notify parent of the update
            this.onUpdate(this.linkGroupData);
            this.enableSaveButton();
        }
    }

    /**
     * Update link
     * @param {number} linkIndex - Index of link to update
     * @param {Object} updatedLink - Updated link data
     */
    updateLink(linkIndex, updatedLink) {
        if (!this.linkGroupData || !this.linkGroupData.data || !this.linkGroupData.data.links) return;

        // Update the link in the link group data
        this.linkGroupData.data.links[linkIndex] = updatedLink;
        
        // Notify parent of the update
        this.onUpdate(this.linkGroupData);
        this.enableSaveButton();
    }

    /**
     * Move link
     * @param {number} fromIndex - Source index
     * @param {number} toIndex - Target index
     */
    moveLink(fromIndex, toIndex) {
        if (!this.linkGroupData || !this.linkGroupData.data || !this.linkGroupData.data.links) return;

        const links = [...this.linkGroupData.data.links];
        const maxIndex = links.length - 1;
        
        // Validate indices
        if (fromIndex < 0 || fromIndex > maxIndex || toIndex < 0 || toIndex > maxIndex) {
            return;
        }
        
        // Remove link from source position and insert at target position
        const movedLink = links.splice(fromIndex, 1)[0];
        links.splice(toIndex, 0, movedLink);
        
        // Update order values
        links.forEach((link, index) => {
            link.order = index + 1;
        });
        
        // Update the link group data
        this.linkGroupData.data.links = links;
        
        // Re-render the link editors
        this.renderLinkEditors();
        
        // Notify parent of the update
        this.onUpdate(this.linkGroupData);
        this.enableSaveButton();
    }

    /**
     * Handle fallback link change
     * @param {number} linkIndex - Link index
     * @param {string} field - Field name
     * @param {string} value - New value
     */
    handleFallbackLinkChange(linkIndex, field, value) {
        if (!this.linkGroupData || !this.linkGroupData.data || !this.linkGroupData.data.links) return;

        // Update the specific field
        this.linkGroupData.data.links[linkIndex][field] = value;
        this.linkGroupData.data.links[linkIndex].updatedAt = new Date().toISOString();
        
        // Notify parent of the update
        this.onUpdate(this.linkGroupData);
        this.enableSaveButton();
    }

    /**
     * Handle link update
     * @param {Object} updatedLink - Updated link data
     */
    handleLinkUpdate(updatedLink) {
        // This method can be used for additional processing if needed
        console.log('Link updated:', updatedLink);
    }

    /**
     * Enable the save button
     */
    enableSaveButton() {
        const saveBtn = this.container.querySelector('.linkgroup-editor-save');
        if (saveBtn) {
            saveBtn.disabled = false;
        }
    }

    /**
     * Handle save action
     */
    handleSave() {
        // Validate all inputs
        if (!this.validateInputs()) {
            return;
        }

        // Emit save event
        this.emitUpdate(this.linkGroupData);
        
        // Disable save button
        const saveBtn = this.container.querySelector('.linkgroup-editor-save');
        if (saveBtn) {
            saveBtn.disabled = true;
        }
    }

    /**
     * Handle cancel action
     */
    handleCancel() {
        this.handleClose();
    }

    /**
     * Handle close action
     */
    handleClose() {
        this.onClose();
    }

    /**
     * Validate all inputs
     * @returns {boolean} True if all inputs are valid
     */
    validateInputs() {
        const links = this.linkGroupData.data?.links || [];
        
        // Validate title
        const titleInput = this.container.querySelector('#linkgroup-title');
        if (titleInput && titleInput.value.length > 255) {
            alert('Group title must be 255 characters or less');
            return false;
        }

        // Validate links
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            
            // Validate link text
            if (!link.linkText || link.linkText.trim().length === 0) {
                alert(`Link ${i + 1}: Link text is required`);
                return false;
            }
            
            if (link.linkText.length > 255) {
                alert(`Link ${i + 1}: Link text must be 255 characters or less`);
                return false;
            }
            
            // Validate link URL
            if (link.linkUrl && link.linkUrl.trim().length > 0) {
                try {
                    new URL(link.linkUrl);
                } catch (e) {
                    alert(`Link ${i + 1}: Please enter a valid URL`);
                    return false;
                }
            }
        }

        return true;
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
     * Add CSS styles for the LinkGroupEditor
     */
    addStyles() {
        if (document.getElementById('linkgroup-editor-styles')) return;

        const style = document.createElement('style');
        style.id = 'linkgroup-editor-styles';
        style.textContent = `
            .linkgroup-editor {
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                max-width: 800px;
                margin: 0 auto;
            }

            .linkgroup-editor-header {
                background: #f8fafc;
                padding: 16px 20px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .linkgroup-editor-header h3 {
                margin: 0;
                color: #2d3748;
                font-size: 18px;
                font-weight: 600;
            }

            .linkgroup-editor-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #718096;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .linkgroup-editor-close:hover {
                background: #e2e8f0;
                color: #2d3748;
            }

            .linkgroup-editor-content {
                padding: 20px;
            }

            .linkgroup-editor-section {
                margin-bottom: 24px;
            }

            .linkgroup-editor-section:last-child {
                margin-bottom: 0;
            }

            .linkgroup-editor-subtitle {
                margin: 0 0 16px 0;
                color: #2d3748;
                font-size: 16px;
                font-weight: 600;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 8px;
            }

            .linkgroup-editor-label {
                display: block;
                margin-bottom: 6px;
                color: #4a5568;
                font-size: 14px;
                font-weight: 500;
            }

            .linkgroup-editor-input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                box-sizing: border-box;
            }

            .linkgroup-editor-input:focus {
                outline: none;
                border-color: #3182ce;
                box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
            }

            .linkgroup-editor-help {
                margin-top: 4px;
                color: #718096;
                font-size: 12px;
            }

            .linkgroup-editor-links-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .linkgroup-editor-add-link {
                background: #3182ce;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .linkgroup-editor-add-link:hover {
                background: #2c5aa0;
            }

            .linkgroup-editor-links-container {
                min-height: 100px;
            }

            .linkgroup-editor-empty {
                text-align: center;
                color: #718096;
                font-style: italic;
                padding: 40px 20px;
                background: #f9fafb;
                border: 2px dashed #d1d5db;
                border-radius: 8px;
            }

            .link-editor-container {
                margin-bottom: 16px;
            }

            .link-editor-container:last-child {
                margin-bottom: 0;
            }

            .linkgroup-editor-actions {
                margin-top: 24px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .linkgroup-editor-save,
            .linkgroup-editor-cancel {
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
            }

            .linkgroup-editor-save {
                background: #3182ce;
                color: white;
            }

            .linkgroup-editor-save:hover:not(:disabled) {
                background: #2c5aa0;
            }

            .linkgroup-editor-save:disabled {
                background: #a0aec0;
                cursor: not-allowed;
            }

            .linkgroup-editor-cancel {
                background: #e2e8f0;
                color: #4a5568;
            }

            .linkgroup-editor-cancel:hover {
                background: #cbd5e0;
            }

            .linkgroup-editor-error {
                background: #fed7d7;
                color: #c53030;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 16px;
                font-size: 14px;
            }
        `;

        document.head.appendChild(style);
    }
}

// Expose LinkGroupEditor globally
window.LinkGroupEditor = LinkGroupEditor;
