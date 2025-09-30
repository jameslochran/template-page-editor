/**
 * AdminCategoryManager
 * Manages administrative category operations including viewing, creating, editing, and deleting categories
 */

class AdminCategoryManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.categories = [];
        this.editingCategoryId = null;
        this.isLoading = false;

        if (!this.container) {
            throw new Error(`Container with ID '${containerId}' not found`);
        }

        this.init();
    }

    /**
     * Initialize the category manager
     */
    async init() {
        this.render();
        await this.loadCategories();
        this.bindEvents();
    }

    /**
     * Render the main interface
     */
    render() {
        this.container.innerHTML = `
            <div class="admin-category-manager">
                <div class="admin-header">
                    <h2>Category Management</h2>
                    <button id="add-category-btn" class="btn btn-primary">
                        <i class="icon-plus"></i> Add New Category
                    </button>
                </div>

                <div id="category-list-container" class="category-list-container">
                    <div class="loading-spinner" id="loading-spinner" style="display: none;">
                        <div class="spinner"></div>
                        <p>Loading categories...</p>
                    </div>
                    
                    <div id="category-list" class="category-list">
                        <!-- Categories will be rendered here -->
                    </div>
                </div>

                <div id="notification-container" class="notification-container">
                    <!-- Notifications will be displayed here -->
                </div>
            </div>

            <!-- Category Form Modal -->
            <div id="category-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">Add New Category</h3>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="category-form">
                            <div class="form-group">
                                <label for="category-name">Category Name *</label>
                                <input type="text" id="category-name" name="name" required maxlength="100">
                                <div class="form-error" id="name-error"></div>
                            </div>
                            <div class="form-group">
                                <label for="category-description">Description</label>
                                <textarea id="category-description" name="description" rows="3" maxlength="500"></textarea>
                                <div class="form-error" id="description-error"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="modal-cancel">Cancel</button>
                        <button type="button" class="btn btn-primary" id="modal-save">
                            <span class="btn-text">Save Category</span>
                            <span class="btn-loading" style="display: none;">
                                <div class="spinner-small"></div> Saving...
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div id="delete-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Delete Category</h3>
                        <button class="modal-close" id="delete-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p id="delete-message">Are you sure you want to delete this category?</p>
                        <div class="delete-warning" id="delete-warning" style="display: none;">
                            <i class="icon-warning"></i>
                            <p>This category has associated templates and cannot be deleted.</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="delete-cancel">Cancel</button>
                        <button type="button" class="btn btn-danger" id="delete-confirm">
                            <span class="btn-text">Delete Category</span>
                            <span class="btn-loading" style="display: none;">
                                <div class="spinner-small"></div> Deleting...
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add category button
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.showCategoryForm();
        });

        // Modal events
        document.getElementById('modal-close').addEventListener('click', () => {
            this.hideCategoryForm();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideCategoryForm();
        });

        document.getElementById('modal-save').addEventListener('click', () => {
            this.saveCategory();
        });

        // Delete modal events
        document.getElementById('delete-modal-close').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('delete-cancel').addEventListener('click', () => {
            this.hideDeleteModal();
        });

        document.getElementById('delete-confirm').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Close modals when clicking outside
        document.getElementById('category-modal').addEventListener('click', (e) => {
            if (e.target.id === 'category-modal') {
                this.hideCategoryForm();
            }
        });

        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.hideDeleteModal();
            }
        });

        // Form validation
        document.getElementById('category-name').addEventListener('input', () => {
            this.validateForm();
        });
    }

    /**
     * Load categories from the API
     */
    async loadCategories() {
        this.showLoading(true);
        try {
            const response = await window.apiUtils.getCategories();
            this.categories = response.data || [];
            this.renderCategoryList();
        } catch (error) {
            this.showNotification('Failed to load categories', 'error');
            console.error('Error loading categories:', error);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render the category list
     */
    renderCategoryList() {
        const categoryList = document.getElementById('category-list');
        
        if (this.categories.length === 0) {
            categoryList.innerHTML = `
                <div class="empty-state">
                    <i class="icon-folder"></i>
                    <h3>No Categories Found</h3>
                    <p>Get started by creating your first category.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('add-category-btn').click()">
                        <i class="icon-plus"></i> Add Category
                    </button>
                </div>
            `;
            return;
        }

        categoryList.innerHTML = this.categories.map(category => `
            <div class="category-item" data-category-id="${category.id}">
                <div class="category-info">
                    <h4 class="category-name">${this.escapeHtml(category.name)}</h4>
                    <p class="category-description">${this.escapeHtml(category.description || 'No description')}</p>
                    <div class="category-meta">
                        <span class="template-count">
                            <i class="icon-file"></i>
                            ${category.templateCount || 0} template${(category.templateCount || 0) !== 1 ? 's' : ''}
                        </span>
                        <span class="created-date">
                            Created: ${new Date(category.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="btn btn-sm btn-secondary edit-category" data-category-id="${category.id}">
                        <i class="icon-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger delete-category" data-category-id="${category.id}">
                        <i class="icon-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Bind category action events
        categoryList.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.edit-category').dataset.categoryId;
                this.editCategory(categoryId);
            });
        });

        categoryList.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.target.closest('.delete-category').dataset.categoryId;
                this.showDeleteModal(categoryId);
            });
        });
    }

    /**
     * Show the category form modal
     */
    showCategoryForm(category = null) {
        this.editingCategoryId = category ? category.id : null;
        
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('modal-title');
        const nameInput = document.getElementById('category-name');
        const descriptionInput = document.getElementById('category-description');
        const saveBtn = document.getElementById('modal-save');

        if (category) {
            title.textContent = 'Edit Category';
            nameInput.value = category.name;
            descriptionInput.value = category.description || '';
            saveBtn.querySelector('.btn-text').textContent = 'Update Category';
        } else {
            title.textContent = 'Add New Category';
            nameInput.value = '';
            descriptionInput.value = '';
            saveBtn.querySelector('.btn-text').textContent = 'Save Category';
        }

        this.clearFormErrors();
        modal.style.display = 'flex';
        nameInput.focus();
    }

    /**
     * Hide the category form modal
     */
    hideCategoryForm() {
        document.getElementById('category-modal').style.display = 'none';
        this.editingCategoryId = null;
        this.clearFormErrors();
    }

    /**
     * Save category (create or update)
     */
    async saveCategory() {
        if (!this.validateForm()) {
            return;
        }

        const nameInput = document.getElementById('category-name');
        const descriptionInput = document.getElementById('category-description');
        const saveBtn = document.getElementById('modal-save');

        const categoryData = {
            name: nameInput.value.trim(),
            description: descriptionInput.value.trim()
        };

        this.setButtonLoading(saveBtn, true);

        try {
            let response;
            if (this.editingCategoryId) {
                response = await window.apiUtils.updateCategory(this.editingCategoryId, categoryData);
                this.showNotification('Category updated successfully', 'success');
            } else {
                response = await window.apiUtils.createCategory(categoryData);
                this.showNotification('Category created successfully', 'success');
            }

            this.hideCategoryForm();
            await this.loadCategories();
        } catch (error) {
            this.handleSaveError(error);
        } finally {
            this.setButtonLoading(saveBtn, false);
        }
    }

    /**
     * Edit a category
     */
    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            this.showCategoryForm(category);
        }
    }

    /**
     * Show delete confirmation modal
     */
    async showDeleteModal(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        const modal = document.getElementById('delete-modal');
        const message = document.getElementById('delete-message');
        const warning = document.getElementById('delete-warning');
        const confirmBtn = document.getElementById('delete-confirm');

        message.textContent = `Are you sure you want to delete "${category.name}"?`;
        confirmBtn.dataset.categoryId = categoryId;

        // Check if category has templates
        try {
            const stats = await window.apiUtils.getCategoryStats(categoryId);
            const templateCount = stats.data?.templateCount || 0;
            
            if (templateCount > 0) {
                warning.style.display = 'block';
                confirmBtn.disabled = true;
                confirmBtn.classList.add('disabled');
            } else {
                warning.style.display = 'none';
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('disabled');
            }
        } catch (error) {
            console.error('Error checking category stats:', error);
            // Allow deletion attempt even if stats check fails
            warning.style.display = 'none';
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('disabled');
        }

        modal.style.display = 'flex';
    }

    /**
     * Hide delete confirmation modal
     */
    hideDeleteModal() {
        document.getElementById('delete-modal').style.display = 'none';
    }

    /**
     * Confirm category deletion
     */
    async confirmDelete() {
        const confirmBtn = document.getElementById('delete-confirm');
        const categoryId = confirmBtn.dataset.categoryId;

        if (!categoryId) return;

        this.setButtonLoading(confirmBtn, true);

        try {
            await window.apiUtils.deleteCategory(categoryId);
            this.showNotification('Category deleted successfully', 'success');
            this.hideDeleteModal();
            await this.loadCategories();
        } catch (error) {
            this.handleDeleteError(error);
        } finally {
            this.setButtonLoading(confirmBtn, false);
        }
    }

    /**
     * Validate the category form
     */
    validateForm() {
        const nameInput = document.getElementById('category-name');
        const nameError = document.getElementById('name-error');
        const name = nameInput.value.trim();

        let isValid = true;

        // Clear previous errors
        this.clearFormErrors();

        // Validate name
        if (!name) {
            nameError.textContent = 'Category name is required';
            nameInput.classList.add('error');
            isValid = false;
        } else if (name.length < 2) {
            nameError.textContent = 'Category name must be at least 2 characters';
            nameInput.classList.add('error');
            isValid = false;
        } else if (name.length > 100) {
            nameError.textContent = 'Category name must be less than 100 characters';
            nameInput.classList.add('error');
            isValid = false;
        } else {
            // Check for duplicate names (excluding current category if editing)
            const existingCategory = this.categories.find(c => 
                c.name.toLowerCase() === name.toLowerCase() && 
                c.id !== this.editingCategoryId
            );
            
            if (existingCategory) {
                nameError.textContent = 'A category with this name already exists';
                nameInput.classList.add('error');
                isValid = false;
            }
        }

        return isValid;
    }

    /**
     * Clear form validation errors
     */
    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
        document.querySelectorAll('.error').forEach(input => {
            input.classList.remove('error');
        });
    }

    /**
     * Handle save errors
     */
    handleSaveError(error) {
        console.error('Save error:', error);
        
        if (error.message.includes('409') || error.message.includes('duplicate')) {
            this.showFormError('name', 'A category with this name already exists');
        } else if (error.message.includes('400')) {
            this.showFormError('name', 'Invalid category data');
        } else {
            this.showNotification('Failed to save category', 'error');
        }
    }

    /**
     * Handle delete errors
     */
    handleDeleteError(error) {
        console.error('Delete error:', error);
        
        if (error.message.includes('409') || error.message.includes('in use')) {
            this.showNotification('Cannot delete category: it has associated templates', 'error');
        } else if (error.message.includes('404')) {
            this.showNotification('Category not found', 'error');
        } else {
            this.showNotification('Failed to delete category', 'error');
        }
    }

    /**
     * Show form field error
     */
    showFormError(fieldName, message) {
        const input = document.getElementById(`category-${fieldName}`);
        const error = document.getElementById(`${fieldName}-error`);
        
        if (input && error) {
            input.classList.add('error');
            error.textContent = message;
        }
    }

    /**
     * Show loading state
     */
    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        const categoryList = document.getElementById('category-list');
        
        if (show) {
            spinner.style.display = 'block';
            categoryList.style.opacity = '0.5';
        } else {
            spinner.style.display = 'none';
            categoryList.style.opacity = '1';
        }
    }

    /**
     * Set button loading state
     */
    setButtonLoading(button, loading) {
        const text = button.querySelector('.btn-text');
        const loadingEl = button.querySelector('.btn-loading');
        
        if (loading) {
            text.style.display = 'none';
            loadingEl.style.display = 'inline-flex';
            button.disabled = true;
        } else {
            text.style.display = 'inline';
            loadingEl.style.display = 'none';
            button.disabled = false;
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${this.escapeHtml(message)}</span>
            <button class="notification-close">&times;</button>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make it globally available
window.AdminCategoryManager = AdminCategoryManager;
