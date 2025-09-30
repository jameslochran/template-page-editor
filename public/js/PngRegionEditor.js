/**
 * PngRegionEditor - Work Order 43
 * 
 * Interactive editor for defining editable component regions on PNG templates.
 * Provides canvas-based drawing tools, region manipulation, and component property editing.
 */

class PngRegionEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`PngRegionEditor: Container element with ID "${containerId}" not found.`);
            return;
        }

        this.options = {
            minRegionSize: 20,
            handleSize: 8,
            gridSize: 10,
            snapToGrid: false,
            showGrid: false,
            onRegionAdded: () => {},
            onRegionUpdated: () => {},
            onRegionDeleted: () => {},
            onTemplateSaved: () => {},
            ...options
        };

        // Editor state
        this.template = null;
        this.image = null;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.isDragging = false;
        this.isResizing = false;
        this.currentTool = 'select';
        this.selectedRegion = null;
        this.hoveredRegion = null;
        this.dragStart = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };
        this.tempRect = null;

        // UI elements
        this.toolbar = null;
        this.sidebar = null;
        this.canvasContainer = null;
        this.regionList = null;
        this.propertyPanel = null;

        this.init();
    }

    /**
     * Initialize the editor
     */
    init() {
        this.render();
        this.setupEventListeners();
        this.setupCanvas();
    }

    /**
     * Render the editor UI
     */
    render() {
        this.container.innerHTML = `
            <div class="png-editor">
                <div class="png-editor-toolbar">
                    <div class="toolbar-section">
                        <button class="tool-btn active" data-tool="select" title="Select Tool">
                            <i class="fas fa-mouse-pointer"></i>
                        </button>
                        <button class="tool-btn" data-tool="draw" title="Draw Region">
                            <i class="fas fa-vector-square"></i>
                        </button>
                        <button class="tool-btn" data-tool="pan" title="Pan Tool">
                            <i class="fas fa-hand-paper"></i>
                        </button>
                    </div>
                    <div class="toolbar-section">
                        <button class="tool-btn" id="zoom-in" title="Zoom In">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button class="tool-btn" id="zoom-out" title="Zoom Out">
                            <i class="fas fa-search-minus"></i>
                        </button>
                        <button class="tool-btn" id="zoom-fit" title="Fit to Screen">
                            <i class="fas fa-expand-arrows-alt"></i>
                        </button>
                        <span class="zoom-level">${Math.round(this.zoom * 100)}%</span>
                    </div>
                    <div class="toolbar-section">
                        <button class="tool-btn" id="show-grid" title="Toggle Grid">
                            <i class="fas fa-th"></i>
                        </button>
                        <button class="tool-btn" id="snap-grid" title="Snap to Grid">
                            <i class="fas fa-magnet"></i>
                        </button>
                    </div>
                    <div class="toolbar-section">
                        <button class="tool-btn" id="load-test-image" title="Load Test Image">
                            <i class="fas fa-image"></i> Load Test
                        </button>
                        <button class="tool-btn" id="save-template" title="Save Template">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>
                
                <div class="png-editor-content">
                    <div class="png-editor-canvas-container">
                        <canvas id="png-editor-canvas"></canvas>
                        <div class="canvas-overlay">
                            <div class="canvas-info">
                                <span id="canvas-info">No image loaded</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="png-editor-sidebar">
                        <div class="sidebar-section">
                            <h3>Component Regions</h3>
                            <div class="region-list" id="region-list">
                                <div class="empty-state">No regions defined</div>
                            </div>
                        </div>
                        
                        <div class="sidebar-section" id="property-panel" style="display: none;">
                            <h3>Region Properties</h3>
                            <div class="property-form" id="property-form">
                                <!-- Property form will be populated dynamically -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Get references to UI elements
        this.toolbar = this.container.querySelector('.png-editor-toolbar');
        this.sidebar = this.container.querySelector('.png-editor-sidebar');
        this.canvasContainer = this.container.querySelector('.png-editor-canvas-container');
        this.canvas = this.container.querySelector('#png-editor-canvas');
        this.regionList = this.container.querySelector('#region-list');
        this.propertyPanel = this.container.querySelector('#property-panel');
        this.propertyForm = this.container.querySelector('#property-form');
        this.canvasInfo = this.container.querySelector('#canvas-info');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toolbar events
        this.toolbar.addEventListener('click', (e) => {
            if (e.target.closest('.tool-btn')) {
                const btn = e.target.closest('.tool-btn');
                const tool = btn.dataset.tool;
                if (tool) {
                    this.setTool(tool);
                }
            }
        });

        // Zoom controls
        this.container.querySelector('#zoom-in').addEventListener('click', () => this.zoomIn());
        this.container.querySelector('#zoom-out').addEventListener('click', () => this.zoomOut());
        this.container.querySelector('#zoom-fit').addEventListener('click', () => this.zoomToFit());
        this.container.querySelector('#show-grid').addEventListener('click', () => this.toggleGrid());
        this.container.querySelector('#snap-grid').addEventListener('click', () => this.toggleSnapToGrid());
        this.container.querySelector('#load-test-image').addEventListener('click', () => this.loadTestImage());
        this.container.querySelector('#save-template').addEventListener('click', () => this.saveTemplate());

        // Canvas events
        this.setupCanvasEvents();
    }

    /**
     * Setup canvas event listeners
     */
    setupCanvasEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Setup canvas context
     */
    setupCanvas() {
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const rect = this.canvasContainer.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.redraw();
    }

    /**
     * Load a test image for demonstration
     */
    loadTestImage() {
        this.loadImage('/images/test-template.svg', 'Test Template');
    }

    /**
     * Load a PNG image into the editor
     * @param {string} imageUrl - URL of the image to load
     * @param {string} name - Template name
     */
    async loadImage(imageUrl, name = 'Untitled Template') {
        return new Promise((resolve, reject) => {
            this.image = new Image();
            this.image.onload = () => {
                this.template = new PngTemplate({
                    name,
                    imageUrl,
                    imageWidth: this.image.width,
                    imageHeight: this.image.height
                });
                
                this.updateCanvasInfo();
                this.zoomToFit();
                this.redraw();
                resolve(this.template);
            };
            this.image.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            this.image.src = imageUrl;
        });
    }

    /**
     * Set the current tool
     * @param {string} tool - Tool name
     */
    setTool(tool) {
        this.currentTool = tool;
        
        // Update toolbar UI
        this.toolbar.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.toolbar.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
        
        // Update cursor
        this.updateCursor();
    }

    /**
     * Update canvas cursor based on current tool and state
     */
    updateCursor() {
        if (this.isResizing && this.resizeHandle) {
            this.canvas.style.cursor = DrawingUtils.getResizeCursor(this.resizeHandle);
        } else if (this.currentTool === 'draw') {
            this.canvas.style.cursor = 'crosshair';
        } else if (this.currentTool === 'pan') {
            this.canvas.style.cursor = 'grab';
        } else if (this.hoveredRegion) {
            this.canvas.style.cursor = 'move';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    /**
     * Handle mouse down events
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const canvasPos = DrawingUtils.screenToCanvas(x, y, this.canvas, this.zoom, this.pan.x, this.pan.y);
        
        this.dragStart = { x: canvasPos.x, y: canvasPos.y };
        
        if (this.currentTool === 'draw') {
            this.startDrawing(canvasPos);
        } else if (this.currentTool === 'select') {
            this.handleSelectMouseDown(canvasPos);
        } else if (this.currentTool === 'pan') {
            this.startPanning();
        }
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const canvasPos = DrawingUtils.screenToCanvas(x, y, this.canvas, this.zoom, this.pan.x, this.pan.y);
        
        if (this.isDrawing) {
            this.updateDrawing(canvasPos);
        } else if (this.isDragging) {
            this.updateDragging(canvasPos);
        } else if (this.isResizing) {
            this.updateResizing(canvasPos);
        } else if (this.currentTool === 'pan' && e.buttons === 1) {
            this.updatePanning(x, y);
        } else {
            this.updateHover(canvasPos);
        }
    }

    /**
     * Handle mouse up events
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseUp(e) {
        if (this.isDrawing) {
            this.finishDrawing();
        } else if (this.isDragging) {
            this.finishDragging();
        } else if (this.isResizing) {
            this.finishResizing();
        }
        
        this.isDrawing = false;
        this.isDragging = false;
        this.isResizing = false;
        this.updateCursor();
    }

    /**
     * Handle wheel events for zooming
     * @param {WheelEvent} e - Wheel event
     */
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = DrawingUtils.constrain(this.zoom * zoomFactor, 0.1, 5);
        
        // Zoom towards mouse position
        const zoomRatio = newZoom / this.zoom;
        this.pan.x = x - (x - this.pan.x) * zoomRatio;
        this.pan.y = y - (y - this.pan.y) * zoomRatio;
        this.zoom = newZoom;
        
        this.updateZoomDisplay();
        this.redraw();
    }

    /**
     * Start drawing a new region
     * @param {Object} pos - Canvas position
     */
    startDrawing(pos) {
        this.isDrawing = true;
        this.tempRect = {
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0
        };
    }

    /**
     * Update drawing of temporary rectangle
     * @param {Object} pos - Canvas position
     */
    updateDrawing(pos) {
        if (this.tempRect) {
            const rect = DrawingUtils.normalizeRect(
                this.dragStart.x, this.dragStart.y, pos.x, pos.y
            );
            this.tempRect = rect;
            this.redraw();
        }
    }

    /**
     * Finish drawing and create new region
     */
    finishDrawing() {
        if (this.tempRect && this.tempRect.width > this.options.minRegionSize && 
            this.tempRect.height > this.options.minRegionSize) {
            
            const region = ComponentRegion.create(
                this.tempRect.x,
                this.tempRect.y,
                this.tempRect.width,
                this.tempRect.height,
                'text' // Default component type
            );
            
            this.template.addRegion(region);
            this.selectRegion(region.id);
            this.updateRegionList();
            this.options.onRegionAdded(region);
        }
        
        this.tempRect = null;
        this.redraw();
    }

    /**
     * Handle select tool mouse down
     * @param {Object} pos - Canvas position
     */
    handleSelectMouseDown(pos) {
        const region = this.template.getTopRegionAtPoint(pos.x, pos.y);
        
        if (region) {
            // Check for resize handle
            this.resizeHandle = DrawingUtils.getResizeHandle(
                pos.x, pos.y, region.x, region.y, region.width, region.height, this.options.handleSize
            );
            
            if (this.resizeHandle) {
                this.startResizing(region);
            } else {
                this.startDragging(region);
            }
        } else {
            this.clearSelection();
        }
    }

    /**
     * Start dragging a region
     * @param {ComponentRegion} region - Region to drag
     */
    startDragging(region) {
        this.isDragging = true;
        this.selectedRegion = region;
        this.selectRegion(region.id);
        this.updateCursor();
    }

    /**
     * Update dragging
     * @param {Object} pos - Canvas position
     */
    updateDragging(pos) {
        if (this.selectedRegion) {
            const deltaX = pos.x - this.dragStart.x;
            const deltaY = pos.y - this.dragStart.y;
            
            this.selectedRegion.move(deltaX, deltaY);
            this.dragStart = pos;
            this.redraw();
        }
    }

    /**
     * Finish dragging
     */
    finishDragging() {
        if (this.selectedRegion) {
            this.options.onRegionUpdated(this.selectedRegion);
        }
    }

    /**
     * Start resizing a region
     * @param {ComponentRegion} region - Region to resize
     */
    startResizing(region) {
        this.isResizing = true;
        this.selectedRegion = region;
        this.selectRegion(region.id);
        this.updateCursor();
    }

    /**
     * Update resizing
     * @param {Object} pos - Canvas position
     */
    updateResizing(pos) {
        if (this.selectedRegion && this.resizeHandle) {
            const deltaX = pos.x - this.dragStart.x;
            const deltaY = pos.y - this.dragStart.y;
            
            const newBounds = DrawingUtils.applyResize(
                this.selectedRegion.getBounds(),
                this.resizeHandle,
                deltaX,
                deltaY,
                this.options.minRegionSize
            );
            
            this.selectedRegion.updateBounds(
                newBounds.x, newBounds.y, newBounds.width, newBounds.height
            );
            
            this.dragStart = pos;
            this.redraw();
        }
    }

    /**
     * Finish resizing
     */
    finishResizing() {
        if (this.selectedRegion) {
            this.options.onRegionUpdated(this.selectedRegion);
        }
        this.resizeHandle = null;
    }

    /**
     * Start panning
     */
    startPanning() {
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * Update panning
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     */
    updatePanning(x, y) {
        // Implementation for panning
        this.redraw();
    }

    /**
     * Update hover state
     * @param {Object} pos - Canvas position
     */
    updateHover(pos) {
        const region = this.template.getTopRegionAtPoint(pos.x, pos.y);
        
        if (region !== this.hoveredRegion) {
            this.hoveredRegion = region;
            this.updateCursor();
            this.redraw();
        }
    }

    /**
     * Select a region
     * @param {string} regionId - Region ID
     */
    selectRegion(regionId) {
        this.template.selectRegion(regionId);
        this.selectedRegion = this.template.getSelectedRegion();
        this.updateRegionList();
        this.updatePropertyPanel();
        this.redraw();
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.template.clearSelection();
        this.selectedRegion = null;
        this.updateRegionList();
        this.updatePropertyPanel();
        this.redraw();
    }

    /**
     * Delete selected region
     */
    deleteSelectedRegion() {
        if (this.selectedRegion) {
            const regionId = this.selectedRegion.id;
            this.template.removeRegion(regionId);
            this.selectedRegion = null;
            this.updateRegionList();
            this.updatePropertyPanel();
            this.redraw();
            this.options.onRegionDeleted(regionId);
        }
    }

    /**
     * Update region list in sidebar
     */
    updateRegionList() {
        if (!this.template) return;
        
        if (this.template.regions.length === 0) {
            this.regionList.innerHTML = '<div class="empty-state">No regions defined</div>';
            return;
        }
        
        this.regionList.innerHTML = this.template.regions.map(region => {
            const display = region.getComponentTypeDisplay();
            const isSelected = region.isSelected ? 'selected' : '';
            
            return `
                <div class="region-item ${isSelected}" data-region-id="${region.id}">
                    <div class="region-icon" style="color: ${display?.color || '#666'}">
                        <i class="${display?.icon || 'fas fa-square'}"></i>
                    </div>
                    <div class="region-info">
                        <div class="region-name">${region.getDisplayName()}</div>
                        <div class="region-type">${display?.name || region.componentType}</div>
                    </div>
                    <div class="region-actions">
                        <button class="btn-icon" onclick="pngRegionEditor.deleteRegion('${region.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        this.regionList.querySelectorAll('.region-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.region-actions')) {
                    const regionId = item.dataset.regionId;
                    this.selectRegion(regionId);
                }
            });
        });
    }

    /**
     * Update property panel
     */
    updatePropertyPanel() {
        if (!this.selectedRegion) {
            this.propertyPanel.style.display = 'none';
            return;
        }
        
        this.propertyPanel.style.display = 'block';
        this.renderPropertyForm();
    }

    /**
     * Render property form for selected region
     */
    renderPropertyForm() {
        const region = this.selectedRegion;
        const componentType = window.ComponentTypeRegistry.getComponentType(region.componentType);
        
        if (!componentType) return;
        
        this.propertyForm.innerHTML = `
            <div class="form-group">
                <label>Component Type</label>
                <select id="component-type" class="form-control">
                    ${window.ComponentTypeRegistry.getComponentTypeOptions().map(option => 
                        `<option value="${option.value}" ${option.value === region.componentType ? 'selected' : ''}>
                            ${option.label}
                        </option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Label</label>
                <input type="text" id="region-label" class="form-control" value="${region.label || ''}" 
                       placeholder="Region label">
            </div>
            
            <div class="form-group">
                <label>Position & Size</label>
                <div class="position-controls">
                    <div class="control-row">
                        <label>X:</label>
                        <input type="number" id="region-x" class="form-control" value="${region.x}">
                    </div>
                    <div class="control-row">
                        <label>Y:</label>
                        <input type="number" id="region-y" class="form-control" value="${region.y}">
                    </div>
                    <div class="control-row">
                        <label>Width:</label>
                        <input type="number" id="region-width" class="form-control" value="${region.width}">
                    </div>
                    <div class="control-row">
                        <label>Height:</label>
                        <input type="number" id="region-height" class="form-control" value="${region.height}">
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>Default Values</label>
                <div id="default-values-form">
                    ${this.renderDefaultValuesForm(componentType.defaultValuesSchema, region.defaultValues)}
                </div>
            </div>
        `;
        
        this.setupPropertyFormEvents();
    }

    /**
     * Render default values form
     * @param {Object} schema - Default values schema
     * @param {Object} values - Current values
     * @returns {string} HTML form
     */
    renderDefaultValuesForm(schema, values) {
        return Object.entries(schema).map(([key, config]) => {
            const value = values[key] || config.default || '';
            
            if (config.options) {
                return `
                    <div class="form-group">
                        <label>${key.charAt(0).toUpperCase() + key.slice(1)}</label>
                        <select class="form-control" data-key="${key}">
                            ${config.options.map(option => 
                                `<option value="${option}" ${option === value ? 'selected' : ''}>${option}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            } else if (config.type === 'number') {
                return `
                    <div class="form-group">
                        <label>${key.charAt(0).toUpperCase() + key.slice(1)}</label>
                        <input type="number" class="form-control" data-key="${key}" 
                               value="${value}" min="${config.min || ''}" max="${config.max || ''}">
                    </div>
                `;
            } else {
                return `
                    <div class="form-group">
                        <label>${key.charAt(0).toUpperCase() + key.slice(1)}</label>
                        <input type="text" class="form-control" data-key="${key}" value="${value}">
                    </div>
                `;
            }
        }).join('');
    }

    /**
     * Setup property form event listeners
     */
    setupPropertyFormEvents() {
        // Component type change
        this.propertyForm.querySelector('#component-type').addEventListener('change', (e) => {
            this.selectedRegion.updateComponentType(e.target.value);
            this.renderPropertyForm(); // Re-render to update default values form
            this.updateRegionList();
            this.redraw();
        });
        
        // Label change
        this.propertyForm.querySelector('#region-label').addEventListener('input', (e) => {
            this.selectedRegion.setLabel(e.target.value);
            this.updateRegionList();
        });
        
        // Position and size changes
        ['x', 'y', 'width', 'height'].forEach(prop => {
            const input = this.propertyForm.querySelector(`#region-${prop}`);
            if (input) {
                input.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (prop === 'x' || prop === 'y') {
                        this.selectedRegion[prop] = value;
                    } else {
                        this.selectedRegion[prop] = Math.max(this.options.minRegionSize, value);
                    }
                    this.redraw();
                });
            }
        });
        
        // Default values changes
        this.propertyForm.querySelectorAll('[data-key]').forEach(input => {
            input.addEventListener('input', (e) => {
                const key = e.target.dataset.key;
                let value = e.target.value;
                
                // Convert to appropriate type
                const schema = window.ComponentTypeRegistry.getDefaultValuesSchema(this.selectedRegion.componentType);
                if (schema && schema[key] && schema[key].type === 'number') {
                    value = parseFloat(value) || 0;
                }
                
                this.selectedRegion.updateDefaultValues({ [key]: value });
            });
        });
    }

    /**
     * Delete a region
     * @param {string} regionId - Region ID
     */
    deleteRegion(regionId) {
        if (confirm('Are you sure you want to delete this region?')) {
            this.template.removeRegion(regionId);
            if (this.selectedRegion && this.selectedRegion.id === regionId) {
                this.selectedRegion = null;
                this.updatePropertyPanel();
            }
            this.updateRegionList();
            this.redraw();
            this.options.onRegionDeleted(regionId);
        }
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.zoom = DrawingUtils.constrain(this.zoom * 1.2, 0.1, 5);
        this.updateZoomDisplay();
        this.redraw();
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.zoom = DrawingUtils.constrain(this.zoom / 1.2, 0.1, 5);
        this.updateZoomDisplay();
        this.redraw();
    }

    /**
     * Zoom to fit image
     */
    zoomToFit() {
        if (!this.image) return;
        
        const containerRect = this.canvasContainer.getBoundingClientRect();
        const scaleX = (containerRect.width - 40) / this.image.width;
        const scaleY = (containerRect.height - 40) / this.image.height;
        this.zoom = Math.min(scaleX, scaleY, 1);
        
        // Center the image
        this.pan.x = (containerRect.width - this.image.width * this.zoom) / 2;
        this.pan.y = (containerRect.height - this.image.height * this.zoom) / 2;
        
        this.updateZoomDisplay();
        this.redraw();
    }

    /**
     * Update zoom display
     */
    updateZoomDisplay() {
        const zoomDisplay = this.container.querySelector('.zoom-level');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }

    /**
     * Toggle grid display
     */
    toggleGrid() {
        this.options.showGrid = !this.options.showGrid;
        this.redraw();
    }

    /**
     * Toggle snap to grid
     */
    toggleSnapToGrid() {
        this.options.snapToGrid = !this.options.snapToGrid;
    }

    /**
     * Update canvas info display
     */
    updateCanvasInfo() {
        if (this.template) {
            this.canvasInfo.textContent = `${this.template.name} (${this.template.imageWidth} × ${this.template.imageHeight})`;
        } else {
            this.canvasInfo.textContent = 'No image loaded';
        }
    }

    /**
     * Redraw the canvas
     */
    redraw() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context
        this.ctx.save();
        
        // Apply zoom and pan
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.pan.x / this.zoom, this.pan.y / this.zoom);
        
        // Draw image
        if (this.image) {
            this.ctx.drawImage(this.image, 0, 0);
        }
        
        // Draw grid
        if (this.options.showGrid) {
            this.drawGrid();
        }
        
        // Draw regions
        if (this.template) {
            this.template.regions.forEach(region => {
                this.drawRegion(region);
            });
        }
        
        // Draw temporary rectangle
        if (this.tempRect) {
            this.drawTempRect();
        }
        
        // Restore context
        this.ctx.restore();
    }

    /**
     * Draw grid
     */
    drawGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1 / this.zoom;
        
        const gridSize = this.options.gridSize;
        const startX = Math.floor(-this.pan.x / this.zoom / gridSize) * gridSize;
        const startY = Math.floor(-this.pan.y / this.zoom / gridSize) * gridSize;
        const endX = startX + (this.canvas.width / this.zoom) + gridSize;
        const endY = startY + (this.canvas.height / this.zoom) + gridSize;
        
        for (let x = startX; x < endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        for (let y = startY; y < endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    /**
     * Draw a component region
     * @param {ComponentRegion} region - Region to draw
     */
    drawRegion(region) {
        if (!region.isVisible) return;
        
        const display = region.getComponentTypeDisplay();
        const color = display?.color || '#3b82f6';
        const isSelected = region.isSelected;
        const isHovered = region === this.hoveredRegion;
        
        // Draw region rectangle
        DrawingUtils.drawRect(this.ctx, region.x, region.y, region.width, region.height, {
            fillColor: isSelected ? `${color}20` : `${color}10`,
            strokeColor: color,
            strokeWidth: isSelected ? 3 : 1,
            strokeDash: isHovered ? [5, 5] : null
        });
        
        // Draw resize handles for selected region
        if (isSelected) {
            DrawingUtils.drawResizeHandles(this.ctx, region.x, region.y, region.width, region.height, {
                handleSize: this.options.handleSize,
                handleColor: '#ffffff',
                handleBorder: color,
                borderWidth: 2
            });
        }
        
        // Draw region label
        if (region.label || display) {
            const label = region.label || display.name;
            DrawingUtils.drawText(this.ctx, label, region.x + 5, region.y + 15, {
                fontSize: 12,
                color: '#ffffff',
                backgroundColor: color,
                padding: 2
            });
        }
    }

    /**
     * Draw temporary rectangle
     */
    drawTempRect() {
        if (this.tempRect) {
            DrawingUtils.drawRect(this.ctx, this.tempRect.x, this.tempRect.y, this.tempRect.width, this.tempRect.height, {
                fillColor: '#3b82f620',
                strokeColor: '#3b82f6',
                strokeWidth: 2,
                strokeDash: [5, 5]
            });
        }
    }

    /**
     * Save template
     */
    saveTemplate() {
        if (!this.template) {
            alert('No template to save');
            return;
        }
        
        // Validate regions
        const validation = this.template.validateRegions();
        if (!validation.isValid) {
            alert('Template has validation errors:\n' + validation.errors.join('\n'));
            return;
        }
        
        this.options.onTemplateSaved(this.template);
    }

    /**
     * Get the current template
     * @returns {PngTemplate|null} Current template
     */
    getTemplate() {
        return this.template;
    }

    /**
     * Set the template
     * @param {PngTemplate} template - Template to set
     */
    setTemplate(template) {
        this.template = template;
        this.updateRegionList();
        this.updatePropertyPanel();
        this.updateCanvasInfo();
        this.redraw();
    }

    /**
     * Destroy the editor
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Make PngRegionEditor available globally
window.PngRegionEditor = PngRegionEditor;
