/**
 * Template Browser Page Component
 * Work Order #14: Integrate Template Browser Page with State Management
 * 
 * This component orchestrates all template browser components through a unified
 * state management system, ensuring consistent data flow and user experience.
 */
class TemplateBrowserPage {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            enablePagination: false,
            itemsPerPage: 12,
            debounceDelay: 300,
            ...options
        };
        
        // State management
        this.state = {
            // Filter state
            categoryFilter: '',
            keywordFilter: '',
            
            // Data state
            templates: [],
            categories: [],
            filteredTemplates: [],
            
            // UI state
            isLoading: false,
            isLoadingCategories: false,
            error: null,
            errorMessage: '',
            
            // Pagination state (for future use)
            currentPage: 1,
            totalPages: 1,
            totalItems: 0
        };
        
        // Component references
        this.searchBar = null;
        this.categoryFilter = null;
        this.templateGrid = null;
        this.templatePreviewModal = null;
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Debounce timer for search
        this.searchDebounceTimer = null;
        
        // Initialize the component
        this.init();
    }

    /**
     * Initialize the Template Browser Page
     */
    init() {
        if (!this.container) {
            throw new Error(`Container with ID '${this.containerId}' not found`);
        }

        this.setupContainer();
        this.setupEventListeners();
        this.loadInitialData();
    }

    /**
     * Setup the container structure
     */
    setupContainer() {
        this.container.innerHTML = `
            <div class="template-browser-page">
                <div class="template-browser-header">
                    <div class="template-browser-title">
                        <h2>Template Browser</h2>
                        <p class="template-browser-subtitle">Browse and select from available templates</p>
                    </div>
                    <div class="template-browser-actions">
                        <button class="btn btn-primary" id="create-new-template">
                            <i class="fas fa-plus"></i>
                            Create New Template
                        </button>
                    </div>
                </div>
                
                <div class="template-browser-filters">
                    <div class="search-container">
                        <input type="text" id="template-search" placeholder="Search templates..." class="search-input">
                        <i class="fas fa-search search-icon"></i>
                    </div>
                    <div class="category-filter-container">
                        <select id="category-filter" class="category-filter">
                            <option value="">All Categories</option>
                        </select>
                    </div>
                </div>
                
                <div class="template-browser-content">
                    <div class="template-browser-loading" id="template-browser-loading" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>Loading templates...</p>
                    </div>
                    
                    <div class="template-browser-error" id="template-browser-error" style="display: none;">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>Error Loading Templates</h3>
                        <p id="error-message">An error occurred while loading templates.</p>
                        <button class="btn btn-secondary" id="retry-loading">
                            <i class="fas fa-redo"></i>
                            Try Again
                        </button>
                    </div>
                    
                    <div class="template-browser-grid" id="template-browser-grid">
                        <!-- Template grid will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = this.container.querySelector('#template-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
        }

        // Category filter
        const categoryFilter = this.container.querySelector('#category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleCategoryFilter(e.target.value);
            });
        }

        // Create new template button
        const createButton = this.container.querySelector('#create-new-template');
        if (createButton) {
            createButton.addEventListener('click', () => {
                this.handleCreateNewTemplate();
            });
        }

        // Retry loading button
        const retryButton = this.container.querySelector('#retry-loading');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.loadTemplates();
            });
        }

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
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadCategories(),
                this.loadTemplates()
            ]);
        } catch (error) {
            console.error('TemplateBrowserPage: Error loading initial data:', error);
            this.setState({ error: error, errorMessage: 'Failed to load initial data' });
        }
    }

    /**
     * Load categories from API
     */
    async loadCategories() {
        this.setState({ isLoadingCategories: true, error: null });

        try {
            const response = await fetch('/api/categories');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const categories = await response.json();
            this.setState({ categories, isLoadingCategories: false });
            this.updateCategoryFilter(categories);
        } catch (error) {
            console.error('TemplateBrowserPage: Error loading categories:', error);
            this.setState({ 
                error: error, 
                errorMessage: 'Failed to load categories',
                isLoadingCategories: false 
            });
        }
    }

    /**
     * Load templates from API
     */
    async loadTemplates() {
        this.setState({ isLoading: true, error: null });

        try {
            const params = new URLSearchParams();
            
            if (this.state.categoryFilter) {
                params.append('category', this.state.categoryFilter);
            }
            
            if (this.state.keywordFilter) {
                params.append('search', this.state.keywordFilter);
            }

            const url = `/api/templates?${params.toString()}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const templates = await response.json();
            this.setState({ 
                templates, 
                filteredTemplates: templates,
                isLoading: false,
                totalItems: templates.length
            });
            
            this.updateTemplateGrid(templates);
        } catch (error) {
            console.error('TemplateBrowserPage: Error loading templates:', error);
            this.setState({ 
                error: error, 
                errorMessage: 'Failed to load templates',
                isLoading: false 
            });
        }
    }

    /**
     * Update state and trigger re-render
     */
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        // Trigger re-render based on state changes
        this.handleStateChange(oldState, this.state);
    }

    /**
     * Handle state changes and update UI accordingly
     */
    handleStateChange(oldState, newState) {
        // Update loading state
        if (oldState.isLoading !== newState.isLoading) {
            this.updateLoadingState(newState.isLoading);
        }

        // Update error state
        if (oldState.error !== newState.error) {
            this.updateErrorState(newState.error, newState.errorMessage);
        }

        // Update templates
        if (oldState.templates !== newState.templates) {
            this.updateTemplateGrid(newState.templates);
        }

        // Update categories
        if (oldState.categories !== newState.categories) {
            this.updateCategoryFilter(newState.categories);
        }
    }

    /**
     * Update loading state UI
     */
    updateLoadingState(isLoading) {
        const loadingElement = this.container.querySelector('#template-browser-loading');
        const gridElement = this.container.querySelector('#template-browser-grid');
        const errorElement = this.container.querySelector('#template-browser-error');

        if (isLoading) {
            if (loadingElement) loadingElement.style.display = 'flex';
            if (gridElement) gridElement.style.display = 'none';
            if (errorElement) errorElement.style.display = 'none';
        } else {
            if (loadingElement) loadingElement.style.display = 'none';
            if (gridElement) gridElement.style.display = 'block';
        }
    }

    /**
     * Update error state UI
     */
    updateErrorState(error, errorMessage) {
        const errorElement = this.container.querySelector('#template-browser-error');
        const gridElement = this.container.querySelector('#template-browser-grid');
        const loadingElement = this.container.querySelector('#template-browser-loading');

        if (error) {
            if (errorElement) {
                errorElement.style.display = 'flex';
                const messageElement = errorElement.querySelector('#error-message');
                if (messageElement) {
                    messageElement.textContent = errorMessage || 'An error occurred';
                }
            }
            if (gridElement) gridElement.style.display = 'none';
            if (loadingElement) loadingElement.style.display = 'none';
        } else {
            if (errorElement) errorElement.style.display = 'none';
        }
    }

    /**
     * Update category filter dropdown
     */
    updateCategoryFilter(categories) {
        const categorySelect = this.container.querySelector('#category-filter');
        if (!categorySelect) return;

        // Clear existing options except "All Categories"
        categorySelect.innerHTML = '<option value="">All Categories</option>';

        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });

        // Set current selection
        categorySelect.value = this.state.categoryFilter;
    }

    /**
     * Update template grid
     */
    updateTemplateGrid(templates) {
        const gridContainer = this.container.querySelector('#template-browser-grid');
        if (!gridContainer) return;

        // Create our own TemplateGrid instance if not already created
        if (!this.templateGrid && window.TemplateGrid) {
            this.templateGrid = new TemplateGrid('template-browser-grid', {
                showPreviewButton: true,
                showSelectButton: true,
                showDeleteButton: false, // Don't show delete buttons in browser
                emptyMessage: 'No templates found matching your search criteria.',
                loadingMessage: 'Loading templates...'
            });
        }

        // Update the template grid
        if (this.templateGrid) {
            this.templateGrid.setTemplates(templates);
            this.templateGrid.setCategories(this.state.categories);
        } else {
            // Fallback: render basic grid
            this.renderBasicGrid(templates, gridContainer);
        }
    }

    /**
     * Render basic grid as fallback
     */
    renderBasicGrid(templates, container) {
        if (!templates || templates.length === 0) {
            container.innerHTML = `
                <div class="template-grid-empty">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>No Templates Found</h3>
                        <p>Try adjusting your filters or create a new template.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = templates.map(template => `
            <div class="template-card" data-template-id="${template.id}">
                <div class="template-card-image">
                    <img src="${template.thumbnail || 'https://via.placeholder.com/300x200?text=No+Preview'}" 
                         alt="${template.name} preview" class="template-preview-image">
                </div>
                <div class="template-card-content">
                    <h3 class="template-card-title">${template.name}</h3>
                    <p class="template-card-description">${template.description || 'No description available.'}</p>
                    <div class="template-card-meta">
                        <span class="template-card-category">${this.getCategoryName(template.categoryId)}</span>
                        <span class="template-card-date">Created: ${new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="template-card-actions">
                    <button class="template-preview-btn" data-action="preview-template" data-template-id="${template.id}">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="template-select-btn" data-action="select-template" data-template-id="${template.id}">
                        <i class="fas fa-check"></i> Select
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to buttons
        container.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const action = button.dataset.action;
            const templateId = button.dataset.templateId;
            const template = templates.find(t => t.id === templateId);

            if (!template) return;

            switch (action) {
                case 'preview-template':
                    this.handleTemplatePreview({ template });
                    break;
                case 'select-template':
                    this.handleTemplateSelect({ template });
                    break;
            }
        });
    }

    /**
     * Get category name by ID
     */
    getCategoryName(categoryId) {
        const category = this.state.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Unknown Category';
    }

    /**
     * Handle search input with debouncing
     */
    handleSearchInput(value) {
        // Clear existing timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        // Set new timer
        this.searchDebounceTimer = setTimeout(() => {
            this.setState({ keywordFilter: value });
            this.loadTemplates();
        }, this.options.debounceDelay);
    }

    /**
     * Handle category filter change
     */
    handleCategoryFilter(categoryId) {
        this.setState({ categoryFilter: categoryId });
        this.loadTemplates();
    }

    /**
     * Handle template preview
     */
    handleTemplatePreview(detail) {
        console.log('TemplateBrowserPage: Preview requested for template:', detail.template);
        
        if (window.TemplatePreviewModal) {
            if (!window.templatePreviewModal) {
                window.templatePreviewModal = new TemplatePreviewModal();
            }
            window.templatePreviewModal.show(detail.template);
        } else {
            alert(`Preview template: ${detail.template.name}`);
        }
    }

    /**
     * Handle template selection
     */
    handleTemplateSelect(detail) {
        console.log('TemplateBrowserPage: Select requested for template:', detail.template);
        
        // Emit event for template selection
        document.dispatchEvent(new CustomEvent('templateSelected', {
            detail: { template: detail.template }
        }));

        // For now, show alert - actual page creation logic is out of scope
        alert(`Template selected: ${detail.template.name}. Page creation workflow would start here.`);
    }

    /**
     * Handle template deletion
     */
    handleTemplateDelete(detail) {
        console.log('TemplateBrowserPage: Delete requested for template:', detail.template);
        
        if (confirm(`Are you sure you want to delete "${detail.template.name}"?`)) {
            // Make API call to delete template
            fetch(`/api/admin/templates/${detail.template.id}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    // Remove from state and reload
                    this.loadTemplates();
                } else {
                    throw new Error('Failed to delete template');
                }
            })
            .catch(error => {
                console.error('Error deleting template:', error);
                alert('Failed to delete template. Please try again.');
            });
        }
    }

    /**
     * Handle create new template
     */
    handleCreateNewTemplate() {
        console.log('TemplateBrowserPage: Create new template requested');
        
        // Emit event for new template creation
        document.dispatchEvent(new CustomEvent('createNewTemplate', {
            detail: {}
        }));

        // For now, show alert - actual template creation logic is out of scope
        alert('Create new template workflow would start here.');
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Destroy the component and clean up
     */
    destroy() {
        // Clear timers
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        // Clean up template grid
        if (this.templateGrid) {
            this.templateGrid.clearCards();
            this.templateGrid = null;
        }

        // Remove event listeners
        this.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.event, listener.handler);
        });
        this.eventListeners.clear();

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    // Static method to create the component
    static create(containerId, options = {}) {
        return new TemplateBrowserPage(containerId, options);
    }
}

// Make TemplateBrowserPage available globally
window.TemplateBrowserPage = TemplateBrowserPage;
