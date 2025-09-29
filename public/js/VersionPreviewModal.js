/**
 * VersionPreviewModal - Work Order 45
 * Modal component for viewing historical page versions in read-only format
 */
class VersionPreviewModal {
    constructor(options = {}) {
        this.options = {
            onClose: () => {},
            ...options
        };
        
        this.isVisible = false;
        this.currentVersion = null;
        this.isLoading = false;
        this.error = null;
        
        this.elements = {};
        this.componentRenderer = new ComponentRenderer();
        
        this.init();
    }

    /**
     * Initialize the modal
     */
    init() {
        this.createModal();
        this.setupEventListeners();
    }

    /**
     * Create the modal HTML structure
     */
    createModal() {
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'version-preview-modal';
        modalContainer.className = 'version-preview-modal';
        modalContainer.style.display = 'none';
        
        modalContainer.innerHTML = `
            <div class="version-preview-modal-overlay">
                <div class="version-preview-modal-container">
                    <div class="version-preview-modal-header">
                        <div class="version-preview-modal-title">
                            <h2>
                                <i class="fas fa-eye"></i>
                                Version Preview
                            </h2>
                            <div class="version-preview-modal-metadata">
                                <div class="version-info">
                                    <span class="version-number"></span>
                                    <span class="version-name"></span>
                                </div>
                                <div class="version-details">
                                    <span class="version-timestamp"></span>
                                    <span class="version-description"></span>
                                </div>
                            </div>
                        </div>
                        <button class="version-preview-modal-close" data-action="close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="version-preview-modal-content">
                        <div class="version-preview-loading" style="display: none;">
                            <div class="loading-spinner"></div>
                            <p>Loading version content...</p>
                        </div>
                        
                        <div class="version-preview-error" style="display: none;">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p class="error-message"></p>
                            <button class="retry-btn" data-action="retry">Retry</button>
                        </div>
                        
                        <div class="version-preview-content" style="display: none;">
                            <div class="read-only-indicator">
                                <i class="fas fa-lock"></i>
                                <span>Read-only preview</span>
                            </div>
                            <div class="version-components-container">
                                <!-- Version components will be rendered here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(modalContainer);
        this.container = modalContainer;
        
        // Cache DOM elements
        this.elements = {
            overlay: modalContainer.querySelector('.version-preview-modal-overlay'),
            container: modalContainer.querySelector('.version-preview-modal-container'),
            header: modalContainer.querySelector('.version-preview-modal-header'),
            title: modalContainer.querySelector('.version-preview-modal-title h2'),
            closeBtn: modalContainer.querySelector('.version-preview-modal-close'),
            content: modalContainer.querySelector('.version-preview-modal-content'),
            loading: modalContainer.querySelector('.version-preview-loading'),
            error: modalContainer.querySelector('.version-preview-error'),
            errorMessage: modalContainer.querySelector('.error-message'),
            retryBtn: modalContainer.querySelector('.retry-btn'),
            previewContent: modalContainer.querySelector('.version-preview-content'),
            componentsContainer: modalContainer.querySelector('.version-components-container'),
            versionNumber: modalContainer.querySelector('.version-number'),
            versionName: modalContainer.querySelector('.version-name'),
            versionTimestamp: modalContainer.querySelector('.version-timestamp'),
            versionDescription: modalContainer.querySelector('.version-description')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        this.elements.closeBtn.addEventListener('click', () => {
            this.close();
        });

        // Overlay click to close
        this.elements.overlay.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) {
                this.close();
            }
        });

        // Retry button
        this.elements.retryBtn.addEventListener('click', () => {
            if (this.currentVersion) {
                this.loadVersionContent(this.currentVersion);
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.close();
            }
        });
    }

    /**
     * Show the modal with version data
     * @param {Object} version - Version data from PageVersion model
     */
    show(version) {
        if (!version) {
            console.error('VersionPreviewModal: No version provided');
            return;
        }

        this.currentVersion = version;
        this.isVisible = true;
        this.container.style.display = 'block';
        
        // Update version metadata
        this.updateVersionMetadata(version);
        
        // Load version content
        this.loadVersionContent(version);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Hide the modal
     */
    close() {
        this.isVisible = false;
        this.container.style.display = 'none';
        this.currentVersion = null;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Clear content
        this.elements.componentsContainer.innerHTML = '';
        this.hideLoading();
        this.hideError();
        this.hideContent();
        
        // Call close callback
        this.options.onClose();
    }

    /**
     * Update version metadata in the header
     * @param {Object} version - Version data
     */
    updateVersionMetadata(version) {
        this.elements.versionNumber.textContent = `Version ${version.versionNumber || 'Unknown'}`;
        this.elements.versionName.textContent = version.versionName || 'Untitled Version';
        this.elements.versionTimestamp.textContent = version.getFormattedTimestamp ? 
            version.getFormattedTimestamp() : 
            new Date(version.timestamp || version.createdAt).toLocaleString();
        this.elements.versionDescription.textContent = version.changeDescription || 'No description provided';
    }

    /**
     * Load version content from API
     * @param {Object} version - Version data
     */
    async loadVersionContent(version) {
        if (!version.id || !version.pageId) {
            this.showError('Invalid version data');
            return;
        }

        this.setLoading(true);
        this.hideError();
        this.hideContent();

        try {
            const response = await fetch(`/api/pages/${version.pageId}/versions/${version.id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const versionData = await response.json();
            
            if (!versionData || !versionData.components) {
                throw new Error('Invalid version data received');
            }

            // Render version components
            this.renderVersionComponents(versionData.components);
            
            this.setLoading(false);
            this.showContent();
            
        } catch (error) {
            console.error('Error loading version content:', error);
            this.setLoading(false);
            this.showError(error.message || 'Failed to load version content');
        }
    }

