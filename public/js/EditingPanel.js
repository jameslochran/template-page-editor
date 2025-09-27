/**
 * EditingPanel - Central editing interface for components
 * Work Order 12: Build EditingPanel with Dynamic Component Editor Loading
 * 
 * This component dynamically loads appropriate editors based on component type
 * and provides the main editing experience for all components.
 */

class EditingPanel {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            componentType: null,
            componentData: null,
            onClose: null,
            ...options
        };
        
        this.componentEditor = null;
        this.componentEditors = window.ComponentEditors || {};
    }

    /**
     * Render the editing panel
     */
    render() {
        if (!this.options.componentType || !this.options.componentData) {
            this.renderNoSelection();
            return;
        }

        this.renderComponentEditor();
    }

    /**
     * Render the appropriate component editor based on component type
     */
    renderComponentEditor() {
        const { componentType, componentData } = this.options;
        
        // Get the appropriate editor class
        const EditorClass = this.componentEditors[componentType];
        
        if (!EditorClass) {
            this.renderUnknownComponent(componentType);
            return;
        }

        try {
            // Create and render the component editor
            this.componentEditor = new EditorClass(this.container, {
                componentData: componentData,
                onUpdate: (updatedData) => {
                    this.handleComponentUpdate(updatedData);
                },
                onClose: this.options.onClose
            });
            
            this.componentEditor.render();
        } catch (error) {
            console.error(`Error rendering ${componentType} editor:`, error);
            this.renderEditorError(componentType, error.message);
        }
    }

    /**
     * Render fallback for unknown component types
     * @param {string} componentType - The unknown component type
     */
    renderUnknownComponent(componentType) {
        this.container.innerHTML = `
            <div class="editing-panel-unknown">
                <div class="unknown-component-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Unknown Component Type</h4>
                </div>
                <div class="unknown-component-content">
                    <p>The component type "<strong>${componentType}</strong>" is not supported.</p>
                    <p>No editor is available for this component type.</p>
                    <div class="component-info">
                        <h5>Component Information:</h5>
                        <ul>
                            <li><strong>Type:</strong> ${componentType}</li>
                            <li><strong>Data:</strong> <pre>${JSON.stringify(this.options.componentData, null, 2)}</pre></li>
                        </ul>
                    </div>
                </div>
                <div class="unknown-component-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.editing-panel').style.display='none'">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render error state for editor loading failures
     * @param {string} componentType - The component type that failed
     * @param {string} errorMessage - The error message
     */
    renderEditorError(componentType, errorMessage) {
        this.container.innerHTML = `
            <div class="editing-panel-error">
                <div class="error-header">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Editor Error</h4>
                </div>
                <div class="error-content">
                    <p>Failed to load editor for component type "<strong>${componentType}</strong>".</p>
                    <div class="error-details">
                        <strong>Error:</strong> ${errorMessage}
                    </div>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i> Reload Page
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.editing-panel').style.display='none'">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render no selection state
     */
    renderNoSelection() {
        this.container.innerHTML = `
            <div class="editing-panel-no-selection">
                <div class="no-selection-icon">
                    <i class="fas fa-hand-pointer"></i>
                </div>
                <div class="no-selection-content">
                    <h4>No Component Selected</h4>
                    <p>Click on a component in the canvas to edit its properties.</p>
                </div>
            </div>
        `;
    }

    /**
     * Handle component data updates from the editor
     * @param {Object} updatedData - The updated component data
     */
    handleComponentUpdate(updatedData) {
        // Emit custom event for component updates
        const event = new CustomEvent('componentUpdated', {
            detail: {
                componentType: this.options.componentType,
                componentData: updatedData,
                originalData: this.options.componentData
            }
        });
        
        document.dispatchEvent(event);
        
        // Update the options with new data
        this.options.componentData = updatedData;
        
        console.log('Component updated:', this.options.componentType, updatedData);
    }

    /**
     * Update the component data
     * @param {Object} newData - New component data
     */
    updateComponentData(newData) {
        this.options.componentData = newData;
        
        if (this.componentEditor && typeof this.componentEditor.updateData === 'function') {
            this.componentEditor.updateData(newData);
        } else {
            // Re-render if update method is not available
            this.render();
        }
    }

    /**
     * Get the current component data
     * @returns {Object} Current component data
     */
    getComponentData() {
        return this.options.componentData;
    }

    /**
     * Destroy the editing panel and clean up resources
     */
    destroy() {
        if (this.componentEditor && typeof this.componentEditor.destroy === 'function') {
            this.componentEditor.destroy();
        }
        
        this.componentEditor = null;
        this.container.innerHTML = '';
    }
}

// Expose EditingPanel globally
window.EditingPanel = EditingPanel;
