/**
 * SharedUserRow Component
 * Work Order #42: Create SharedUserRow Component for Individual Collaborator Management
 * 
 * This component provides a reusable row for displaying and managing individual
 * collaborator permissions within a sharing modal.
 */
class SharedUserRow {
    constructor(options = {}) {
        this.options = {
            pageId: null,
            shareId: null,
            userName: '',
            userEmail: '',
            currentPermission: 'view',
            onUpdate: () => {},
            onDelete: () => {},
            ...options
        };
        
        this.element = null;
        this.isUpdating = false;
        this.isDeleting = false;
        this.error = null;
        
        this.init();
    }
    
    /**
     * Initialize the SharedUserRow component
     */
    init() {
        this.render();
        this.setupEventListeners();
    }
    
    /**
     * Render the SharedUserRow HTML structure
     */
    render() {
        const { userName, userEmail, currentPermission, shareId } = this.options;
        
        this.element = document.createElement('div');
        this.element.className = 'shared-user-row';
        this.element.setAttribute('data-share-id', shareId);
        
        this.element.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <div class="user-name">${this.escapeHtml(userName)}</div>
                    <div class="user-email">${this.escapeHtml(userEmail)}</div>
                </div>
            </div>
            
            <div class="permission-controls">
                <div class="permission-selector">
                    <select class="permission-dropdown" ${this.isUpdating ? 'disabled' : ''}>
                        <option value="view" ${currentPermission === 'view' ? 'selected' : ''}>
                            <i class="fas fa-eye"></i> View
                        </option>
                        <option value="edit" ${currentPermission === 'edit' ? 'selected' : ''}>
                            <i class="fas fa-edit"></i> Edit
                        </option>
                    </select>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline btn-danger" 
                            data-action="revoke" 
                            ${this.isDeleting ? 'disabled' : ''}>
                        <i class="fas fa-times"></i>
                        <span class="btn-text">Revoke</span>
                    </button>
                </div>
            </div>
            
            <div class="status-indicators">
                ${this.renderStatusIndicator()}
            </div>
        `;
        
        return this.element;
    }
    
    /**
     * Render status indicator for loading/error states
     */
    renderStatusIndicator() {
        if (this.isUpdating) {
            return '<div class="status-indicator updating"><i class="fas fa-spinner fa-spin"></i> Updating...</div>';
        }
        
        if (this.isDeleting) {
            return '<div class="status-indicator deleting"><i class="fas fa-spinner fa-spin"></i> Removing...</div>';
        }
        
        if (this.error) {
            return `<div class="status-indicator error"><i class="fas fa-exclamation-triangle"></i> ${this.escapeHtml(this.error)}</div>`;
        }
        
        return '';
    }
    
    /**
     * Setup event listeners for the SharedUserRow
     */
    setupEventListeners() {
        if (!this.element) return;
        
        // Permission dropdown change
        const permissionDropdown = this.element.querySelector('.permission-dropdown');
        if (permissionDropdown) {
            permissionDropdown.addEventListener('change', (e) => {
                this.handlePermissionChange(e.target.value);
            });
        }
        
        // Revoke button click
        const revokeButton = this.element.querySelector('[data-action="revoke"]');
        if (revokeButton) {
            revokeButton.addEventListener('click', () => {
                this.handleRevokeAccess();
            });
        }
    }
    
    /**
     * Handle permission level change
     */
    async handlePermissionChange(newPermission) {
        const { pageId, shareId, currentPermission } = this.options;
        
        if (newPermission === currentPermission) {
            return; // No change needed
        }
        
        this.setUpdating(true);
        this.clearError();
        
        try {
            const response = await fetch(`/api/pages/${pageId}/share/${shareId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-admin-token'
                },
                body: JSON.stringify({
                    permissionLevel: newPermission
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to update permission');
            }
            
            // Update the current permission
            this.options.currentPermission = newPermission;
            
            // Call the onUpdate callback
            if (this.options.onUpdate) {
                this.options.onUpdate({
                    shareId,
                    newPermission,
                    oldPermission: currentPermission
                });
            }
            
            this.setUpdating(false);
            
        } catch (error) {
            console.error('Error updating permission:', error);
            this.setError(error.message);
            this.setUpdating(false);
            
            // Reset dropdown to original value
            const dropdown = this.element.querySelector('.permission-dropdown');
            if (dropdown) {
                dropdown.value = currentPermission;
            }
        }
    }
    
