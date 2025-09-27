/**
 * ComponentEditors - Mapping between component types and their editor classes
 * Work Order 12: Build EditingPanel with Dynamic Component Editor Loading
 * 
 * This file centralizes the dynamic loading logic and makes it easily extensible
 * for future component editors.
 */

/**
 * Base Component Editor Class
 * All component editors should extend this class
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
                        >${this.options.componentData?.content?.data || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="text-format">Format:</label>
                        <select id="text-format" class="form-control">
                            <option value="html" ${this.options.componentData?.content?.format === 'html' ? 'selected' : ''}>HTML</option>
                            <option value="plain" ${this.options.componentData?.content?.format === 'plain' ? 'selected' : ''}>Plain Text</option>
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
                    content: {
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
        // Use the new AccordionEditor if available
        if (window.AccordionEditor) {
            this.accordionEditor = new window.AccordionEditor(this.container, {
                componentData: this.options.componentData,
                onUpdate: (updatedData) => {
                    this.emitUpdate(updatedData);
                },
                onClose: () => {
                    this.emitClose();
                }
            });
            this.accordionEditor.render();
        } else {
            // Fallback to basic implementation
            this.renderFallback();
        }
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
        this.imageEditor = null;
    }
    render() {
        // Use the new ImageEditor for image fields if available
        if (window.ImageEditor) {
            this.renderWithImageEditor();
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
 * Placeholder implementation - will be fully implemented in separate work order
 */
class BannerComponentEditor extends BaseComponentEditor {
    render() {
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
                            value="${this.options.componentData?.headlineText || ''}"
                            placeholder="Banner headline..."
                        />
                    </div>
                    <div class="form-group">
                        <label for="banner-subheadline">Subheadline:</label>
                        <input 
                            type="text" 
                            id="banner-subheadline" 
                            class="form-control" 
                            value="${this.options.componentData?.subheadlineText || ''}"
                            placeholder="Banner subheadline..."
                        />
                    </div>
                    <div class="form-group">
                        <label for="banner-background">Background Image URL:</label>
                        <input 
                            type="url" 
                            id="banner-background" 
                            class="form-control" 
                            value="${this.options.componentData?.backgroundImageUrl || ''}"
                            placeholder="https://example.com/background.jpg"
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
                const headline = this.container.querySelector('#banner-headline').value;
                const subheadline = this.container.querySelector('#banner-subheadline').value;
                const backgroundImage = this.container.querySelector('#banner-background').value;

                const updatedData = {
                    ...this.options.componentData,
                    headlineText: headline,
                    subheadlineText: subheadline,
                    backgroundImageUrl: backgroundImage
                };

                this.emitUpdate(updatedData);
            });
        }
    }
}

/**
 * LinkGroupComponent Editor
 * Placeholder implementation - will be fully implemented in separate work order
 */
class LinkGroupComponentEditor extends BaseComponentEditor {
    render() {
        const links = this.options.componentData?.links || [];
        
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
                            value="${this.options.componentData?.title || ''}"
                            placeholder="Link group title..."
                        />
                    </div>
                    <div class="link-group-links">
                        <h5>Links (${links.length})</h5>
                        <div class="links-list">
                            ${links.map((link, index) => `
                                <div class="link-editor" data-index="${index}">
                                    <div class="link-header">
                                        <input type="text" value="${link.text || ''}" placeholder="Link text..." class="form-control link-text" />
                                        <button class="btn btn-sm btn-danger remove-link" data-index="${index}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <input type="url" value="${link.url || ''}" placeholder="https://example.com" class="form-control link-url" />
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn btn-sm btn-primary add-link">
                            <i class="fas fa-plus"></i> Add Link
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
                const title = this.container.querySelector('#linkgroup-title').value;
                const links = Array.from(this.container.querySelectorAll('.link-editor')).map(linkEl => ({
                    text: linkEl.querySelector('.link-text').value,
                    url: linkEl.querySelector('.link-url').value,
                    target: '_self'
                }));

                const updatedData = {
                    ...this.options.componentData,
                    title: title,
                    links: links
                };

                this.emitUpdate(updatedData);
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
 * Component Editors Mapping
 * Maps component types to their corresponding editor classes
 */
const ComponentEditors = {
    'TextComponent': TextComponentEditor,
    'AccordionComponent': AccordionComponentEditor,
    'CardComponent': CardComponentEditor,
    'BannerComponent': BannerComponentEditor,
    'LinkGroupComponent': LinkGroupComponentEditor,
    
    // Add more component editors here as they are implemented
    // 'ImageComponent': ImageComponentEditor,
    // 'ButtonComponent': ButtonComponentEditor,
    // 'ContainerComponent': ContainerComponentEditor,
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
