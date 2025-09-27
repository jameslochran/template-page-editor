// Template Page Editor JavaScript Application
// Work Order #8: TextComponent Data Model Structure Integration
// Work Order #13: Accordion Component Data Model Structure Integration
// Work Order #18: CardComponent Data Model Structure and Validation
// Work Order #23: Banner Component Data Model Structure
// Work Order #24: LinkGroupComponent Data Model Structure

class TemplatePageEditor {
    constructor() {
        this.currentSection = 'editor';
        this.currentTool = null;
        this.templates = [];
        this.currentPage = null;
        this.selectedComponentId = null; // Track currently selected component
        this.activeComponent = null; // Track currently active component for editing
        this.pageEditor = null; // PageEditor instance
        this.pageId = null; // Current page ID for saving
        this.hasUnsavedChanges = false; // Track unsaved changes
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTemplates();
        this.setupCanvas();
        this.setupStateManagement();
        this.setupUnsavedChangesWarning();
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

        // Template actions (using event delegation for dynamically created elements)
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="load-template"]')) {
                const templateId = e.target.dataset.templateId;
                this.loadTemplate(templateId);
            } else if (e.target.matches('[data-action="delete-template"]')) {
                const templateId = e.target.dataset.templateId;
                this.deleteTemplate(templateId);
            }
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
        
        // Only add active class if tool is not null and element exists
        if (tool) {
            const toolElement = document.querySelector(`[data-tool="${tool}"]`);
            if (toolElement) {
                toolElement.classList.add('active');
            }
        }

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

    // =====================================================
    // GLOBAL STATE MANAGEMENT
    // =====================================================

    /**
     * Setup state management system
     */
    setupStateManagement() {
        // Initialize with PageStateManager if available
        if (window.PageStateManager) {
            this.initializeStateManager();
        }
    }

    /**
     * Initialize the state manager
     */
    initializeStateManager() {
        // Create new state manager instance
        this.stateManager = new PageStateManager();
        
        // Setup event listeners for state changes
        this.setupStateEventListeners();
        
        // Update currentPage reference
        this.currentPage = this.stateManager;
    }

    /**
     * Setup event listeners for state changes
     */
    setupStateEventListeners() {
        if (!this.stateManager) return;

        // Component selection events
        this.stateManager.addEventListener('componentSelected', (data) => {
            this.handleComponentSelected(data);
        });

        this.stateManager.addEventListener('componentDeselected', (data) => {
            this.handleComponentDeselected(data);
        });

        // Component update events
        this.stateManager.addEventListener('componentUpdated', (data) => {
            this.handleComponentUpdated(data);
        });

        this.stateManager.addEventListener('textComponentUpdated', (data) => {
            this.handleTextComponentUpdated(data);
        });

        this.stateManager.addEventListener('accordionItemAdded', (data) => {
            this.handleAccordionItemAdded(data);
        });

        this.stateManager.addEventListener('accordionItemRemoved', (data) => {
            this.handleAccordionItemRemoved(data);
        });

        this.stateManager.addEventListener('cardTitleUpdated', (data) => {
            this.handleCardTitleUpdated(data);
        });

        this.stateManager.addEventListener('bannerHeadlineUpdated', (data) => {
            this.handleBannerHeadlineUpdated(data);
        });

        this.stateManager.addEventListener('bannerBackgroundImageRemoved', (data) => {
            this.handleBannerBackgroundImageRemoved(data);
        });
    }

    /**
     * Set the currently selected component
     * @param {string} componentId - Component ID to select
     */
    setSelectedComponent(componentId) {
        if (this.stateManager) {
            this.stateManager.setSelectedComponent(componentId);
        } else {
            this.selectedComponentId = componentId;
            this.updateComponentSelectionVisuals();
        }
    }

    /**
     * Clear the currently selected component
     */
    clearSelectedComponent() {
        if (this.stateManager) {
            this.stateManager.clearSelectedComponent();
        } else {
            this.selectedComponentId = null;
            this.updateComponentSelectionVisuals();
        }
    }

    /**
     * Get the currently selected component
     * @returns {Object|null} Selected component or null
     */
    getSelectedComponent() {
        if (this.stateManager) {
            return this.stateManager.getSelectedComponent();
        }
        return this.selectedComponentId ? this.currentPage?.getComponentById(this.selectedComponentId) : null;
    }

    /**
     * Handle component selection
     * @param {Object} data - Selection data
     */
    handleComponentSelected(data) {
        this.selectedComponentId = data.componentId;
        this.updateComponentSelectionVisuals();
        
        // Update editing panel if available
        this.updateEditingPanel(data.component);
    }

    /**
     * Handle component deselection
     * @param {Object} data - Deselection data
     */
    handleComponentDeselected(data) {
        this.selectedComponentId = null;
        this.updateComponentSelectionVisuals();
        
        // Clear editing panel if available
        this.clearEditingPanel();
    }

    /**
     * Update visual indicators for component selection
     */
    updateComponentSelectionVisuals() {
        // Remove selection from all components
        document.querySelectorAll('.canvas-element').forEach(element => {
            element.classList.remove('selected');
        });

        // Add selection to currently selected component
        if (this.selectedComponentId) {
            const selectedElement = document.querySelector(`[data-component-id="${this.selectedComponentId}"]`);
            if (selectedElement) {
                const canvasElement = selectedElement.closest('.canvas-element');
                if (canvasElement) {
                    canvasElement.classList.add('selected');
                }
            }
        }
    }

    /**
     * Handle component updates
     * @param {Object} data - Update data
     */
    handleComponentUpdated(data) {
        // Re-render the updated component
        this.rerenderComponent(data.componentId);
        
        // Mark page as having unsaved changes
        this.markAsUnsaved();
    }

    /**
     * Handle text component updates
     * @param {Object} data - Update data
     */
    handleTextComponentUpdated(data) {
        // Update the text editor content
        const textEditor = document.querySelector(`[data-component-id="${data.componentId}"]`);
        if (textEditor && textEditor.contentEditable) {
            const newContent = data.newComponent.content.data;
            if (textEditor.innerHTML !== newContent) {
                textEditor.innerHTML = newContent;
            }
        }
        
        // Mark page as having unsaved changes
        this.markAsUnsaved();
    }

    /**
     * Handle accordion item addition
     * @param {Object} data - Addition data
     */
    handleAccordionItemAdded(data) {
        // Re-render the accordion component
        this.rerenderComponent(data.componentId);
    }

    /**
     * Handle accordion item removal
     * @param {Object} data - Removal data
     */
    handleAccordionItemRemoved(data) {
        // Re-render the accordion component
        this.rerenderComponent(data.componentId);
    }

    /**
     * Handle card title updates
     * @param {Object} data - Update data
     */
    handleCardTitleUpdated(data) {
        // Update the card title in the DOM
        const cardElement = document.querySelector(`[data-component-id="${data.componentId}"]`);
        if (cardElement) {
            const titleElement = cardElement.querySelector('.card-title');
            if (titleElement) {
                titleElement.textContent = data.title;
            }
        }
    }

    /**
     * Handle banner headline updates
     * @param {Object} data - Update data
     */
    handleBannerHeadlineUpdated(data) {
        // Update the banner headline in the DOM
        const bannerElement = document.querySelector(`[data-component-id="${data.componentId}"]`);
        if (bannerElement) {
            const headlineElement = bannerElement.querySelector('.banner-headline');
            if (headlineElement) {
                headlineElement.textContent = data.headlineText;
            }
        }
    }

    /**
     * Handle banner background image removal
     * @param {Object} data - Update data
     */
    handleBannerBackgroundImageRemoved(data) {
        // Update the banner background image in the DOM
        const bannerElement = document.querySelector(`[data-component-id="${data.componentId}"]`);
        if (bannerElement) {
            // Remove background image styles
            bannerElement.style.backgroundImage = '';
            bannerElement.style.backgroundSize = '';
            bannerElement.style.backgroundPosition = '';
            bannerElement.style.backgroundRepeat = '';
            
            // Update any background image container
            const backgroundContainer = bannerElement.querySelector('.banner-background-image');
            if (backgroundContainer) {
                backgroundContainer.style.display = 'none';
            }
        }
    }

    /**
     * Re-render a specific component
     * @param {string} componentId - Component ID to re-render
     */
    rerenderComponent(componentId) {
        const component = this.currentPage?.getComponentById(componentId);
        if (!component) return;

        const element = document.querySelector(`[data-component-id="${componentId}"]`);
        if (!element) return;

        // Re-render based on component type
        switch (component.type) {
            case 'TextComponent':
                this.rerenderTextComponent(element, component);
                break;
            case 'AccordionComponent':
                this.rerenderAccordionComponent(element, component);
                break;
            case 'CardComponent':
                this.rerenderCardComponent(element, component);
                break;
            case 'BannerComponent':
                this.rerenderBannerComponent(element, component);
                break;
            case 'LinkGroupComponent':
                this.rerenderLinkGroupComponent(element, component);
                break;
        }
    }

    /**
     * Update editing panel with component data
     * @param {Object} component - Component data
     */
    updateEditingPanel(component) {
        // This would integrate with the EditingPanel component
        // For now, we'll just log the selection
        console.log('Selected component:', component);
    }

    /**
     * Clear editing panel
     */
    clearEditingPanel() {
        // This would clear the EditingPanel component
        console.log('Component deselected');
    }

    addElement(event) {
        const canvas = document.getElementById('canvas');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const element = this.createElement(this.currentTool, x, y);
        canvas.appendChild(element);

        // Mark page as having unsaved changes
        this.markAsUnsaved();

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

                // Add click handler for component selection
                textEditor.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.setActiveComponent(textData.id, 'TextComponent', textData.data);
                    this.openEditingPanel('TextComponent', textData.data);
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
                accordionElement.setAttribute('data-component-id', accordionData.id);
                accordionElement.setAttribute('data-component-type', 'AccordionComponent');
                accordionElement.style.width = '400px';
                accordionElement.style.minHeight = '200px';
                accordionElement.style.border = '1px solid #e2e8f0';
                accordionElement.style.borderRadius = '8px';
                accordionElement.style.backgroundColor = 'white';
                accordionElement.style.padding = '10px';

                // Add click handler for component selection
                accordionElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.setActiveComponent(accordionData.id, 'AccordionComponent', accordionData.data);
                    this.openEditingPanel('AccordionComponent', accordionData.data);
                });
                
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
                
            case 'card':
                // Create CardComponent using structured data model
                const cardComponent = CardComponent.createDefault();
                const cardData = cardComponent.toJSON();
                
                // Create card HTML structure
                const cardElement = document.createElement('div');
                cardElement.className = 'card-component';
                cardElement.setAttribute('data-card-data', JSON.stringify(cardData));
                cardElement.style.width = '300px';
                cardElement.style.minHeight = '400px';
                cardElement.style.border = '1px solid #e2e8f0';
                cardElement.style.borderRadius = '8px';
                cardElement.style.backgroundColor = 'white';
                cardElement.style.overflow = 'hidden';
                cardElement.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                
                // Create card image container with ImageUploader
                const imageContainer = document.createElement('div');
                imageContainer.className = 'card-image-container';
                imageContainer.style.height = '200px';
                imageContainer.style.backgroundColor = '#f8fafc';
                imageContainer.style.display = 'flex';
                imageContainer.style.alignItems = 'center';
                imageContainer.style.justifyContent = 'center';
                imageContainer.style.position = 'relative';
                
                // Create ImageUploader instance
                const imageUploaderContainer = document.createElement('div');
                imageUploaderContainer.style.width = '100%';
                imageUploaderContainer.style.height = '100%';
                
                if (window.ImageUploader) {
                    const imageUploader = new window.ImageUploader(imageUploaderContainer, {
                        initialImageUrl: cardData.data.imageUrl,
                        initialAltText: cardData.data.altText,
                        onUpdate: (data) => {
                            this.updateCardImage(cardData.id, data.imageUrl, data.altText);
                        },
                        onError: (error) => {
                            console.error('ImageUploader error:', error);
                            this.showNotification('Image upload failed: ' + error.message, 'error');
                        },
                        maxFileSize: 10 * 1024 * 1024, // 10MB
                        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                        showAltText: true,
                        showRemoveButton: true
                    });
                    
                    // Store reference to imageUploader for later access
                    cardElement.imageUploader = imageUploader;
                } else {
                    // Fallback to basic input if ImageUploader is not available
                    const fallbackInput = document.createElement('input');
                    fallbackInput.type = 'url';
                    fallbackInput.placeholder = 'Enter image URL...';
                    fallbackInput.value = cardData.data.imageUrl;
                    fallbackInput.style.width = '100%';
                    fallbackInput.style.height = '100%';
                    fallbackInput.style.border = 'none';
                    fallbackInput.style.outline = 'none';
                    fallbackInput.style.padding = '10px';
                    fallbackInput.style.backgroundColor = 'transparent';
                    fallbackInput.addEventListener('blur', () => {
                        this.updateCardImage(cardData.id, fallbackInput.value, '');
                    });
                    imageUploaderContainer.appendChild(fallbackInput);
                }
                
                imageContainer.appendChild(imageUploaderContainer);
                
                // Create card content
                const contentContainer = document.createElement('div');
                contentContainer.className = 'card-content-container';
                contentContainer.style.padding = '16px';
                
                // Title input
                const titleInput = document.createElement('input');
                titleInput.type = 'text';
                titleInput.value = cardData.data.title;
                titleInput.style.width = '100%';
                titleInput.style.border = 'none';
                titleInput.style.outline = 'none';
                titleInput.style.fontSize = '18px';
                titleInput.style.fontWeight = '600';
                titleInput.style.marginBottom = '12px';
                titleInput.style.backgroundColor = 'transparent';
                titleInput.addEventListener('blur', () => {
                    this.updateCardTitle(cardData.id, titleInput.value);
                });
                
                // Description editor
                const descriptionEditor = document.createElement('div');
                descriptionEditor.className = 'card-description-editor';
                descriptionEditor.contentEditable = true;
                descriptionEditor.innerHTML = cardData.data.description.data;
                descriptionEditor.style.minHeight = '60px';
                descriptionEditor.style.border = '1px solid transparent';
                descriptionEditor.style.borderRadius = '4px';
                descriptionEditor.style.padding = '8px';
                descriptionEditor.style.outline = 'none';
                descriptionEditor.style.fontSize = '14px';
                descriptionEditor.style.lineHeight = '1.5';
                descriptionEditor.addEventListener('focus', () => {
                    descriptionEditor.style.border = '1px solid #2563eb';
                    descriptionEditor.style.backgroundColor = '#f8fafc';
                });
                descriptionEditor.addEventListener('blur', () => {
                    descriptionEditor.style.border = '1px solid transparent';
                    descriptionEditor.style.backgroundColor = 'transparent';
                    this.updateCardDescription(cardData.id, descriptionEditor.innerHTML);
                });
                descriptionEditor.addEventListener('input', () => {
                    this.updateCardDescription(cardData.id, descriptionEditor.innerHTML);
                });
                
                // Link inputs
                const linkContainer = document.createElement('div');
                linkContainer.style.marginTop = '12px';
                linkContainer.style.display = 'flex';
                linkContainer.style.gap = '8px';
                linkContainer.style.flexDirection = 'column';
                
                const linkUrlInput = document.createElement('input');
                linkUrlInput.type = 'url';
                linkUrlInput.placeholder = 'Link URL...';
                linkUrlInput.value = cardData.data.linkUrl;
                linkUrlInput.style.width = '100%';
                linkUrlInput.style.padding = '6px';
                linkUrlInput.style.border = '1px solid #e2e8f0';
                linkUrlInput.style.borderRadius = '4px';
                linkUrlInput.style.outline = 'none';
                linkUrlInput.style.fontSize = '14px';
                linkUrlInput.addEventListener('blur', () => {
                    this.updateCardLink(cardData.id, linkUrlInput.value, linkTextInput.value, linkTargetSelect.value);
                });
                
                const linkTextInput = document.createElement('input');
                linkTextInput.type = 'text';
                linkTextInput.placeholder = 'Link text...';
                linkTextInput.value = cardData.data.linkText;
                linkTextInput.style.width = '100%';
                linkTextInput.style.padding = '6px';
                linkTextInput.style.border = '1px solid #e2e8f0';
                linkTextInput.style.borderRadius = '4px';
                linkTextInput.style.outline = 'none';
                linkTextInput.style.fontSize = '14px';
                linkTextInput.addEventListener('blur', () => {
                    this.updateCardLink(cardData.id, linkUrlInput.value, linkTextInput.value, linkTargetSelect.value);
                });
                
                const linkTargetSelect = document.createElement('select');
                linkTargetSelect.style.width = '100%';
                linkTargetSelect.style.padding = '6px';
                linkTargetSelect.style.border = '1px solid #e2e8f0';
                linkTargetSelect.style.borderRadius = '4px';
                linkTargetSelect.style.outline = 'none';
                linkTargetSelect.style.fontSize = '14px';
                linkTargetSelect.value = cardData.data.linkTarget;
                linkTargetSelect.addEventListener('change', () => {
                    this.updateCardLink(cardData.id, linkUrlInput.value, linkTextInput.value, linkTargetSelect.value);
                });
                
                const selfOption = document.createElement('option');
                selfOption.value = '_self';
                selfOption.textContent = 'Same window';
                const blankOption = document.createElement('option');
                blankOption.value = '_blank';
                blankOption.textContent = 'New window';
                
                linkTargetSelect.appendChild(selfOption);
                linkTargetSelect.appendChild(blankOption);
                
                linkContainer.appendChild(linkUrlInput);
                linkContainer.appendChild(linkTextInput);
                linkContainer.appendChild(linkTargetSelect);
                
                contentContainer.appendChild(titleInput);
                contentContainer.appendChild(descriptionEditor);
                contentContainer.appendChild(linkContainer);
                
                cardElement.appendChild(imageContainer);
                cardElement.appendChild(contentContainer);
                
                element.appendChild(cardElement);
                element.style.width = '300px';
                element.style.minHeight = '400px';
                
                // Store component data
                element.setAttribute('data-component', JSON.stringify(cardData));
                break;
                
            case 'banner':
                // Create BannerComponent using structured data model
                const bannerComponent = BannerComponent.createDefault();
                const bannerData = bannerComponent.toJSON();
                
                // Create banner HTML structure
                const bannerElement = document.createElement('div');
                bannerElement.className = 'banner-component';
                bannerElement.setAttribute('data-banner-data', JSON.stringify(bannerData));
                bannerElement.style.width = '100%';
                bannerElement.style.minHeight = '400px';
                bannerElement.style.border = '1px solid #e2e8f0';
                bannerElement.style.borderRadius = '8px';
                bannerElement.style.overflow = 'hidden';
                bannerElement.style.position = 'relative';
                bannerElement.style.backgroundColor = '#f8fafc';
                
                // Background image container with BannerImageUploader
                const backgroundContainer = document.createElement('div');
                backgroundContainer.className = 'banner-background-container';
                backgroundContainer.style.position = 'absolute';
                backgroundContainer.style.top = '0';
                backgroundContainer.style.left = '0';
                backgroundContainer.style.width = '100%';
                backgroundContainer.style.height = '100%';
                backgroundContainer.style.zIndex = '1';
                backgroundContainer.style.display = 'flex';
                backgroundContainer.style.alignItems = 'center';
                backgroundContainer.style.justifyContent = 'center';
                backgroundContainer.style.backgroundColor = '#f8fafc';
                
                // Create BannerImageUploader instance
                const bannerImageUploaderContainer = document.createElement('div');
                bannerImageUploaderContainer.style.width = '80%';
                bannerImageUploaderContainer.style.maxWidth = '500px';
                
                if (window.BannerImageUploader) {
                    const bannerImageUploader = new window.BannerImageUploader(bannerImageUploaderContainer, {
                        initialImageUrl: bannerData.data.backgroundImageUrl,
                        initialAltText: bannerData.data.backgroundImageAltText,
                        onUpdate: (data) => {
                            this.updateBannerBackgroundImage(bannerData.id, data.imageUrl, data.altText);
                        },
                        onError: (error) => {
                            console.error('BannerImageUploader error:', error);
                            this.showNotification('Banner image upload failed: ' + error.message, 'error');
                        },
                        maxFileSize: 10 * 1024 * 1024, // 10MB
                        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
                        showAltText: true,
                        showRemoveButton: true,
                        aspectRatio: '16:9'
                    });
                    
                    // Store reference to bannerImageUploader for later access
                    bannerElement.bannerImageUploader = bannerImageUploader;
                } else {
                    // Fallback to basic input if BannerImageUploader is not available
                    const fallbackInput = document.createElement('input');
                    fallbackInput.type = 'url';
                    fallbackInput.placeholder = 'Enter background image URL...';
                    fallbackInput.value = bannerData.data.backgroundImageUrl;
                    fallbackInput.style.width = '100%';
                    fallbackInput.style.height = '100%';
                    fallbackInput.style.border = 'none';
                    fallbackInput.style.outline = 'none';
                    fallbackInput.style.padding = '10px';
                    fallbackInput.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    fallbackInput.style.fontSize = '14px';
                    fallbackInput.addEventListener('blur', () => {
                        this.updateBannerBackgroundImage(bannerData.id, fallbackInput.value, '');
                    });
                    bannerImageUploaderContainer.appendChild(fallbackInput);
                }
                
                backgroundContainer.appendChild(bannerImageUploaderContainer);
                
                // Content overlay
                const contentOverlay = document.createElement('div');
                contentOverlay.className = 'banner-content-overlay';
                contentOverlay.style.position = 'relative';
                contentOverlay.style.zIndex = '2';
                contentOverlay.style.padding = '60px 40px';
                contentOverlay.style.display = 'flex';
                contentOverlay.style.flexDirection = 'column';
                contentOverlay.style.alignItems = 'center';
                contentOverlay.style.justifyContent = 'center';
                contentOverlay.style.minHeight = '400px';
                contentOverlay.style.textAlign = 'center';
                
                // Headline input
                const headlineInput = document.createElement('input');
                headlineInput.type = 'text';
                headlineInput.value = bannerData.data.headlineText;
                headlineInput.style.width = '80%';
                headlineInput.style.border = 'none';
                headlineInput.style.outline = 'none';
                headlineInput.style.fontSize = '32px';
                headlineInput.style.fontWeight = '700';
                headlineInput.style.marginBottom = '30px';
                headlineInput.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                headlineInput.style.padding = '15px';
                headlineInput.style.borderRadius = '8px';
                headlineInput.style.textAlign = 'center';
                headlineInput.style.maxLength = '500';
                headlineInput.addEventListener('blur', () => {
                    this.updateBannerHeadline(bannerData.id, headlineInput.value);
                });
                
                // Call-to-action container
                const ctaContainer = document.createElement('div');
                ctaContainer.className = 'banner-cta-container';
                ctaContainer.style.display = 'flex';
                ctaContainer.style.flexDirection = 'column';
                ctaContainer.style.alignItems = 'center';
                ctaContainer.style.gap = '15px';
                ctaContainer.style.width = '80%';
                
                // Button text input
                const buttonTextInput = document.createElement('input');
                buttonTextInput.type = 'text';
                buttonTextInput.placeholder = 'Button text...';
                buttonTextInput.value = bannerData.data.callToAction.buttonText;
                buttonTextInput.style.width = '100%';
                buttonTextInput.style.maxWidth = '300px';
                buttonTextInput.style.padding = '12px';
                buttonTextInput.style.border = '1px solid #e2e8f0';
                buttonTextInput.style.borderRadius = '6px';
                buttonTextInput.style.outline = 'none';
                buttonTextInput.style.fontSize = '16px';
                buttonTextInput.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                buttonTextInput.style.textAlign = 'center';
                buttonTextInput.style.maxLength = '255';
                buttonTextInput.addEventListener('blur', () => {
                    this.updateBannerCallToAction(bannerData.id, {
                        buttonText: buttonTextInput.value,
                        linkUrl: bannerLinkUrlInput.value,
                        linkTarget: bannerLinkTargetSelect.value
                    });
                });
                
                // Link URL input
                const bannerLinkUrlInput = document.createElement('input');
                bannerLinkUrlInput.type = 'url';
                bannerLinkUrlInput.placeholder = 'Link URL...';
                bannerLinkUrlInput.value = bannerData.data.callToAction.linkUrl;
                bannerLinkUrlInput.style.width = '100%';
                bannerLinkUrlInput.style.maxWidth = '300px';
                bannerLinkUrlInput.style.padding = '12px';
                bannerLinkUrlInput.style.border = '1px solid #e2e8f0';
                bannerLinkUrlInput.style.borderRadius = '6px';
                bannerLinkUrlInput.style.outline = 'none';
                bannerLinkUrlInput.style.fontSize = '14px';
                bannerLinkUrlInput.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                bannerLinkUrlInput.style.textAlign = 'center';
                bannerLinkUrlInput.addEventListener('blur', () => {
                    this.updateBannerCallToAction(bannerData.id, {
                        buttonText: buttonTextInput.value,
                        linkUrl: bannerLinkUrlInput.value,
                        linkTarget: bannerLinkTargetSelect.value
                    });
                });
                
                // Link target select
                const bannerLinkTargetSelect = document.createElement('select');
                bannerLinkTargetSelect.style.width = '100%';
                bannerLinkTargetSelect.style.maxWidth = '300px';
                bannerLinkTargetSelect.style.padding = '12px';
                bannerLinkTargetSelect.style.border = '1px solid #e2e8f0';
                bannerLinkTargetSelect.style.borderRadius = '6px';
                bannerLinkTargetSelect.style.outline = 'none';
                bannerLinkTargetSelect.style.fontSize = '14px';
                bannerLinkTargetSelect.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                bannerLinkTargetSelect.value = bannerData.data.callToAction.linkTarget;
                bannerLinkTargetSelect.addEventListener('change', () => {
                    this.updateBannerCallToAction(bannerData.id, {
                        buttonText: buttonTextInput.value,
                        linkUrl: bannerLinkUrlInput.value,
                        linkTarget: bannerLinkTargetSelect.value
                    });
                });
                
                const bannerSelfOption = document.createElement('option');
                bannerSelfOption.value = '_self';
                bannerSelfOption.textContent = 'Same window';
                const bannerBlankOption = document.createElement('option');
                bannerBlankOption.value = '_blank';
                bannerBlankOption.textContent = 'New window';
                
                bannerLinkTargetSelect.appendChild(bannerSelfOption);
                bannerLinkTargetSelect.appendChild(bannerBlankOption);
                
                ctaContainer.appendChild(buttonTextInput);
                ctaContainer.appendChild(bannerLinkUrlInput);
                ctaContainer.appendChild(bannerLinkTargetSelect);
                
                contentOverlay.appendChild(headlineInput);
                contentOverlay.appendChild(ctaContainer);
                
                bannerElement.appendChild(backgroundContainer);
                bannerElement.appendChild(contentOverlay);
                
                element.appendChild(bannerElement);
                element.style.width = '100%';
                element.style.minHeight = '400px';
                
                // Store component data
                element.setAttribute('data-component', JSON.stringify(bannerData));
                break;
                
            case 'linkgroup':
                // Create LinkGroupComponent using structured data model
                const linkGroupComponent = LinkGroupComponent.createDefault();
                const linkGroupData = linkGroupComponent.toJSON();
                
                // Create link group HTML structure
                const linkGroupElement = document.createElement('div');
                linkGroupElement.className = 'linkgroup-component';
                linkGroupElement.setAttribute('data-linkgroup-data', JSON.stringify(linkGroupData));
                linkGroupElement.style.width = '100%';
                linkGroupElement.style.minHeight = '200px';
                linkGroupElement.style.border = '1px solid #e2e8f0';
                linkGroupElement.style.borderRadius = '8px';
                linkGroupElement.style.backgroundColor = 'white';
                linkGroupElement.style.padding = '20px';
                
                // Title input
                const linkGroupTitleInput = document.createElement('input');
                linkGroupTitleInput.type = 'text';
                linkGroupTitleInput.value = linkGroupData.data.title;
                linkGroupTitleInput.style.width = '100%';
                linkGroupTitleInput.style.border = 'none';
                linkGroupTitleInput.style.outline = 'none';
                linkGroupTitleInput.style.fontSize = '20px';
                linkGroupTitleInput.style.fontWeight = '600';
                linkGroupTitleInput.style.marginBottom = '15px';
                linkGroupTitleInput.style.backgroundColor = 'transparent';
                linkGroupTitleInput.style.borderBottom = '2px solid #e2e8f0';
                linkGroupTitleInput.style.paddingBottom = '5px';
                linkGroupTitleInput.addEventListener('blur', () => {
                    this.updateLinkGroupTitle(linkGroupData.id, linkGroupTitleInput.value);
                });
                
                // Links container
                const linksContainer = document.createElement('div');
                linksContainer.className = 'links-container';
                linksContainer.style.display = 'flex';
                linksContainer.style.flexDirection = 'column';
                linksContainer.style.gap = '10px';
                
                // Create initial links
                linkGroupData.data.links.forEach((linkData, index) => {
                    const linkElement = this.createLinkElement(linkData, linkGroupData.id);
                    linksContainer.appendChild(linkElement);
                });
                
                // Controls container
                const controlsContainer = document.createElement('div');
                controlsContainer.className = 'linkgroup-controls';
                controlsContainer.style.marginTop = '15px';
                controlsContainer.style.display = 'flex';
                controlsContainer.style.gap = '10px';
                controlsContainer.style.justifyContent = 'center';
                
                // Add link button
                const addLinkButton = document.createElement('button');
                addLinkButton.textContent = '+ Add Link';
                addLinkButton.className = 'btn btn-sm';
                addLinkButton.style.backgroundColor = '#10b981';
                addLinkButton.style.color = 'white';
                addLinkButton.style.border = 'none';
                addLinkButton.style.padding = '8px 16px';
                addLinkButton.style.borderRadius = '4px';
                addLinkButton.style.cursor = 'pointer';
                addLinkButton.addEventListener('click', () => {
                    this.addLinkToGroup(linkGroupData.id);
                    this.refreshLinkGroupElement(linkGroupElement, linkGroupData.id);
                });
                
                controlsContainer.appendChild(addLinkButton);
                
                linkGroupElement.appendChild(linkGroupTitleInput);
                linkGroupElement.appendChild(linksContainer);
                linkGroupElement.appendChild(controlsContainer);
                
                element.appendChild(linkGroupElement);
                element.style.width = '100%';
                element.style.minHeight = '200px';
                
                // Store component data
                element.setAttribute('data-component', JSON.stringify(linkGroupData));
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

        // Extract component data for wrapper
        const componentId = element.dataset.componentId || this.generateId();
        const componentType = element.dataset.componentType || type;
        const componentData = this.extractComponentData(element, componentType);

        // Wrap with editable wrapper
        const wrappedElement = this.createEditableWrapper(element, componentId, componentType, componentData);

        return wrappedElement;
    }

    /**
     * Create an editable wrapper around a component element
     * @param {HTMLElement} componentElement - The component DOM element
     * @param {string} componentId - The component ID
     * @param {string} componentType - The component type
     * @param {Object} componentData - The component data
     * @returns {HTMLElement} The wrapped editable component
     */
    createEditableWrapper(componentElement, componentId, componentType, componentData) {
        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.className = 'editable-component';
        wrapper.dataset.componentId = componentId;
        wrapper.dataset.componentType = componentType;
        
        // Append the component element to the wrapper
        wrapper.appendChild(componentElement);
        
        // Add event listeners for visual feedback and interaction
        wrapper.addEventListener('mouseover', () => {
            wrapper.classList.add('hover');
        });
        
        wrapper.addEventListener('mouseout', () => {
            wrapper.classList.remove('hover');
        });
        
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent canvas click events
            this.setActiveComponent(componentId, componentType, componentData);
            this.openEditingPanel(componentType, componentData);
        });
        
        return wrapper;
    }

    /**
     * Extract component data from element for wrapper
     * @param {HTMLElement} element - The component element
     * @param {string} componentType - The component type
     * @returns {Object} Component data object
     */
    extractComponentData(element, componentType) {
        // Basic component data structure
        const componentData = {
            id: element.dataset.componentId || this.generateId(),
            type: componentType,
            data: {}
        };

        // Extract specific data based on component type
        switch (componentType) {
            case 'text':
            case 'TextComponent':
                const textEditor = element.querySelector('.text-editor');
                if (textEditor) {
                    componentData.data = {
                        content: {
                            format: 'html',
                            data: textEditor.innerHTML
                        }
                    };
                }
                break;
            case 'card':
            case 'CardComponent':
                const titleInput = element.querySelector('input[type="text"]');
                const descriptionEditor = element.querySelector('.card-description-editor');
                if (titleInput && descriptionEditor) {
                    componentData.data = {
                        title: titleInput.value,
                        description: {
                            format: 'html',
                            data: descriptionEditor.innerHTML
                        }
                    };
                }
                break;
            // Add more cases as needed for other component types
            default:
                componentData.data = {
                    type: componentType,
                    content: element.innerHTML
                };
        }

        return componentData;
    }

    /**
     * Set the currently active component for editing
     * @param {string} componentId - The component ID
     * @param {string} componentType - The component type
     * @param {Object} componentData - The component data
     */
    setActiveComponent(componentId, componentType, componentData) {
        // Remove active class from previously active component
        const previousActive = document.querySelector('.editable-component.active');
        if (previousActive) {
            previousActive.classList.remove('active');
        }

        // Update active component state
        this.activeComponent = {
            id: componentId,
            type: componentType,
            data: componentData
        };

        // Add active class to newly selected component
        const activeWrapper = document.querySelector(`[data-component-id="${componentId}"]`);
        if (activeWrapper) {
            activeWrapper.classList.add('active');
        }

        console.log('Active component set:', this.activeComponent);
    }

    /**
     * Clear the currently active component
     */
    clearActiveComponent() {
        // Remove active class from currently active component
        const activeWrapper = document.querySelector('.editable-component.active');
        if (activeWrapper) {
            activeWrapper.classList.remove('active');
        }

        // Clear active component state
        this.activeComponent = null;

        console.log('Active component cleared');
    }

    /**
     * Open the editing panel for the selected component (placeholder)
     * @param {string} componentType - The component type
     * @param {Object} componentData - The component data
     */
    openEditingPanel(componentType, componentData) {
        console.log('Opening editing panel for:', componentType, componentData);
        this.renderEditingPanel(componentType, componentData);
    }

    /**
     * Render the editing panel based on the active component
     * @param {string} componentType - Optional component type to render
     * @param {Object} componentData - Optional component data to render
     */
    renderEditingPanel(componentType = null, componentData = null) {
        // Get or create the editing panel container
        let editingPanel = document.getElementById('editing-panel');
        if (!editingPanel) {
            editingPanel = document.createElement('div');
            editingPanel.id = 'editing-panel';
            editingPanel.className = 'editing-panel';
            document.body.appendChild(editingPanel);
        }

        // Clear existing content
        editingPanel.innerHTML = '';

        // Use provided parameters or fall back to activeComponent
        const currentComponentType = componentType || (this.activeComponent ? this.activeComponent.type : null);
        const currentComponentData = componentData || (this.activeComponent ? this.activeComponent.data : null);

        if (!currentComponentType || !currentComponentData) {
            // Hide panel when no component is selected
            editingPanel.style.display = 'none';
            return;
        }

        // Show panel and render content
        editingPanel.style.display = 'block';

        // Create panel header
        const header = document.createElement('div');
        header.className = 'editing-panel-header';
        header.innerHTML = `
            <h3>Edit ${currentComponentType}</h3>
            <div class="editing-panel-actions">
                <button class="btn btn-primary save-page-btn" data-action="save-page" title="Save page changes">
                    <i class="fas fa-save"></i>
                    <span class="save-text">Save</span>
                    <span class="save-spinner" style="display: none;">
                        <i class="fas fa-spinner fa-spin"></i>
                    </span>
                </button>
                <button class="btn btn-icon close-panel-btn" data-action="close-editing-panel">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Create panel content
        const content = document.createElement('div');
        content.className = 'editing-panel-content';
        content.id = 'editing-panel-content';
        
        // Add notification area for save feedback
        const notificationArea = document.createElement('div');
        notificationArea.className = 'editing-panel-notifications';
        notificationArea.id = 'editing-panel-notifications';
        notificationArea.style.display = 'none';

        // Add close button event listener
        header.querySelector('.close-panel-btn').addEventListener('click', () => {
            this.clearActiveComponent();
            this.renderEditingPanel();
        });

        // Add save button event listener
        const saveBtn = header.querySelector('.save-page-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.savePage();
            });
        }

        editingPanel.appendChild(header);
        editingPanel.appendChild(notificationArea);
        editingPanel.appendChild(content);

        // Load the appropriate component editor
        this.loadComponentEditor(currentComponentType, currentComponentData, content);
    }

    /**
     * Load the appropriate component editor based on component type
     * @param {string} componentType - The component type
     * @param {Object} componentData - The component data
     * @param {HTMLElement} container - Container element for the editor
     */
    loadComponentEditor(componentType, componentData, container) {
        // Check if EditingPanel class is available
        if (window.EditingPanel) {
            const editingPanel = new window.EditingPanel(container, {
                componentType: componentType,
                componentData: componentData,
                onClose: () => {
                    this.clearActiveComponent();
                    this.renderEditingPanel();
                }
            });
            editingPanel.render();
        } else {
            // Fallback: show basic component info
            const componentId = this.activeComponent ? this.activeComponent.id : 'Unknown';
            container.innerHTML = `
                <div class="component-editor-fallback">
                    <h4>Component: ${componentType}</h4>
                    <p>Component ID: ${componentId}</p>
                    <div class="component-data">
                        <h5>Component Data:</h5>
                        <pre>${JSON.stringify(componentData, null, 2)}</pre>
                    </div>
                    <p class="fallback-message">
                        <i class="fas fa-info-circle"></i>
                        Component-specific editor not available. 
                        Individual editors will be implemented in separate work orders.
                    </p>
                </div>
            `;
        }
    }

    /**
     * Generate a unique ID for components
     * @returns {string} Unique ID
     */
    generateId() {
        return 'comp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Set the current page ID
     * @param {string} pageId - The page ID
     */
    setPageId(pageId) {
        this.pageId = pageId;
    }

    /**
     * Save page changes to the backend
     */
    async savePage() {
        if (!this.pageId) {
            this.showNotification('No page loaded to save', 'error');
            return;
        }

        if (!this.currentPage) {
            this.showNotification('No page data to save', 'error');
            return;
        }

        // Validate page data before saving
        if (!this.validatePageData()) {
            this.showNotification('Page data validation failed', 'error');
            return;
        }

        try {
            // Show loading state
            this.setSaveButtonLoading(true);
            this.hideNotification();

            // Prepare page data for API
            const pageData = this.currentPage.toJSON ? this.currentPage.toJSON() : this.serializeCanvasToPage().toJSON();

            // Make API call to save page
            const response = await fetch(`/api/pages/${this.pageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pageData)
            });

            if (!response.ok) {
                throw new Error(`Failed to save page: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to save page');
            }

            // Clear unsaved changes flag
            this.hasUnsavedChanges = false;
            this.updateUnsavedChangesIndicator();

            // Show success notification
            this.showNotification('Page saved successfully!', 'success');

        } catch (error) {
            console.error('Error saving page:', error);
            this.showNotification(`Error saving page: ${error.message}`, 'error');
        } finally {
            // Hide loading state
            this.setSaveButtonLoading(false);
        }
    }

    /**
     * Validate page data before saving
     * @returns {boolean} True if valid, false otherwise
     */
    validatePageData() {
        if (!this.currentPage) {
            return false;
        }

        // Check if page has components
        const components = this.currentPage.components || this.currentPage.getOrderedComponents?.() || [];
        if (!Array.isArray(components) || components.length === 0) {
            return false;
        }

        // Validate each component
        for (const component of components) {
            if (!component || !component.type) {
                return false;
            }

            // Basic validation based on component type
            switch (component.type) {
                case 'TextComponent':
                    if (!component.data || !component.data.content) {
                        return false;
                    }
                    break;
                case 'AccordionComponent':
                    if (!component.data || !Array.isArray(component.data.items) || component.data.items.length === 0) {
                        return false;
                    }
                    break;
                case 'CardComponent':
                    if (!component.data || !component.data.title) {
                        return false;
                    }
                    break;
                case 'BannerComponent':
                    if (!component.data || !component.data.title) {
                        return false;
                    }
                    break;
                case 'LinkGroupComponent':
                    if (!component.data || !Array.isArray(component.data.links) || component.data.links.length === 0) {
                        return false;
                    }
                    break;
            }
        }

        return true;
    }

    /**
     * Set save button loading state
     * @param {boolean} loading - Whether to show loading state
     */
    setSaveButtonLoading(loading) {
        const saveBtn = document.querySelector('.save-page-btn');
        if (!saveBtn) return;

        const saveText = saveBtn.querySelector('.save-text');
        const saveSpinner = saveBtn.querySelector('.save-spinner');

        if (loading) {
            saveBtn.disabled = true;
            saveText.style.display = 'none';
            saveSpinner.style.display = 'inline';
        } else {
            saveBtn.disabled = false;
            saveText.style.display = 'inline';
            saveSpinner.style.display = 'none';
        }
    }

    /**
     * Show notification in the editing panel
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('editing-panel-notifications');
        if (!notificationArea) return;

        const notificationClass = `notification-${type}`;
        notificationArea.innerHTML = `
            <div class="notification ${notificationClass}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        notificationArea.style.display = 'block';

        // Auto-hide success notifications after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.hideNotification();
            }, 3000);
        }
    }

    /**
     * Hide notification
     */
    hideNotification() {
        const notificationArea = document.getElementById('editing-panel-notifications');
        if (notificationArea) {
            notificationArea.style.display = 'none';
            notificationArea.innerHTML = '';
        }
    }

    /**
     * Setup unsaved changes warning
     */
    setupUnsavedChangesWarning() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    /**
     * Update unsaved changes indicator
     */
    updateUnsavedChangesIndicator() {
        // Update page title to show unsaved changes
        const title = document.querySelector('title');
        if (title) {
            if (this.hasUnsavedChanges) {
                if (!title.textContent.includes('*')) {
                    title.textContent = '*' + title.textContent;
                }
            } else {
                title.textContent = title.textContent.replace('*', '');
            }
        }
    }

    /**
     * Mark page as having unsaved changes
     */
    markAsUnsaved() {
        this.hasUnsavedChanges = true;
        this.updateUnsavedChangesIndicator();
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
            case 'test-page-editor':
                this.testPageEditor();
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
                sourceFigmaFileUrl: null, // S3 URL for Figma export file
                sourcePngFileUrl: null,   // S3 URL for PNG image file
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
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
        
        // Use PageStateManager if available, otherwise fallback to Page
        const PageClass = window.PageStateManager || Page;
        const page = new PageClass({
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

    /**
     * Validate S3 URL format and length
     * @param {string} url - URL to validate
     * @returns {Object} Validation result with isValid boolean and error message
     */
    validateSourceFileUrl(url) {
        // Allow null/undefined values (optional fields)
        if (!url || url.trim() === '') {
            return { isValid: true, error: null };
        }

        const trimmedUrl = url.trim();

        // Check maximum length (2048 characters)
        if (trimmedUrl.length > 2048) {
            return { 
                isValid: false, 
                error: 'URL must not exceed 2048 characters' 
            };
        }

        // Basic URL format validation
        try {
            const urlObj = new URL(trimmedUrl);
            
            // Additional S3-specific validation (optional)
            if (trimmedUrl.includes('s3.amazonaws.com') || trimmedUrl.includes('amazonaws.com/s3')) {
                // S3 URL format is valid
                return { isValid: true, error: null };
            } else {
                // Accept any valid URL format, not just S3
                return { isValid: true, error: null };
            }
        } catch (error) {
            return { 
                isValid: false, 
                error: 'Invalid URL format' 
            };
        }
    }

    /**
     * Update template source file URLs with validation
     * @param {number} templateId - Template ID
     * @param {string} sourceFigmaFileUrl - Figma source file URL (optional)
     * @param {string} sourcePngFileUrl - PNG source file URL (optional)
     * @returns {boolean} Success status
     */
    updateTemplateSourceFiles(templateId, sourceFigmaFileUrl = null, sourcePngFileUrl = null) {
        try {
            // Validate URLs if provided
            if (sourceFigmaFileUrl !== null) {
                const figmaValidation = this.validateSourceFileUrl(sourceFigmaFileUrl);
                if (!figmaValidation.isValid) {
                    throw new Error(`Figma file URL: ${figmaValidation.error}`);
                }
            }

            if (sourcePngFileUrl !== null) {
                const pngValidation = this.validateSourceFileUrl(sourcePngFileUrl);
                if (!pngValidation.isValid) {
                    throw new Error(`PNG file URL: ${pngValidation.error}`);
                }
            }

            // Find and update template
            const template = this.templates.find(t => t.id === templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Update template with new source file URLs
            template.sourceFigmaFileUrl = sourceFigmaFileUrl;
            template.sourcePngFileUrl = sourcePngFileUrl;
            template.updatedAt = new Date().toISOString();

            // Save to localStorage
            this.saveTemplatesToStorage();
            
            this.showNotification('Template source files updated successfully!');
            return true;
        } catch (error) {
            console.error('Error updating template source files:', error);
            this.showNotification('Error updating source files: ' + error.message, 'error');
            return false;
        }
    }

    loadTemplates() {
        const saved = localStorage.getItem('templatePageEditor_templates');
        if (saved) {
            this.templates = JSON.parse(saved);
            
            // Ensure backward compatibility: initialize new fields for existing templates
            this.templates = this.templates.map(template => ({
                ...template,
                sourceFigmaFileUrl: template.sourceFigmaFileUrl || null,
                sourcePngFileUrl: template.sourcePngFileUrl || null,
                updatedAt: template.updatedAt || template.createdAt || new Date().toISOString()
            }));
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
            
            // Build source files info
            let sourceFilesInfo = '';
            if (template.sourceFigmaFileUrl || template.sourcePngFileUrl) {
                sourceFilesInfo = '<div class="source-files-info" style="margin: 8px 0; font-size: 12px; color: #64748b;">';
                if (template.sourceFigmaFileUrl) {
                    sourceFilesInfo += '<div><i class="fas fa-file-image"></i> Figma</div>';
                }
                if (template.sourcePngFileUrl) {
                    sourceFilesInfo += '<div><i class="fas fa-image"></i> PNG</div>';
                }
                sourceFilesInfo += '</div>';
            }
            
            card.innerHTML = `
                <h3>${template.name}</h3>
                <p>Created: ${new Date(template.createdAt).toLocaleDateString()}</p>
                ${sourceFilesInfo}
                <div class="template-actions">
                    <button class="btn btn-primary" data-action="load-template" data-template-id="${template.id}">Load</button>
                    <button class="btn" data-action="delete-template" data-template-id="${template.id}">Delete</button>
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
            // Use PageStateManager if available, otherwise fallback to Page
            if (window.PageStateManager) {
                const page = PageStateManager.fromJSON(pageData);
                this.currentPage = page;
                this.stateManager = page;
                this.setupStateEventListeners();
            } else {
                const page = Page.fromJSON(pageData);
                this.currentPage = page;
            }
            
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
     * Initialize PageEditor for page editing
     * @param {string} pageId - Page ID to load
     */
    initializePageEditor(pageId) {
        // Check if PageEditor is available
        if (!window.PageEditor) {
            console.warn('PageEditor not available, falling back to legacy page loading');
            return;
        }

        // Create container for PageEditor if it doesn't exist
        let editorContainer = document.getElementById('page-editor-container');
        if (!editorContainer) {
            editorContainer = document.createElement('div');
            editorContainer.id = 'page-editor-container';
            editorContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: white;
                z-index: 1000;
                display: none;
            `;
            document.body.appendChild(editorContainer);
        }

        // Initialize PageEditor
        this.pageEditor = new PageEditor('page-editor-container', {
            showEditingPanel: true,
            enableRealTimeUpdates: true,
            autoSave: false
        });

        // Setup PageEditor event listeners
        this.setupPageEditorEventListeners();

        // Load the page
        this.pageEditor.loadPage(pageId);

        // Show the editor
        editorContainer.style.display = 'block';
    }

    /**
     * Setup PageEditor event listeners
     */
    setupPageEditorEventListeners() {
        if (!this.pageEditor) return;

        // Page loaded event
        this.pageEditor.addEventListener('pageLoaded', (data) => {
            console.log('Page loaded in PageEditor:', data);
            this.currentPage = data.page;
        });

        // Component selection events
        this.pageEditor.addEventListener('componentSelected', (data) => {
            this.handleComponentSelected(data);
        });

        this.pageEditor.addEventListener('componentDeselected', (data) => {
            this.handleComponentDeselected(data);
        });

        // Page save events
        this.pageEditor.addEventListener('pageSaved', (data) => {
            this.showNotification('Page saved successfully!');
        });

        this.pageEditor.addEventListener('pageSaveError', (data) => {
            this.showNotification('Failed to save page: ' + data.error, 'error');
        });

        // Page load error
        this.pageEditor.addEventListener('pageLoadError', (data) => {
            this.showNotification('Failed to load page: ' + data.error, 'error');
        });
    }

    /**
     * Close PageEditor
     */
    closePageEditor() {
        const editorContainer = document.getElementById('page-editor-container');
        if (editorContainer) {
            editorContainer.style.display = 'none';
        }

        if (this.pageEditor) {
            this.pageEditor.destroy();
            this.pageEditor = null;
        }
    }

    /**
     * Test PageEditor functionality
     */
    testPageEditor() {
        // Use a known page ID for testing
        const testPageId = '750e8400-e29b-41d4-a716-446655440001';
        
        try {
            this.initializePageEditor(testPageId);
            this.showNotification('PageEditor initialized for testing!');
        } catch (error) {
            console.error('Error testing PageEditor:', error);
            this.showNotification('Error testing PageEditor: ' + error.message, 'error');
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
                
                // Add click handler for component selection
                textEditor.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.setActiveComponent(component.id, 'TextComponent', component.data);
                    this.openEditingPanel('TextComponent', component.data);
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
                accordionElement.setAttribute('data-component-id', accordionData.id);
                accordionElement.setAttribute('data-component-type', 'AccordionComponent');
                accordionElement.style.width = '400px';
                accordionElement.style.minHeight = '200px';
                accordionElement.style.border = '1px solid #e2e8f0';
                accordionElement.style.borderRadius = '8px';
                accordionElement.style.backgroundColor = 'white';
                accordionElement.style.padding = '10px';

                // Add click handler for component selection
                accordionElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.setActiveComponent(accordionData.id, 'AccordionComponent', accordionData.data);
                    this.openEditingPanel('AccordionComponent', accordionData.data);
                });
                
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
                
            case 'CardComponent':
                // CardComponent case handled in createElement method
                break;
                
                
                
            case 'LinkGroupComponent':
                // Create LinkGroupComponent from structured data
                const linkGroupComponent = new LinkGroupComponent(component);
                const linkGroupData = linkGroupComponent.toJSON();
                
                // Create link group HTML structure
                const linkGroupElement = document.createElement('div');
                linkGroupElement.className = 'linkgroup-component';
                linkGroupElement.setAttribute('data-linkgroup-data', JSON.stringify(linkGroupData));
                linkGroupElement.style.width = '100%';
                linkGroupElement.style.minHeight = '200px';
                linkGroupElement.style.border = '1px solid #e2e8f0';
                linkGroupElement.style.borderRadius = '8px';
                linkGroupElement.style.backgroundColor = 'white';
                linkGroupElement.style.padding = '20px';
                
                // Title input
                const titleInput = document.createElement('input');
                titleInput.type = 'text';
                titleInput.value = linkGroupData.data.title;
                titleInput.style.width = '100%';
                titleInput.style.border = 'none';
                titleInput.style.outline = 'none';
                titleInput.style.fontSize = '20px';
                titleInput.style.fontWeight = '600';
                titleInput.style.marginBottom = '15px';
                titleInput.style.backgroundColor = 'transparent';
                titleInput.style.borderBottom = '2px solid #e2e8f0';
                titleInput.style.paddingBottom = '5px';
                titleInput.addEventListener('blur', () => {
                    this.updateLinkGroupTitle(linkGroupData.id, titleInput.value);
                });
                
                // Links container
                const linksContainer = document.createElement('div');
                linksContainer.className = 'links-container';
                linksContainer.style.display = 'flex';
                linksContainer.style.flexDirection = 'column';
                linksContainer.style.gap = '10px';
                
                // Create links from data
                linkGroupData.data.links.forEach((linkData, index) => {
                    const linkElement = this.createLinkElement(linkData, linkGroupData.id);
                    linksContainer.appendChild(linkElement);
                });
                
                // Controls container
                const controlsContainer = document.createElement('div');
                controlsContainer.className = 'linkgroup-controls';
                controlsContainer.style.marginTop = '15px';
                controlsContainer.style.display = 'flex';
                controlsContainer.style.gap = '10px';
                controlsContainer.style.justifyContent = 'center';
                
                // Add link button
                const addLinkButton = document.createElement('button');
                addLinkButton.textContent = '+ Add Link';
                addLinkButton.className = 'btn btn-sm';
                addLinkButton.style.backgroundColor = '#10b981';
                addLinkButton.style.color = 'white';
                addLinkButton.style.border = 'none';
                addLinkButton.style.padding = '8px 16px';
                addLinkButton.style.borderRadius = '4px';
                addLinkButton.style.cursor = 'pointer';
                addLinkButton.addEventListener('click', () => {
                    this.addLinkToGroup(linkGroupData.id);
                    this.refreshLinkGroupElement(linkGroupElement, linkGroupData.id);
                });
                
                controlsContainer.appendChild(addLinkButton);
                
                linkGroupElement.appendChild(titleInput);
                linkGroupElement.appendChild(linksContainer);
                linkGroupElement.appendChild(controlsContainer);
                
                element.appendChild(linkGroupElement);
                break;
                
            default:
                element.innerHTML = `<div class="unknown-component">Unknown Component: ${component.type}</div>`;
                element.style.width = '200px';
                element.style.height = '50px';
        }

        // Add generic click handler for component selection
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setActiveComponent(component.id, component.type, component.data);
            this.openEditingPanel(component.type, component.data);
        });

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
                // Use state manager if available, otherwise fallback to direct update
                if (this.stateManager) {
                    this.stateManager.updateTextComponentContentWithNotification(componentId, content);
                } else {
                    this.currentPage.updateTextComponentContent(componentId, content);
                }
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

    /**
     * Update card title
     * @param {string} componentId - Component ID
     * @param {string} title - New title
     */
    updateCardTitle(componentId, title) {
        if (this.currentPage) {
            try {
                this.currentPage.updateCardComponentTitle(componentId, title);
            } catch (error) {
                console.error('Failed to update card title:', error);
                this.showNotification('Failed to update title: ' + error.message, 'error');
            }
        }
    }

    /**
     * Update card description
     * @param {string} componentId - Component ID
     * @param {string} description - New description HTML
     */
    updateCardDescription(componentId, description) {
        if (this.currentPage) {
            try {
                this.currentPage.updateCardComponentDescription(componentId, {
                    format: 'html',
                    data: description,
                    metadata: {
                        version: '1.0',
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.error('Failed to update card description:', error);
                this.showNotification('Failed to update description: ' + error.message, 'error');
            }
        }
    }

    /**
     * Update card image
     * @param {string} componentId - Component ID
     * @param {string} imageUrl - New image URL
     * @param {string} altText - New alt text
     */
    updateCardImage(componentId, imageUrl, altText) {
        if (this.currentPage) {
            try {
                this.currentPage.updateCardComponentImage(componentId, imageUrl, altText);
                
                // Update the card element's data attribute
                const cardElement = document.querySelector(`[data-card-data*="${componentId}"]`);
                if (cardElement) {
                    const cardData = JSON.parse(cardElement.getAttribute('data-card-data'));
                    cardData.data.imageUrl = imageUrl;
                    cardData.data.altText = altText;
                    cardElement.setAttribute('data-card-data', JSON.stringify(cardData));
                }
                
                // Mark as having unsaved changes
                this.hasUnsavedChanges = true;
                this.updatePageTitle();
                
            } catch (error) {
                console.error('Failed to update card image:', error);
                this.showNotification('Failed to update image: ' + error.message, 'error');
            }
        }
    }

    /**
     * Update card link
     * @param {string} componentId - Component ID
     * @param {string} linkUrl - New link URL
     * @param {string} linkText - New link text
     * @param {string} linkTarget - New link target
     */
    updateCardLink(componentId, linkUrl, linkText, linkTarget) {
        if (this.currentPage) {
            try {
                this.currentPage.updateCardComponentLink(componentId, linkUrl, linkText, linkTarget);
            } catch (error) {
                console.error('Failed to update card link:', error);
                this.showNotification('Failed to update link: ' + error.message, 'error');
            }
        }
    }

    // Banner Component Update Functions
    updateBannerHeadline(componentId, headlineText) {
        if (this.currentPage) {
            try {
                this.currentPage.updateBannerComponentHeadline(componentId, headlineText);
            } catch (error) {
                console.error('Failed to update banner headline:', error);
                this.showNotification('Failed to update headline: ' + error.message, 'error');
            }
        }
    }

    updateBannerBackgroundImage(componentId, backgroundImageUrl, backgroundImageAltText) {
        if (this.currentPage) {
            try {
                this.currentPage.updateBannerComponentBackgroundImage(componentId, backgroundImageUrl, backgroundImageAltText);
            } catch (error) {
                console.error('Failed to update banner background image:', error);
                this.showNotification('Failed to update background image: ' + error.message, 'error');
            }
        }
    }

    updateBannerCallToAction(componentId, callToAction) {
        if (this.currentPage) {
            try {
                this.currentPage.updateBannerComponentCallToAction(componentId, callToAction);
            } catch (error) {
                console.error('Failed to update banner call-to-action:', error);
                this.showNotification('Failed to update call-to-action: ' + error.message, 'error');
            }
        }
    }

    // Link Group Component Helper Functions
    createLinkElement(linkData, linkGroupId) {
        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';
        linkElement.style.display = 'flex';
        linkElement.style.alignItems = 'center';
        linkElement.style.gap = '10px';
        linkElement.style.padding = '8px';
        linkElement.style.border = '1px solid #e2e8f0';
        linkElement.style.borderRadius = '4px';
        linkElement.style.backgroundColor = '#f8fafc';
        
        // Link text input
        const linkTextInput = document.createElement('input');
        linkTextInput.type = 'text';
        linkTextInput.value = linkData.linkText;
        linkTextInput.style.flex = '1';
        linkTextInput.style.border = 'none';
        linkTextInput.style.outline = 'none';
        linkTextInput.style.backgroundColor = 'transparent';
        linkTextInput.style.padding = '4px';
        linkTextInput.style.maxLength = '255';
        linkTextInput.addEventListener('blur', () => {
            this.updateLinkInGroup(linkGroupId, linkData.id, {
                linkText: linkTextInput.value,
                linkUrl: linkGroupLinkUrlInput.value,
                linkTarget: linkTargetSelect.value
            });
        });
        
        // Link URL input
        const linkGroupLinkUrlInput = document.createElement('input');
        linkGroupLinkUrlInput.type = 'url';
        linkGroupLinkUrlInput.value = linkData.linkUrl;
        linkGroupLinkUrlInput.style.flex = '2';
        linkGroupLinkUrlInput.style.border = 'none';
        linkGroupLinkUrlInput.style.outline = 'none';
        linkGroupLinkUrlInput.style.backgroundColor = 'transparent';
        linkGroupLinkUrlInput.style.padding = '4px';
        linkGroupLinkUrlInput.addEventListener('blur', () => {
            this.updateLinkInGroup(linkGroupId, linkData.id, {
                linkText: linkTextInput.value,
                linkUrl: linkGroupLinkUrlInput.value,
                linkTarget: linkTargetSelect.value
            });
        });
        
        // Link target select
        const linkTargetSelect = document.createElement('select');
        linkTargetSelect.value = linkData.linkTarget;
        linkTargetSelect.style.border = 'none';
        linkTargetSelect.style.outline = 'none';
        linkTargetSelect.style.backgroundColor = 'transparent';
        linkTargetSelect.style.padding = '4px';
        linkTargetSelect.addEventListener('change', () => {
            this.updateLinkInGroup(linkGroupId, linkData.id, {
                linkText: linkTextInput.value,
                linkUrl: linkGroupLinkUrlInput.value,
                linkTarget: linkTargetSelect.value
            });
        });
        
        const selfOption = document.createElement('option');
        selfOption.value = '_self';
        selfOption.textContent = 'Same';
        const blankOption = document.createElement('option');
        blankOption.value = '_blank';
        blankOption.textContent = 'New';
        
        linkTargetSelect.appendChild(selfOption);
        linkTargetSelect.appendChild(blankOption);
        
        // Remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = '×';
        removeButton.style.width = '24px';
        removeButton.style.height = '24px';
        removeButton.style.border = 'none';
        removeButton.style.borderRadius = '50%';
        removeButton.style.backgroundColor = '#ef4444';
        removeButton.style.color = 'white';
        removeButton.style.cursor = 'pointer';
        removeButton.style.fontSize = '16px';
        removeButton.style.display = 'flex';
        removeButton.style.alignItems = 'center';
        removeButton.style.justifyContent = 'center';
        removeButton.addEventListener('click', () => {
            this.removeLinkFromGroup(linkGroupId, linkData.id);
            this.refreshLinkGroupElement(linkElement.closest('.linkgroup-component'), linkGroupId);
        });
        
        linkElement.appendChild(linkTextInput);
        linkElement.appendChild(linkGroupLinkUrlInput);
        linkElement.appendChild(linkTargetSelect);
        linkElement.appendChild(removeButton);
        
        return linkElement;
    }

    refreshLinkGroupElement(linkGroupElement, linkGroupId) {
        if (!this.currentPage) return;
        
        const linkGroupComponent = this.currentPage.getLinkGroupComponentById(linkGroupId);
        if (!linkGroupComponent) return;
        
        const linksContainer = linkGroupElement.querySelector('.links-container');
        if (linksContainer) {
            linksContainer.innerHTML = '';
            linkGroupComponent.data.links.forEach(linkData => {
                const linkElement = this.createLinkElement(linkData, linkGroupId);
                linksContainer.appendChild(linkElement);
            });
        }
    }

    // Link Group Component Update Functions
    updateLinkGroupTitle(componentId, title) {
        if (this.currentPage) {
            try {
                this.currentPage.updateLinkGroupComponentData(componentId, { title });
            } catch (error) {
                console.error('Failed to update link group title:', error);
                this.showNotification('Failed to update title: ' + error.message, 'error');
            }
        }
    }

    addLinkToGroup(componentId) {
        if (this.currentPage) {
            try {
                const newLink = {
                    linkText: 'New Link',
                    linkUrl: 'https://example.com',
                    linkTarget: '_self'
                };
                this.currentPage.addLinkToGroup(componentId, newLink);
            } catch (error) {
                console.error('Failed to add link to group:', error);
                this.showNotification('Failed to add link: ' + error.message, 'error');
            }
        }
    }

    removeLinkFromGroup(componentId, linkId) {
        if (this.currentPage) {
            try {
                this.currentPage.removeLinkFromGroup(componentId, linkId);
            } catch (error) {
                console.error('Failed to remove link from group:', error);
                this.showNotification('Failed to remove link: ' + error.message, 'error');
            }
        }
    }

    updateLinkInGroup(componentId, linkId, updates) {
        if (this.currentPage) {
            try {
                this.currentPage.updateLinkInGroup(componentId, linkId, updates);
            } catch (error) {
                console.error('Failed to update link in group:', error);
                this.showNotification('Failed to update link: ' + error.message, 'error');
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

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing app...');
    
    // Check if TemplatePageEditor class exists
    if (typeof TemplatePageEditor === 'undefined') {
        console.error('TemplatePageEditor class not found!');
        return;
    }
    
    // Initialize the application
    const app = new TemplatePageEditor();
    console.log('App initialized:', app);
    
    // Load saved theme
    const savedTheme = localStorage.getItem('templatePageEditor_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
    }
    
    // Debug: Check if toolbar buttons exist
    const toolbarButtons = document.querySelectorAll('.toolbar-btn[data-tool]');
    console.log('Found toolbar buttons:', toolbarButtons.length);
    
    // Debug: Check if canvas exists
    const canvas = document.getElementById('canvas');
    console.log('Canvas element:', canvas);
});

