/**
 * PageEditor Container Component
 * Work Order #6: Build PageEditor Container Component for Content Editing
 * 
 * This component orchestrates the content editing experience by managing page state
 * and rendering editable components. It serves as the main container for the editing interface.
 */
class PageEditor {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            showEditingPanel: true,
            enableRealTimeUpdates: true,
            autoSave: false,
            ...options
        };
        
        // State management
        this.page = null;
        this.selectedComponentId = null;
        this.isLoading = false;
        this.error = null;
        
        // Component references
        this.editingPanel = null;
        this.canvas = null;
        this.shareButton = null;
        this.sharePageModal = null;
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Initialize the component
        this.init();
    }

    /**
     * Initialize the PageEditor component
     */
    init() {
        if (!this.container) {
            throw new Error(`Container with ID '${this.containerId}' not found`);
        }

        this.setupContainer();
        this.setupEventListeners();
        this.render();
    }

    /**
     * Setup the container structure
     */
    setupContainer() {
        this.container.innerHTML = `
            <div class="page-editor">
                <div class="page-editor-header">
                    <div class="page-editor-title">
                        <h2 id="page-title">Loading...</h2>
                        <div class="page-editor-status" id="page-status"></div>
                    </div>
                    <div class="page-editor-actions">
                        <button class="btn btn-secondary" id="refresh-page" title="Refresh Page">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <div id="share-button-container"></div>
                        <button class="btn btn-primary" id="save-page" title="Save Page" disabled>
                            <i class="fas fa-save"></i>
                            Save
                        </button>
                    </div>
                </div>
                
                <div class="page-editor-content">
                    <div class="page-editor-main">
                        <div class="page-editor-canvas-container">
                            <div class="page-editor-canvas" id="page-editor-canvas">
                                <div class="loading-placeholder" id="loading-placeholder">
                                    <div class="loading-spinner"></div>
                                    <p>Loading page content...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${this.options.showEditingPanel ? `
                    <div class="page-editor-sidebar" id="editing-panel-container">
                        <div class="editing-panel" id="editing-panel">
                            <div class="editing-panel-header">
                                <h3>Component Properties</h3>
                                <button class="btn btn-sm btn-secondary" id="close-editing-panel">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="editing-panel-content" id="editing-panel-content">
                                <div class="no-selection">
                                    <i class="fas fa-mouse-pointer"></i>
                                    <p>Select a component to edit its properties</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="page-editor-error" id="page-editor-error" style="display: none;">
                    <div class="error-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div class="error-message">
                            <h3>Error Loading Page</h3>
                            <p id="error-message"></p>
                        </div>
                        <button class="btn btn-primary" id="retry-loading">Retry</button>
                    </div>
                </div>
            </div>
        `;

        // Cache DOM references
        this.canvas = document.getElementById('page-editor-canvas');
        this.editingPanel = document.getElementById('editing-panel');
        this.errorContainer = document.getElementById('page-editor-error');
        
        // Initialize ShareButton and SharePageModal
        this.initializeShareComponents();
    }

    /**
     * Initialize ShareButton and SharePageModal components
     */
    initializeShareComponents() {
        // Initialize ShareButton
        if (window.ShareButton) {
            this.shareButton = new window.ShareButton({
                onClick: () => {
                    this.handleShareButtonClick();
                }
            });
            
            // Add ShareButton to the container
            const shareContainer = document.getElementById('share-button-container');
            if (shareContainer && this.shareButton.getElement()) {
                shareContainer.appendChild(this.shareButton.getElement());
            }
        } else {
            console.warn('ShareButton component not available');
        }
        
        // Initialize SharePageModal
        if (window.SharePageModal) {
            this.sharePageModal = new window.SharePageModal({
                onClose: () => {
                    this.handleShareModalClose();
                },
                onShare: (shareType, pageId) => {
                    this.handleShareAction(shareType, pageId);
                }
            });
        } else {
            console.warn('SharePageModal component not available');
        }
    }

    /**
     * Handle ShareButton click
     */
    handleShareButtonClick() {
        if (!this.sharePageModal) {
            console.error('SharePageModal not available');
            return;
        }
        
        if (!this.pageId) {
            console.error('No page ID available for sharing');
            return;
        }
        
        // Show the share modal
        this.sharePageModal.show(this.pageId);
    }

    /**
     * Handle SharePageModal close
     */
    handleShareModalClose() {
        // Modal closed, no additional action needed
        console.log('Share modal closed');
    }

    /**
     * Handle share action from modal
     * @param {string} shareType - Type of sharing action
     * @param {string} pageId - Page ID being shared
     */
    handleShareAction(shareType, pageId) {
        console.log(`Share action: ${shareType} for page ${pageId}`);
        
        // Emit share event for other components to handle
        this.emit('pageShare', { shareType, pageId });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-page');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (this.pageId) {
                    this.loadPage(this.pageId);
                }
            });
        }

        // Save button
        const saveBtn = document.getElementById('save-page');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.savePage();
            });
        }

        // Close editing panel
        const closePanelBtn = document.getElementById('close-editing-panel');
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                this.clearSelectedComponent();
            });
        }

        // Retry button
        const retryBtn = document.getElementById('retry-loading');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                if (this.pageId) {
                    this.loadPage(this.pageId);
                }
            });
        }

        // Canvas click to deselect
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => {
                if (e.target === this.canvas) {
                    this.clearSelectedComponent();
                }
            });
        }
    }

    /**
     * Load page data from API
     * @param {string} pageId - Page ID to load
     */
    async loadPage(pageId) {
        if (!pageId) {
            throw new Error('Page ID is required');
        }

        this.pageId = pageId;
        console.log('PageEditor: Setting pageId to:', pageId);
        this.setLoadingState(true);
        this.hideError();

        try {
            const response = await fetch(`/api/pages/${pageId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
            }

            const pageData = await response.json();
            
            // Handle both response formats: direct data or wrapped in success/data structure
            let actualPageData;
            if (pageData.success !== undefined) {
                // Wrapped response format
                if (!pageData.success) {
                    throw new Error(pageData.error || 'Failed to load page data');
                }
                actualPageData = pageData.data;
            } else {
                // Direct response format (current API)
                actualPageData = pageData;
            }

            this.page = this.createPageFromData(actualPageData);
            this.renderPage();
            this.updatePageTitle();
            this.setLoadingState(false);
            
            // Emit page loaded event
            this.emit('pageLoaded', { page: this.page, pageId });

        } catch (error) {
            console.error('Error loading page:', error);
            this.setLoadingState(false);
            this.showError(error.message);
            
            // Emit page load error event
            this.emit('pageLoadError', { error: error.message, pageId });
        }
    }

    /**
     * Create Page object from API data
     * @param {Object} pageData - Page data from API
     * @returns {Page|PageStateManager} Page instance
     */
    createPageFromData(pageData) {
        console.log('PageEditor: Creating page from data:', pageData);
        
        // Use PageStateManager if available, otherwise fallback to Page
        if (window.PageStateManager) {
            console.log('PageEditor: Using PageStateManager');
            const page = new PageStateManager(pageData);
            console.log('PageEditor: Created PageStateManager with', page.components?.length || 0, 'components');
            return page;
        } else if (window.Page) {
            console.log('PageEditor: Using Page class');
            const page = new Page(pageData);
            console.log('PageEditor: Created Page with', page.components?.length || 0, 'components');
            return page;
        } else {
            throw new Error('Neither PageStateManager nor Page class is available');
        }
    }

    /**
     * Render the page content
     */
    renderPage() {
        if (!this.page || !this.canvas) {
            console.log('PageEditor: Cannot render - missing page or canvas');
            return;
        }

        // Clear canvas
        this.canvas.innerHTML = '';

        // Get ordered components
        const components = this.page.getOrderedComponents();
        console.log('PageEditor: Rendering page with', components.length, 'components');
        console.log('PageEditor: Components data:', components);

        if (components.length === 0) {
            console.log('PageEditor: No components found, showing empty page message');
            this.canvas.innerHTML = `
                <div class="empty-page">
                    <i class="fas fa-file-alt"></i>
                    <h3>Empty Page</h3>
                    <p>This page doesn't have any components yet.</p>
                </div>
            `;
            return;
        }

        // Render each component wrapped in EditableComponent
        components.forEach((component, index) => {
            console.log(`PageEditor: Rendering component ${index + 1}:`, component.type, component.id);
            const editableElement = this.createEditableComponent(component);
            this.canvas.appendChild(editableElement);
        });

        console.log('PageEditor: Page rendered successfully with', components.length, 'components');

        // Emit page rendered event
        this.emit('pageRendered', { page: this.page, components });
    }

    /**
     * Create an editable component wrapper
     * @param {Object} component - Component data
     * @returns {HTMLElement} Editable component element
     */
    createEditableComponent(component) {
        const wrapper = document.createElement('div');
        wrapper.className = 'editable-component';
        wrapper.dataset.componentId = component.id;
        wrapper.dataset.componentType = component.type;

        // Create the actual component element
        const componentElement = this.createElementFromComponent(component);
        wrapper.appendChild(componentElement);

        // Add selection overlay
        const overlay = document.createElement('div');
        overlay.className = 'component-overlay';
        overlay.innerHTML = `
            <div class="component-controls">
                <button class="btn btn-sm btn-primary" title="Edit Component">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" title="Delete Component">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        wrapper.appendChild(overlay);

        // Add event listeners
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectComponent(component.id, component);
        });

        // Handle component updates
        if (this.options.enableRealTimeUpdates) {
            this.setupComponentUpdateListener(component.id, wrapper);
        }

        return wrapper;
    }

    /**
     * Create DOM element from component data
     * @param {Object} component - Component data
     * @returns {HTMLElement} DOM element
     */
    createElementFromComponent(component) {
        // This method delegates to the existing implementation in app.js
        // or creates a basic element structure
        const element = document.createElement('div');
        element.className = `component ${component.type.toLowerCase()}`;
        element.dataset.componentId = component.id;

        // Extract data from the component structure
        const data = component.data || {};

        switch (component.type) {
            case 'TextComponent':
                const textContent = data.content?.data || data.content || 'Text Component';
                element.innerHTML = `<div class="text-content">${textContent}</div>`;
                break;
            case 'AccordionComponent':
                element.innerHTML = `
                    <div class="accordion">
                        <div class="accordion-header">${data.title || 'Accordion'}</div>
                        <div class="accordion-content">${data.items?.length || 0} items</div>
                    </div>
                `;
                break;
            case 'CardComponent':
                const cardTitle = data.title || 'Card Title';
                const cardDescription = data.description?.data || data.description || 'Card description';
                const cardImageUrl = data.imageUrl || '';
                const cardAltText = data.altText || '';
                element.innerHTML = `
                    <div class="card">
                        <div class="card-image">${cardImageUrl ? `<img src="${cardImageUrl}" alt="${cardAltText}">` : 'No Image'}</div>
                        <div class="card-content">
                            <h3>${cardTitle}</h3>
                            <p>${cardDescription}</p>
                        </div>
                    </div>
                `;
                break;
            case 'BannerComponent':
                const bannerHeadline = data.headlineText || 'Banner Headline';
                const bannerSubheadline = data.subheadlineText || 'Banner subheadline';
                const bannerBackgroundImage = data.backgroundImageUrl || '';
                element.innerHTML = `
                    <div class="banner" style="background-image: url('${bannerBackgroundImage}')">
                        <div class="banner-content">
                            <h1>${bannerHeadline}</h1>
                            <p>${bannerSubheadline}</p>
                        </div>
                    </div>
                `;
                break;
            case 'LinkGroupComponent':
                element.innerHTML = `
                    <div class="link-group">
                        <h3>${data.title || 'Links'}</h3>
                        <div class="links">${data.links?.length || 0} links</div>
                    </div>
                `;
                break;
            default:
                element.innerHTML = `<div class="unknown-component">${component.type}</div>`;
        }

        return element;
    }

    /**
     * Setup component update listener for real-time updates
     * @param {string} componentId - Component ID
     * @param {HTMLElement} wrapper - Component wrapper element
     */
    setupComponentUpdateListener(componentId, wrapper) {
        // Listen for component updates from the page state
        if (this.page && this.page.addEventListener) {
            this.page.addEventListener('componentUpdated', (data) => {
                if (data.componentId === componentId) {
                    this.updateComponentElement(wrapper, data.component);
                }
            });
        }
    }

    /**
     * Update component element when data changes
     * @param {HTMLElement} wrapper - Component wrapper
     * @param {Object} component - Updated component data
     */
    updateComponentElement(wrapper, component) {
        const componentElement = wrapper.querySelector('.component');
        if (componentElement) {
            const newElement = this.createElementFromComponent(component);
            componentElement.replaceWith(newElement);
        }
    }

    /**
     * Select a component
     * @param {string} componentId - Component ID
     * @param {Object} component - Component data
     */
    selectComponent(componentId, component) {
        // Clear previous selection
        this.clearSelectedComponent();

        // Set new selection
        this.selectedComponentId = componentId;
        
        // Update visual selection
        this.updateComponentSelectionVisuals();
        
        // Show editing panel
        if (this.options.showEditingPanel) {
            this.showEditingPanel(component);
        }

        // Emit selection event
        this.emit('componentSelected', { componentId, component });
    }

    /**
     * Clear component selection
     */
    clearSelectedComponent() {
        if (this.selectedComponentId) {
            const previousId = this.selectedComponentId;
            this.selectedComponentId = null;
            
            // Update visual selection
            this.updateComponentSelectionVisuals();
            
            // Hide editing panel
            if (this.options.showEditingPanel) {
                this.hideEditingPanel();
            }

            // Emit deselection event
            this.emit('componentDeselected', { componentId: previousId });
        }
    }

    /**
     * Update component selection visuals
     */
    updateComponentSelectionVisuals() {
        // Remove previous selection
        document.querySelectorAll('.editable-component.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to current component
        if (this.selectedComponentId) {
            const selectedElement = document.querySelector(`[data-component-id="${this.selectedComponentId}"]`);
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }
    }

    /**
     * Show editing panel with component data
     * @param {Object} component - Component data
     */
    showEditingPanel(component) {
        if (!this.editingPanel) return;

        const content = document.getElementById('editing-panel-content');
        if (!content) return;

        // Create component-specific editor
        const editor = this.createComponentEditor(component);
        content.innerHTML = '';
        content.appendChild(editor);

        // Show the panel
        this.editingPanel.style.display = 'block';
    }

    /**
     * Hide editing panel
     */
    hideEditingPanel() {
        if (!this.editingPanel) return;

        const content = document.getElementById('editing-panel-content');
        if (content) {
            content.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>Select a component to edit its properties</p>
                </div>
            `;
        }

        this.editingPanel.style.display = 'none';
    }

    /**
     * Create component-specific editor
     * @param {Object} component - Component data
     * @returns {HTMLElement} Editor element
     */
    createComponentEditor(component) {
        const editor = document.createElement('div');
        editor.className = 'component-editor';
        
        // Use the EditingPanel system if available
        if (window.EditingPanel) {
            const editingPanel = new window.EditingPanel(editor, {
                componentType: component.type,
                componentData: component,
                onUpdate: (updatedData) => {
                    this.handleComponentUpdate(component.id, updatedData);
                },
                onClose: () => {
                    this.hideEditingPanel();
                }
            });
            editingPanel.render();
        } else {
            // Fallback to basic editor
            editor.innerHTML = `
                <div class="editor-header">
                    <h4>${component.type}</h4>
                    <span class="component-id">ID: ${component.id}</span>
                </div>
                <div class="editor-content">
                    <p>Component editor for ${component.type} will be implemented in separate work orders.</p>
                    <div class="component-preview">
                        <h5>Current Data:</h5>
                        <pre>${JSON.stringify(component, null, 2)}</pre>
                    </div>
                </div>
            `;
        }
        
        return editor;
    }

    /**
     * Handle component update from editor
     * @param {string} componentId - Component ID
     * @param {Object} updatedData - Updated component data
     */
    handleComponentUpdate(componentId, updatedData) {
        if (!this.page || !this.pageStateManager) return;
        
        // Update the component in the page
        const componentIndex = this.page.components.findIndex(c => c.id === componentId);
        if (componentIndex !== -1) {
            this.page.components[componentIndex] = {
                ...this.page.components[componentIndex],
                ...updatedData
            };
            
            // Update the page state
            this.pageStateManager.updatePage(this.page);
            
            // Re-render the component
            this.renderComponent(this.page.components[componentIndex]);
            
            // Emit update event
            this.emit('componentUpdated', { componentId, component: this.page.components[componentIndex] });
        }
    }

    /**
     * Update page title
     */
    updatePageTitle() {
        const titleElement = document.getElementById('page-title');
        if (titleElement && this.page) {
            // Use page ID or template ID as title since the API doesn't provide a title field
            const title = this.page.title || `Page ${this.page.id?.substring(0, 8) || 'Untitled'}`;
            titleElement.textContent = title;
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        const placeholder = document.getElementById('loading-placeholder');
        const saveBtn = document.getElementById('save-page');
        
        if (placeholder) {
            placeholder.style.display = loading ? 'flex' : 'none';
        }
        
        if (saveBtn) {
            saveBtn.disabled = loading || !this.page;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.error = message;
        const errorContainer = this.errorContainer;
        const errorMessage = document.getElementById('error-message');
        
        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.style.display = 'block';
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        this.error = null;
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
        }
    }

    /**
     * Save page
     */
    async savePage() {
        if (!this.page || !this.pageId) {
            throw new Error('No page to save');
        }

        try {
            const response = await fetch(`/api/pages/${this.pageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.page.toJSON())
            });

            if (!response.ok) {
                throw new Error(`Failed to save page: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            // The API returns the page data directly, not wrapped in a success object
            // So we don't need to check for result.success

            // Emit save success event
            this.emit('pageSaved', { page: this.page, pageId: this.pageId });

        } catch (error) {
            console.error('Error saving page:', error);
            this.emit('pageSaveError', { error: error.message, pageId: this.pageId });
            throw error;
        }
    }

    /**
     * Render the component
     */
    render() {
        // Component is already rendered in setupContainer
        // This method can be used for re-rendering if needed
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get current page
     * @returns {Page|PageStateManager|null} Current page
     */
    getPage() {
        return this.page;
    }

    /**
     * Get selected component
     * @returns {Object|null} Selected component
     */
    getSelectedComponent() {
        if (this.selectedComponentId && this.page) {
            return this.page.getComponentById(this.selectedComponentId);
        }
        return null;
    }

    /**
     * Destroy the component
     */
    destroy() {
        // Clean up event listeners
        this.eventListeners.clear();
        
        // Clean up share components
        if (this.shareButton) {
            this.shareButton.destroy();
            this.shareButton = null;
        }
        
        if (this.sharePageModal) {
            this.sharePageModal.destroy();
            this.sharePageModal = null;
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Clear references
        this.page = null;
        this.selectedComponentId = null;
        this.canvas = null;
        this.editingPanel = null;
    }
}

// Export for use in other modules
window.PageEditor = PageEditor;
