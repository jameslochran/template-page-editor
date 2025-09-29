/**
 * ComponentEditors - Mapping between component types and their editor classes
 * Work Order 12: Build EditingPanel with Dynamic Component Editor Loading
 * 
 * This file centralizes the dynamic loading logic and makes it easily extensible
 * for future component editors.
 */

// BaseComponentEditor is now loaded from separate file

/**
 * TextComponent Editor
 * Work Order 16: Enhanced implementation with rich text editing
 */
class TextComponentEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.textEditor = null;
    }

    render() {
        // Use the new TextEditor if available
        if (window.TextEditor) {
            this.textEditor = new window.TextEditor(this.container, {
                componentData: this.options.componentData,
                onUpdate: (updatedData) => {
                    this.emitUpdate(updatedData);
                },
                onClose: () => {
                    this.emitClose();
                }
            });
            this.textEditor.render();
        } else {
            // Fallback to basic implementation
            this.renderFallback();
        }
    }

    renderFallback() {
        this.container.innerHTML = `
            <div class="text-component-editor">
                <div class="editor-header">
                    <h4>Text Component Editor</h4>
                    <p class="editor-description">Edit text content and formatting</p>
                </div>
                <div class="editor-content">
                    <div class="form-group">
                        <label for="text-content">Content:</label>
                        <textarea 
                            id="text-content" 
                            class="form-control" 
                            rows="4" 
                            placeholder="Enter text content..."
                        >${this.options.componentData?.data?.data || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="text-format">Format:</label>
                        <select id="text-format" class="form-control">
                            <option value="html" ${this.options.componentData?.data?.format === 'html' ? 'selected' : ''}>HTML</option>
                            <option value="plain" ${this.options.componentData?.data?.format === 'plain' ? 'selected' : ''}>Plain Text</option>
                        </select>
                    </div>
                </div>
                <div class="editor-actions">
                    <button class="btn btn-primary" onclick="this.closest('.text-component-editor').querySelector('.save-btn').click()">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.editing-panel').style.display='none'">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="save-btn" style="display: none;" onclick="this.saveChanges()"></button>
                </div>
            </div>
        `;

        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const saveBtn = this.container.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.saveChanges = () => {
                const content = this.container.querySelector('#text-content').value;
                const format = this.container.querySelector('#text-format').value;
                
                const updatedData = {
                    ...this.options.componentData,
                    data: {
                        format: format,
                        data: content
                    }
                };
                
                this.emitUpdate(updatedData);
            };
        }
    }

    update(newData) {
        if (this.textEditor) {
            this.textEditor.update(newData);
        } else {
            this.options.componentData = newData;
            this.renderFallback();
        }
    }

    destroy() {
        if (this.textEditor) {
            this.textEditor.destroy();
        }
        super.destroy();
    }
}

/**
 * AccordionComponent Editor
 * Work Order 16: Enhanced implementation with item management
 */
class AccordionComponentEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.accordionEditor = null;
    }
    render() {
        // Use fallback implementation for now to ensure it works
        this.renderFallback();
    }

    renderFallback() {
        const items = this.options.componentData?.items || [];
        
        this.container.innerHTML = `
            <div class="accordion-component-editor">
                <div class="editor-header">
                    <h4>Accordion Component Editor</h4>
                    <p class="editor-description">Edit accordion items and properties</p>
                </div>
                <div class="editor-content">
                    <div class="form-group">
                        <label for="accordion-title">Title:</label>
                        <input 
                            type="text" 
                            id="accordion-title" 
                            class="form-control" 
                            value="${this.options.componentData?.title || ''}"
                            placeholder="Accordion title..."
                        />
                    </div>
                    <div class="accordion-items">
                        <h5>Accordion Items (${items.length})</h5>
                        <div class="items-list">
                            ${items.map((item, index) => `
                                <div class="accordion-item-editor" data-index="${index}">
                                    <div class="item-header">
                                        <input type="text" value="${item.title || ''}" placeholder="Item title..." class="form-control item-title" />
                                        <button class="btn btn-sm btn-danger remove-item" data-index="${index}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <textarea class="form-control item-content" placeholder="Item content...">${item.content || ''}</textarea>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn btn-sm btn-primary add-item">
                            <i class="fas fa-plus"></i> Add Item
                        </button>
                    </div>
                </div>
                <div class="editor-actions">
                    <button class="btn btn-primary save-changes">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.editing-panel').style.display='none'">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Save changes
        const saveBtn = this.container.querySelector('.save-changes');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const title = this.container.querySelector('#accordion-title').value;
                const items = Array.from(this.container.querySelectorAll('.accordion-item-editor')).map(itemEl => ({
                    title: itemEl.querySelector('.item-title').value,
                    content: itemEl.querySelector('.item-content').value
                }));

                const updatedData = {
                    ...this.options.componentData,
                    title: title,
                    items: items
                };

                this.emitUpdate(updatedData);
            });
        }

        // Add item
        const addBtn = this.container.querySelector('.add-item');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const itemsList = this.container.querySelector('.items-list');
                const newIndex = itemsList.children.length;
                const newItem = document.createElement('div');
                newItem.className = 'accordion-item-editor';
                newItem.dataset.index = newIndex;
                newItem.innerHTML = `
                    <div class="item-header">
                        <input type="text" value="" placeholder="Item title..." class="form-control item-title" />
                        <button class="btn btn-sm btn-danger remove-item" data-index="${newIndex}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <textarea class="form-control item-content" placeholder="Item content..."></textarea>
                `;
                itemsList.appendChild(newItem);
            });
        }

        // Remove item
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item')) {
                e.target.closest('.accordion-item-editor').remove();
            }
        });
    }

    update(newData) {
        if (this.accordionEditor) {
            this.accordionEditor.update(newData);
        } else {
            this.options.componentData = newData;
            this.renderFallback();
        }
    }

    destroy() {
        if (this.accordionEditor) {
            this.accordionEditor.destroy();
        }
        super.destroy();
    }
}

/**
 * CardComponent Editor
 * Work Order 16: Enhanced implementation with image editing
 */
class CardComponentEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.cardEditor = null;
    }
    render() {
        // Use the new CardEditor if available
        if (window.CardEditor) {
            this.cardEditor = new window.CardEditor(this.container, {
                componentData: this.options.componentData,
                onTitleChange: (cardId, newTitle) => {
                    this.emitUpdate({ title: newTitle });
                },
                onDescriptionChange: (cardId, newDescription) => {
                    this.emitUpdate({ description: newDescription });
                },
                onLinkChange: (cardId, linkData) => {
                    this.emitUpdate(linkData);
                },
                onUpdate: (updatedData) => {
                    this.emitUpdate(updatedData);
                },
                onClose: () => {
                    this.emitClose();
                }
            });
        } else {
            // Fallback to basic implementation
            this.renderFallback();
        }
    }

    renderWithImageEditor() {
        this.container.innerHTML = `
            <div class="card-component-editor">
                <div class="editor-header">
                    <h4>Card Component Editor</h4>
                    <p class="editor-description">Edit card properties and content</p>
                </div>
                <div class="editor-content">
                    <div class="form-group">
                        <label for="card-title">Title:</label>
                        <input 
                            type="text" 
                            id="card-title" 
                            class="form-control" 
                            value="${this.options.componentData?.title || ''}"
                            placeholder="Card title..."
                        />
                    </div>
                    <div class="form-group">
                        <label for="card-description">Description:</label>
                        <textarea 
                            id="card-description" 
                            class="form-control" 
                            rows="3"
                            placeholder="Card description..."
                        >${this.options.componentData?.description?.data || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Image Settings</label>
                        <div id="card-image-editor"></div>
                    </div>
                </div>
                <div class="editor-actions">
                    <button class="btn btn-primary save-changes">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.editing-panel').style.display='none'">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;

        // Initialize image editor
        const imageEditorContainer = this.container.querySelector('#card-image-editor');
        if (imageEditorContainer) {
            this.imageEditor = new window.ImageEditor(imageEditorContainer, {
                componentData: {
                    imageUrl: this.options.componentData?.imageUrl || '',
                    altText: this.options.componentData?.altText || '',
                    caption: this.options.componentData?.caption || ''
                },
                onUpdate: (imageData) => {
                    // Update the card data with image data
                    this.handleDataChange();
                }
            });
            this.imageEditor.render();
        }

        this.setupEventListeners();
    }

    renderFallback() {
        this.container.innerHTML = `
            <div class="card-component-editor">
                <div class="editor-header">
                    <h4>Card Component Editor</h4>
                    <p class="editor-description">Edit card properties and content</p>
                </div>
                <div class="editor-content">
                    <div class="form-group">
                        <label for="card-title">Title:</label>
                        <input 
                            type="text" 
                            id="card-title" 
                            class="form-control" 
                            value="${this.options.componentData?.title || ''}"
                            placeholder="Card title..."
                        />
                    </div>
                    <div class="form-group">
                        <label for="card-description">Description:</label>
                        <textarea 
                            id="card-description" 
                            class="form-control" 
                            rows="3"
                            placeholder="Card description..."
                        >${this.options.componentData?.description?.data || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="card-image-url">Image URL:</label>
                        <input 
                            type="url" 
                            id="card-image-url" 
                            class="form-control" 
                            value="${this.options.componentData?.imageUrl || ''}"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                </div>
                <div class="editor-actions">
                    <button class="btn btn-primary save-changes">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.editing-panel').style.display='none'">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const saveBtn = this.container.querySelector('.save-changes');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.handleDataChange();
            });
        }
    }

    handleDataChange() {
        const title = this.container.querySelector('#card-title')?.value || '';
        const description = this.container.querySelector('#card-description')?.value || '';
        
        // Get image data from image editor if available
        let imageData = {};
        if (this.imageEditor) {
            imageData = this.imageEditor.getCurrentData();
        } else {
            // Fallback to basic image URL
            const imageUrl = this.container.querySelector('#card-image-url')?.value || '';
            imageData = { imageUrl };
        }

        const updatedData = {
            ...this.options.componentData,
            title: title,
            description: {
                format: 'html',
                data: description
            },
            ...imageData
        };

        this.emitUpdate(updatedData);
    }

    update(newData) {
        this.options.componentData = newData;
        if (this.imageEditor) {
            this.imageEditor.update({
                imageUrl: newData.imageUrl || '',
                altText: newData.altText || '',
                caption: newData.caption || ''
            });
        }
        this.render();
    }

    destroy() {
        if (this.imageEditor) {
            this.imageEditor.destroy();
        }
        super.destroy();
    }
}

/**
 * BannerComponent Editor
 * Uses the dedicated BannerEditor component for comprehensive banner editing
 */
class BannerComponentEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.bannerEditor = null;
    }

    render() {
        // Use the new BannerEditor if available
        if (window.BannerEditor) {
            this.bannerEditor = new window.BannerEditor(this.container, {
                componentData: this.options.componentData,
                onHeadlineChange: (bannerId, headlineText) => {
                    this.emitUpdate({ headlineText });
                },
                onCallToActionChange: (bannerId, callToAction) => {
                    this.emitUpdate({ callToAction });
                },
                onBackgroundImageChange: (bannerId, imageUrl, altText) => {
                    this.emitUpdate({ 
                        backgroundImageUrl: imageUrl,
                        backgroundImageAltText: altText
                    });
                },
                onUpdate: (updatedData) => {
                    this.emitUpdate(updatedData);
                },
                onClose: () => {
                    this.emitClose();
                }
            });
        } else {
            // Fallback to basic implementation
            this.renderFallback();
        }
    }

    renderFallback() {
        this.container.innerHTML = `
            <div class="banner-component-editor">
                <div class="editor-header">
                    <h4>Banner Component Editor</h4>
                    <p class="editor-description">Edit banner content and styling</p>
                </div>
                <div class="editor-content">
                    <div class="form-group">
                        <label for="banner-headline">Headline:</label>
                        <input 
                            type="text" 
                            id="banner-headline" 
                            class="form-control" 
                            value="${this.options.componentData?.data?.headlineText || ''}"
                            placeholder="Banner headline..."
                        />
                    </div>
                    <div class="form-group">
                        <label for="banner-cta-text">Call-to-Action Text:</label>
                        <input 
                            type="text" 
                            id="banner-cta-text" 
                            class="form-control" 
                            value="${this.options.componentData?.data?.callToAction?.buttonText || ''}"
                            placeholder="Button text..."
                        />
                    </div>
                    <div class="form-group">
                        <label for="banner-cta-url">Call-to-Action URL:</label>
                        <input 
                            type="url" 
                            id="banner-cta-url" 
                            class="form-control" 
                            value="${this.options.componentData?.data?.callToAction?.linkUrl || ''}"
                            placeholder="https://example.com"
                        />
                    </div>
                </div>
            </div>
        `;

        this.setupFallbackEventListeners();
    }

    setupFallbackEventListeners() {
        const headlineInput = this.container.querySelector('#banner-headline');
        const ctaTextInput = this.container.querySelector('#banner-cta-text');
        const ctaUrlInput = this.container.querySelector('#banner-cta-url');

        if (headlineInput) {
            headlineInput.addEventListener('input', (e) => {
                this.emitUpdate({ headlineText: e.target.value });
            });
        }

        if (ctaTextInput) {
            ctaTextInput.addEventListener('input', (e) => {
                const callToAction = {
                    ...this.options.componentData?.data?.callToAction,
                    buttonText: e.target.value
                };
                this.emitUpdate({ callToAction });
            });
        }

        if (ctaUrlInput) {
            ctaUrlInput.addEventListener('input', (e) => {
                const callToAction = {
                    ...this.options.componentData?.data?.callToAction,
                    linkUrl: e.target.value
                };
                this.emitUpdate({ callToAction });
            });
        }
    }
}

/**
 * LinkGroupComponent Editor
 * Uses the dedicated LinkGroupEditor component for comprehensive link group editing
 */
class LinkGroupComponentEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.linkGroupEditor = null;
    }

    render() {
        // Use the new LinkGroupEditor if available
        if (window.LinkGroupEditor) {
            this.linkGroupEditor = new window.LinkGroupEditor(this.container, {
                componentData: this.options.componentData,
                onUpdate: (updatedData) => {
                    this.emitUpdate(updatedData);
                },
                onClose: () => {
                    this.emitClose();
                }
            });
        } else {
            // Fallback to basic implementation
            this.renderFallback();
        }
    }

    renderFallback() {
        const links = this.options.componentData?.data?.links || [];
        
        this.container.innerHTML = `
            <div class="linkgroup-component-editor">
                <div class="editor-header">
                    <h4>Link Group Component Editor</h4>
                    <p class="editor-description">Edit link group properties and links</p>
                </div>
                <div class="editor-content">
                    <div class="form-group">
                        <label for="linkgroup-title">Title:</label>
                        <input 
                            type="text" 
                            id="linkgroup-title" 
                            class="form-control" 
                            value="${this.options.componentData?.data?.title || ''}"
                            placeholder="Link group title..."
                        />
                    </div>
                    <div class="link-group-links">
                        <h5>Links (${links.length})</h5>
                        <div class="links-list">
                            ${links.map((link, index) => `
                                <div class="link-editor" data-index="${index}">
                                    <div class="link-header">
                                        <input type="text" value="${link.linkText || ''}" placeholder="Link text..." class="form-control link-text" />
                                        <button class="btn btn-sm btn-danger remove-link" data-index="${index}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <input type="url" value="${link.linkUrl || ''}" placeholder="https://example.com" class="form-control link-url" />
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn btn-sm btn-primary add-link">
                            <i class="fas fa-plus"></i> Add Link
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupFallbackEventListeners();
    }

    setupFallbackEventListeners() {
        // Title input
        const titleInput = this.container.querySelector('#linkgroup-title');
        if (titleInput) {
            titleInput.addEventListener('input', (e) => {
                this.emitUpdate({ title: e.target.value });
            });
        }

        // Add link
        const addBtn = this.container.querySelector('.add-link');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const linksList = this.container.querySelector('.links-list');
                const newIndex = linksList.children.length;
                const newLink = document.createElement('div');
                newLink.className = 'link-editor';
                newLink.dataset.index = newIndex;
                newLink.innerHTML = `
                    <div class="link-header">
                        <input type="text" value="" placeholder="Link text..." class="form-control link-text" />
                        <button class="btn btn-sm btn-danger remove-link" data-index="${newIndex}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <input type="url" value="" placeholder="https://example.com" class="form-control link-url" />
                `;
                linksList.appendChild(newLink);
            });
        }

        // Remove link
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.remove-link')) {
                e.target.closest('.link-editor').remove();
            }
        });
    }
}

