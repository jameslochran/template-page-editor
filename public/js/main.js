/**
 * Main Integration Module
 * Integrates TemplateGrid and TemplateCard components with the application
 * Work Order #5: Build Template Grid and Card Display System
 */

class TemplateGridManager {
    constructor() {
        this.templateGrid = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            console.log('DOM still loading, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            console.log('DOM already ready, initializing immediately...');
            this.initialize();
        }
    }

    initialize() {
        try {
            this.setupTemplateGrid();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('TemplateGridManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TemplateGridManager:', error);
        }
    }

    setupTemplateGrid() {
        const gridContainer = document.getElementById('templates-grid');
        console.log('setupTemplateGrid: gridContainer found:', gridContainer);
        if (!gridContainer) {
            console.warn('Templates grid container not found');
            return;
        }

        console.log('Creating TemplateGrid with container:', gridContainer);
        this.templateGrid = new TemplateGrid('templates-grid', {
            showPreviewButton: true,
            showSelectButton: true,
            showDeleteButton: true,
            emptyMessage: 'No templates found matching your search criteria.',
            loadingMessage: 'Loading templates...'
        });
        console.log('TemplateGrid created:', this.templateGrid);
    }

    setupEventListeners() {
        // Listen for template grid events
        document.addEventListener('templateGridPreviewRequested', (e) => {
            this.handleTemplatePreview(e.detail);
        });

        document.addEventListener('templateGridSelectRequested', (e) => {
            this.handleTemplateSelect(e.detail);
        });

        document.addEventListener('templateGridDeleteRequested', (e) => {
            this.handleTemplateDelete(e.detail);
        });

        // Listen for template data updates from the main app
        document.addEventListener('templatesUpdated', (e) => {
            this.updateTemplates(e.detail.templates);
        });

        document.addEventListener('categoriesUpdated', (e) => {
            this.updateCategories(e.detail.categories);
        });
    }

    handleTemplatePreview(detail) {
        console.log('Template preview requested:', detail);
        
        // Use the TemplatePreviewModal to show the template preview
        if (window.TemplatePreviewModal) {
            // Create or reuse the global modal instance
            if (!window.templatePreviewModal) {
                window.templatePreviewModal = new TemplatePreviewModal();
            }
            window.templatePreviewModal.show(detail.template);
        } else {
            // Fallback: show an alert
            alert(`Preview template: ${detail.template.name}`);
        }
    }

    handleTemplateSelect(detail) {
        console.log('Template select requested:', detail);
        
        // Use the existing template loading functionality
        if (window.app && window.app.loadTemplate) {
            window.app.loadTemplate(detail.templateId, 'api');
            // Switch to editor section
            if (window.app.switchSection) {
                window.app.switchSection('editor');
            }
        } else {
            // Fallback: show an alert
            alert(`Selected template: ${detail.template.name}`);
        }
    }

    handleTemplateDelete(detail) {
        console.log('Template delete requested:', detail);
        
        // Use the existing template deletion functionality
        if (window.app && window.app.deleteTemplate) {
            window.app.deleteTemplate(detail.templateId, 'api');
        } else {
            // Fallback: show an alert
            alert(`Delete template: ${detail.template.name}`);
        }
    }

    updateTemplates(templates) {
        console.log('TemplateGridManager: updateTemplates called with', templates.length, 'templates');
        if (this.templateGrid) {
            this.templateGrid.setTemplates(templates);
        } else {
            console.warn('TemplateGridManager: templateGrid not initialized');
        }
    }

    updateCategories(categories) {
        if (this.templateGrid) {
            this.templateGrid.setCategories(categories);
        }
    }

    // Public API methods
    setTemplates(templates) {
        this.updateTemplates(templates);
    }

    setCategories(categories) {
        this.updateCategories(categories);
    }

    showLoading() {
        if (this.templateGrid) {
            this.templateGrid.renderLoading();
        }
    }

    showEmpty(message = null) {
        if (this.templateGrid) {
            if (message) {
                this.templateGrid.options.emptyMessage = message;
            }
            this.templateGrid.renderEmpty();
        }
    }

