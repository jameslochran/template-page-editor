/**
 * VersionHistoryManager - Work Order 40
 * Manages version history display and interactions for the PageEditor
 */
class VersionHistoryManager {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            pageId: null,
            onViewVersion: () => {}, // Placeholder for VersionPreviewModal
            onRevertVersion: () => {}, // Callback for revert operations
            onRefreshPage: () => {}, // Callback to refresh page content
            ...options
        };
        
        this.versions = [];
        this.isLoading = false;
        this.error = null;
        this.elements = {};
        this.versionPreviewModal = null;
        
        this.initializeVersionPreviewModal();
        this.render();
        this.setupEventListeners();
    }

    /**
     * Initialize Version Preview Modal
     */
    initializeVersionPreviewModal() {
        if (window.VersionPreviewModal) {
            this.versionPreviewModal = new window.VersionPreviewModal({
                onClose: () => {
                    // Modal closed, no action needed
                }
            });
        } else {
            console.warn('VersionPreviewModal not available');
        }
    }

    /**
     * Render the version history panel
     */
    render() {
        this.container.innerHTML = `
            <div class="version-history-panel">
                <div class="version-history-header">
                    <h3 class="version-history-title">
                        <i class="fas fa-history"></i>
                        Version History
                    </h3>
                    <button class="version-history-close-btn" data-action="close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="version-history-content">
                    <div class="version-history-loading" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>Loading versions...</p>
                    </div>
                    
                    <div class="version-history-error" style="display: none;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p class="error-message"></p>
                        <button class="retry-btn" data-action="retry">Retry</button>
                    </div>
                    
                    <div class="version-history-empty" style="display: none;">
                        <i class="fas fa-inbox"></i>
                        <p>No versions found</p>
                        <small>Save a version to see it here</small>
                    </div>
                    
                    <div class="version-history-list">
                        <!-- Version cards will be inserted here -->
                    </div>
                </div>
            </div>
        `;

        // Cache DOM elements
        this.elements = {
            panel: this.container.querySelector('.version-history-panel'),
            header: this.container.querySelector('.version-history-header'),
            title: this.container.querySelector('.version-history-title'),
            closeBtn: this.container.querySelector('.version-history-close-btn'),
            content: this.container.querySelector('.version-history-content'),
            loading: this.container.querySelector('.version-history-loading'),
            error: this.container.querySelector('.version-history-error'),
            errorMessage: this.container.querySelector('.error-message'),
            retryBtn: this.container.querySelector('.retry-btn'),
            empty: this.container.querySelector('.version-history-empty'),
            list: this.container.querySelector('.version-history-list')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        this.elements.closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // Retry button
        this.elements.retryBtn.addEventListener('click', () => {
            this.loadVersions();
        });

        // Click outside to close
        this.elements.panel.addEventListener('click', (e) => {
            if (e.target === this.elements.panel) {
                this.hide();
            }
        });
    }

    /**
     * Show the version history panel
     * @param {string} pageId - Page ID to load versions for
     */
    show(pageId = null) {
        console.log('VersionHistoryManager.show() called with pageId:', pageId);
        
        if (pageId) {
            this.options.pageId = pageId;
        }
        
        if (!this.options.pageId) {
            console.error('VersionHistoryManager: No pageId provided');
            return;
        }

        console.log('Setting container display to block');
        this.container.style.display = 'block';
        console.log('Loading versions...');
        this.loadVersions();
    }

    /**
     * Hide the version history panel
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * Check if panel is visible
     * @returns {boolean} True if visible
     */
    isVisible() {
        return this.container.style.display === 'block';
    }

    /**
     * Load versions from API
     */
    async loadVersions() {
        console.log('loadVersions() called with pageId:', this.options.pageId);
        
        if (!this.options.pageId) {
            this.showError('No page ID provided');
            return;
        }

        this.setLoading(true);
        this.hideError();
        this.hideEmpty();

        try {
            const response = await fetch(`/api/pages/${this.options.pageId}/versions`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (Array.isArray(data)) {
                this.versions = window.PageVersion ? 
                    window.PageVersion.fromAPIArray(data) : 
                    data.map(v => new PageVersion(v));
                
                // Sort by date (newest first)
                this.versions = window.PageVersion ? 
                    window.PageVersion.sortByDate(this.versions) :
                    this.versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                this.renderVersions();
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error loading versions:', error);
            this.showError(error.message || 'Failed to load versions');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Render version cards
     */
    renderVersions() {
        if (!this.versions || this.versions.length === 0) {
            this.showEmpty();
            return;
        }

        this.elements.list.innerHTML = '';
        
        this.versions.forEach((version, index) => {
            const versionCard = this.createVersionCard(version, index);
            this.elements.list.appendChild(versionCard);
        });
    }

    /**
     * Create a version card element
     * @param {PageVersion} version - Version data
     * @param {number} index - Index in the list
     * @returns {HTMLElement} Version card element
     */
    createVersionCard(version, index) {
        const card = document.createElement('div');
        card.className = 'version-card';
        card.dataset.versionId = version.id;
        card.dataset.versionNumber = version.versionNumber;

        // Add current version indicator
        if (version.isCurrentVersion && version.isCurrentVersion()) {
            card.classList.add('current-version');
        }

        const displayName = version.getDisplayName ? version.getDisplayName() : `Version ${version.versionNumber}`;
        const timestamp = version.getFormattedTimestamp ? version.getFormattedTimestamp() : new Date(version.createdAt).toLocaleString();
        const relativeTime = version.getRelativeTime ? version.getRelativeTime() : 'Unknown time';
        const userDisplay = version.getUserDisplayName ? version.getUserDisplayName() : 'Unknown User';
        const changeSummary = version.getChangeSummary ? version.getChangeSummary() : 'No description';

        card.innerHTML = `
            <div class="version-card-header">
                <div class="version-info">
                    <h4 class="version-name">${this.escapeHtml(displayName)}</h4>
                    <span class="version-number">v${version.versionNumber}</span>
                    ${version.isCurrentVersion && version.isCurrentVersion() ? '<span class="current-badge">Current</span>' : ''}
                </div>
                <div class="version-timestamp">
                    <span class="timestamp-full">${this.escapeHtml(timestamp)}</span>
                    <span class="timestamp-relative">${this.escapeHtml(relativeTime)}</span>
                </div>
            </div>
            
            <div class="version-card-body">
                <div class="version-meta">
                    <div class="version-user">
                        <i class="fas fa-user"></i>
                        <span>${this.escapeHtml(userDisplay)}</span>
                    </div>
                </div>
                
                ${changeSummary !== 'No description' ? `
                    <div class="version-description">
                        <p>${this.escapeHtml(changeSummary)}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="version-card-actions">
                <button class="btn btn-secondary btn-sm view-btn" data-action="view" data-version-id="${version.id}">
                    <i class="fas fa-eye"></i>
                    View
                </button>
                ${!version.isCurrentVersion || !version.isCurrentVersion() ? `
                    <button class="btn btn-primary btn-sm revert-btn" data-action="revert" data-version-id="${version.id}">
                        <i class="fas fa-undo"></i>
                        Revert
                    </button>
                ` : ''}
            </div>
        `;

        // Add event listeners for action buttons
        const viewBtn = card.querySelector('.view-btn');
        const revertBtn = card.querySelector('.revert-btn');

        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleViewVersion(version);
            });
        }

        if (revertBtn) {
            revertBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleRevertVersion(version);
            });
        }

        return card;
    }

    /**
     * Handle view version action
     * @param {PageVersion} version - Version to view
     */
    handleViewVersion(version) {
        console.log('View version requested:', version);
        
        // Use VersionPreviewModal if available
        if (this.versionPreviewModal) {
            this.versionPreviewModal.show(version);
        } else {
            console.warn('VersionPreviewModal not available, falling back to callback');
            // Call callback if provided
            if (this.options.onViewVersion) {
                this.options.onViewVersion(version);
            }
        }
    }

    /**
     * Handle revert version action
     * @param {PageVersion} version - Version to revert to
     */
    async handleRevertVersion(version) {
        const confirmMessage = `Are you sure you want to revert to ${version.getDisplayName ? version.getDisplayName() : `Version ${version.versionNumber}`}?\n\nThis will replace the current page content with the content from this version.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            this.setLoading(true);
            
            const response = await fetch(`/api/pages/${this.options.pageId}/revert/${version.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Show success message
            this.showSuccess(`Successfully reverted to ${version.getDisplayName ? version.getDisplayName() : `Version ${version.versionNumber}`}`);
            
            // Refresh page content
            if (this.options.onRefreshPage) {
                this.options.onRefreshPage();
            }
            
            // Reload versions to update current version indicator
            setTimeout(() => {
                this.loadVersions();
            }, 1000);
            
        } catch (error) {
            console.error('Error reverting version:', error);
            this.showError(error.message || 'Failed to revert version');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.elements.loading.style.display = 'flex';
            this.elements.list.style.display = 'none';
        } else {
            this.elements.loading.style.display = 'none';
            this.elements.list.style.display = 'block';
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
        this.elements.list.style.display = 'none';
        this.elements.empty.style.display = 'none';
    }

    /**
     * Hide error state
     */
    hideError() {
        this.error = null;
        this.elements.error.style.display = 'none';
    }

    /**
     * Show empty state
     */
    showEmpty() {
        this.elements.empty.style.display = 'flex';
        this.elements.list.style.display = 'none';
        this.elements.error.style.display = 'none';
    }

    /**
     * Hide empty state
     */
    hideEmpty() {
        this.elements.empty.style.display = 'none';
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Create temporary success notification
        const notification = document.createElement('div');
        notification.className = 'version-success-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${this.escapeHtml(message)}</span>
        `;
        
        this.elements.content.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (typeof text !== 'string') {
            return '';
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update page ID and reload versions
     * @param {string} pageId - New page ID
     */
    updatePageId(pageId) {
        this.options.pageId = pageId;
        if (this.isVisible()) {
            this.loadVersions();
        }
    }

    /**
     * Get current versions
     * @returns {Array<PageVersion>} Current versions
     */
    getVersions() {
        return [...this.versions];
    }

    /**
     * Get current version
     * @returns {PageVersion|null} Current version
     */
    getCurrentVersion() {
        if (window.PageVersion) {
            return window.PageVersion.findCurrentVersion(this.versions);
        }
        return this.versions.find(v => v.isActive) || null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VersionHistoryManager;
} else {
    window.VersionHistoryManager = VersionHistoryManager;
}