    /**
     * Render version components in read-only format
     * @param {Array} components - Array of component data
     */
    renderVersionComponents(components) {
        this.elements.componentsContainer.innerHTML = '';
        
        if (!components || components.length === 0) {
            this.elements.componentsContainer.innerHTML = `
                <div class="no-components">
                    <i class="fas fa-inbox"></i>
                    <p>No components in this version</p>
                </div>
            `;
            return;
        }

        // Sort components by order
        const sortedComponents = [...components].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        sortedComponents.forEach(component => {
            try {
                const componentElement = this.componentRenderer.renderComponent(component, true); // true = read-only
                this.elements.componentsContainer.appendChild(componentElement);
            } catch (error) {
                console.error('Error rendering component:', component, error);
                // Create fallback element
                const fallbackElement = document.createElement('div');
                fallbackElement.className = 'component-error';
                fallbackElement.innerHTML = `
                    <div class="error-component">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Error rendering ${component.type || 'Unknown'} component</span>
                    </div>
                `;
                this.elements.componentsContainer.appendChild(fallbackElement);
            }
        });
    }

    /**
     * Set loading state
     * @param {boolean} loading - Whether to show loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        if (loading) {
            this.elements.loading.style.display = 'flex';
        } else {
            this.elements.loading.style.display = 'none';
        }
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    showError(message) {
        this.error = message;
        this.elements.errorMessage.textContent = message;
        this.elements.error.style.display = 'flex';
    }

    /**
     * Hide error state
     */
    hideError() {
        this.error = null;
        this.elements.error.style.display = 'none';
    }

    /**
     * Show content
     */
    showContent() {
        this.elements.previewContent.style.display = 'block';
    }

    /**
     * Hide content
     */
    hideContent() {
        this.elements.previewContent.style.display = 'none';
    }
}

/**
 * ComponentRenderer - Utility class for rendering components in read-only format
 * Extracted from PageEditor for reuse
 */
class ComponentRenderer {
    /**
     * Render a component in read-only format
     * @param {Object} component - Component data
     * @param {boolean} readOnly - Whether to render in read-only mode
     * @returns {HTMLElement} Rendered component element
     */
    renderComponent(component, readOnly = false) {
        const element = document.createElement('div');
        element.className = `version-component ${component.type.toLowerCase()}-component`;
        element.dataset.componentId = component.id;
        element.dataset.componentType = component.type;

        // Extract data from the component structure
        const data = component.data || {};

        switch (component.type) {
            case 'TextComponent':
                return this.renderTextComponent(element, data, readOnly);
            case 'BannerComponent':
                return this.renderBannerComponent(element, data, readOnly);
            case 'CardComponent':
                return this.renderCardComponent(element, data, readOnly);
            case 'AccordionComponent':
                return this.renderAccordionComponent(element, data, readOnly);
            case 'LinkGroupComponent':
                return this.renderLinkGroupComponent(element, data, readOnly);
            default:
                return this.renderUnknownComponent(element, component, readOnly);
        }
    }

    /**
     * Render TextComponent
     */
    renderTextComponent(element, data, readOnly) {
        const textContent = data.content?.data || data.content || 'Text Component';
        element.innerHTML = `
            <div class="text-content">
                ${textContent}
            </div>
        `;
        element.style.padding = '20px';
        element.style.border = '1px solid #e2e8f0';
        element.style.borderRadius = '8px';
        element.style.backgroundColor = 'white';
        element.style.marginBottom = '20px';
        return element;
    }

