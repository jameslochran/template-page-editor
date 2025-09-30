/**
 * TemplatePreviewModal Component
 * Full-screen modal for previewing templates before selection
 * Work Order #10: Create Template Preview Modal Interface
 */

class TemplatePreviewModal {
    constructor(options = {}) {
        this.options = {
            containerId: 'template-preview-modal-container',
            onClose: null,
            onSelect: null,
            ...options
        };
        
        this.isOpen = false;
        this.currentTemplate = null;
        this.container = null;
        this.overlay = null;
        this.modal = null;
        this.previewContent = null;
        this.loadingElement = null;
        
        this.init();
    }

    init() {
        this.createContainer();
        this.setupEventListeners();
    }

    createContainer() {
        // Create container if it doesn't exist
        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = this.options.containerId;
            this.container.className = 'template-preview-modal-container';
            document.body.appendChild(this.container);
        }
    }

    setupEventListeners() {
        // Listen for escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Listen for template preview requests
        document.addEventListener('templatePreviewRequested', (e) => {
            this.show(e.detail.template);
        });
    }

    show(template) {
        if (!template) {
            console.error('TemplatePreviewModal: No template provided');
            return;
        }

        this.currentTemplate = template;
        this.isOpen = true;
        
        this.render();
        this.container.style.display = 'flex';
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        this.container.focus();
        
        console.log('TemplatePreviewModal: Showing template:', template.name);
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.currentTemplate = null;
        
        this.container.style.display = 'none';
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Clear content
        if (this.previewContent) {
            this.previewContent.innerHTML = '';
        }
        
        // Call close callback
        if (this.options.onClose) {
            this.options.onClose();
        }
        
        console.log('TemplatePreviewModal: Closed');
    }

    selectTemplate() {
        if (!this.currentTemplate) return;
        
        console.log('TemplatePreviewModal: Template selected:', this.currentTemplate.name);
        
        // Call select callback
        if (this.options.onSelect) {
            this.options.onSelect(this.currentTemplate);
        }
        
        // Emit select event
        const event = new CustomEvent('templateSelected', {
            detail: {
                template: this.currentTemplate
            }
        });
        document.dispatchEvent(event);
        
        this.close();
    }

    render() {
        if (!this.currentTemplate) return;

        this.container.innerHTML = `
            <div class="template-preview-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="template-preview-title">
                <div class="template-preview-modal">
                    <div class="template-preview-header">
                        <div class="template-preview-title-section">
                            <h2 id="template-preview-title" class="template-preview-title">${this.escapeHtml(this.currentTemplate.name)}</h2>
                            <p class="template-preview-description">${this.escapeHtml(this.currentTemplate.description)}</p>
                        </div>
                        <div class="template-preview-actions">
                            <button class="btn btn-secondary template-preview-close-btn" aria-label="Close preview">
                                <i class="fas fa-times"></i>
                                Close
                            </button>
                            <button class="btn btn-primary template-preview-select-btn" aria-label="Select this template">
                                <i class="fas fa-check"></i>
                                Select Template
                            </button>
                        </div>
                    </div>
                    <div class="template-preview-content">
                        <div class="template-preview-loading" id="template-preview-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading template preview...</p>
                        </div>
                        <div class="template-preview-canvas" id="template-preview-canvas"></div>
                    </div>
                </div>
            </div>
        `;

        this.overlay = this.container.querySelector('.template-preview-modal-overlay');
        this.modal = this.container.querySelector('.template-preview-modal');
        this.previewContent = this.container.querySelector('#template-preview-canvas');
        this.loadingElement = this.container.querySelector('#template-preview-loading');

        this.setupModalEventListeners();
        this.renderTemplateContent();
    }

    setupModalEventListeners() {
        // Close button
        const closeBtn = this.container.querySelector('.template-preview-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Select button
        const selectBtn = this.container.querySelector('.template-preview-select-btn');
        if (selectBtn) {
            selectBtn.addEventListener('click', () => this.selectTemplate());
        }

        // Click outside to close
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }
    }

    async renderTemplateContent() {
        if (!this.previewContent || !this.currentTemplate) return;

        try {
            // Show loading state
            if (this.loadingElement) {
                this.loadingElement.style.display = 'flex';
            }

            // Clear previous content
            this.previewContent.innerHTML = '';

            // Render template components
            if (this.currentTemplate.components && Array.isArray(this.currentTemplate.components)) {
                await this.renderComponents(this.currentTemplate.components);
            } else {
                this.renderEmptyState();
            }

            // Hide loading state
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }

        } catch (error) {
            console.error('TemplatePreviewModal: Error rendering template content:', error);
            this.renderErrorState(error.message);
            
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }
        }
    }

    async renderComponents(components) {
        if (!components || !Array.isArray(components)) return;

        // Use ComponentRenderer for consistent component rendering
        const componentRenderer = new ComponentRenderer();
        
        for (const component of components) {
            try {
                const element = componentRenderer.renderComponent(component, true); // true = read-only
                if (element) {
                    // Add template preview specific classes
                    element.classList.add('template-preview-component');
                    this.previewContent.appendChild(element);
                }
            } catch (error) {
                console.error('TemplatePreviewModal: Error rendering component:', component, error);
                // Create fallback element
                const fallbackElement = document.createElement('div');
                fallbackElement.className = 'template-preview-component component-error';
                fallbackElement.innerHTML = `
                    <div class="error-component">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Error rendering ${component.type || 'Unknown'} component</span>
                    </div>
                `;
                this.previewContent.appendChild(fallbackElement);
            }
        }
    }



    renderEmptyState() {
        if (!this.previewContent) return;
        
        this.previewContent.innerHTML = `
            <div class="template-preview-empty">
                <div class="empty-icon"><i class="fas fa-file-alt"></i></div>
                <h3>No Components</h3>
                <p>This template doesn't contain any components yet.</p>
            </div>
        `;
    }

    renderErrorState(errorMessage) {
        if (!this.previewContent) return;
        
        this.previewContent.innerHTML = `
            <div class="template-preview-error">
                <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h3>Preview Error</h3>
                <p>Unable to load template preview: ${this.escapeHtml(errorMessage)}</p>
            </div>
        `;
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public API methods
    isModalOpen() {
        return this.isOpen;
    }

    getCurrentTemplate() {
        return this.currentTemplate;
    }

    // Static method to create modal
    static create(options = {}) {
        return new TemplatePreviewModal(options);
    }
}

// Make TemplatePreviewModal available globally
window.TemplatePreviewModal = TemplatePreviewModal;

