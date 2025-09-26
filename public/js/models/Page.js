/**
 * Page Model - Client Side
 * Work Order #8: Implement Page Data Model Structure
 * 
 * This model provides structured data management for pages with components,
 * including TextComponent integration for rich text content.
 */

class Page {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.templateId = data.templateId || data.template_id;
        this.components = data.components || [];
        this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
        this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'page-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Validate the page data structure
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Validate templateId
        if (!this.templateId) {
            errors.push('templateId is required');
        }

        // Validate components array
        if (!Array.isArray(this.components)) {
            errors.push('components must be an array');
        } else {
            const componentValidation = this.validateComponents(this.components);
            if (!componentValidation.isValid) {
                errors.push(...componentValidation.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate components array structure
     * @param {Array} components - Array of component objects
     * @returns {Object} Validation result
     */
    validateComponents(components) {
        const errors = [];
        
        if (!Array.isArray(components)) {
            return { isValid: false, errors: ['Components must be an array'] };
        }

        // Check for empty array (valid)
        if (components.length === 0) {
            return { isValid: true, errors: [] };
        }

        const componentIds = new Set();
        const componentOrders = new Set();
        const validComponentTypes = [
            'TextComponent',
            'ImageComponent', 
            'BannerComponent',
            'ButtonComponent',
            'ContainerComponent',
            'CardComponent',
            'AccordionComponent',
            'LinkGroupComponent'
        ];

        components.forEach((component, index) => {
            // Validate component is an object
            if (typeof component !== 'object' || component === null) {
                errors.push(`Component at index ${index} must be an object`);
                return;
            }

            // Validate required fields
            const requiredFields = ['id', 'type', 'data', 'order'];
            requiredFields.forEach(field => {
                if (!(field in component)) {
                    errors.push(`Component at index ${index} missing required field: ${field}`);
                }
            });

            // Validate field types
            if (component.id !== undefined && typeof component.id !== 'string') {
                errors.push(`Component at index ${index}: id must be a string`);
            }
            
            if (component.type !== undefined && typeof component.type !== 'string') {
                errors.push(`Component at index ${index}: type must be a string`);
            }
            
            if (component.data !== undefined && typeof component.data !== 'object') {
                errors.push(`Component at index ${index}: data must be an object`);
            }
            
            if (component.order !== undefined && typeof component.order !== 'number') {
                errors.push(`Component at index ${index}: order must be a number`);
            }

            // Validate component type is supported
            if (component.type && !validComponentTypes.includes(component.type)) {
                errors.push(`Component at index ${index}: unsupported component type '${component.type}'`);
            }

            // Check for duplicate IDs
            if (component.id) {
                if (componentIds.has(component.id)) {
                    errors.push(`Duplicate component ID found: '${component.id}'`);
                } else {
                    componentIds.add(component.id);
                }
            }

            // Check for duplicate orders
            if (typeof component.order === 'number') {
                if (componentOrders.has(component.order)) {
                    errors.push(`Duplicate component order found: ${component.order}`);
                } else {
                    componentOrders.add(component.order);
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Add a component to the page
     * @param {Object} component - Component object with id, type, data, and order
     * @returns {boolean} Success status
     */
    addComponent(component) {
        const validation = this.validateComponents([component]);
        if (!validation.isValid) {
            throw new Error(`Invalid component: ${validation.errors.join(', ')}`);
        }

        // Check for duplicate ID
        const existingComponent = this.getComponentById(component.id);
        if (existingComponent) {
            throw new Error(`Component with ID '${component.id}' already exists`);
        }

        // Check for duplicate order
        const existingOrder = this.getComponentByOrder(component.order);
        if (existingOrder) {
            throw new Error(`Component with order ${component.order} already exists`);
        }

        this.components.push(component);
        this.updatedAt = new Date().toISOString();
        return true;
    }

    /**
     * Update a component by ID
     * @param {string} componentId - Component ID to update
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    updateComponent(componentId, updates) {
        const component = this.getComponentById(componentId);
        if (!component) {
            throw new Error(`Component with ID '${componentId}' not found`);
        }

        // Create updated component
        const updatedComponent = { ...component, ...updates };
        
        // Validate updated component
        const validation = this.validateComponents([updatedComponent]);
        if (!validation.isValid) {
            throw new Error(`Invalid component update: ${validation.errors.join(', ')}`);
        }

        // Check for duplicate order if order is being updated
        if (updates.order !== undefined && updates.order !== component.order) {
            const existingOrder = this.getComponentByOrder(updates.order);
            if (existingOrder && existingOrder.id !== componentId) {
                throw new Error(`Component with order ${updates.order} already exists`);
            }
        }

        // Update the component
        const index = this.components.findIndex(c => c.id === componentId);
        this.components[index] = updatedComponent;
        this.updatedAt = new Date().toISOString();
        return true;
    }

    /**
     * Remove a component by ID
     * @param {string} componentId - Component ID to remove
     * @returns {boolean} Success status
     */
    removeComponent(componentId) {
        const index = this.components.findIndex(c => c.id === componentId);
        if (index === -1) {
            throw new Error(`Component with ID '${componentId}' not found`);
        }

        this.components.splice(index, 1);
        this.updatedAt = new Date().toISOString();
        return true;
    }

    /**
     * Get component by ID
     * @param {string} componentId - Component ID
     * @returns {Object|null} Component object or null if not found
     */
    getComponentById(componentId) {
        return this.components.find(c => c.id === componentId) || null;
    }

    /**
     * Get component by order
     * @param {number} order - Component order
     * @returns {Object|null} Component object or null if not found
     */
    getComponentByOrder(order) {
        return this.components.find(c => c.order === order) || null;
    }

    /**
     * Get components ordered by their order field
     * @returns {Array} Sorted components array
     */
    getOrderedComponents() {
        return [...this.components].sort((a, b) => a.order - b.order);
    }

    /**
     * Get components by type
     * @param {string} type - Component type
     * @returns {Array} Components of specified type
     */
    getComponentsByType(type) {
        return this.components.filter(c => c.type === type);
    }

    /**
     * Get all TextComponents on the page
     * @returns {Array} Array of TextComponent instances
     */
    getTextComponents() {
        return this.components
            .filter(c => c.type === 'TextComponent')
            .map(c => new TextComponent(c));
    }

    /**
     * Get TextComponent by ID
     * @param {string} componentId - Component ID
     * @returns {TextComponent|null} TextComponent instance or null
     */
    getTextComponentById(componentId) {
        const component = this.getComponentById(componentId);
        if (component && component.type === 'TextComponent') {
            return new TextComponent(component);
        }
        return null;
    }

    /**
     * Create a new TextComponent and add it to the page
     * @param {Object} options - TextComponent options
     * @param {string} options.content - Initial content (optional)
     * @param {string} options.format - Content format (optional, defaults to 'html')
     * @param {number} options.order - Component order (optional)
     * @returns {TextComponent} Created TextComponent instance
     */
    createTextComponent(options = {}) {
        const textComponent = new TextComponent({
            content: options.content,
            order: options.order || this.getNextOrder()
        });

        // Override format if specified
        if (options.format) {
            textComponent.updateContent(textComponent.content.data, options.format);
        }

        this.addComponent(textComponent.toJSON());
        return textComponent;
    }

    /**
     * Update TextComponent content
     * @param {string} componentId - Component ID
     * @param {string|Object} content - New content
     * @param {string} format - Content format (optional)
     * @returns {boolean} Success status
     */
    updateTextComponentContent(componentId, content, format = null) {
        const textComponent = this.getTextComponentById(componentId);
        if (!textComponent) {
            throw new Error(`TextComponent with ID '${componentId}' not found`);
        }

        textComponent.updateContent(content, format);
        this.updateComponent(componentId, textComponent.toJSON());
        return true;
    }

    /**
     * Get next available order number
     * @returns {number} Next order number
     */
    getNextOrder() {
        if (this.components.length === 0) return 1;
        const maxOrder = Math.max(...this.components.map(c => c.order || 0));
        return maxOrder + 1;
    }

    /**
     * Reorder components
     * @param {Array} componentIds - Array of component IDs in new order
     * @returns {boolean} Success status
     */
    reorderComponents(componentIds) {
        const reorderedComponents = [];
        
        componentIds.forEach((id, index) => {
            const component = this.getComponentById(id);
            if (!component) {
                throw new Error(`Component with ID '${id}' not found`);
            }
            reorderedComponents.push({
                ...component,
                order: index + 1
            });
        });

        // Add any remaining components that weren't in the reorder list
        this.components.forEach(component => {
            if (!componentIds.includes(component.id)) {
                reorderedComponents.push({
                    ...component,
                    order: reorderedComponents.length + 1
                });
            }
        });

        this.components = reorderedComponents;
        this.updatedAt = new Date().toISOString();
        return true;
    }

    /**
     * Get all text content from TextComponents as plain text
     * @returns {string} Combined plain text content
     */
    getAllTextContent() {
        return this.getTextComponents()
            .map(tc => tc.getAsPlainText())
            .join('\n\n');
    }

    /**
     * Get content statistics for TextComponents
     * @returns {Object} Content statistics
     */
    getTextContentStats() {
        const textComponents = this.getTextComponents();
        const stats = {
            totalTextComponents: textComponents.length,
            totalCharacters: 0,
            totalWords: 0,
            formatBreakdown: {},
            averageComponentLength: 0
        };

        textComponents.forEach(tc => {
            const plainText = tc.getAsPlainText();
            stats.totalCharacters += plainText.length;
            stats.totalWords += plainText.split(/\s+/).filter(word => word.length > 0).length;
            
            const format = tc.content.format;
            stats.formatBreakdown[format] = (stats.formatBreakdown[format] || 0) + 1;
        });

        stats.averageComponentLength = textComponents.length > 0 ? 
            Math.round(stats.totalCharacters / textComponents.length) : 0;

        return stats;
    }

    /**
     * Get all AccordionComponents on the page
     * @returns {Array} Array of AccordionComponent instances
     */
    getAccordionComponents() {
        return this.components
            .filter(c => c.type === 'AccordionComponent')
            .map(c => new AccordionComponent(c));
    }

    /**
     * Get AccordionComponent by ID
     * @param {string} componentId - Component ID
     * @returns {AccordionComponent|null} AccordionComponent instance or null
     */
    getAccordionComponentById(componentId) {
        const component = this.getComponentById(componentId);
        if (component && component.type === 'AccordionComponent') {
            return new AccordionComponent(component);
        }
        return null;
    }

    /**
     * Create a new AccordionComponent and add it to the page
     * @param {Object} options - AccordionComponent options
     * @param {Array} options.items - Initial items (optional)
     * @param {boolean} options.allowMultipleOpen - Allow multiple open items (optional)
     * @param {string} options.style - Component style (optional)
     * @param {number} options.order - Component order (optional)
     * @returns {AccordionComponent} Created AccordionComponent instance
     */
    createAccordionComponent(options = {}) {
        const accordionComponent = new AccordionComponent({
            data: {
                items: options.items || AccordionComponent.createDefault(2).data.items,
                allowMultipleOpen: options.allowMultipleOpen !== undefined ? options.allowMultipleOpen : true,
                style: options.style || 'default'
            },
            order: options.order || this.getNextOrder()
        });

        this.addComponent(accordionComponent.toJSON());
        return accordionComponent;
    }

    /**
     * Update AccordionComponent data
     * @param {string} componentId - Component ID
     * @param {Object} data - New data
     * @returns {boolean} Success status
     */
    updateAccordionComponentData(componentId, data) {
        const accordionComponent = this.getAccordionComponentById(componentId);
        if (!accordionComponent) {
            throw new Error(`AccordionComponent with ID '${componentId}' not found`);
        }

        accordionComponent.data = accordionComponent.initializeData(data);
        this.updateComponent(componentId, accordionComponent.toJSON());
        return true;
    }

    /**
     * Add item to AccordionComponent
     * @param {string} componentId - Component ID
     * @param {Object} itemData - Item data (optional)
     * @returns {string} New item ID
     */
    addAccordionItem(componentId, itemData = {}) {
        const accordionComponent = this.getAccordionComponentById(componentId);
        if (!accordionComponent) {
            throw new Error(`AccordionComponent with ID '${componentId}' not found`);
        }

        const itemId = accordionComponent.addItem(itemData);
        this.updateComponent(componentId, accordionComponent.toJSON());
        return itemId;
    }

    /**
     * Remove item from AccordionComponent
     * @param {string} componentId - Component ID
     * @param {string} itemId - Item ID to remove
     * @returns {boolean} Success status
     */
    removeAccordionItem(componentId, itemId) {
        const accordionComponent = this.getAccordionComponentById(componentId);
        if (!accordionComponent) {
            throw new Error(`AccordionComponent with ID '${componentId}' not found`);
        }

        accordionComponent.removeItem(itemId);
        this.updateComponent(componentId, accordionComponent.toJSON());
        return true;
    }

    /**
     * Update AccordionComponent item
     * @param {string} componentId - Component ID
     * @param {string} itemId - Item ID
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    updateAccordionItem(componentId, itemId, updates) {
        const accordionComponent = this.getAccordionComponentById(componentId);
        if (!accordionComponent) {
            throw new Error(`AccordionComponent with ID '${componentId}' not found`);
        }

        accordionComponent.updateItem(itemId, updates);
        this.updateComponent(componentId, accordionComponent.toJSON());
        return true;
    }

    /**
     * Toggle AccordionComponent item state
     * @param {string} componentId - Component ID
     * @param {string} itemId - Item ID
     * @returns {boolean} New open state
     */
    toggleAccordionItem(componentId, itemId) {
        const accordionComponent = this.getAccordionComponentById(componentId);
        if (!accordionComponent) {
            throw new Error(`AccordionComponent with ID '${componentId}' not found`);
        }

        const newState = accordionComponent.toggleItem(itemId);
        this.updateComponent(componentId, accordionComponent.toJSON());
        return newState;
    }

    /**
     * Get accordion content statistics
     * @returns {Object} Accordion content statistics
     */
    getAccordionContentStats() {
        const accordionComponents = this.getAccordionComponents();
        const stats = {
            totalAccordionComponents: accordionComponents.length,
            totalItems: 0,
            openItems: 0,
            closedItems: 0,
            totalCharacters: 0,
            totalWords: 0
        };

        accordionComponents.forEach(ac => {
            const componentStats = ac.getContentStats();
            stats.totalItems += componentStats.totalItems;
            stats.openItems += componentStats.openItems;
            stats.closedItems += componentStats.closedItems;
            stats.totalCharacters += componentStats.totalCharacters;
            stats.totalWords += componentStats.totalWords;
        });

        return stats;
    }

    /**
     * Get all CardComponents on the page
     * @returns {Array} Array of CardComponent instances
     */
    getCardComponents() {
        return this.components
            .filter(c => c.type === 'CardComponent')
            .map(c => new CardComponent(c));
    }

    /**
     * Get CardComponent by ID
     * @param {string} componentId - Component ID
     * @returns {CardComponent|null} CardComponent instance or null
     */
    getCardComponentById(componentId) {
        const component = this.getComponentById(componentId);
        if (component && component.type === 'CardComponent') {
            return new CardComponent(component);
        }
        return null;
    }

    /**
     * Create a new CardComponent and add it to the page
     * @param {Object} options - CardComponent options
     * @param {string} options.title - Card title (optional)
     * @param {Object} options.description - Card description (optional)
     * @param {string} options.imageUrl - Image URL (optional)
     * @param {string} options.altText - Alt text (optional)
     * @param {string} options.linkUrl - Link URL (optional)
     * @param {string} options.linkText - Link text (optional)
     * @param {string} options.linkTarget - Link target (optional)
     * @param {string} options.style - Component style (optional)
     * @param {number} options.order - Component order (optional)
     * @returns {CardComponent} Created CardComponent instance
     */
    createCardComponent(options = {}) {
        const cardComponent = new CardComponent({
            data: {
                title: options.title || 'Card Title',
                description: options.description || {
                    format: 'html',
                    data: '<p>Card description goes here...</p>',
                    metadata: {
                        version: '1.0',
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString()
                    }
                },
                imageUrl: options.imageUrl || '',
                altText: options.altText || '',
                linkUrl: options.linkUrl || '',
                linkText: options.linkText || '',
                linkTarget: options.linkTarget || '_self',
                style: options.style || 'default'
            },
            order: options.order || this.getNextOrder()
        });

        this.addComponent(cardComponent.toJSON());
        return cardComponent;
    }

    /**
     * Update CardComponent data
     * @param {string} componentId - Component ID
     * @param {Object} data - New data
     * @returns {boolean} Success status
     */
    updateCardComponentData(componentId, data) {
        const cardComponent = this.getCardComponentById(componentId);
        if (!cardComponent) {
            throw new Error(`CardComponent with ID '${componentId}' not found`);
        }

        cardComponent.updateData(data);
        this.updateComponent(componentId, cardComponent.toJSON());
        return true;
    }

    /**
     * Update CardComponent title
     * @param {string} componentId - Component ID
     * @param {string} title - New title
     * @returns {boolean} Success status
     */
    updateCardComponentTitle(componentId, title) {
        return this.updateCardComponentData(componentId, { title });
    }

    /**
     * Update CardComponent description
     * @param {string} componentId - Component ID
     * @param {Object} description - New description
     * @returns {boolean} Success status
     */
    updateCardComponentDescription(componentId, description) {
        return this.updateCardComponentData(componentId, { description });
    }

    /**
     * Update CardComponent image
     * @param {string} componentId - Component ID
     * @param {string} imageUrl - New image URL
     * @param {string} altText - New alt text
     * @returns {boolean} Success status
     */
    updateCardComponentImage(componentId, imageUrl, altText = '') {
        return this.updateCardComponentData(componentId, { imageUrl, altText });
    }

    /**
     * Update CardComponent link
     * @param {string} componentId - Component ID
     * @param {string} linkUrl - New link URL
     * @param {string} linkText - New link text
     * @param {string} linkTarget - New link target
     * @returns {boolean} Success status
     */
    updateCardComponentLink(componentId, linkUrl, linkText = '', linkTarget = '_self') {
        return this.updateCardComponentData(componentId, { linkUrl, linkText, linkTarget });
    }

    /**
     * Get card content statistics
     * @returns {Object} Card content statistics
     */
    getCardContentStats() {
        const cardComponents = this.getCardComponents();
        const stats = {
            totalCardComponents: cardComponents.length,
            cardsWithImages: 0,
            cardsWithLinks: 0,
            totalTitleCharacters: 0,
            totalDescriptionCharacters: 0,
            totalDescriptionWords: 0,
            averageTitleLength: 0,
            averageDescriptionLength: 0
        };

        cardComponents.forEach(cc => {
            const componentStats = cc.getContentStats();
            stats.totalTitleCharacters += componentStats.titleLength;
            stats.totalDescriptionCharacters += componentStats.descriptionLength;
            stats.totalDescriptionWords += componentStats.descriptionWords;
            
            if (componentStats.hasImage) {
                stats.cardsWithImages++;
            }
            
            if (componentStats.hasLink) {
                stats.cardsWithLinks++;
            }
        });

        stats.averageTitleLength = cardComponents.length > 0 ? 
            Math.round(stats.totalTitleCharacters / cardComponents.length) : 0;
        stats.averageDescriptionLength = cardComponents.length > 0 ? 
            Math.round(stats.totalDescriptionCharacters / cardComponents.length) : 0;

        return stats;
    }

    /**
     * Search card content
     * @param {string} searchTerm - Search term
     * @returns {Array} Array of matching card components with search context
     */
    searchCardContent(searchTerm) {
        const matches = [];
        const cardComponents = this.getCardComponents();

        cardComponents.forEach(cardComponent => {
            const title = cardComponent.getTitle().toLowerCase();
            const description = cardComponent.getDescriptionAsPlainText().toLowerCase();
            const searchLower = searchTerm.toLowerCase();

            if (title.includes(searchLower)) {
                matches.push({
                    componentId: cardComponent.id,
                    componentType: 'CardComponent',
                    field: 'title',
                    content: cardComponent.getTitle(),
                    match: searchTerm
                });
            }

            if (description.includes(searchLower)) {
                matches.push({
                    componentId: cardComponent.id,
                    componentType: 'CardComponent',
                    field: 'description',
                    content: cardComponent.getDescriptionAsPlainText(),
                    match: searchTerm
                });
            }
        });

        return matches;
    }

    /**
     * Convert to JSON object
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            templateId: this.templateId,
            components: this.components,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create Page instance from JSON
     * @param {Object} json - JSON object
     * @returns {Page} Page instance
     */
    static fromJSON(json) {
        return new Page(json);
    }

    /**
     * Create a new page from template
     * @param {Object} template - Template object
     * @returns {Page} New page instance
     */
    static createFromTemplate(template) {
        const page = new Page({
            templateId: template.id
        });

        // Convert template components to page components
        if (template.components && Array.isArray(template.components)) {
            template.components.forEach((templateComponent, index) => {
                if (templateComponent.type === 'text') {
                    const textComponent = new TextComponent({
                        content: templateComponent.defaultValues?.content || 'Click to edit text',
                        order: index + 1
                    });
                    page.addComponent(textComponent.toJSON());
                } else {
                    // Handle other component types (basic structure for now)
                    page.addComponent({
                        id: `${templateComponent.type.toLowerCase()}-${Date.now()}-${index}`,
                        type: this.mapTemplateComponentType(templateComponent.type),
                        data: { ...templateComponent.defaultValues },
                        order: index + 1
                    });
                }
            });
        }

        return page;
    }

    /**
     * Map template component type to page component type
     * @param {string} templateType - Template component type
     * @returns {string} Page component type
     */
    static mapTemplateComponentType(templateType) {
        const typeMapping = {
            'banner': 'BannerComponent',
            'text': 'TextComponent',
            'image': 'ImageComponent',
            'button': 'ButtonComponent',
            'container': 'ContainerComponent',
            'card': 'CardComponent',
            'accordion': 'AccordionComponent',
            'linkgroup': 'LinkGroupComponent'
        };

        return typeMapping[templateType] || 'TextComponent';
    }
}

// Export for use in other scripts
window.Page = Page;
