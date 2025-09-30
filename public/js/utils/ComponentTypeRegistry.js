/**
 * ComponentTypeRegistry - Work Order 43
 * 
 * Registry of available component types and their expected defaultValues schemas.
 * Used for populating componentType dropdowns and validating defaultValues.
 */

class ComponentTypeRegistry {
    constructor() {
        this.componentTypes = {
            'text': {
                name: 'Text',
                description: 'Editable text content',
                icon: 'fas fa-font',
                color: '#3b82f6',
                defaultValuesSchema: {
                    text: { type: 'string', required: true, default: 'Sample Text' },
                    fontSize: { type: 'number', required: false, default: 16, min: 8, max: 72 },
                    fontFamily: { type: 'string', required: false, default: 'Arial, sans-serif' },
                    fontWeight: { type: 'string', required: false, default: 'normal', options: ['normal', 'bold', 'lighter', 'bolder'] },
                    color: { type: 'string', required: false, default: '#000000' },
                    textAlign: { type: 'string', required: false, default: 'left', options: ['left', 'center', 'right', 'justify'] },
                    lineHeight: { type: 'number', required: false, default: 1.4, min: 0.5, max: 3.0 }
                }
            },
            'image': {
                name: 'Image',
                description: 'Editable image content',
                icon: 'fas fa-image',
                color: '#10b981',
                defaultValuesSchema: {
                    src: { type: 'string', required: true, default: '' },
                    alt: { type: 'string', required: false, default: 'Image' },
                    width: { type: 'number', required: false, default: 300, min: 50, max: 2000 },
                    height: { type: 'number', required: false, default: 200, min: 50, max: 2000 },
                    objectFit: { type: 'string', required: false, default: 'cover', options: ['cover', 'contain', 'fill', 'scale-down'] },
                    borderRadius: { type: 'number', required: false, default: 0, min: 0, max: 50 }
                }
            },
            'button': {
                name: 'Button',
                description: 'Clickable button element',
                icon: 'fas fa-hand-pointer',
                color: '#f59e0b',
                defaultValuesSchema: {
                    text: { type: 'string', required: true, default: 'Click Me' },
                    href: { type: 'string', required: false, default: '#' },
                    target: { type: 'string', required: false, default: '_self', options: ['_self', '_blank', '_parent', '_top'] },
                    backgroundColor: { type: 'string', required: false, default: '#3b82f6' },
                    textColor: { type: 'string', required: false, default: '#ffffff' },
                    fontSize: { type: 'number', required: false, default: 16, min: 8, max: 24 },
                    padding: { type: 'string', required: false, default: '12px 24px' },
                    borderRadius: { type: 'number', required: false, default: 4, min: 0, max: 50 }
                }
            },
            'link': {
                name: 'Link',
                description: 'Text link element',
                icon: 'fas fa-link',
                color: '#8b5cf6',
                defaultValuesSchema: {
                    text: { type: 'string', required: true, default: 'Link Text' },
                    href: { type: 'string', required: true, default: '#' },
                    target: { type: 'string', required: false, default: '_self', options: ['_self', '_blank', '_parent', '_top'] },
                    color: { type: 'string', required: false, default: '#3b82f6' },
                    fontSize: { type: 'number', required: false, default: 16, min: 8, max: 24 },
                    textDecoration: { type: 'string', required: false, default: 'underline', options: ['none', 'underline', 'overline', 'line-through'] }
                }
            },
            'heading': {
                name: 'Heading',
                description: 'Page heading element',
                icon: 'fas fa-heading',
                color: '#ef4444',
                defaultValuesSchema: {
                    text: { type: 'string', required: true, default: 'Heading Text' },
                    level: { type: 'number', required: true, default: 1, min: 1, max: 6 },
                    fontSize: { type: 'number', required: false, default: 32, min: 12, max: 72 },
                    fontFamily: { type: 'string', required: false, default: 'Arial, sans-serif' },
                    fontWeight: { type: 'string', required: false, default: 'bold', options: ['normal', 'bold', 'lighter', 'bolder'] },
                    color: { type: 'string', required: false, default: '#000000' },
                    textAlign: { type: 'string', required: false, default: 'left', options: ['left', 'center', 'right', 'justify'] },
                    margin: { type: 'string', required: false, default: '0 0 16px 0' }
                }
            },
            'card': {
                name: 'Card',
                description: 'Content card container',
                icon: 'fas fa-id-card',
                color: '#06b6d4',
                defaultValuesSchema: {
                    title: { type: 'string', required: false, default: 'Card Title' },
                    content: { type: 'string', required: false, default: 'Card content goes here...' },
                    backgroundColor: { type: 'string', required: false, default: '#ffffff' },
                    borderColor: { type: 'string', required: false, default: '#e5e7eb' },
                    borderRadius: { type: 'number', required: false, default: 8, min: 0, max: 50 },
                    padding: { type: 'string', required: false, default: '16px' },
                    boxShadow: { type: 'string', required: false, default: '0 1px 3px rgba(0, 0, 0, 0.1)' }
                }
            },
            'banner': {
                name: 'Banner',
                description: 'Hero banner section',
                icon: 'fas fa-flag',
                color: '#f97316',
                defaultValuesSchema: {
                    title: { type: 'string', required: false, default: 'Banner Title' },
                    subtitle: { type: 'string', required: false, default: 'Banner subtitle' },
                    backgroundImage: { type: 'string', required: false, default: '' },
                    backgroundColor: { type: 'string', required: false, default: '#f3f4f6' },
                    textColor: { type: 'string', required: false, default: '#000000' },
                    textAlign: { type: 'string', required: false, default: 'center', options: ['left', 'center', 'right'] },
                    padding: { type: 'string', required: false, default: '60px 20px' },
                    minHeight: { type: 'number', required: false, default: 300, min: 100, max: 800 }
                }
            }
        };
    }