    /**
     * Handle revoke access action
     */
    async handleRevokeAccess() {
        const { pageId, shareId, userName } = this.options;
        
        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to revoke access for ${userName}? This action cannot be undone.`
        );
        
        if (!confirmed) {
            return;
        }
        
        this.setDeleting(true);
        this.clearError();
        
        try {
            const response = await fetch(`/api/pages/${pageId}/share/${shareId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer mock-admin-token'
                }
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to revoke access');
            }
            
            // Call the onDelete callback
            if (this.options.onDelete) {
                this.options.onDelete({
                    shareId,
                    userName
                });
            }
            
            // Remove the row from DOM
            this.remove();
            
        } catch (error) {
            console.error('Error revoking access:', error);
            this.setError(error.message);
            this.setDeleting(false);
        }
    }
    
    /**
     * Set updating state
     */
    setUpdating(isUpdating) {
        this.isUpdating = isUpdating;
        this.updateStatusIndicator();
        this.updateButtonStates();
    }
    
    /**
     * Set deleting state
     */
    setDeleting(isDeleting) {
        this.isDeleting = isDeleting;
        this.updateStatusIndicator();
        this.updateButtonStates();
    }
    
    /**
     * Set error state
     */
    setError(errorMessage) {
        this.error = errorMessage;
        this.updateStatusIndicator();
    }
    
    /**
     * Clear error state
     */
    clearError() {
        this.error = null;
        this.updateStatusIndicator();
    }
    
    /**
     * Update status indicator display
     */
    updateStatusIndicator() {
        const statusContainer = this.element.querySelector('.status-indicators');
        if (statusContainer) {
            statusContainer.innerHTML = this.renderStatusIndicator();
        }
    }
    
    /**
     * Update button states based on current operation
     */
    updateButtonStates() {
        const dropdown = this.element.querySelector('.permission-dropdown');
        const revokeButton = this.element.querySelector('[data-action="revoke"]');
        
        if (dropdown) {
            dropdown.disabled = this.isUpdating || this.isDeleting;
        }
        
        if (revokeButton) {
            revokeButton.disabled = this.isUpdating || this.isDeleting;
        }
    }
    
    /**
     * Update user information
     */
    updateUserInfo(userName, userEmail) {
        this.options.userName = userName;
        this.options.userEmail = userEmail;
        
        const nameElement = this.element.querySelector('.user-name');
        const emailElement = this.element.querySelector('.user-email');
        
        if (nameElement) {
            nameElement.textContent = userName;
        }
        
        if (emailElement) {
            emailElement.textContent = userEmail;
        }
    }
    
    /**
     * Update permission level
     */
    updatePermission(permission) {
        this.options.currentPermission = permission;
        
        const dropdown = this.element.querySelector('.permission-dropdown');
        if (dropdown) {
            dropdown.value = permission;
        }
    }
    
    /**
     * Get the DOM element
     */
    getElement() {
        return this.element;
    }
    
    /**
     * Remove the row from DOM
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Destroy the component and clean up
     */
    destroy() {
        if (this.element) {
            // Remove event listeners
            const dropdown = this.element.querySelector('.permission-dropdown');
            const revokeButton = this.element.querySelector('[data-action="revoke"]');
            
            if (dropdown) {
                dropdown.removeEventListener('change', this.handlePermissionChange);
            }
            
            if (revokeButton) {
                revokeButton.removeEventListener('click', this.handleRevokeAccess);
            }
            
            // Remove from DOM
            this.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedUserRow;
}
