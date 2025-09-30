/**
 * Admin Templates Dashboard
 * Manages the administrative interface for viewing and managing templates
 */
class AdminTemplatesDashboard {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            ...options
        };

        this.state = {
            templates: [],
            categories: [],
            filteredTemplates: [],
            searchQuery: '',
            categoryFilter: '',
            isLoading: false,
            error: null,
            errorMessage: '',
            currentPage: 1,
            itemsPerPage: 12,
            totalItems: 0,
        };

        this.searchDebounceTimer = null;
        this.eventListeners = new Map();

        this.init();
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        try {
            this.render();
            this.attachEventListeners();
            await this.loadData();
        } catch (error) {
            console.error('AdminTemplatesDashboard: Error initializing:', error);
            this.showError('Failed to initialize dashboard', error.message);
        }
    }

    /**
     * Render the dashboard HTML structure
     */
    render() {
        if (!this.container) {
            console.error('AdminTemplatesDashboard: Container not found:', this.containerId);
            return;
        }

        this.container.innerHTML = `
            <div class="admin-dashboard">
                <!-- Header -->
                <div class="admin-dashboard-header">
                    <div class="admin-dashboard-title">
                        <h2>Template Management</h2>
                        <p class="admin-dashboard-subtitle">Manage your template library and categories</p>
                    </div>
                    <div class="admin-dashboard-actions">
                        <button id="add-new-template-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Add New Template
                        </button>
                        <button id="manage-categories-btn" class="btn btn-secondary">
                            <i class="fas fa-tags"></i>
                            Manage Categories
                        </button>
                    </div>
                </div>

                <!-- Filters -->
                <div class="admin-dashboard-filters">
                    <div class="admin-search-container">
                        <input 
                            type="text" 
                            id="admin-template-search" 
                            class="admin-search-input" 
                            placeholder="Search templates..."
                            value="${this.state.searchQuery}"
                        >
                        <i class="fas fa-search admin-search-icon"></i>
                    </div>
                    <select id="admin-category-filter" class="admin-category-select">
                        <option value="">All Categories</option>
                    </select>
                    <div class="admin-results-count">
                        <span id="admin-results-count">0 templates</span>
                    </div>
                </div>

                <!-- Content -->
                <div class="admin-dashboard-content">
                    <!-- Loading State -->
                    <div id="admin-loading-state" class="admin-loading-state" style="display: none;">
                        <div class="admin-loading-spinner"></div>
                        <p>Loading templates...</p>
                    </div>

                    <!-- Error State -->
                    <div id="admin-error-state" class="admin-error-state" style="display: none;">
                        <div class="admin-error-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>Error Loading Templates</h3>
                        <p id="admin-error-message">An error occurred while loading templates.</p>
                        <button id="admin-retry-btn" class="btn btn-primary">Try Again</button>
                    </div>

                    <!-- Empty State -->
                    <div id="admin-empty-state" class="admin-empty-state" style="display: none;">
                        <div class="admin-empty-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <h3>No Templates Found</h3>
                        <p id="admin-empty-message">No templates match your search criteria.</p>
                        <button id="admin-clear-filters-btn" class="btn btn-secondary">Clear Filters</button>
                    </div>

                    <!-- Templates Grid -->
                    <div id="admin-templates-grid" class="admin-templates-grid">
                        <!-- Templates will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Search input
        const searchInput = this.container.querySelector('#admin-template-search');
        if (searchInput) {
            const handler = (e) => this.handleSearch(e.target.value);
            searchInput.addEventListener('input', handler);
            this.eventListeners.set(searchInput, { event: 'input', handler });
        }

        // Category filter
        const categoryFilter = this.container.querySelector('#admin-category-filter');
        if (categoryFilter) {
            const handler = (e) => this.handleCategoryFilter(e.target.value);
            categoryFilter.addEventListener('change', handler);
            this.eventListeners.set(categoryFilter, { event: 'change', handler });
        }

        // Add New Template button
        const addTemplateBtn = this.container.querySelector('#add-new-template-btn');
        if (addTemplateBtn) {
            const handler = () => this.handleAddNewTemplate();
            addTemplateBtn.addEventListener('click', handler);
            this.eventListeners.set(addTemplateBtn, { event: 'click', handler });
        }

        // Manage Categories button
        const manageCategoriesBtn = this.container.querySelector('#manage-categories-btn');
        if (manageCategoriesBtn) {
            const handler = () => this.handleManageCategories();
            manageCategoriesBtn.addEventListener('click', handler);
            this.eventListeners.set(manageCategoriesBtn, { event: 'click', handler });
        }

        // Retry button
        const retryBtn = this.container.querySelector('#admin-retry-btn');
        if (retryBtn) {
            const handler = () => this.loadData();
            retryBtn.addEventListener('click', handler);
            this.eventListeners.set(retryBtn, { event: 'click', handler });
        }

        // Clear filters button
        const clearFiltersBtn = this.container.querySelector('#admin-clear-filters-btn');
        if (clearFiltersBtn) {
            const handler = () => this.clearFilters();
            clearFiltersBtn.addEventListener('click', handler);
            this.eventListeners.set(clearFiltersBtn, { event: 'click', handler });
        }
    }

    /**
     * Load templates and categories data
     */
    async loadData() {
        try {
            this.setState({ isLoading: true, error: null });
            this.showLoading();

            // Load templates and categories in parallel
            const [templatesResponse, categoriesResponse] = await Promise.all([
                this.fetchTemplates(),
                this.fetchCategories()
            ]);

            const templates = templatesResponse.data || [];
            const categories = categoriesResponse.data || [];

            this.setState({
                templates,
                categories,
                filteredTemplates: templates,
                totalItems: templates.length,
                isLoading: false
            });

            this.populateCategoryFilter(categories);
            this.renderTemplates(templates);
            this.updateResultsCount(templates.length);
            this.hideAllStates();

        } catch (error) {
            console.error('AdminTemplatesDashboard: Error loading data:', error);
            this.setState({
                isLoading: false,
                error: error,
                errorMessage: error.message || 'Failed to load templates'
            });
            this.showError('Failed to load templates', error.message);
        }
    }

    /**
     * Fetch templates from API
     */
    async fetchTemplates() {
        try {
            const response = await fetch('/api/admin/templates', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-admin-token-123' // Mock admin authentication
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('AdminTemplatesDashboard: Error fetching templates:', error);
            throw new Error('Failed to fetch templates from server');
        }
    }

    /**
     * Fetch categories from API
     */
    async fetchCategories() {
        try {
            const response = await fetch('/api/admin/categories', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-admin-token-123' // Mock admin authentication
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('AdminTemplatesDashboard: Error fetching categories:', error);
            throw new Error('Failed to fetch categories from server');
        }
    }

    /**
     * Populate category filter dropdown
     */
    populateCategoryFilter(categories) {
        const categoryFilter = this.container.querySelector('#admin-category-filter');
        if (!categoryFilter) return;

        // Clear existing options except "All Categories"
        categoryFilter.innerHTML = '<option value="">All Categories</option>';

        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (category.id === this.state.categoryFilter) {
                option.selected = true;
            }
            categoryFilter.appendChild(option);
        });
    }

    /**
     * Render templates in the grid
     */
    renderTemplates(templates) {
        const grid = this.container.querySelector('#admin-templates-grid');
        if (!grid) return;

        if (!templates || templates.length === 0) {
            this.showEmpty();
            return;
        }

        grid.innerHTML = templates.map(template => this.createTemplateCard(template)).join('');
        this.hideAllStates();
    }

    /**
     * Create a template card element
     */
    createTemplateCard(template) {
        const category = this.state.categories.find(cat => cat.id === template.categoryId);
        const categoryName = category ? category.name : 'Unknown Category';
        const fileType = this.determineFileType(template);
        const createdDate = new Date(template.createdAt).toLocaleDateString();

        return `
            <div class="admin-template-card" data-template-id="${template.id}">
                <div class="admin-template-card-image">
                    <img 
                        src="${template.previewImageUrl || '/images/placeholder-template.svg'}" 
                        alt="${template.name}"
                        onerror="this.src='/images/placeholder-template.svg'"
                    >
                    <div class="admin-template-card-overlay">
                        <button class="admin-template-preview-btn" data-template-id="${template.id}">
                            <i class="fas fa-eye"></i>
                            Preview
                        </button>
                    </div>
                </div>
                <div class="admin-template-card-content">
                    <h3 class="admin-template-name">${this.escapeHtml(template.name)}</h3>
                    <p class="admin-template-description">${this.escapeHtml(template.description)}</p>
                    <div class="admin-template-meta">
                        <span class="admin-template-category">
                            <i class="fas fa-tag"></i>
                            ${this.escapeHtml(categoryName)}
                        </span>
                        <span class="admin-template-type">
                            <i class="fas fa-file"></i>
                            ${fileType}
                        </span>
                        <span class="admin-template-date">
                            <i class="fas fa-calendar"></i>
                            ${createdDate}
                        </span>
                    </div>
                    <div class="admin-template-actions">
                        <button class="admin-template-edit-btn" data-template-id="${template.id}">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="admin-template-delete-btn" data-template-id="${template.id}">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Determine file type based on template data
     */
    determineFileType(template) {
        // For now, we'll determine file type based on previewImageUrl or components
        if (template.previewImageUrl) {
            const extension = template.previewImageUrl.split('.').pop().toLowerCase();
            if (extension === 'fig' || extension === 'figma') {
                return 'Figma';
            } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
                return 'PNG';
            }
        }
        
        // Default to PNG if we can't determine
        return 'PNG';
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        // Clear existing timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }

        // Set new timer for debounced search
        this.searchDebounceTimer = setTimeout(() => {
            this.setState({ searchQuery: query });
            this.applyFilters();
        }, 300);
    }

    /**
     * Handle category filter change
     */
    handleCategoryFilter(categoryId) {
        this.setState({ categoryFilter: categoryId });
        this.applyFilters();
    }

    /**
     * Apply search and category filters
     */
    applyFilters() {
        const { templates, searchQuery, categoryFilter } = this.state;
        
        let filtered = [...templates];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(template => 
                template.name.toLowerCase().includes(query) ||
                template.description.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (categoryFilter) {
            filtered = filtered.filter(template => template.categoryId === categoryFilter);
        }

        this.setState({ 
            filteredTemplates: filtered,
            totalItems: filtered.length
        });

        this.renderTemplates(filtered);
        this.updateResultsCount(filtered.length);
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        const searchInput = this.container.querySelector('#admin-template-search');
        const categoryFilter = this.container.querySelector('#admin-category-filter');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';

        this.setState({ 
            searchQuery: '',
            categoryFilter: '',
            filteredTemplates: this.state.templates,
            totalItems: this.state.templates.length
        });

        this.renderTemplates(this.state.templates);
        this.updateResultsCount(this.state.templates.length);
    }

    /**
     * Handle Add New Template button click
     */
    handleAddNewTemplate() {
        // For now, show an alert. In a real implementation, this would open a modal or navigate to upload page
        alert('Add New Template functionality will be implemented in a future work order.');
        
        // Dispatch custom event for potential integration
        const event = new CustomEvent('adminAddNewTemplate', {
            detail: { source: 'AdminTemplatesDashboard' }
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle Manage Categories button click
     */
    handleManageCategories() {
        // For now, show an alert. In a real implementation, this would open a modal or navigate to category management
        alert('Manage Categories functionality will be implemented in a future work order.');
        
        // Dispatch custom event for potential integration
        const event = new CustomEvent('adminManageCategories', {
            detail: { source: 'AdminTemplatesDashboard' }
        });
        document.dispatchEvent(event);
    }

    /**
     * Update results count display
     */
    updateResultsCount(count) {
        const resultsCount = this.container.querySelector('#admin-results-count');
        if (resultsCount) {
            resultsCount.textContent = `${count} template${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.hideAllStates();
        const loadingState = this.container.querySelector('#admin-loading-state');
        if (loadingState) {
            loadingState.style.display = 'flex';
        }
    }

    /**
     * Show error state
     */
    showError(title, message) {
        this.hideAllStates();
        const errorState = this.container.querySelector('#admin-error-state');
        const errorMessage = this.container.querySelector('#admin-error-message');
        
        if (errorState) {
            errorState.style.display = 'flex';
        }
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }

    /**
     * Show empty state
     */
    showEmpty() {
        this.hideAllStates();
        const emptyState = this.container.querySelector('#admin-empty-state');
        const emptyMessage = this.container.querySelector('#admin-empty-message');
        
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        if (emptyMessage) {
            if (this.state.searchQuery || this.state.categoryFilter) {
                emptyMessage.textContent = 'No templates match your search criteria.';
            } else {
                emptyMessage.textContent = 'No templates have been created yet.';
            }
        }
    }

    /**
     * Hide all states
     */
    hideAllStates() {
        const states = ['admin-loading-state', 'admin-error-state', 'admin-empty-state'];
        states.forEach(stateId => {
            const element = this.container.querySelector(`#${stateId}`);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    /**
     * Update component state
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Destroy the dashboard and clean up
     */
    destroy() {
        // Clear timers
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
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
}

// Make the class available globally
window.AdminTemplatesDashboard = AdminTemplatesDashboard;