    addTemplate(template) {
        if (this.templateGrid) {
            this.templateGrid.addTemplate(template);
        }
    }

    updateTemplate(template) {
        if (this.templateGrid) {
            this.templateGrid.updateTemplate(template);
        }
    }

    removeTemplate(templateId) {
        if (this.templateGrid) {
            this.templateGrid.removeTemplate(templateId);
        }
    }

    getTemplateCount() {
        return this.templateGrid ? this.templateGrid.getTemplateCount() : 0;
    }

    // Integration with existing app.js
    integrateWithApp(app) {
        if (!app) {
            console.warn('TemplateGridManager: No app provided for integration');
            return;
        }

        console.log('TemplateGridManager: Integrating with app:', app);
        console.log('TemplateGridManager: app.renderTemplates exists:', typeof app.renderTemplates);
        console.log('TemplateGridManager: Available app methods:', Object.getOwnPropertyNames(app).filter(name => typeof app[name] === 'function'));

        // Store reference to the app
        this.app = app;

        // Check if renderTemplates method exists
        if (typeof app.renderTemplates !== 'function') {
            console.warn('TemplateGridManager: app.renderTemplates is not a function, using alternative integration');
            
            // Alternative integration: Hook into the app's template loading process
            // We'll override the loadTemplates method instead
            if (typeof app.loadTemplates === 'function') {
                const originalLoadTemplates = app.loadTemplates.bind(app);
                app.loadTemplates = async function() {
                    console.log('TemplateGridManager: loadTemplates called');
                    
                    // Call original method
                    await originalLoadTemplates();
                    
                    // Update our grid with the loaded templates
                    if (window.templateGridManager) {
                        console.log('TemplateGridManager: Updating grid with', this.templates.length, 'templates');
                        window.templateGridManager.setTemplates(this.templates);
                        window.templateGridManager.setCategories(this.categories);
                    }
                };
                console.log('TemplateGridManager: Integrated with loadTemplates method');
            } else {
                console.warn('TemplateGridManager: No suitable integration method found');
                return;
            }
        } else {
            // Original integration with renderTemplates
            const originalRenderTemplates = app.renderTemplates.bind(app);
            app.renderTemplates = async function() {
                console.log('TemplateGridManager: renderTemplates called with', this.templates.length, 'templates');
                
                // Ensure template grid is initialized
                if (window.templateGridManager && !window.templateGridManager.templateGrid) {
                    console.log('TemplateGrid not initialized, trying to set it up...');
                    window.templateGridManager.setupTemplateGrid();
                }
                
                // Use the new template grid system if available
                if (window.templateGridManager && window.templateGridManager.templateGrid) {
                    console.log('Using new template grid system');
                    window.templateGridManager.setTemplates(this.templates);
                    window.templateGridManager.setCategories(this.categories);
                    return;
                }

                console.log('Falling back to original renderTemplates method');
                // Fallback to original method
                await originalRenderTemplates();
            };
        }

        console.log('TemplateGridManager integrated with app.js');
    }
}

// Initialize the template grid manager
let templateGridManager;

// Wait for the main app to be available
function initializeTemplateGrid() {
    console.log('initializeTemplateGrid called, window.app:', window.app);
    if (window.app) {
        console.log('Creating TemplateGridManager...');
        templateGridManager = new TemplateGridManager();
        
        // Add a small delay to ensure app is fully initialized
        setTimeout(() => {
            templateGridManager.integrateWithApp(window.app);
            window.templateGridManager = templateGridManager;
            console.log('TemplateGridManager created and integrated');
        }, 50);
    } else {
        console.log('window.app not available, retrying in 100ms...');
        // Retry after a short delay
        setTimeout(initializeTemplateGrid, 100);
    }
}

// Start initialization
console.log('Starting TemplateGridManager initialization...');
initializeTemplateGrid();

// Make TemplateGridManager available globally
window.TemplateGridManager = TemplateGridManager;
