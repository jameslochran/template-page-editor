/**
 * SharePageModal Component
 * Work Order #35: Build SharePageModal Component for Managing Page Collaborators
 * Work Order #42: Enhanced with SharedUserRow component for individual collaborator management
 * 
 * This modal component provides a comprehensive interface to add new collaborators,
 * view existing shares, and manage permissions for page sharing.
 */
class SharePageModal {
    constructor(options = {}) {
        this.options = {
            onClose: () => {},
            onShare: () => {},
            ...options
        };
        
        this.modalElement = null;
        this.overlayElement = null;
        this.contentElement = null;
        this.isVisible = false;
        this.isLoading = false;
        this.error = null;
        this.pageId = null;
        
        // Collaborator management state
        this.existingCollaborators = [];
        this.searchResults = [];
        this.selectedUser = null;
        this.selectedPermission = 'view';
        this.searchQuery = '';
        this.searchTimeout = null;
        this.isSearching = false;
        this.isAddingCollaborator = false;
        
        // SharedUserRow instances for individual collaborator management
        this.sharedUserRows = new Map();
        
        this.elements = {};
        
        this.init();
    }

    /**
     * Initialize the SharePageModal component
     */
    init() {
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the modal HTML structure
     */
    render() {
        // Create modal overlay
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'share-page-modal-overlay';
        this.overlayElement.style.display = 'none';
        
        // Create modal content
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'share-page-modal-content';
        
        this.overlayElement.appendChild(this.contentElement);
        
        // Append to document body
        document.body.appendChild(this.overlayElement);
        
        this.modalElement = this.overlayElement;
        
        this.updateContent();
    }

    /**
     * Update modal content based on state
     */
    updateContent() {
        if (!this.contentElement) return;

        if (this.isLoading) {
            this.contentElement.innerHTML = `
                <div class="modal-header">
                    <h3>Share Page</h3>
                    <button class="modal-close-btn" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Loading page collaborators...</p>
                    </div>
                </div>
            `;
        } else if (this.error) {
            this.contentElement.innerHTML = `
                <div class="modal-header">
                    <h3>Share Page</h3>
                    <button class="modal-close-btn" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>Error</h4>
                        <p>${this.escapeHtml(this.error)}</p>
                        <button class="btn btn-primary" id="retry-sharing">Retry</button>
                    </div>
                </div>
            `;
        } else {
            this.contentElement.innerHTML = `
                <div class="modal-header">
                    <h3>Share Page</h3>
                    <button class="modal-close-btn" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- Add New Collaborator Section -->
                    <div class="add-collaborator-section">
                        <h4>Add Collaborator</h4>
                        <div class="collaborator-form">
                            <div class="form-group">
                                <label for="user-search">Search for users</label>
                                <div class="search-container">
                                    <input 
                                        type="text" 
                                        id="user-search" 
                                        class="form-control" 
                                        placeholder="Type name or email to search..."
                                        value="${this.escapeHtml(this.searchQuery)}"
                                    >
                                    <div class="search-results" id="search-results" style="display: none;">
                                        ${this.renderSearchResults()}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Permission Level</label>
                                <div class="permission-selector">
                                    <label class="permission-option">
                                        <input 
                                            type="radio" 
                                            name="permission" 
                                            value="view" 
                                            ${this.selectedPermission === 'view' ? 'checked' : ''}
                                        >
                                        <span class="permission-label">
                                            <i class="fas fa-eye"></i>
                                            <strong>View</strong>
                                            <small>Can view the page</small>
                                        </span>
                                    </label>
                                    <label class="permission-option">
                                        <input 
                                            type="radio" 
                                            name="permission" 
                                            value="edit" 
                                            ${this.selectedPermission === 'edit' ? 'checked' : ''}
                                        >
                                        <span class="permission-label">
                                            <i class="fas fa-edit"></i>
                                            <strong>Edit</strong>
                                            <small>Can view and edit the page</small>
                                        </span>
                                    </label>
                                </div>
                            </div>
                            
                            <button 
                                class="btn btn-primary" 
                                id="add-collaborator-btn"
                                ${!this.selectedUser ? 'disabled' : ''}
                            >
                                <i class="fas fa-user-plus"></i>
                                Add Collaborator
                            </button>
                        </div>
                    </div>
                    
                    <!-- Existing Collaborators Section -->
                    <div class="existing-collaborators-section">
                        <h4>Current Collaborators</h4>
                        <div class="collaborators-list" id="collaborators-list">
                            ${this.renderExistingCollaborators()}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="close-modal-btn">Close</button>
                </div>
            `;
        }
        
        this.cacheElements();
    }

    /**
     * Render search results HTML
     */
    renderSearchResults() {
        if (this.isSearching) {
            return '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
        }
        
        if (this.searchResults.length === 0 && this.searchQuery.length >= 2) {
            return '<div class="search-no-results">No users found matching your search.</div>';
        }
        
        return this.searchResults.map(user => `
            <div class="search-result-item" data-user-id="${user.id}">
                <div class="user-info">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-details">
                        <div class="user-name">${this.escapeHtml(user.name)}</div>
                        <div class="user-email">${this.escapeHtml(user.email)}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render existing collaborators using SharedUserRow components
     */
    renderExistingCollaborators() {
        if (this.existingCollaborators.length === 0) {
            return '<div class="no-collaborators">No collaborators yet. Add someone to get started!</div>';
        }
        
        // Clear existing SharedUserRow instances
        this.clearSharedUserRows();
        
        // Create SharedUserRow components for each collaborator
        const container = document.createElement('div');
        container.className = 'shared-user-rows-container';
        
        this.existingCollaborators.forEach(collaborator => {
            const sharedUserRow = new SharedUserRow({
                pageId: this.pageId,
                shareId: collaborator.id,
                userName: collaborator.user?.name || 'Unknown User',
                userEmail: collaborator.user?.email || '',
                currentPermission: collaborator.permissionLevel,
                onUpdate: (data) => this.handleCollaboratorUpdate(data),
                onDelete: (data) => this.handleCollaboratorDelete(data)
            });
            
            // Store the SharedUserRow instance
            this.sharedUserRows.set(collaborator.id, sharedUserRow);
            
            // Append the row element to the container
            container.appendChild(sharedUserRow.getElement());
        });
        
        return container;
    }

    /**
     * Clear all SharedUserRow instances
     */
    clearSharedUserRows() {
        this.sharedUserRows.forEach((sharedUserRow) => {
            sharedUserRow.destroy();
        });
        this.sharedUserRows.clear();
    }

    /**
     * Handle collaborator permission update
     */
    handleCollaboratorUpdate(data) {
        const { shareId, newPermission, oldPermission } = data;
        
        // Update the collaborator in our local state
        const collaborator = this.existingCollaborators.find(c => c.id === shareId);
        if (collaborator) {
            collaborator.permissionLevel = newPermission;
        }
        
        // Show success notification
        this.showNotification(`Permission updated to ${newPermission}`, 'success');
        
        console.log(`Collaborator permission updated: ${oldPermission} → ${newPermission}`);
    }

    /**
     * Handle collaborator deletion
     */
    handleCollaboratorDelete(data) {
        const { shareId, userName } = data;
        
        // Remove the collaborator from our local state
        this.existingCollaborators = this.existingCollaborators.filter(c => c.id !== shareId);
        
        // Remove the SharedUserRow instance
        const sharedUserRow = this.sharedUserRows.get(shareId);
        if (sharedUserRow) {
            this.sharedUserRows.delete(shareId);
        }
        
        // Show success notification
        this.showNotification(`Access revoked for ${userName}`, 'success');
        
        console.log(`Collaborator removed: ${userName}`);
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
        
        // Add to modal content
        if (this.contentElement) {
            this.contentElement.appendChild(notification);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }

    /**
     * Cache DOM elements for easy access
     */
    cacheElements() {
        this.elements = {
            closeBtn: this.contentElement?.querySelector('.modal-close-btn'),
            closeModalBtn: this.contentElement?.querySelector('#close-modal-btn'),
            userSearchInput: this.contentElement?.querySelector('#user-search'),
            searchResults: this.contentElement?.querySelector('#search-results'),
            addCollaboratorBtn: this.contentElement?.querySelector('#add-collaborator-btn'),
            collaboratorsList: this.contentElement?.querySelector('#collaborators-list'),
            retryBtn: this.contentElement?.querySelector('#retry-sharing')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Close modal button
        if (this.elements.closeModalBtn) {
            this.elements.closeModalBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Overlay click to close
        if (this.overlayElement) {
            this.overlayElement.addEventListener('click', (e) => {
                if (e.target === this.overlayElement) {
                    this.hide();
                }
            });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // User search input
        if (this.elements.userSearchInput) {
            this.elements.userSearchInput.addEventListener('input', (e) => {
                this.handleUserSearch(e.target.value);
            });
            
            this.elements.userSearchInput.addEventListener('focus', () => {
                if (this.searchResults.length > 0) {
                    this.elements.searchResults.style.display = 'block';
                }
            });
        }

        // Search results click
        if (this.elements.searchResults) {
            this.elements.searchResults.addEventListener('click', (e) => {
                const resultItem = e.target.closest('.search-result-item');
                if (resultItem) {
                    const userId = resultItem.dataset.userId;
                    this.selectUser(userId);
                }
            });
        }

        // Permission radio buttons
        const permissionRadios = this.contentElement?.querySelectorAll('input[name="permission"]');
        if (permissionRadios) {
            permissionRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.selectedPermission = e.target.value;
                });
            });
        }

        // Add collaborator button
        if (this.elements.addCollaboratorBtn) {
            this.elements.addCollaboratorBtn.addEventListener('click', () => {
                this.handleAddCollaborator();
            });
        }

        // Collaborator actions (remove)
        if (this.elements.collaboratorsList) {
            this.elements.collaboratorsList.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('[data-action]');
                if (actionBtn && actionBtn.dataset.action === 'remove') {
                    const shareId = actionBtn.dataset.shareId;
                    this.handleRemoveCollaborator(shareId);
                }
            });
        }

        // Retry button
        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', () => {
                this.hideError();
                this.show(this.pageId);
            });
        }

        // Click outside search results to hide them
        document.addEventListener('click', (e) => {
            if (this.elements.searchResults && 
                !this.elements.searchResults.contains(e.target) && 
                !this.elements.userSearchInput?.contains(e.target)) {
                this.elements.searchResults.style.display = 'none';
            }
        });
    }

    /**
     * Show the modal
     * @param {string} pageId - Page ID to share
     */
    async show(pageId) {
        this.pageId = pageId;
        this.isVisible = true;
        this.hideError();
        
        // Reset state
        this.searchQuery = '';
        this.searchResults = [];
        this.selectedUser = null;
        this.selectedPermission = 'view';
        this.existingCollaborators = [];
        
        // Show loading state initially
        this.setLoading(true);
        
        if (this.modalElement) {
            this.modalElement.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        try {
            // Load existing collaborators
            await this.loadExistingCollaborators();
            
            // Hide loading and show content
            this.setLoading(false);
            this.updateContent();
            this.setupEventListeners(); // Re-setup listeners after content update
        } catch (error) {
            console.error('Error loading collaborators:', error);
            this.showError('Failed to load page collaborators. Please try again.');
        }
    }

    /**
     * Hide the modal
     */
    hide() {
        this.isVisible = false;
        
        // Clean up SharedUserRow instances
        this.clearSharedUserRows();
        
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }

        // Call onClose callback
        if (this.options.onClose && typeof this.options.onClose === 'function') {
            this.options.onClose();
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.updateContent();
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.error = message;
        this.isLoading = false;
        this.updateContent();
        this.setupEventListeners(); // Re-setup listeners after content update
    }

    /**
     * Hide error message
     */
    hideError() {
        this.error = null;
    }

    /**
     * Load existing collaborators for the page
     */
    async loadExistingCollaborators() {
        try {
            const response = await fetch(`/api/pages/${this.pageId}/share`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load collaborators: ${response.status}`);
            }

            const result = await response.json();
            this.existingCollaborators = result.data || [];
        } catch (error) {
            console.error('Error loading existing collaborators:', error);
            throw error;
        }
    }

    /**
     * Handle user search with debouncing
     */
    handleUserSearch(query) {
        this.searchQuery = query;
        
        // Clear existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Hide search results if query is too short
        if (query.length < 2) {
            this.searchResults = [];
            this.elements.searchResults.style.display = 'none';
            return;
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performUserSearch(query);
        }, 300);
    }

    /**
     * Perform user search API call
     */
    async performUserSearch(query) {
        try {
            this.isSearching = true;
            this.updateSearchResults();
            
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const result = await response.json();
            this.searchResults = result.data || [];
            this.isSearching = false;
            this.updateSearchResults();
            
            // Show search results
            if (this.elements.searchResults) {
                this.elements.searchResults.style.display = this.searchResults.length > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Error searching users:', error);
            this.isSearching = false;
            this.searchResults = [];
            this.updateSearchResults();
            this.showNotification('Failed to search users. Please try again.', 'error');
        }
    }

    /**
     * Update search results display
     */
    updateSearchResults() {
        if (this.elements.searchResults) {
            this.elements.searchResults.innerHTML = this.renderSearchResults();
        }
    }

    /**
     * Select a user from search results
     */
    selectUser(userId) {
        const user = this.searchResults.find(u => u.id === userId);
        if (user) {
            this.selectedUser = user;
            this.elements.userSearchInput.value = user.name;
            this.elements.searchResults.style.display = 'none';
            this.elements.addCollaboratorBtn.disabled = false;
        }
    }

    /**
     * Handle adding a new collaborator
     */
    async handleAddCollaborator() {
        if (!this.selectedUser) {
            this.showNotification('Please select a user to add as collaborator.', 'warning');
            return;
        }

        try {
            this.isAddingCollaborator = true;
            this.elements.addCollaboratorBtn.disabled = true;
            this.elements.addCollaboratorBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

            const response = await fetch(`/api/pages/${this.pageId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.selectedUser.id,
                    permissionLevel: this.selectedPermission
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add collaborator');
            }

            const result = await response.json();
            
            // Refresh collaborators list
            await this.loadExistingCollaborators();
            this.updateContent();
            this.setupEventListeners();
            
            // Reset form
            this.selectedUser = null;
            this.searchQuery = '';
            this.searchResults = [];
            this.elements.userSearchInput.value = '';
            
            this.showNotification(`Successfully added ${this.selectedUser?.name || 'collaborator'} with ${this.selectedPermission} permissions.`, 'success');
            
        } catch (error) {
            console.error('Error adding collaborator:', error);
            this.showNotification(error.message || 'Failed to add collaborator. Please try again.', 'error');
        } finally {
            this.isAddingCollaborator = false;
            this.elements.addCollaboratorBtn.disabled = false;
            this.elements.addCollaboratorBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Collaborator';
        }
    }

    /**
     * Handle removing a collaborator
     */
    async handleRemoveCollaborator(shareId) {
        if (!confirm('Are you sure you want to remove this collaborator?')) {
            return;
        }

        try {
            const response = await fetch(`/api/pages/${this.pageId}/share/${shareId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove collaborator');
            }

            // Refresh collaborators list
            await this.loadExistingCollaborators();
            this.updateContent();
            this.setupEventListeners();
            
            this.showNotification('Collaborator removed successfully.', 'success');
            
        } catch (error) {
            console.error('Error removing collaborator:', error);
            this.showNotification(error.message || 'Failed to remove collaborator. Please try again.', 'error');
        }
    }

    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type (info, success, warning, error)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
        
        // Add to modal content
        if (this.contentElement) {
            this.contentElement.appendChild(notification);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }

    /**
     * Get notification icon based on type
     * @param {string} type - Notification type
     * @returns {string} Icon class
     */
    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Check if modal is visible
     * @returns {boolean} Visibility state
     */
    isModalVisible() {
        return this.isVisible;
    }

    /**
     * Get current page ID
     * @returns {string|null} Current page ID
     */
    getPageId() {
        return this.pageId;
    }

    /**
     * Destroy the modal
     */
    destroy() {
        if (this.modalElement && this.modalElement.parentNode) {
            this.modalElement.parentNode.removeChild(this.modalElement);
        }
        
        // Restore body overflow
        document.body.style.overflow = '';
        
        this.modalElement = null;
        this.overlayElement = null;
        this.contentElement = null;
        this.elements = {};
    }
}

// Export for use in other modules
window.SharePageModal = SharePageModal;
