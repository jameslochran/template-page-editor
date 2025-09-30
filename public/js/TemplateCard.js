/**
 * TemplateCard Component
 * Displays individual template cards with preview image, name, description, and action buttons
 * Work Order #5: Build Template Grid and Card Display System
 */

class TemplateCard {
    constructor(templateData, options = {}) {
        this.template = templateData;
        this.options = {
            showPreviewButton: true,
            showSelectButton: true,
            showDeleteButton: false,
            ...options
        };
        this.element = null;
        this.init();
    }

    init() {
        this.createElement();
        this.attachEventListeners();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'template-card';
        this.element.dataset.templateId = this.template.id;
        
        this.render();
    }

    render() {
        const previewImage = this.getPreviewImage();
        const categoryName = this.getCategoryName();
        
        this.element.innerHTML = `
            <div class="template-card-image">
                ${previewImage}
            </div>
            <div class="template-card-content">
                <h3 class="template-card-title">${this.escapeHtml(this.template.name)}</h3>
                <p class="template-card-description">${this.escapeHtml(this.template.description)}</p>
                <div class="template-card-meta">
                    <span class="template-card-category">${this.escapeHtml(categoryName)}</span>
                    <span class="template-card-date">${this.formatDate(this.template.createdAt)}</span>
                </div>
            </div>
            <div class="template-card-actions">
                ${this.options.showPreviewButton ? this.createPreviewButton() : ''}
                ${this.options.showSelectButton ? this.createSelectButton() : ''}
                ${this.options.showDeleteButton ? this.createDeleteButton() : ''}
            </div>
        `;
    }

    getPreviewImage() {
        // Check if template has a preview image
        const imageUrl = this.template.thumbnail || this.template.previewImageUrl;
        
        if (imageUrl && imageUrl !== '/images/templates/default.jpg') {
            return `
                <img 
                    src="${this.escapeHtml(imageUrl)}" 
                    alt="${this.escapeHtml(this.template.name)}" 
                    class="template-preview-image"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />
                <div class="template-preview-placeholder" style="display: none;">
                    <i class="fas fa-image"></i>
                    <span>Preview</span>
                </div>
            `;
        } else {
            return `
                <div class="template-preview-placeholder">
                    <i class="fas fa-image"></i>
                    <span>Preview</span>
                </div>
            `;
        }
    }

    getCategoryName() {
        // This will be set by the TemplateGrid when categories are loaded
        return this.template.categoryName || 'Unknown Category';
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Unknown Date';
        }
    }

    createPreviewButton() {
        return `
            <button 
                class="btn btn-secondary template-preview-btn" 
                data-action="preview-template"
                data-template-id="${this.template.id}"
                title="Preview Template"
            >
                <i class="fas fa-eye"></i>
                Preview
            </button>
        `;
    }

    createSelectButton() {
        return `
            <button 
                class="btn btn-primary template-select-btn" 
                data-action="select-template"
                data-template-id="${this.template.id}"
                title="Select Template"
            >
                <i class="fas fa-check"></i>
                Select
            </button>
        `;
    }

    createDeleteButton() {
        return `
            <button 
                class="btn btn-danger template-delete-btn" 
                data-action="delete-template"
                data-template-id="${this.template.id}"
                title="Delete Template"
            >
                <i class="fas fa-trash"></i>
                Delete
            </button>
        `;
    }

    attachEventListeners() {
        // Use event delegation for better performance
        this.element.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const templateId = button.dataset.templateId;

            switch (action) {
                case 'preview-template':
                    this.handlePreview(templateId);
                    break;
                case 'select-template':
                    this.handleSelect(templateId);
                    break;
                case 'delete-template':
                    this.handleDelete(templateId);
                    break;
            }
        });
    }

    handlePreview(templateId) {
        const event = new CustomEvent('templatePreviewRequested', {
            detail: {
                templateId: templateId,
                template: this.template
            }
        });
        document.dispatchEvent(event);
    }

    handleSelect(templateId) {
        const event = new CustomEvent('templateSelectRequested', {
            detail: {
                templateId: templateId,
                template: this.template
            }
        });
        document.dispatchEvent(event);
    }

    handleDelete(templateId) {
        if (confirm('Are you sure you want to delete this template?')) {
            const event = new CustomEvent('templateDeleteRequested', {
                detail: {
                    templateId: templateId,
                    template: this.template
                }
            });
            document.dispatchEvent(event);
        }
    }

    updateCategoryName(categoryName) {
        this.template.categoryName = categoryName;
        const categoryElement = this.element.querySelector('.template-card-category');
        if (categoryElement) {
            categoryElement.textContent = categoryName;
        }
    }

    updateTemplateData(newTemplateData) {
        this.template = { ...this.template, ...newTemplateData };
        this.render();
    }

    getElement() {
        return this.element;
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Static method to create a card from template data
    static create(templateData, options = {}) {
        return new TemplateCard(templateData, options);
    }
}

// Make TemplateCard available globally
window.TemplateCard = TemplateCard;