    /**
     * Render BannerComponent
     */
    renderBannerComponent(element, data, readOnly) {
        const headline = data.headlineText || 'Banner Headline';
        const subheadline = data.subheadlineText || '';
        const backgroundImage = data.backgroundImageUrl || '';
        const cta = data.callToAction || {};
        
        element.innerHTML = `
            <div class="banner-preview" style="background-image: url('${backgroundImage}'); background-size: cover; background-position: center;">
                <div class="banner-content">
                    <h1 class="banner-headline">${headline}</h1>
                    ${subheadline ? `<p class="banner-subheadline">${subheadline}</p>` : ''}
                    ${cta.buttonText ? `
                        <div class="banner-cta">
                            <a href="${cta.linkUrl || '#'}" target="${cta.linkTarget || '_self'}" class="cta-button">
                                ${cta.buttonText}
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        element.style.minHeight = '400px';
        element.style.borderRadius = '8px';
        element.style.overflow = 'hidden';
        element.style.position = 'relative';
        element.style.marginBottom = '20px';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        
        return element;
    }

    /**
     * Render CardComponent
     */
    renderCardComponent(element, data, readOnly) {
        const title = data.title || 'Card Title';
        const description = data.description?.data || data.description || 'Card description';
        const imageUrl = data.imageUrl || '';
        const altText = data.altText || '';
        const linkUrl = data.linkUrl || '';
        const linkText = data.linkText || '';
        
        element.innerHTML = `
            <div class="card-preview">
                ${imageUrl ? `
                    <div class="card-image">
                        <img src="${imageUrl}" alt="${altText}" style="width: 100%; height: 200px; object-fit: cover;">
                    </div>
                ` : ''}
                <div class="card-content">
                    <h3 class="card-title">${title}</h3>
                    <div class="card-description">${description}</div>
                    ${linkUrl && linkText ? `
                        <div class="card-link">
                            <a href="${linkUrl}" target="${data.linkTarget || '_self'}" class="card-link-button">
                                ${linkText}
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        element.style.border = '1px solid #e2e8f0';
        element.style.borderRadius = '8px';
        element.style.backgroundColor = 'white';
        element.style.overflow = 'hidden';
        element.style.marginBottom = '20px';
        
        return element;
    }

    /**
     * Render AccordionComponent
     */
    renderAccordionComponent(element, data, readOnly) {
        const title = data.title || 'Accordion';
        const items = data.items || [];
        
        let itemsHtml = '';
        items.forEach((item, index) => {
            itemsHtml += `
                <div class="accordion-item">
                    <div class="accordion-header">
                        <h4>${item.title || `Item ${index + 1}`}</h4>
                    </div>
                    <div class="accordion-content">
                        <div class="accordion-text">${item.content || 'No content'}</div>
                    </div>
                </div>
            `;
        });
        
        element.innerHTML = `
            <div class="accordion-preview">
                <h3 class="accordion-title">${title}</h3>
                <div class="accordion-items">
                    ${itemsHtml}
                </div>
            </div>
        `;
        
        element.style.border = '1px solid #e2e8f0';
        element.style.borderRadius = '8px';
        element.style.backgroundColor = 'white';
        element.style.padding = '20px';
        element.style.marginBottom = '20px';
        
        return element;
    }

    /**
     * Render LinkGroupComponent
     */
    renderLinkGroupComponent(element, data, readOnly) {
        const title = data.title || 'Links';
        const links = data.links || [];
        
        let linksHtml = '';
        links.forEach((link, index) => {
            linksHtml += `
                <div class="link-item">
                    <a href="${link.url || '#'}" target="${link.target || '_self'}" class="link-preview">
                        ${link.text || `Link ${index + 1}`}
                    </a>
                </div>
            `;
        });
        
        element.innerHTML = `
            <div class="linkgroup-preview">
                <h3 class="linkgroup-title">${title}</h3>
                <div class="linkgroup-links">
                    ${linksHtml}
                </div>
            </div>
        `;
        
        element.style.border = '1px solid #e2e8f0';
        element.style.borderRadius = '8px';
        element.style.backgroundColor = 'white';
        element.style.padding = '20px';
        element.style.marginBottom = '20px';
        
        return element;
    }

    /**
     * Render unknown component type
     */
    renderUnknownComponent(element, component, readOnly) {
        element.innerHTML = `
            <div class="unknown-component">
                <i class="fas fa-question-circle"></i>
                <span>Unknown component type: ${component.type}</span>
            </div>
        `;
        element.style.border = '1px dashed #cbd5e1';
        element.style.borderRadius = '8px';
        element.style.backgroundColor = '#f8fafc';
        element.style.padding = '20px';
        element.style.textAlign = 'center';
        element.style.color = '#6b7280';
        element.style.marginBottom = '20px';
        
        return element;
    }
}

// Make classes available globally
window.VersionPreviewModal = VersionPreviewModal;
window.ComponentRenderer = ComponentRenderer;
