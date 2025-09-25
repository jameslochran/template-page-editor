// Template Page Editor JavaScript Application
// Work Order #8: TextComponent Data Model Structure Integration
// Work Order #13: Accordion Component Data Model Structure Integration

class TemplatePageEditor {
    constructor() {
        this.currentSection = 'editor';
        this.currentTool = null;
        this.templates = [];
        this.currentPage = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTemplates();
        this.setupCanvas();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Toolbar tools
        document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.selectTool(tool);
            });
        });

        // Toolbar actions
        document.querySelectorAll('.toolbar-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Canvas click
        document.getElementById('canvas').addEventListener('click', (e) => {
            if (this.currentTool) {
                this.addElement(e);
            }
        });

        // Create template button
        document.getElementById('create-template').addEventListener('click', () => {
            this.createNewTemplate();
        });

        // Settings
        document.getElementById('theme').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;

        if (section === 'templates') {
            this.renderTemplates();
        }
    }

    selectTool(tool) {
        // Update tool selection
        document.querySelectorAll('.toolbar-btn[data-tool]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');

        this.currentTool = tool;
        this.updateCanvasCursor();
    }

    updateCanvasCursor() {
        const canvas = document.getElementById('canvas');
        if (this.currentTool) {
            canvas.style.cursor = 'crosshair';
            canvas.classList.add('tool-active');
        } else {
            canvas.style.cursor = 'default';
            canvas.classList.remove('tool-active');
        }
    }

    setupCanvas() {
        const canvas = document.getElementById('canvas');
        const placeholder = canvas.querySelector('.canvas-placeholder');
        
        // Hide placeholder when elements are added
        this.observer = new MutationObserver((mutations) => {
            const hasElements = canvas.children.length > 1; // More than just the placeholder
            placeholder.style.display = hasElements ? 'none' : 'block';
        });
        
        this.observer.observe(canvas, { childList: true });
    }

    addElement(event) {
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const element = this.createElement(this.currentTool, x, y);
        canvas.appendChild(element);

        // Clear tool selection after adding element
        this.selectTool(null);
    }

    createElement(type, x, y) {
        const element = document.createElement('div');
        element.className = `canvas-element ${type}-element`;
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        switch (type) {
            case 'text':
                // Create TextComponent using structured data model
                const textComponent = TextComponent.createDefault('Click to edit text');
                const textData = textComponent.toJSON();
                
                // Create rich text editable element
                const textEditor = document.createElement('div');
                textEditor.className = 'text-editor';
                textEditor.contentEditable = true;
                textEditor.innerHTML = textComponent.getAsHtml();
                textEditor.style.width = '200px';
                textEditor.style.minHeight = '30px';
                textEditor.style.border = '1px solid transparent';
                textEditor.style.padding = '5px';
                textEditor.style.borderRadius = '3px';
                textEditor.setAttribute('data-component-id', textData.id);
                textEditor.setAttribute('data-component-type', 'TextComponent');
                
                // Add focus/blur handlers for rich text editing
                textEditor.addEventListener('focus', () => {
                    textEditor.style.border = '1px solid #2563eb';
                    textEditor.style.backgroundColor = '#f8fafc';
                });
                
                textEditor.addEventListener('blur', () => {
                    textEditor.style.border = '1px solid transparent';
                    textEditor.style.backgroundColor = 'transparent';
                    this.updateTextComponentContent(textData.id, textEditor.innerHTML);
                });
                
                textEditor.addEventListener('input', () => {
                    // Real-time content update for better UX
                    this.updateTextComponentContent(textData.id, textEditor.innerHTML);
                });
                
                element.appendChild(textEditor);
                element.style.width = '200px';
                element.style.minHeight = '30px';
                
                // Store component data
                element.setAttribute('data-component', JSON.stringify(textData));
                break;
                
            case 'accordion':
                // Create AccordionComponent using structured data model
                const accordionComponent = AccordionComponent.createDefault(2);
                const accordionData = accordionComponent.toJSON();
                
                // Create accordion HTML structure
                const accordionElement = document.createElement('div');
                accordionElement.className = 'accordion-component';
                accordionElement.setAttribute('data-accordion-data', JSON.stringify(accordionData));
                accordionElement.style.width = '400px';
                accordionElement.style.minHeight = '200px';
                accordionElement.style.border = '1px solid #e2e8f0';
                accordionElement.style.borderRadius = '8px';
                accordionElement.style.backgroundColor = 'white';
                accordionElement.style.padding = '10px';
                
                // Create accordion items
                accordionData.data.items.forEach((item, index) => {
                    const itemElement = this.createAccordionItemElement(item, index);
                    accordionElement.appendChild(itemElement);
                });
                
                // Add accordion controls
                const controlsElement = document.createElement('div');
                controlsElement.className = 'accordion-controls';
                controlsElement.style.marginTop = '10px';
                controlsElement.style.textAlign = 'center';
                
                const addButton = document.createElement('button');
                addButton.textContent = '+ Add Item';
                addButton.className = 'btn btn-sm';
                addButton.style.marginRight = '5px';
                addButton.addEventListener('click', () => {
                    this.addAccordionItem(accordionData.id);
                    this.refreshAccordionElement(accordionElement, accordionData.id);
                });
                
                const removeButton = document.createElement('button');
                removeButton.textContent = '- Remove Item';
                removeButton.className = 'btn btn-sm';
                removeButton.addEventListener('click', () => {
                    this.removeLastAccordionItem(accordionData.id);
                    this.refreshAccordionElement(accordionElement, accordionData.id);
                });
                
                controlsElement.appendChild(addButton);
                controlsElement.appendChild(removeButton);
                accordionElement.appendChild(controlsElement);
                
                element.appendChild(accordionElement);
                element.style.width = '400px';
                element.style.minHeight = '200px';
                
                // Store component data
                element.setAttribute('data-component', JSON.stringify(accordionData));
                break;
                
            case 'image':
                element.innerHTML = '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image</span></div>';
                element.style.width = '200px';
                element.style.height = '150px';
                break;
            case 'button':
                element.innerHTML = '<button class="canvas-button">Button</button>';
                element.style.width = '120px';
                element.style.height = '40px';
                break;
            case 'container':
                element.innerHTML = '<div class="container-element">Container</div>';
                element.style.width = '300px';
                element.style.height = '200px';
                element.style.border = '1px dashed #cbd5e1';
                element.style.backgroundColor = '#f8fafc';
                break;
        }

        // Make element draggable
        this.makeDraggable(element);

        return element;
    }

    makeDraggable(element) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(element.style.left);
            startTop = parseInt(element.style.top);
            element.style.zIndex = '1000';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            element.style.left = `${startLeft + deltaX}px`;
            element.style.top = `${startTop + deltaY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.zIndex = '1';
            }
        });
    }

    handleAction(action) {
        switch (action) {
            case 'preview':
                this.previewPage();
                break;
            case 'save':
                this.saveTemplate();
                break;
        }
    }

    previewPage() {
        const canvas = document.getElementById('canvas');
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Page Preview</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    .canvas-element { position: relative !important; }
                    .text-input { border: none; background: transparent; width: 100%; }
                    .image-placeholder { 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        justify-content: center; 
                        background: #f3f4f6; 
                        border: 1px dashed #d1d5db;
                        height: 100%;
                    }
                    .canvas-button { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; }
                </style>
            </head>
            <body>
                ${canvas.innerHTML}
            </body>
            </html>
        `;
        
        previewWindow.document.write(html);
        previewWindow.document.close();
    }

    saveTemplate() {
        try {
            // Create a new Page instance with structured data
            const page = this.serializeCanvasToPage();
            
            const templateData = {
                id: Date.now(),
                name: `Template ${this.templates.length + 1}`,
                page: page.toJSON(),
                html: document.getElementById('canvas').innerHTML, // Keep for backward compatibility
                createdAt: new Date().toISOString()
            };

            this.templates.push(templateData);
            this.saveTemplatesToStorage();
            this.showNotification('Template saved successfully!');
        } catch (error) {
            console.error('Error saving template:', error);
            this.showNotification('Error saving template: ' + error.message, 'error');
        }
    }

    /**
     * Serialize canvas content to Page data model
     * @returns {Page} Page instance with components
     */
    serializeCanvasToPage() {
        const canvas = document.getElementById('canvas');
        const page = new Page({
            templateId: 'default-template'
        });

        // Extract components from canvas elements
        const canvasElements = canvas.querySelectorAll('.canvas-element');
        canvasElements.forEach((element, index) => {
            const componentData = element.getAttribute('data-component');
            
            if (componentData) {
                try {
                    const component = JSON.parse(componentData);
                    component.order = index + 1;
                    page.addComponent(component);
                } catch (error) {
                    console.warn('Failed to parse component data:', error);
                }
            } else {
                // Fallback for elements without structured data
                const componentType = this.getElementComponentType(element);
                if (componentType) {
                    const component = {
                        id: `component-${Date.now()}-${index}`,
                        type: componentType,
                        data: this.extractElementData(element),
                        order: index + 1
                    };
                    page.addComponent(component);
                }
            }
        });

        return page;
    }

    /**
     * Determine component type from DOM element
     * @param {Element} element - DOM element
     * @returns {string|null} Component type
     */
    getElementComponentType(element) {
        if (element.querySelector('.text-editor')) return 'TextComponent';
        if (element.querySelector('.image-placeholder')) return 'ImageComponent';
        if (element.querySelector('.canvas-button')) return 'ButtonComponent';
        if (element.querySelector('.container-element')) return 'ContainerComponent';
        return null;
    }

    /**
     * Extract data from DOM element
     * @param {Element} element - DOM element
     * @returns {Object} Component data
     */
    extractElementData(element) {
        const textEditor = element.querySelector('.text-editor');
        if (textEditor) {
            return {
                content: {
                    format: 'html',
                    data: textEditor.innerHTML,
                    metadata: {
                        version: '1.0',
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString()
                    }
                }
            };
        }
        
        // Fallback for other component types
        return {
            element: element.innerHTML
        };
    }

    createNewTemplate() {
        this.switchSection('editor');
        this.clearCanvas();
    }

    clearCanvas() {
        const canvas = document.getElementById('canvas');
        canvas.innerHTML = '<div class="canvas-placeholder"><i class="fas fa-mouse-pointer"></i><p>Click on a tool to start building your page</p></div>';
    }

    loadTemplates() {
        const saved = localStorage.getItem('templatePageEditor_templates');
        if (saved) {
            this.templates = JSON.parse(saved);
        }
    }

    saveTemplatesToStorage() {
        localStorage.setItem('templatePageEditor_templates', JSON.stringify(this.templates));
    }

    renderTemplates() {
        const grid = document.getElementById('templates-grid');
        grid.innerHTML = '';

        if (this.templates.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #64748b; grid-column: 1 / -1;">No templates yet. Create your first template!</p>';
            return;
        }

        this.templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <h3>${template.name}</h3>
                <p>Created: ${new Date(template.createdAt).toLocaleDateString()}</p>
                <div class="template-actions">
                    <button class="btn btn-primary" onclick="app.loadTemplate(${template.id})">Load</button>
                    <button class="btn" onclick="app.deleteTemplate(${template.id})">Delete</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    loadTemplate(id) {
        const template = this.templates.find(t => t.id === id);
        if (template) {
            this.switchSection('editor');
            this.clearCanvas();
            
            // Load structured data if available, otherwise fallback to HTML
            if (template.page) {
                this.loadPageFromData(template.page);
            } else if (template.html) {
                // Fallback for legacy templates
                const canvas = document.getElementById('canvas');
                canvas.innerHTML = template.html;
                this.convertLegacyElementsToStructured();
            }
        }
    }

    /**
     * Load page from structured data
     * @param {Object} pageData - Page data object
     */
    loadPageFromData(pageData) {
        try {
            const page = Page.fromJSON(pageData);
            this.currentPage = page;
            
            const canvas = document.getElementById('canvas');
            const orderedComponents = page.getOrderedComponents();
            
            orderedComponents.forEach(component => {
                const element = this.createElementFromComponent(component);
                canvas.appendChild(element);
            });
        } catch (error) {
            console.error('Error loading page data:', error);
            this.showNotification('Error loading template: ' + error.message, 'error');
        }
    }

    /**
     * Create DOM element from component data
     * @param {Object} component - Component data
     * @returns {Element} DOM element
     */
    createElementFromComponent(component) {
        const element = document.createElement('div');
        element.className = `canvas-element ${component.type.toLowerCase()}-element`;
        element.style.position = 'absolute';
        element.style.left = '50px';
        element.style.top = `${50 + (component.order * 60)}px`;
        element.setAttribute('data-component', JSON.stringify(component));

        switch (component.type) {
            case 'TextComponent':
                const textComponent = new TextComponent(component);
                const textEditor = document.createElement('div');
                textEditor.className = 'text-editor';
                textEditor.contentEditable = true;
                textEditor.innerHTML = textComponent.getAsHtml();
                textEditor.style.width = '200px';
                textEditor.style.minHeight = '30px';
                textEditor.style.border = '1px solid transparent';
                textEditor.style.padding = '5px';
                textEditor.style.borderRadius = '3px';
                textEditor.setAttribute('data-component-id', component.id);
                textEditor.setAttribute('data-component-type', 'TextComponent');
                
                // Add event handlers
                textEditor.addEventListener('focus', () => {
                    textEditor.style.border = '1px solid #2563eb';
                    textEditor.style.backgroundColor = '#f8fafc';
                });
                
                textEditor.addEventListener('blur', () => {
                    textEditor.style.border = '1px solid transparent';
                    textEditor.style.backgroundColor = 'transparent';
                    this.updateTextComponentContent(component.id, textEditor.innerHTML);
                });
                
                textEditor.addEventListener('input', () => {
                    this.updateTextComponentContent(component.id, textEditor.innerHTML);
                });
                
                element.appendChild(textEditor);
                break;
                
            case 'ImageComponent':
                element.innerHTML = '<div class="image-placeholder"><i class="fas fa-image"></i><span>Image</span></div>';
                element.style.width = '200px';
                element.style.height = '150px';
                break;
                
            case 'ButtonComponent':
                element.innerHTML = '<button class="canvas-button">Button</button>';
                element.style.width = '120px';
                element.style.height = '40px';
                break;
                
            case 'ContainerComponent':
                element.innerHTML = '<div class="container-element">Container</div>';
                element.style.width = '300px';
                element.style.height = '200px';
                element.style.border = '1px dashed #cbd5e1';
                element.style.backgroundColor = '#f8fafc';
                break;
                
            case 'AccordionComponent':
                const accordionComponent = new AccordionComponent(component);
                const accordionData = accordionComponent.toJSON();
                
                // Create accordion HTML structure
                const accordionElement = document.createElement('div');
                accordionElement.className = 'accordion-component';
                accordionElement.setAttribute('data-accordion-data', JSON.stringify(accordionData));
                accordionElement.style.width = '400px';
                accordionElement.style.minHeight = '200px';
                accordionElement.style.border = '1px solid #e2e8f0';
                accordionElement.style.borderRadius = '8px';
                accordionElement.style.backgroundColor = 'white';
                accordionElement.style.padding = '10px';
                
                // Create accordion items
                accordionData.data.items.forEach((item, index) => {
                    const itemElement = this.createAccordionItemElement(item, index);
                    accordionElement.appendChild(itemElement);
                });
                
                // Add accordion controls
                const controlsElement = document.createElement('div');
                controlsElement.className = 'accordion-controls';
                controlsElement.style.marginTop = '10px';
                controlsElement.style.textAlign = 'center';
                
                const addButton = document.createElement('button');
                addButton.textContent = '+ Add Item';
                addButton.className = 'btn btn-sm';
                addButton.style.marginRight = '5px';
                addButton.addEventListener('click', () => {
                    this.addAccordionItem(accordionData.id);
                    this.refreshAccordionElement(accordionElement, accordionData.id);
                });
                
                const removeButton = document.createElement('button');
                removeButton.textContent = '- Remove Item';
                removeButton.className = 'btn btn-sm';
                removeButton.addEventListener('click', () => {
                    this.removeLastAccordionItem(accordionData.id);
                    this.refreshAccordionElement(accordionElement, accordionData.id);
                });
                
                controlsElement.appendChild(addButton);
                controlsElement.appendChild(removeButton);
                accordionElement.appendChild(controlsElement);
                
                element.appendChild(accordionElement);
                break;
                
            default:
                element.innerHTML = `<div class="unknown-component">Unknown Component: ${component.type}</div>`;
                element.style.width = '200px';
                element.style.height = '50px';
        }

        this.makeDraggable(element);
        return element;
    }

    /**
     * Convert legacy elements to structured data
     */
    convertLegacyElementsToStructured() {
        const canvas = document.getElementById('canvas');
        const elements = canvas.querySelectorAll('.canvas-element');
        
        elements.forEach((element, index) => {
            if (!element.getAttribute('data-component')) {
                const componentType = this.getElementComponentType(element);
                if (componentType) {
                    const component = {
                        id: `legacy-${Date.now()}-${index}`,
                        type: componentType,
                        data: this.extractElementData(element),
                        order: index + 1
                    };
                    element.setAttribute('data-component', JSON.stringify(component));
                }
            }
        });
    }

    /**
     * Update TextComponent content
     * @param {string} componentId - Component ID
     * @param {string} content - New content
     */
    updateTextComponentContent(componentId, content) {
        if (this.currentPage) {
            try {
                this.currentPage.updateTextComponentContent(componentId, content);
            } catch (error) {
                console.warn('Failed to update text component:', error);
            }
        }
    }

    /**
     * Create accordion item element
     * @param {Object} item - Accordion item data
     * @param {number} index - Item index
     * @returns {Element} Accordion item DOM element
     */
    createAccordionItemElement(item, index) {
        const itemElement = document.createElement('div');
        itemElement.className = 'accordion-item';
        itemElement.style.border = '1px solid #e2e8f0';
        itemElement.style.borderRadius = '4px';
        itemElement.style.marginBottom = '8px';
        itemElement.style.overflow = 'hidden';

        // Create header
        const headerElement = document.createElement('div');
        headerElement.className = 'accordion-header';
        headerElement.style.padding = '12px';
        headerElement.style.backgroundColor = '#f8fafc';
        headerElement.style.cursor = 'pointer';
        headerElement.style.display = 'flex';
        headerElement.style.justifyContent = 'space-between';
        headerElement.style.alignItems = 'center';
        headerElement.setAttribute('data-item-id', item.id);

        const headerText = document.createElement('input');
        headerText.type = 'text';
        headerText.value = item.header;
        headerText.style.border = 'none';
        headerText.style.background = 'transparent';
        headerText.style.fontWeight = '600';
        headerText.style.width = '100%';
        headerText.style.outline = 'none';
        headerText.addEventListener('blur', () => {
            this.updateAccordionItemHeader(item.id, headerText.value);
        });

        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = item.isOpen ? '▼' : '▶';
        toggleIcon.style.fontSize = '12px';
        toggleIcon.style.color = '#64748b';

        headerElement.appendChild(headerText);
        headerElement.appendChild(toggleIcon);

        // Create content
        const contentElement = document.createElement('div');
        contentElement.className = 'accordion-content';
        contentElement.style.padding = '12px';
        contentElement.style.backgroundColor = 'white';
        contentElement.style.display = item.isOpen ? 'block' : 'none';

        const contentEditor = document.createElement('div');
        contentEditor.className = 'accordion-content-editor';
        contentEditor.contentEditable = true;
        contentEditor.innerHTML = item.content.data;
        contentEditor.style.minHeight = '50px';
        contentEditor.style.border = '1px solid transparent';
        contentEditor.style.borderRadius = '4px';
        contentEditor.style.padding = '8px';
        contentEditor.style.outline = 'none';
        contentEditor.setAttribute('data-item-id', item.id);

        contentEditor.addEventListener('focus', () => {
            contentEditor.style.border = '1px solid #2563eb';
            contentEditor.style.backgroundColor = '#f8fafc';
        });

        contentEditor.addEventListener('blur', () => {
            contentEditor.style.border = '1px solid transparent';
            contentEditor.style.backgroundColor = 'transparent';
            this.updateAccordionItemContent(item.id, contentEditor.innerHTML);
        });

        contentEditor.addEventListener('input', () => {
            this.updateAccordionItemContent(item.id, contentEditor.innerHTML);
        });

        contentElement.appendChild(contentEditor);

        // Add click handler for toggle
        headerElement.addEventListener('click', () => {
            this.toggleAccordionItem(item.id);
            this.refreshAccordionItemElement(itemElement, item.id);
        });

        itemElement.appendChild(headerElement);
        itemElement.appendChild(contentElement);

        return itemElement;
    }

    /**
     * Refresh accordion element after data changes
     * @param {Element} accordionElement - Accordion DOM element
     * @param {string} componentId - Component ID
     */
    refreshAccordionElement(accordionElement, componentId) {
        if (this.currentPage) {
            const accordionComponent = this.currentPage.getAccordionComponentById(componentId);
            if (accordionComponent) {
                // Update data attribute
                accordionElement.setAttribute('data-accordion-data', JSON.stringify(accordionComponent.toJSON()));
                
                // Remove existing items (except controls)
                const existingItems = accordionElement.querySelectorAll('.accordion-item');
                existingItems.forEach(item => item.remove());
                
                // Add updated items
                const controlsElement = accordionElement.querySelector('.accordion-controls');
                accordionComponent.getOrderedItems().forEach((item, index) => {
                    const itemElement = this.createAccordionItemElement(item, index);
                    accordionElement.insertBefore(itemElement, controlsElement);
                });
            }
        }
    }

    /**
     * Refresh accordion item element
     * @param {Element} itemElement - Item DOM element
     * @param {string} itemId - Item ID
     */
    refreshAccordionItemElement(itemElement, itemId) {
        if (this.currentPage) {
            // Find the component ID from the accordion element
            const accordionElement = itemElement.closest('.accordion-component');
            if (accordionElement) {
                const componentData = JSON.parse(accordionElement.getAttribute('data-accordion-data'));
                const accordionComponent = this.currentPage.getAccordionComponentById(componentData.id);
                
                if (accordionComponent) {
                    const item = accordionComponent.getItemById(itemId);
                    if (item) {
                        const contentElement = itemElement.querySelector('.accordion-content');
                        const toggleIcon = itemElement.querySelector('.accordion-header span');
                        
                        contentElement.style.display = item.isOpen ? 'block' : 'none';
                        toggleIcon.textContent = item.isOpen ? '▼' : '▶';
                    }
                }
            }
        }
    }

    /**
     * Add accordion item
     * @param {string} componentId - Component ID
     */
    addAccordionItem(componentId) {
        if (this.currentPage) {
            try {
                this.currentPage.addAccordionItem(componentId, {
                    header: 'New Accordion Item',
                    content: {
                        format: 'html',
                        data: '<p>Click to edit content</p>'
                    }
                });
            } catch (error) {
                console.error('Failed to add accordion item:', error);
                this.showNotification('Failed to add accordion item: ' + error.message, 'error');
            }
        }
    }

    /**
     * Remove last accordion item
     * @param {string} componentId - Component ID
     */
    removeLastAccordionItem(componentId) {
        if (this.currentPage) {
            try {
                const accordionComponent = this.currentPage.getAccordionComponentById(componentId);
                if (accordionComponent && accordionComponent.getItemCount() > 1) {
                    const lastItem = accordionComponent.getOrderedItems().pop();
                    this.currentPage.removeAccordionItem(componentId, lastItem.id);
                } else {
                    this.showNotification('Cannot remove the last accordion item', 'error');
                }
            } catch (error) {
                console.error('Failed to remove accordion item:', error);
                this.showNotification('Failed to remove accordion item: ' + error.message, 'error');
            }
        }
    }

    /**
     * Toggle accordion item
     * @param {string} itemId - Item ID
     */
    toggleAccordionItem(itemId) {
        if (this.currentPage) {
            try {
                // Find the component ID from the accordion element
                const accordionElements = document.querySelectorAll('.accordion-component');
                for (const accordionElement of accordionElements) {
                    const componentData = JSON.parse(accordionElement.getAttribute('data-accordion-data'));
                    const accordionComponent = this.currentPage.getAccordionComponentById(componentData.id);
                    
                    if (accordionComponent && accordionComponent.getItemById(itemId)) {
                        this.currentPage.toggleAccordionItem(componentData.id, itemId);
                        break;
                    }
                }
            } catch (error) {
                console.error('Failed to toggle accordion item:', error);
                this.showNotification('Failed to toggle accordion item: ' + error.message, 'error');
            }
        }
    }

    /**
     * Update accordion item header
     * @param {string} itemId - Item ID
     * @param {string} header - New header text
     */
    updateAccordionItemHeader(itemId, header) {
        if (this.currentPage) {
            try {
                // Find the component ID from the accordion element
                const accordionElements = document.querySelectorAll('.accordion-component');
                for (const accordionElement of accordionElements) {
                    const componentData = JSON.parse(accordionElement.getAttribute('data-accordion-data'));
                    const accordionComponent = this.currentPage.getAccordionComponentById(componentData.id);
                    
                    if (accordionComponent && accordionComponent.getItemById(itemId)) {
                        this.currentPage.updateAccordionItem(componentData.id, itemId, { header });
                        break;
                    }
                }
            } catch (error) {
                console.error('Failed to update accordion item header:', error);
                this.showNotification('Failed to update header: ' + error.message, 'error');
            }
        }
    }

    /**
     * Update accordion item content
     * @param {string} itemId - Item ID
     * @param {string} content - New content
     */
    updateAccordionItemContent(itemId, content) {
        if (this.currentPage) {
            try {
                // Find the component ID from the accordion element
                const accordionElements = document.querySelectorAll('.accordion-component');
                for (const accordionElement of accordionElements) {
                    const componentData = JSON.parse(accordionElement.getAttribute('data-accordion-data'));
                    const accordionComponent = this.currentPage.getAccordionComponentById(componentData.id);
                    
                    if (accordionComponent && accordionComponent.getItemById(itemId)) {
                        this.currentPage.updateAccordionItem(componentData.id, itemId, {
                            content: {
                                format: 'html',
                                data: content,
                                metadata: {
                                    version: '1.0',
                                    created: new Date().toISOString(),
                                    lastModified: new Date().toISOString()
                                }
                            }
                        });
                        break;
                    }
                }
            } catch (error) {
                console.error('Failed to update accordion item content:', error);
                this.showNotification('Failed to update content: ' + error.message, 'error');
            }
        }
    }

    deleteTemplate(id) {
        if (confirm('Are you sure you want to delete this template?')) {
            this.templates = this.templates.filter(t => t.id !== id);
            this.saveTemplatesToStorage();
            this.renderTemplates();
            this.showNotification('Template deleted successfully!');
        }
    }

    changeTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('templatePageEditor_theme', theme);
    }

    showNotification(message, type = 'success') {
        // Create a simple notification
        const notification = document.createElement('div');
        const backgroundColor = type === 'error' ? '#ef4444' : '#10b981';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, type === 'error' ? 5000 : 3000);
    }
}

// Initialize the application
const app = new TemplatePageEditor();

// Load saved theme
const savedTheme = localStorage.getItem('templatePageEditor_theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme').value = savedTheme;
}
