/**
 * BaseComponentEditor - Base class for all component editors
 * Work Order 12: Build EditingPanel with Dynamic Component Editor Loading
 * 
 * This base class provides common functionality for all component editors
 * and ensures consistent interface across different editor types.
 */

class BaseComponentEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            componentData: null,
            onUpdate: null,
            onClose: null,
            ...options
        };
    }

    /**
     * Render the component editor
     * Must be implemented by subclasses
     */
    render() {
        throw new Error('render() method must be implemented by subclass');
    }

    /**
     * Update component data
     * @param {Object} newData - New component data
     */
    updateData(newData) {
        this.options.componentData = newData;
        this.render();
    }

    /**
     * Emit component update event
     * @param {Object} updatedData - Updated component data
     */
    emitUpdate(updatedData) {
        if (this.options.onUpdate) {
            this.options.onUpdate(updatedData);
        }
    }

    /**
     * Emit close event
     */
    emitClose() {
        if (this.options.onClose) {
            this.options.onClose();
        }
    }

    /**
     * Destroy the editor and clean up resources
     */
    destroy() {
        this.container.innerHTML = '';
    }
}

// Export the BaseComponentEditor class
window.BaseComponentEditor = BaseComponentEditor;