/**
 * ImageComponent Editor
 * Work Order 16: Enhanced implementation with image editing
 */
class ImageComponentEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
        this.imageEditor = null;
    }

    render() {
        // Use the new ImageEditor if available
        if (window.ImageEditor) {
            this.imageEditor = new window.ImageEditor(this.container, {
                componentData: this.options.componentData,
                onUpdate: (updatedData) => {
                    this.emitUpdate(updatedData);
                },
                onClose: () => {
                    this.emitClose();
                }
            });
            this.imageEditor.render();
        } else {
            // Fallback to basic implementation
            this.renderFallback();
        }
    }

    renderFallback() {
        this.container.innerHTML = `
            <div class="component-editor-fallback">
                <h4>Image Component Editor</h4>
                <p>Component ID: ${this.options.componentData?.id || 'Unknown'}</p>
                <div class="component-data">
                    <h5>Component Data:</h5>
                    <pre>${JSON.stringify(this.options.componentData, null, 2)}</pre>
                </div>
                <p class="fallback-message">
                    <i class="fas fa-info-circle"></i>
                    Image editor not available. Please ensure ImageEditor is loaded.
                </p>
            </div>
        `;
    }

    destroy() {
        if (this.imageEditor) {
            this.imageEditor.destroy();
        }
        super.destroy();
    }
}

/**
 * ButtonComponent Editor
 * Work Order 16: Enhanced implementation with button editing
 */
class ButtonComponentEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
    }

    render() {
        const componentData = this.options.componentData || {};
        const data = componentData.data || componentData || {};
        
        this.container.innerHTML = `
            <div class="button-editor">
                <div class="editor-header">
                    <h4><i class="fas fa-mouse-pointer"></i> Button Editor</h4>
                </div>
                
                <div class="editor-content">
                    <div class="form-group">
                        <label for="button-text">Button Text:</label>
                        <input type="text" id="button-text" value="${data.text || 'Button'}" placeholder="Enter button text">
                    </div>
                    
                    <div class="form-group">
                        <label for="button-url">Link URL:</label>
                        <input type="url" id="button-url" value="${data.url || ''}" placeholder="https://example.com">
                    </div>
                    
                    <div class="form-group">
                        <label for="button-style">Button Style:</label>
                        <select id="button-style">
                            <option value="primary" ${data.style === 'primary' ? 'selected' : ''}>Primary</option>
                            <option value="secondary" ${data.style === 'secondary' ? 'selected' : ''}>Secondary</option>
                            <option value="success" ${data.style === 'success' ? 'selected' : ''}>Success</option>
                            <option value="danger" ${data.style === 'danger' ? 'selected' : ''}>Danger</option>
                            <option value="warning" ${data.style === 'warning' ? 'selected' : ''}>Warning</option>
                            <option value="info" ${data.style === 'info' ? 'selected' : ''}>Info</option>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="button-width">Width (px):</label>
                            <input type="number" id="button-width" value="${data.width || 120}" min="50" max="500">
                        </div>
                        
                        <div class="form-group">
                            <label for="button-height">Height (px):</label>
                            <input type="number" id="button-height" value="${data.height || 40}" min="20" max="100">
                        </div>
                    </div>
                    
                    <div class="editor-actions">
                        <button type="button" class="btn btn-primary" data-action="save">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button type="button" class="btn btn-secondary" data-action="cancel">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Text input handler
        const textInput = this.container.querySelector('#button-text');
        if (textInput) {
            textInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // URL input handler
        const urlInput = this.container.querySelector('#button-url');
        if (urlInput) {
            urlInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Style select handler
        const styleSelect = this.container.querySelector('#button-style');
        if (styleSelect) {
            styleSelect.addEventListener('change', () => {
                this.handleDataChange();
            });
        }

        // Width input handler
        const widthInput = this.container.querySelector('#button-width');
        if (widthInput) {
            widthInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Height input handler
        const heightInput = this.container.querySelector('#button-height');
        if (heightInput) {
            heightInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Action buttons
        const saveBtn = this.container.querySelector('[data-action="save"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.save();
            });
        }

        const cancelBtn = this.container.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancel();
            });
        }
    }

    handleDataChange() {
        const updatedData = this.getFormData();
        this.emitUpdate(updatedData);
    }

    getFormData() {
        const textInput = this.container.querySelector('#button-text');
        const urlInput = this.container.querySelector('#button-url');
        const styleSelect = this.container.querySelector('#button-style');
        const widthInput = this.container.querySelector('#button-width');
        const heightInput = this.container.querySelector('#button-height');

        return {
            text: textInput ? textInput.value : 'Button',
            url: urlInput ? urlInput.value : '',
            style: styleSelect ? styleSelect.value : 'primary',
            width: widthInput ? parseInt(widthInput.value) : 120,
            height: heightInput ? parseInt(heightInput.value) : 40
        };
    }

    save() {
        const updatedData = this.getFormData();
        this.emitUpdate(updatedData);
        this.emitClose();
    }

    cancel() {
        this.emitClose();
    }
}

/**
 * ContainerComponent Editor
 * Work Order 16: Enhanced implementation with container editing
 */
class ContainerComponentEditor extends BaseComponentEditor {
    constructor(container, options = {}) {
        super(container, options);
    }

    render() {
        const componentData = this.options.componentData || {};
        const data = componentData.data || componentData || {};
        
        this.container.innerHTML = `
            <div class="container-editor">
                <div class="editor-header">
                    <h4><i class="fas fa-square"></i> Container Editor</h4>
                </div>
                
                <div class="editor-content">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="container-width">Width (px):</label>
                            <input type="number" id="container-width" value="${data.width || 300}" min="100" max="800">
                        </div>
                        
                        <div class="form-group">
                            <label for="container-height">Height (px):</label>
                            <input type="number" id="container-height" value="${data.height || 200}" min="50" max="600">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="container-background">Background Color:</label>
                        <input type="color" id="container-background" value="${data.backgroundColor || '#f8fafc'}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="container-border-color">Border Color:</label>
                            <input type="color" id="container-border-color" value="${data.borderColor || '#cbd5e1'}">
                        </div>
                        
                        <div class="form-group">
                            <label for="container-border-style">Border Style:</label>
                            <select id="container-border-style">
                                <option value="solid" ${data.borderStyle === 'solid' ? 'selected' : ''}>Solid</option>
                                <option value="dashed" ${data.borderStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
                                <option value="dotted" ${data.borderStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
                                <option value="none" ${data.borderStyle === 'none' ? 'selected' : ''}>None</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="container-border-width">Border Width (px):</label>
                            <input type="number" id="container-border-width" value="${data.borderWidth || 1}" min="0" max="10">
                        </div>
                        
                        <div class="form-group">
                            <label for="container-padding">Padding (px):</label>
                            <input type="number" id="container-padding" value="${data.padding || 10}" min="0" max="50">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="container-margin">Margin (px):</label>
                        <input type="number" id="container-margin" value="${data.margin || 0}" min="0" max="50">
                    </div>
                    
                    <div class="editor-actions">
                        <button type="button" class="btn btn-primary" data-action="save">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                        <button type="button" class="btn btn-secondary" data-action="cancel">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Width input handler
        const widthInput = this.container.querySelector('#container-width');
        if (widthInput) {
            widthInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Height input handler
        const heightInput = this.container.querySelector('#container-height');
        if (heightInput) {
            heightInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Background color handler
        const backgroundInput = this.container.querySelector('#container-background');
        if (backgroundInput) {
            backgroundInput.addEventListener('change', () => {
                this.handleDataChange();
            });
        }

        // Border color handler
        const borderColorInput = this.container.querySelector('#container-border-color');
        if (borderColorInput) {
            borderColorInput.addEventListener('change', () => {
                this.handleDataChange();
            });
        }

        // Border style handler
        const borderStyleSelect = this.container.querySelector('#container-border-style');
        if (borderStyleSelect) {
            borderStyleSelect.addEventListener('change', () => {
                this.handleDataChange();
            });
        }

        // Border width handler
        const borderWidthInput = this.container.querySelector('#container-border-width');
        if (borderWidthInput) {
            borderWidthInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Padding handler
        const paddingInput = this.container.querySelector('#container-padding');
        if (paddingInput) {
            paddingInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Margin handler
        const marginInput = this.container.querySelector('#container-margin');
        if (marginInput) {
            marginInput.addEventListener('input', () => {
                this.handleDataChange();
            });
        }

        // Action buttons
        const saveBtn = this.container.querySelector('[data-action="save"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.save();
            });
        }

        const cancelBtn = this.container.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancel();
            });
        }
    }

    handleDataChange() {
        const updatedData = this.getFormData();
        this.emitUpdate(updatedData);
    }

    getFormData() {
        const widthInput = this.container.querySelector('#container-width');
        const heightInput = this.container.querySelector('#container-height');
        const backgroundInput = this.container.querySelector('#container-background');
        const borderColorInput = this.container.querySelector('#container-border-color');
        const borderStyleSelect = this.container.querySelector('#container-border-style');
        const borderWidthInput = this.container.querySelector('#container-border-width');
        const paddingInput = this.container.querySelector('#container-padding');
        const marginInput = this.container.querySelector('#container-margin');

        return {
            width: widthInput ? parseInt(widthInput.value) : 300,
            height: heightInput ? parseInt(heightInput.value) : 200,
            backgroundColor: backgroundInput ? backgroundInput.value : '#f8fafc',
            borderColor: borderColorInput ? borderColorInput.value : '#cbd5e1',
            borderStyle: borderStyleSelect ? borderStyleSelect.value : 'dashed',
            borderWidth: borderWidthInput ? parseInt(borderWidthInput.value) : 1,
            padding: paddingInput ? parseInt(paddingInput.value) : 10,
            margin: marginInput ? parseInt(marginInput.value) : 0
        };
    }

    save() {
        const updatedData = this.getFormData();
        this.emitUpdate(updatedData);
        this.emitClose();
    }

    cancel() {
        this.emitClose();
    }
}

