/**
 * TemplateGrid Component
 * Manages the template grid layout and handles dynamic updates
 * Work Order #5: Build Template Grid and Card Display System
 */

class TemplateGrid {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        this.options = {
            showPreviewButton: true,
            showSelectButton: true,
            showDeleteButton: false,
            emptyMessage: 'No templates found.',
            loadingMessage: 'Loading templates...',
            ...options
        };

        this.templates = [];
        this.categories = [];
        this.cards = new Map(); // Map of template ID to TemplateCard instance
        this.isLoading = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderEmpty();
    }

    setupEventListeners() {
        // Listen for template events
        document.addEventListener('templatePreviewRequested', (e) => {
            this.handleTemplatePreview(e.detail);
        });

        document.addEventListener('templateSelectRequested', (e) => {
            this.handleTemplateSelect(e.detail);
        });

        document.addEventListener('templateDeleteRequested', (e) => {
            this.handleTemplateDelete(e.detail);
        });
    }

    setTemplates(templates) {
        console.log('TemplateGrid: setTemplates called with', templates.length, 'templates');
        this.templates = templates || [];
        this.updateCards();
    }

    setCategories(categories) {
        this.categories = categories || [];
        this.updateCategoryNames();
    }

    updateCards() {
        console.log('TemplateGrid: updateCards called with', this.templates.length, 'templates');
        
        // Clear existing cards
        this.clearCards();

        if (this.templates.length === 0) {
            console.log('TemplateGrid: No templates, showing empty state');
            this.renderEmpty();
            return;
        }

        console.log('TemplateGrid: Creating', this.templates.length, 'template cards');
        
        // Create new cards
        this.templates.forEach(template => {
            const card = new TemplateCard(template, {
                showPreviewButton: this.options.showPreviewButton,
                showSelectButton: this.options.showSelectButton,
                showDeleteButton: this.options.showDeleteButton
            });

            this.cards.set(template.id, card);
            this.container.appendChild(card.getElement());
        });

        // Update category names if categories are available
        this.updateCategoryNames();
        
        console.log('TemplateGrid: updateCards completed');
    }

    updateCategoryNames() {
        if (this.categories.length === 0) return;

        this.cards.forEach((card, templateId) => {
            const template = this.templates.find(t => t.id === templateId);
            if (template && template.categoryId) {
                const category = this.categories.find(c => c.id === template.categoryId);
                if (category) {
                    card.updateCategoryName(category.name);
                }
            }
        });
    }

    clearCards() {
        this.cards.forEach(card => {
            card.destroy();
        });
        this.cards.clear();
        this.container.innerHTML = '';
    }

    renderEmpty() {
        this.container.innerHTML = `
            <div class="template-grid-empty">
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No Templates Found</h3>
                    <p>${this.options.emptyMessage}</p>
                </div>
            </div>
        `;
    }

    renderLoading() {
        this.isLoading = true;
        this.container.innerHTML = `
            <div class="template-grid-loading">
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>${this.options.loadingMessage}</p>
                </div>
            </div>
        `;
    }

    addTemplate(template) {
        // Check if template already exists
        if (this.cards.has(template.id)) {
            this.updateTemplate(template);
            return;
        }

        // Add to templates array
        this.templates.push(template);

        // Create and add card
        const card = new TemplateCard(template, {
            showPreviewButton: this.options.showPreviewButton,
            showSelectButton: this.options.showSelectButton,
            showDeleteButton: this.options.showDeleteButton
        });

        this.cards.set(template.id, card);
        this.container.appendChild(card.getElement());

        // Update category name if available
        if (template.categoryId) {
            const category = this.categories.find(c => c.id === template.categoryId);
            if (category) {
                card.updateCategoryName(category.name);
            }
        }
    }

    updateTemplate(template) {
        const existingIndex = this.templates.findIndex(t => t.id === template.id);
        if (existingIndex !== -1) {
            this.templates[existingIndex] = template;
        }

        const card = this.cards.get(template.id);
        if (card) {
            card.updateTemplateData(template);
            
            // Update category name if available
            if (template.categoryId) {
                const category = this.categories.find(c => c.id === template.categoryId);
                if (category) {
                    card.updateCategoryName(category.name);
                }
            }
        }
    }

    removeTemplate(templateId) {
        // Remove from templates array
        this.templates = this.templates.filter(t => t.id !== templateId);

        // Remove card
        const card = this.cards.get(templateId);
        if (card) {
            card.destroy();
            this.cards.delete(templateId);
        }

        // If no templates left, show empty state
        if (this.templates.length === 0) {
            this.renderEmpty();
        }
    }

    handleTemplatePreview(detail) {
        // Emit event for parent components to handle
        const event = new CustomEvent('templateGridPreviewRequested', {
            detail: detail
        });
        document.dispatchEvent(event);
    }

    handleTemplateSelect(detail) {
        // Emit event for parent components to handle
        const event = new CustomEvent('templateGridSelectRequested', {
            detail: detail
        });
        document.dispatchEvent(event);
    }

    handleTemplateDelete(detail) {
        // Emit event for parent components to handle
        const event = new CustomEvent('templateGridDeleteRequested', {
            detail: detail
        });
        document.dispatchEvent(event);
    }

    // Utility methods
    getTemplateCount() {
        return this.templates.length;
    }

    getTemplateById(templateId) {
        return this.templates.find(t => t.id === templateId);
    }

    getCardById(templateId) {
        return this.cards.get(templateId);
    }

    // Filter templates (for search/filter integration)
    filterTemplates(filterFn) {
        const filteredTemplates = this.templates.filter(filterFn);
        this.setTemplates(filteredTemplates);
    }

    // Reset to show all templates
    resetFilter() {
        // This would need to be called with the original templates array
        // from the parent component
    }

    // Destroy the grid
    destroy() {
        this.clearCards();
        this.templates = [];
        this.categories = [];
        this.cards.clear();
    }

    // Static method to create a grid
    static create(containerId, options = {}) {
        return new TemplateGrid(containerId, options);
    }
}

// Make TemplateGrid available globally
window.TemplateGrid = TemplateGrid;
