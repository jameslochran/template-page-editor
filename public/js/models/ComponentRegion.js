/**
 * ComponentRegion - Work Order 43
 * 
 * Data model representing a single editable region on a PNG template.
 * Includes position, dimensions, component type, and default values.
 */

class ComponentRegion {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.width = data.width || 100;
        this.height = data.height || 50;
        this.componentType = data.componentType || 'text';
        this.defaultValues = data.defaultValues || {};
        this.label = data.label || '';
        this.isSelected = data.isSelected || false;
        this.isVisible = data.isVisible !== undefined ? data.isVisible : true;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Generate a unique ID for the component region
     * @returns {string} Unique identifier
     */
    generateId() {
        return `region_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update the region's position and dimensions
     * @param {number} x - New x coordinate
     * @param {number} y - New y coordinate
     * @param {number} width - New width
     * @param {number} height - New height
     */
    updateBounds(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update the component type and reset default values
     * @param {string} componentType - New component type
     */
    updateComponentType(componentType) {
        this.componentType = componentType;
        
        // Generate new default values based on component type
        if (window.ComponentTypeRegistry) {
            this.defaultValues = window.ComponentTypeRegistry.generateDefaultValues(componentType);
        }
        
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Update default values for the component
     * @param {Object} values - New default values
     */
    updateDefaultValues(values) {
        this.defaultValues = { ...this.defaultValues, ...values };
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Set the region label
     * @param {string} label - New label
     */
    setLabel(label) {
        this.label = label;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Set the selected state
     * @param {boolean} selected - Whether the region is selected
     */
    setSelected(selected) {
        this.isSelected = selected;
    }

    /**
     * Set the visible state
     * @param {boolean} visible - Whether the region is visible
     */
    setVisible(visible) {
        this.isVisible = visible;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Check if a point is inside this region
     * @param {number} x - Point x coordinate
     * @param {number} y - Point y coordinate
     * @returns {boolean} True if point is inside region
     */
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }

    /**
     * Get the center point of the region
     * @returns {Object} Center coordinates {x, y}
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    /**
     * Get the bounds of the region
     * @returns {Object} Bounds {x, y, width, height}
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Move the region by a delta amount
     * @param {number} deltaX - Change in x coordinate
     * @param {number} deltaY - Change in y coordinate
     */
    move(deltaX, deltaY) {
        this.x += deltaX;
        this.y += deltaY;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Resize the region
     * @param {number} newWidth - New width
     * @param {number} newHeight - New height
     */
    resize(newWidth, newHeight) {
        this.width = Math.max(20, newWidth); // Minimum width
        this.height = Math.max(20, newHeight); // Minimum height
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Validate the region's properties
     * @returns {Object} Validation result with isValid and errors
     */
    validate() {
        const errors = [];

        // Validate position and dimensions
        if (this.x < 0) errors.push('X coordinate cannot be negative');
        if (this.y < 0) errors.push('Y coordinate cannot be negative');
        if (this.width <= 0) errors.push('Width must be positive');
        if (this.height <= 0) errors.push('Height must be positive');

        // Validate component type
        if (!this.componentType) {
            errors.push('Component type is required');
        } else if (window.ComponentTypeRegistry) {
            const componentType = window.ComponentTypeRegistry.getComponentType(this.componentType);
            if (!componentType) {
                errors.push(`Unknown component type: ${this.componentType}`);
            }
        }

        // Validate default values if component type registry is available
        if (window.ComponentTypeRegistry && this.componentType) {
            const validation = window.ComponentTypeRegistry.validateDefaultValues(
                this.componentType, 
                this.defaultValues
            );
            if (!validation.isValid) {
                errors.push(...validation.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get the display name for this region
     * @returns {string} Display name
     */
    getDisplayName() {
        if (this.label) {
            return this.label;
        }

        if (window.ComponentTypeRegistry) {
            const componentType = window.ComponentTypeRegistry.getComponentType(this.componentType);
            if (componentType) {
                return `${componentType.name} Region`;
            }
        }

        return `${this.componentType} Region`;
    }

    /**
     * Get the component type display information
     * @returns {Object|null} Component type display info
     */
    getComponentTypeDisplay() {
        if (window.ComponentTypeRegistry) {
            return window.ComponentTypeRegistry.getComponentTypeDisplay(this.componentType);
        }
        return null;
    }

    /**
     * Clone this component region
     * @returns {ComponentRegion} New component region instance
     */
    clone() {
        return new ComponentRegion({
            x: this.x + 20, // Offset slightly
            y: this.y + 20,
            width: this.width,
            height: this.height,
            componentType: this.componentType,
            defaultValues: { ...this.defaultValues },
            label: this.label ? `${this.label} Copy` : ''
        });
    }

    /**
     * Convert to JSON representation
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            componentType: this.componentType,
            defaultValues: this.defaultValues,
            label: this.label,
            isVisible: this.isVisible,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create from JSON representation
     * @param {Object} json - JSON representation
     * @returns {ComponentRegion} New component region instance
     */
    static fromJSON(json) {
        return new ComponentRegion(json);
    }

    /**
     * Create a new component region with default values
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {string} componentType - Component type
     * @returns {ComponentRegion} New component region
     */
    static create(x, y, width, height, componentType = 'text') {
        const region = new ComponentRegion({
            x, y, width, height, componentType
        });

        // Generate default values based on component type
        if (window.ComponentTypeRegistry) {
            region.defaultValues = window.ComponentTypeRegistry.generateDefaultValues(componentType);
        }

        return region;
    }
}

// Make ComponentRegion available globally
window.ComponentRegion = ComponentRegion;