/**
 * Component Editors Mapping
 * Maps component types to their corresponding editor classes
 */
const ComponentEditors = {
    'TextComponent': TextComponentEditor,
    'AccordionComponent': AccordionComponentEditor,
    'CardComponent': CardComponentEditor,
    'BannerComponent': BannerComponentEditor,
    'LinkGroupComponent': LinkGroupComponentEditor,
    
    // Add lowercase mappings for template types
    'text': TextComponentEditor,
    'accordion': AccordionComponentEditor,
    'card': CardComponentEditor,
    'banner': BannerComponentEditor,
    'linkgroup': LinkGroupComponentEditor,
    
    // Add more component editors here as they are implemented
    'ImageComponent': ImageComponentEditor,
    'ButtonComponent': ButtonComponentEditor,
    'ContainerComponent': ContainerComponentEditor,
};

// Expose ComponentEditors globally
window.ComponentEditors = ComponentEditors;

// Also expose individual editor classes for direct access if needed
window.BaseComponentEditor = BaseComponentEditor;
window.TextComponentEditor = TextComponentEditor;
window.AccordionComponentEditor = AccordionComponentEditor;
window.CardComponentEditor = CardComponentEditor;
window.BannerComponentEditor = BannerComponentEditor;
window.LinkGroupComponentEditor = LinkGroupComponentEditor;
window.ImageComponentEditor = ImageComponentEditor;
window.ButtonComponentEditor = ButtonComponentEditor;
window.ContainerComponentEditor = ContainerComponentEditor;
