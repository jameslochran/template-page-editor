/**
 * Page Model
 * Work Order #7: Implement Page Data Model with Component Storage
 * 
 * This model provides object-relational mapping for the Page entity,
 * enabling application-level interaction with page data and component instances.
 */

const { v4: uuidv4 } = require('uuid');

class Page {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.templateId = data.templateId || data.template_id;
        this.components = data.components || [];
        this.createdAt = data.createdAt || data.created_at || new Date();
        this.updatedAt = data.updatedAt || data.updated_at || new Date();
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
        } else if (!this.isValidUUID(this.templateId)) {
            errors.push('templateId must be a valid UUID');
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
        this.updatedAt = new Date();
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
        this.updatedAt = new Date();
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
        this.updatedAt = new Date();
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
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Initialize page from template
     * @param {Object} template - Template object with components
     * @returns {boolean} Success status
     */
    initializeFromTemplate(template) {
        if (!template || !template.components) {
            throw new Error('Template must have components array');
        }

        this.templateId = template.id;
        this.components = [];

        // Convert template components to page components
        template.components.forEach((templateComponent, index) => {
            const pageComponent = {
                id: `${templateComponent.type.toLowerCase()}-${Date.now()}-${index}`,
                type: this.mapTemplateComponentType(templateComponent.type),
                data: { ...templateComponent.defaultValues },
                order: index + 1
            };
            this.addComponent(pageComponent);
        });

        this.updatedAt = new Date();
        return true;
    }

    /**
     * Map template component type to page component type
     * @param {string} templateType - Template component type
     * @returns {string} Page component type
     */
    mapTemplateComponentType(templateType) {
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

    /**
     * Get component statistics
     * @returns {Object} Component statistics
     */
    getComponentStats() {
        const stats = {
            totalComponents: this.components.length,
            componentTypes: {},
            orderedComponents: this.getOrderedComponents().map(c => ({
                id: c.id,
                type: c.type,
                order: c.order
            }))
        };

        this.components.forEach(component => {
            stats.componentTypes[component.type] = (stats.componentTypes[component.type] || 0) + 1;
        });

        return stats;
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
     * Validate UUID format
     * @param {string} uuid - UUID string
     * @returns {boolean} Valid UUID
     */
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Create a new page from template
     * @param {Object} template - Template object
     * @returns {Page} New page instance
     */
    static createFromTemplate(template) {
        const page = new Page();
        page.initializeFromTemplate(template);
        return page;
    }
}

module.exports = Page;
