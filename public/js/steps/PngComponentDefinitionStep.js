/**
 * PNG Component Definition Step
 * Work Order #47: Implement Multi-Step Template Upload Wizard with State Management
 * 
 * Handles interactive component definition for PNG templates, allowing users
 * to define clickable regions and component types for the uploaded image.
 */

class PngComponentDefinitionStep {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            stateManager: null,
            onStepComplete: null,
            ...options
        };

        if (!this.container) {
            console.error('PngComponentDefinitionStep: Container not found:', containerId);
            return;
        }

        if (!this.options.stateManager) {
            console.error('PngComponentDefinitionStep: State manager is required');
            return;
        }

        this.stateManager = this.options.stateManager;
        this.elements = {};
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.components = [];
        this.selectedComponent = null;
        this.isDrawing = false;
        this.startPoint = null;
        this.currentRegion = null;

        this.init();
    }

    /**
     * Initialize the PNG component definition step
     */
    init() {
        this.render();
        this.setupEventListeners();
        this.loadExistingData();
        this.loadImage();
    }

    /**
     * Render the PNG component definition step UI
     */
    render() {
        this.container.innerHTML = `
            <div class="png-component-step">
                <div class="step-header">
                    <h3 class="step-title">
                        <i class="fas fa-mouse-pointer"></i>
                        Define Interactive Components
                    </h3>
                    <p class="step-description">
                        Click and drag on the image to define interactive components. Each component will be editable in the page editor.
                    </p>
                </div>

                <div class="component-definition-area">
                    <div class="canvas-container">
                        <canvas id="component-canvas" width="800" height="600"></canvas>
                        <div class="canvas-overlay" id="canvas-overlay">
                            <div class="canvas-instructions">
                                <i class="fas fa-mouse-pointer"></i>
                                <p>Click and drag to create interactive components</p>
                            </div>
                        </div>
                    </div>

                    <div class="component-panel">
                        <div class="panel-header">
                            <h4>Component Properties</h4>
                            <button class="btn btn-secondary btn-sm" id="clear-all-components">
                                <i class="fas fa-trash"></i>
                                Clear All
                            </button>
                        </div>

                        <div class="component-form" id="component-form" style="display: none;">
                            <div class="form-group">
                                <label for="component-type">Component Type</label>
                                <select id="component-type" class="form-control">
                                    <option value="text">Text Component</option>
                                    <option value="image">Image Component</option>
                                    <option value="button">Button Component</option>
                                    <option value="link">Link Component</option>
                                    <option value="card">Card Component</option>
                                    <option value="banner">Banner Component</option>
                                    <option value="accordion">Accordion Component</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="component-name">Component Name</label>
                                <input type="text" id="component-name" class="form-control" placeholder="Enter component name">
                            </div>

                            <div class="form-group">
                                <label for="component-description">Description (Optional)</label>
                                <textarea id="component-description" class="form-control" rows="3" placeholder="Describe this component"></textarea>
                            </div>

                            <div class="form-actions">
                                <button class="btn btn-primary btn-sm" id="save-component">
                                    <i class="fas fa-save"></i>
                                    Save Component
                                </button>
                                <button class="btn btn-secondary btn-sm" id="cancel-component">
                                    <i class="fas fa-times"></i>
                                    Cancel
                                </button>
                            </div>
                        </div>

                        <div class="components-list" id="components-list">
                            <div class="empty-state">
                                <i class="fas fa-mouse-pointer"></i>
                                <p>No components defined yet</p>
                                <small>Click and drag on the image to create your first component</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <div class="component-help">
                        <h5>Component Types:</h5>
                        <div class="help-grid">
                            <div class="help-item">
                                <strong>Text:</strong> Editable text content
                            </div>
                            <div class="help-item">
                                <strong>Image:</strong> Replaceable images
                            </div>
                            <div class="help-item">
                                <strong>Button:</strong> Call-to-action buttons
                            </div>
                            <div class="help-item">
                                <strong>Link:</strong> Clickable links
                            </div>
                            <div class="help-item">
                                <strong>Card:</strong> Content cards
                            </div>
                            <div class="help-item">
                                <strong>Banner:</strong> Header banners
                            </div>
                            <div class="help-item">
                                <strong>Accordion:</strong> Collapsible content
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.cacheElements();
        this.initializeCanvas();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            canvas: document.getElementById('component-canvas'),
            canvasOverlay: document.getElementById('canvas-overlay'),
            componentForm: document.getElementById('component-form'),
            componentType: document.getElementById('component-type'),
            componentName: document.getElementById('component-name'),
            componentDescription: document.getElementById('component-description'),
            saveComponentBtn: document.getElementById('save-component'),
            cancelComponentBtn: document.getElementById('cancel-component'),
            clearAllBtn: document.getElementById('clear-all-components'),
            componentsList: document.getElementById('components-list')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Canvas events
        this.elements.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.elements.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.elements.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.elements.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Form events
        this.elements.saveComponentBtn.addEventListener('click', () => this.saveComponent());
        this.elements.cancelComponentBtn.addEventListener('click', () => this.cancelComponent());
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAllComponents());
    }

    /**
     * Initialize canvas
     */
    initializeCanvas() {
        this.canvas = this.elements.canvas;
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size based on container
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    /**
     * Load existing data from state
     */
    loadExistingData() {
        const pngData = this.stateManager.getStepData('pngComponents');
        this.components = pngData.components || [];
        this.updateComponentsList();
    }

    /**
     * Load image from upload data
     */
    async loadImage() {
        const uploadData = this.stateManager.getStepData('upload');
        
        if (!uploadData || !uploadData.publicUrl) {
            console.error('PngComponentDefinitionStep: No image URL available from upload data:', uploadData);
            return;
        }

        try {
            this.image = new Image();
            this.image.crossOrigin = 'anonymous';
            
            this.image.onload = () => {
                console.log('PngComponentDefinitionStep: Image loaded successfully');
                this.drawImage();
                this.drawComponents();
            };
            
            this.image.onerror = (error) => {
                console.error('PngComponentDefinitionStep: Failed to load image:', error);
                console.error('Image URL:', uploadData.publicUrl);
                // Show error message to user
                this.showImageError();
            };
            
            console.log('PngComponentDefinitionStep: Loading image from URL:', uploadData.publicUrl);
            this.image.src = uploadData.publicUrl;
        } catch (error) {
            console.error('PngComponentDefinitionStep: Error loading image:', error);
            this.showImageError();
        }
    }

    /**
     * Show error message when image fails to load
     */
    showImageError() {
        if (this.elements.canvas) {
            this.ctx = this.elements.canvas.getContext('2d');
            const canvasWidth = this.elements.canvas.width;
            const canvasHeight = this.elements.canvas.height;
            
            // Clear canvas
            this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            
            // Draw error message
            this.ctx.fillStyle = '#f3f4f6';
            this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Failed to load image', canvasWidth / 2, canvasHeight / 2 - 10);
            
            this.ctx.fillStyle = '#6b7280';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('Please check the image URL and try again', canvasWidth / 2, canvasHeight / 2 + 10);
        }
    }

    /**
     * Draw the image on canvas
     */
    drawImage() {
        if (!this.image || !this.ctx) return;

        // Check if image is loaded and not broken
        if (!this.image.complete || this.image.naturalWidth === 0) {
            console.warn('PngComponentDefinitionStep: Image not ready for drawing');
            return;
        }

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Calculate image dimensions to fit canvas while maintaining aspect ratio
        const imageAspect = this.image.width / this.image.height;
        const canvasAspect = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imageAspect > canvasAspect) {
            // Image is wider than canvas
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imageAspect;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        } else {
            // Image is taller than canvas
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imageAspect;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw image
        this.ctx.drawImage(this.image, offsetX, offsetY, drawWidth, drawHeight);
        
        // Store image bounds for coordinate conversion
        this.imageBounds = {
            x: offsetX,
            y: offsetY,
            width: drawWidth,
            height: drawHeight
        };
    }

    /**
     * Draw all components on canvas
     */
    drawComponents() {
        this.components.forEach((component, index) => {
            this.drawComponent(component, index);
        });
    }

    /**
     * Draw a single component
     */
    drawComponent(component, index) {
        const { x, y, width, height } = component.region;
        
        // Draw selection rectangle
        this.ctx.strokeStyle = component === this.selectedComponent ? '#3b82f6' : '#10b981';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw component label
        this.ctx.fillStyle = component === this.selectedComponent ? '#3b82f6' : '#10b981';
        this.ctx.fillRect(x, y - 20, Math.max(100, component.name.length * 8), 20);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(component.name, x + 5, y - 5);
        
        // Draw component number
        this.ctx.fillStyle = component === this.selectedComponent ? '#3b82f6' : '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(x + width - 10, y + 10, 10, 0, 2 * Math.PI);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText((index + 1).toString(), x + width - 10, y + 14);
        this.ctx.textAlign = 'left';
    }

    /**
     * Handle mouse down
     */
    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.isDrawing = true;
        this.startPoint = { x, y };
        this.currentRegion = { x, y, width: 0, height: 0 };
        
        this.elements.canvasOverlay.style.display = 'none';
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(event) {
        if (!this.isDrawing || !this.startPoint) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Update current region
        this.currentRegion = {
            x: Math.min(this.startPoint.x, x),
            y: Math.min(this.startPoint.y, y),
            width: Math.abs(x - this.startPoint.x),
            height: Math.abs(y - this.startPoint.y)
        };
        
        // Redraw canvas
        this.drawImage();
        this.drawComponents();
        this.drawCurrentRegion();
    }

    /**
     * Handle mouse up
     */
    handleMouseUp(event) {
        if (!this.isDrawing || !this.currentRegion) return;
        
        this.isDrawing = false;
        
        // Only create component if region is large enough
        if (this.currentRegion.width > 20 && this.currentRegion.height > 20) {
            this.showComponentForm();
        }
        
        this.currentRegion = null;
        this.startPoint = null;
    }

    /**
     * Handle canvas click
     */
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if clicking on existing component
        const clickedComponent = this.components.find(component => {
            const { x: compX, y: compY, width, height } = component.region;
            return x >= compX && x <= compX + width && y >= compY && y <= compY + height;
        });
        
        if (clickedComponent) {
            this.selectComponent(clickedComponent);
        } else {
            this.deselectComponent();
        }
    }

    /**
     * Draw current region being drawn
     */
    drawCurrentRegion() {
        if (!this.currentRegion) return;
        
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            this.currentRegion.x,
            this.currentRegion.y,
            this.currentRegion.width,
            this.currentRegion.height
        );
        this.ctx.setLineDash([]);
    }

    /**
     * Show component form
     */
    showComponentForm() {
        this.elements.componentForm.style.display = 'block';
        this.elements.componentName.focus();
    }

    /**
     * Hide component form
     */
    hideComponentForm() {
        this.elements.componentForm.style.display = 'none';
        this.elements.componentName.value = '';
        this.elements.componentDescription.value = '';
        this.elements.componentType.value = 'text';
    }

    /**
     * Save component
     */
    saveComponent() {
        const name = this.elements.componentName.value.trim();
        const type = this.elements.componentType.value;
        const description = this.elements.componentDescription.value.trim();
        
        if (!name) {
            alert('Please enter a component name');
            return;
        }
        
        if (!this.currentRegion) {
            alert('Please draw a region first');
            return;
        }
        
        const component = {
            id: this.generateComponentId(),
            name,
            type,
            description,
            region: { ...this.currentRegion }
        };
        
        this.components.push(component);
        this.updateState();
        this.updateComponentsList();
        this.drawImage();
        this.drawComponents();
        this.hideComponentForm();
        
        // Clear current region
        this.currentRegion = null;
    }

    /**
     * Cancel component creation
     */
    cancelComponent() {
        this.hideComponentForm();
        this.currentRegion = null;
        this.drawImage();
        this.drawComponents();
    }

    /**
     * Select component
     */
    selectComponent(component) {
        this.selectedComponent = component;
        this.drawImage();
        this.drawComponents();
    }

    /**
     * Deselect component
     */
    deselectComponent() {
        this.selectedComponent = null;
        this.drawImage();
        this.drawComponents();
    }

    /**
     * Clear all components
     */
    clearAllComponents() {
        if (this.components.length === 0) return;
        
        if (confirm('Are you sure you want to clear all components?')) {
            this.components = [];
            this.selectedComponent = null;
            this.updateState();
            this.updateComponentsList();
            this.drawImage();
        }
    }

    /**
     * Update components list
     */
    updateComponentsList() {
        if (this.components.length === 0) {
            this.elements.componentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>No components defined yet</p>
                    <small>Click and drag on the image to create your first component</small>
                </div>
            `;
            return;
        }
        
        const componentsHtml = this.components.map((component, index) => `
            <div class="component-item ${component === this.selectedComponent ? 'selected' : ''}" 
                 data-component-id="${component.id}">
                <div class="component-info">
                    <div class="component-name">${component.name}</div>
                    <div class="component-type">${component.type}</div>
                </div>
                <div class="component-actions">
                    <button class="btn btn-sm btn-secondary" onclick="this.selectComponent('${component.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="this.deleteComponent('${component.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        this.elements.componentsList.innerHTML = componentsHtml;
    }

    /**
     * Update state manager
     */
    updateState() {
        this.stateManager.updateStepData('pngComponents', {
            components: this.components,
            isCompleted: this.components.length > 0,
            error: null
        });
        
        // Mark step as complete if we have components
        if (this.components.length > 0 && this.options.onStepComplete) {
            this.options.onStepComplete();
        }
    }

    /**
     * Generate component ID
     */
    generateComponentId() {
        return 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Delete component
     */
    deleteComponent(componentId) {
        const index = this.components.findIndex(comp => comp.id === componentId);
        if (index > -1) {
            this.components.splice(index, 1);
            if (this.selectedComponent && this.selectedComponent.id === componentId) {
                this.selectedComponent = null;
            }
            this.updateState();
            this.updateComponentsList();
            this.drawImage();
            this.drawComponents();
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        // Clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PngComponentDefinitionStep;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.PngComponentDefinitionStep = PngComponentDefinitionStep;
}