    /**
     * Get all available component types
     * @returns {Object} Component types registry
     */
    getComponentTypes() {
        return this.componentTypes;
    }

    /**
     * Get a specific component type definition
     * @param {string} type - Component type key
     * @returns {Object|null} Component type definition or null if not found
     */
    getComponentType(type) {
        return this.componentTypes[type] || null;
    }

    /**
     * Get component type options for dropdown
     * @returns {Array} Array of {value, label, icon, color} objects
     */
    getComponentTypeOptions() {
        return Object.entries(this.componentTypes).map(([key, config]) => ({
            value: key,
            label: config.name,
            icon: config.icon,
            color: config.color,
            description: config.description
        }));
    }

    /**
     * Get default values schema for a component type
     * @param {string} type - Component type key
     * @returns {Object|null} Default values schema or null if not found
     */
    getDefaultValuesSchema(type) {
        const componentType = this.getComponentType(type);
        return componentType ? componentType.defaultValuesSchema : null;
    }

    /**
     * Generate default values for a component type
     * @param {string} type - Component type key
     * @returns {Object} Default values object
     */
    generateDefaultValues(type) {
        const schema = this.getDefaultValuesSchema(type);
        if (!schema) return {};

        const defaults = {};
        Object.entries(schema).forEach(([key, config]) => {
            defaults[key] = config.default;
        });
        return defaults;
    }

    /**
     * Validate default values against component type schema
     * @param {string} type - Component type key
     * @param {Object} values - Values to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validateDefaultValues(type, values) {
        const schema = this.getDefaultValuesSchema(type);
        if (!schema) {
            return { isValid: false, errors: ['Unknown component type'] };
        }

        const errors = [];
        const validatedValues = {};

        // Check required fields
        Object.entries(schema).forEach(([key, config]) => {
            const value = values[key];
            
            if (config.required && (value === undefined || value === null || value === '')) {
                errors.push(`${key} is required`);
                return;
            }

            if (value !== undefined && value !== null && value !== '') {
                // Type validation
                if (config.type === 'number' && typeof value !== 'number') {
                    errors.push(`${key} must be a number`);
                    return;
                }
                if (config.type === 'string' && typeof value !== 'string') {
                    errors.push(`${key} must be a string`);
                    return;
                }

                // Range validation for numbers
                if (config.type === 'number' && typeof value === 'number') {
                    if (config.min !== undefined && value < config.min) {
                        errors.push(`${key} must be at least ${config.min}`);
                        return;
                    }
                    if (config.max !== undefined && value > config.max) {
                        errors.push(`${key} must be at most ${config.max}`);
                        return;
                    }
                }

                // Options validation
                if (config.options && !config.options.includes(value)) {
                    errors.push(`${key} must be one of: ${config.options.join(', ')}`);
                    return;
                }

                validatedValues[key] = value;
            } else {
                // Use default value if not provided
                validatedValues[key] = config.default;
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            validatedValues
        };
    }

    /**
     * Get component type display information
     * @param {string} type - Component type key
     * @returns {Object} Display information
     */
    getComponentTypeDisplay(type) {
        const componentType = this.getComponentType(type);
        if (!componentType) return null;

        return {
            name: componentType.name,
            description: componentType.description,
            icon: componentType.icon,
            color: componentType.color
        };
    }
}

// Create global instance
window.ComponentTypeRegistry = new ComponentTypeRegistry();
