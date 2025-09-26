/**
 * Enhanced Page Class for Global State Management
 * Work Order #20: Setup Global State Management for Page Editing
 * 
 * This class provides centralized state management for page editing,
 * including component selection tracking, state change notifications,
 * and real-time preview updates.
 */

class PageStateManager {
    constructor(data = {}) {
        // Initialize page data
        this.id = data.id || this.generateId();
        this.templateId = data.templateId || data.template_id;
        this.components = data.components || [];
        this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
        this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
        
        // State management properties
        this.selectedComponentId = null;
        this.listeners = new Map(); // Event listeners for state changes
        this.isUpdating = false; // Flag to prevent infinite update loops
        
        // Initialize with existing Page functionality if available
        if (window.Page) {
            this.initializeFromPageClass();
        }
    }

    /**
     * Initialize from existing Page class functionality
     */
    initializeFromPageClass() {
        // Copy methods from existing Page class
        const existingPage = new window.Page(this);
        
        // Copy validation methods
        this.validate = existingPage.validate.bind(this);
        this.validateComponents = existingPage.validateComponents.bind(this);
        
        // Copy component management methods
        this.addComponent = existingPage.addComponent.bind(this);
        this.updateComponent = existingPage.updateComponent.bind(this);
        this.removeComponent = existingPage.removeComponent.bind(this);
        this.getComponentById = existingPage.getComponentById.bind(this);
        this.getComponentByOrder = existingPage.getComponentByOrder.bind(this);
        this.getOrderedComponents = existingPage.getOrderedComponents.bind(this);
        this.getComponentsByType = existingPage.getComponentsByType.bind(this);
        this.getNextOrder = existingPage.getNextOrder.bind(this);
        this.reorderComponents = existingPage.reorderComponents.bind(this);
        
        // Copy component-specific methods
        this.getTextComponents = existingPage.getTextComponents.bind(this);
        this.getTextComponentById = existingPage.getTextComponentById.bind(this);
        this.createTextComponent = existingPage.createTextComponent.bind(this);
        this.updateTextComponentContent = existingPage.updateTextComponentContent.bind(this);
        
        this.getAccordionComponents = existingPage.getAccordionComponents.bind(this);
        this.getAccordionComponentById = existingPage.getAccordionComponentById.bind(this);
        this.createAccordionComponent = existingPage.createAccordionComponent.bind(this);
        this.addAccordionItem = existingPage.addAccordionItem.bind(this);
        this.removeAccordionItem = existingPage.removeAccordionItem.bind(this);
        this.updateAccordionItem = existingPage.updateAccordionItem.bind(this);
        this.toggleAccordionItem = existingPage.toggleAccordionItem.bind(this);
        
        this.getCardComponents = existingPage.getCardComponents.bind(this);
        this.getCardComponentById = existingPage.getCardComponentById.bind(this);
        this.createCardComponent = existingPage.createCardComponent.bind(this);
        this.updateCardComponentTitle = existingPage.updateCardComponentTitle.bind(this);
        this.updateCardComponentDescription = existingPage.updateCardComponentDescription.bind(this);
        this.updateCardComponentImage = existingPage.updateCardComponentImage.bind(this);
        this.updateCardComponentLink = existingPage.updateCardComponentLink.bind(this);
        
        this.getBannerComponents = existingPage.getBannerComponents.bind(this);
        this.getBannerComponentById = existingPage.getBannerComponentById.bind(this);
        this.createBannerComponent = existingPage.createBannerComponent.bind(this);
        this.updateBannerComponentHeadline = existingPage.updateBannerComponentHeadline.bind(this);
        this.updateBannerComponentBackgroundImage = existingPage.updateBannerComponentBackgroundImage.bind(this);
        this.updateBannerComponentCallToAction = existingPage.updateBannerComponentCallToAction.bind(this);
        
        this.getLinkGroupComponents = existingPage.getLinkGroupComponents.bind(this);
        this.getLinkGroupComponentById = existingPage.getLinkGroupComponentById.bind(this);
        this.createLinkGroupComponent = existingPage.createLinkGroupComponent.bind(this);
        this.addLinkToGroup = existingPage.addLinkToGroup.bind(this);
        this.removeLinkFromGroup = existingPage.removeLinkFromGroup.bind(this);
        this.updateLinkInGroup = existingPage.updateLinkInGroup.bind(this);
        this.reorderLinksInGroup = existingPage.reorderLinksInGroup.bind(this);
        
        // Copy utility methods
        this.toJSON = existingPage.toJSON.bind(this);
        this.getAllTextContent = existingPage.getAllTextContent.bind(this);
        this.getTextContentStats = existingPage.getTextContentStats.bind(this);
        this.getAccordionContentStats = existingPage.getAccordionContentStats.bind(this);
        this.getCardContentStats = existingPage.getCardContentStats.bind(this);
        this.getBannerContentStats = existingPage.getBannerContentStats.bind(this);
        this.getLinkGroupContentStats = existingPage.getLinkGroupContentStats.bind(this);
        this.getComponentStats = existingPage.getComponentStats.bind(this);
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'page-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // =====================================================
    // COMPONENT SELECTION MANAGEMENT
    // =====================================================

    /**
     * Set the currently selected component
     * @param {string} componentId - Component ID to select
     */
    setSelectedComponent(componentId) {
        if (this.selectedComponentId === componentId) {
            return; // Already selected
        }

        const previousSelection = this.selectedComponentId;
        this.selectedComponentId = componentId;
        
        // Notify listeners of selection change
        this.notifyListeners('componentSelected', {
            componentId: componentId,
            previousComponentId: previousSelection,
            component: componentId ? this.getComponentById(componentId) : null
        });
    }

    /**
     * Clear the currently selected component
     */
    clearSelectedComponent() {
        if (this.selectedComponentId === null) {
            return; // Already cleared
        }

        const previousSelection = this.selectedComponentId;
        this.selectedComponentId = null;
        
        // Notify listeners of selection change
        this.notifyListeners('componentDeselected', {
            componentId: null,
            previousComponentId: previousSelection
        });
    }

    /**
     * Get the currently selected component
     * @returns {Object|null} Selected component or null
     */
    getSelectedComponent() {
        return this.selectedComponentId ? this.getComponentById(this.selectedComponentId) : null;
    }

    /**
     * Check if a component is currently selected
     * @param {string} componentId - Component ID to check
     * @returns {boolean} True if component is selected
     */
    isComponentSelected(componentId) {
        return this.selectedComponentId === componentId;
    }

    // =====================================================
    // ENHANCED COMPONENT MANAGEMENT WITH STATE NOTIFICATIONS
    // =====================================================

    /**
     * Add a component with state notification
     * @param {Object} component - Component object
     * @returns {boolean} Success status
     */
    addComponentWithNotification(component) {
        if (this.isUpdating) return false;
        
        this.isUpdating = true;
        
        try {
            const result = this.addComponent(component);
            if (result) {
                this.updatedAt = new Date().toISOString();
                
                // Notify listeners of component addition
                this.notifyListeners('componentAdded', {
                    component: component,
                    componentId: component.id,
                    totalComponents: this.components.length
                });
            }
            return result;
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Update a component with state notification
     * @param {string} componentId - Component ID
     * @param {Object} updates - Updates to apply
     * @returns {boolean} Success status
     */
    updateComponentWithNotification(componentId, updates) {
        if (this.isUpdating) return false;
        
        this.isUpdating = true;
        
        try {
            const oldComponent = this.getComponentById(componentId);
            const result = this.updateComponent(componentId, updates);
            
            if (result) {
                this.updatedAt = new Date().toISOString();
                const newComponent = this.getComponentById(componentId);
                
                // Notify listeners of component update
                this.notifyListeners('componentUpdated', {
                    componentId: componentId,
                    oldComponent: oldComponent,
                    newComponent: newComponent,
                    updates: updates
                });
            }
            return result;
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Remove a component with state notification
     * @param {string} componentId - Component ID
     * @returns {boolean} Success status
     */
    removeComponentWithNotification(componentId) {
        if (this.isUpdating) return false;
        
        this.isUpdating = true;
        
        try {
            const component = this.getComponentById(componentId);
            const result = this.removeComponent(componentId);
            
            if (result) {
                this.updatedAt = new Date().toISOString();
                
                // Clear selection if the removed component was selected
                if (this.selectedComponentId === componentId) {
                    this.clearSelectedComponent();
                }
                
                // Notify listeners of component removal
                this.notifyListeners('componentRemoved', {
                    componentId: componentId,
                    component: component,
                    totalComponents: this.components.length
                });
            }
            return result;
        } finally {
            this.isUpdating = false;
        }
    }

    // =====================================================
    // ENHANCED COMPONENT-SPECIFIC METHODS WITH NOTIFICATIONS
    // =====================================================

    /**
     * Update text component content with notification
     * @param {string} componentId - Component ID
     * @param {string|Object} content - New content
     * @param {string} format - Content format
     * @returns {boolean} Success status
     */
    updateTextComponentContentWithNotification(componentId, content, format = null) {
        if (this.isUpdating) return false;
        
        this.isUpdating = true;
        
        try {
            const oldComponent = this.getTextComponentById(componentId);
            const result = this.updateTextComponentContent(componentId, content, format);
            
            if (result) {
                this.updatedAt = new Date().toISOString();
                const newComponent = this.getTextComponentById(componentId);
                
                // Notify listeners of text component update
                this.notifyListeners('textComponentUpdated', {
                    componentId: componentId,
                    oldComponent: oldComponent,
                    newComponent: newComponent,
                    content: content,
                    format: format
                });
            }
            return result;
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Add accordion item with notification
     * @param {string} componentId - Component ID
     * @param {Object} itemData - Item data
     * @returns {string} New item ID
     */
    addAccordionItemWithNotification(componentId, itemData = {}) {
        if (this.isUpdating) return null;
        
        this.isUpdating = true;
        
        try {
            const oldComponent = this.getAccordionComponentById(componentId);
            const itemId = this.addAccordionItem(componentId, itemData);
            
            if (itemId) {
                this.updatedAt = new Date().toISOString();
                const newComponent = this.getAccordionComponentById(componentId);
                
                // Notify listeners of accordion item addition
                this.notifyListeners('accordionItemAdded', {
                    componentId: componentId,
                    itemId: itemId,
                    itemData: itemData,
                    oldComponent: oldComponent,
                    newComponent: newComponent
                });
            }
            return itemId;
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Remove accordion item with notification
     * @param {string} componentId - Component ID
     * @param {string} itemId - Item ID
     * @returns {boolean} Success status
     */
    removeAccordionItemWithNotification(componentId, itemId) {
        if (this.isUpdating) return false;
        
        this.isUpdating = true;
        
        try {
            const oldComponent = this.getAccordionComponentById(componentId);
            const result = this.removeAccordionItem(componentId, itemId);
            
            if (result) {
                this.updatedAt = new Date().toISOString();
                const newComponent = this.getAccordionComponentById(componentId);
                
                // Notify listeners of accordion item removal
                this.notifyListeners('accordionItemRemoved', {
                    componentId: componentId,
                    itemId: itemId,
                    oldComponent: oldComponent,
                    newComponent: newComponent
                });
            }
            return result;
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Update card component title with notification
     * @param {string} componentId - Component ID
     * @param {string} title - New title
     * @returns {boolean} Success status
     */
    updateCardTitleWithNotification(componentId, title) {
        if (this.isUpdating) return false;
        
        this.isUpdating = true;
        
        try {
            const oldComponent = this.getCardComponentById(componentId);
            const result = this.updateCardComponentTitle(componentId, title);
            
            if (result) {
                this.updatedAt = new Date().toISOString();
                const newComponent = this.getCardComponentById(componentId);
                
                // Notify listeners of card title update
                this.notifyListeners('cardTitleUpdated', {
                    componentId: componentId,
                    title: title,
                    oldComponent: oldComponent,
                    newComponent: newComponent
                });
            }
            return result;
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Update banner headline with notification
     * @param {string} componentId - Component ID
     * @param {string} headlineText - New headline text
     * @returns {boolean} Success status
     */
    updateBannerHeadlineWithNotification(componentId, headlineText) {
        if (this.isUpdating) return false;
        
        this.isUpdating = true;
        
        try {
            const oldComponent = this.getBannerComponentById(componentId);
            const result = this.updateBannerComponentHeadline(componentId, headlineText);
            
            if (result) {
                this.updatedAt = new Date().toISOString();
                const newComponent = this.getBannerComponentById(componentId);
                
                // Notify listeners of banner headline update
                this.notifyListeners('bannerHeadlineUpdated', {
                    componentId: componentId,
                    headlineText: headlineText,
                    oldComponent: oldComponent,
                    newComponent: newComponent
                });
            }
            return result;
        } finally {
            this.isUpdating = false;
        }
    }

    // =====================================================
    // EVENT SYSTEM FOR STATE CHANGE NOTIFICATIONS
    // =====================================================

    /**
     * Add an event listener
     * @param {string} eventType - Event type
     * @param {Function} callback - Callback function
     */
    addEventListener(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    /**
     * Remove an event listener
     * @param {string} eventType - Event type
     * @param {Function} callback - Callback function
     */
    removeEventListener(eventType, callback) {
        if (this.listeners.has(eventType)) {
            const callbacks = this.listeners.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Notify all listeners of an event
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     */
    notifyListeners(eventType, data) {
        if (this.listeners.has(eventType)) {
            const callbacks = this.listeners.get(eventType);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${eventType}:`, error);
                }
            });
        }
    }

    /**
     * Clear all event listeners
     */
    clearEventListeners() {
        this.listeners.clear();
    }

    // =====================================================
    // UTILITY METHODS
    // =====================================================

    /**
     * Get page state summary
     * @returns {Object} Page state summary
     */
    getStateSummary() {
        return {
            id: this.id,
            templateId: this.templateId,
            componentCount: this.components.length,
            selectedComponentId: this.selectedComponentId,
            selectedComponent: this.getSelectedComponent(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            componentTypes: this.getComponentStats().componentTypes
        };
    }

    /**
     * Create a deep copy of the page state
     * @returns {PageStateManager} Deep copy of the page state
     */
    clone() {
        const clonedData = JSON.parse(JSON.stringify(this.toJSON()));
        return new PageStateManager(clonedData);
    }

    /**
     * Reset page state to initial state
     * @param {Object} data - New page data
     */
    reset(data = {}) {
        this.id = data.id || this.generateId();
        this.templateId = data.templateId || data.template_id;
        this.components = data.components || [];
        this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
        this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
        this.selectedComponentId = null;
        
        // Notify listeners of page reset
        this.notifyListeners('pageReset', {
            pageData: this.toJSON()
        });
    }

    /**
     * Create PageStateManager from JSON
     * @param {Object} json - JSON object
     * @returns {PageStateManager} PageStateManager instance
     */
    static fromJSON(json) {
        return new PageStateManager(json);
    }

    /**
     * Create PageStateManager from existing Page instance
     * @param {Page} page - Existing Page instance
     * @returns {PageStateManager} PageStateManager instance
     */
    static fromPage(page) {
        return new PageStateManager(page.toJSON());
    }
}

// Export for use in other scripts
window.PageStateManager = PageStateManager;
