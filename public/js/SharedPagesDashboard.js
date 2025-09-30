/**
 * SharedPagesDashboard Component
 * Work Order #44: Develop SharedPagesDashboard for Viewing Pages Shared with User
 * 
 * This component provides a dedicated interface to discover and access all pages
 * that have been shared with the user, enabling efficient navigation to collaborative content.
 */

class SharedPagesDashboard {
    constructor(options = {}) {
        this.options = {
            containerId: 'shared-pages-content',
            onPageClick: null,
            ...options
        };

        this.container = null;
        this.sharedPages = [];
        this.isLoading = false;
        this.error = null;

        this.init();
    }

    /**
     * Initialize the dashboard
     */
    init() {
        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error('SharedPagesDashboard: Container not found:', this.options.containerId);
            return;
        }

        this.render();
        this.loadSharedPages();
    }

    /**
     * Render the dashboard UI
     */
    render() {
        this.container.innerHTML = `
            <div class="shared-pages-dashboard">
                <div class="dashboard-header">
                    <div class="header-content">
                        <h3 class="dashboard-title">
                            <i class="fas fa-share-alt"></i>
                            Pages Shared with You
                        </h3>
                        <p class="dashboard-subtitle">
                            Discover and access pages that have been shared with you for collaboration
                        </p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="refresh-shared-pages">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                </div>

                <div class="dashboard-content">
                    <div id="shared-pages-loading" class="loading-state" style="display: none;">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <p>Loading shared pages...</p>
                    </div>

                    <div id="shared-pages-error" class="error-state" style="display: none;">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <p class="error-message"></p>
                        <button class="btn btn-secondary" id="retry-load-shared-pages">
                            <i class="fas fa-redo"></i>
                            Try Again
                        </button>
                    </div>

                    <div id="shared-pages-empty" class="empty-state" style="display: none;">
                        <div class="empty-icon">
                            <i class="fas fa-share-alt"></i>
                        </div>
                        <h4>No Shared Pages</h4>
                        <p>No pages have been shared with you yet. When someone shares a page with you, it will appear here.</p>
                    </div>

                    <div id="shared-pages-list" class="shared-pages-list" style="display: none;">
                        <!-- Shared pages will be rendered here -->
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-shared-pages');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadSharedPages();
            });
        }

        // Retry button
        const retryBtn = document.getElementById('retry-load-shared-pages');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.loadSharedPages();
            });
        }
    }

    /**
     * Load shared pages from the API
     */
    async loadSharedPages() {
        this.setLoadingState(true);
        this.setErrorState(false);

        try {
            const response = await fetch('/api/users/me/shared-pages', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer mock-token' // Mock authentication
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const sharedPages = await response.json();
            this.sharedPages = Array.isArray(sharedPages) ? sharedPages : [];
            this.renderSharedPages();

        } catch (error) {
            console.error('Error loading shared pages:', error);
            this.setErrorState(true, error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Render the list of shared pages
     */
    renderSharedPages() {
        const listContainer = document.getElementById('shared-pages-list');
        const emptyState = document.getElementById('shared-pages-empty');

        if (!listContainer) return;

        if (this.sharedPages.length === 0) {
            this.setEmptyState(true);
            listContainer.style.display = 'none';
            return;
        }

        this.setEmptyState(false);
        listContainer.style.display = 'block';

        listContainer.innerHTML = this.sharedPages.map(share => this.renderSharedPageCard(share)).join('');
    }

    /**
     * Render a single shared page card
     */
    renderSharedPageCard(share) {
        const page = share.page;
        const permissionIcon = share.permissionLevel === 'edit' ? 'fas fa-edit' : 'fas fa-eye';
        const permissionText = share.permissionLevel === 'edit' ? 'Can Edit' : 'View Only';
        const permissionClass = share.permissionLevel === 'edit' ? 'permission-edit' : 'permission-view';

        return `
            <div class="shared-page-card" data-page-id="${page.id}" data-share-id="${share.id}">
                <div class="page-header">
                    <div class="page-info">
                        <h4 class="page-title">${this.escapeHtml(page.title)}</h4>
                        <p class="page-meta">
                            <span class="page-id">ID: ${page.id}</span>
                            <span class="page-components">${page.componentCount} components</span>
                        </p>
                    </div>
                    <div class="page-actions">
                        <span class="permission-badge ${permissionClass}">
                            <i class="${permissionIcon}"></i>
                            ${permissionText}
                        </span>
                    </div>
                </div>

                <div class="page-details">
                    <div class="detail-item">
                        <i class="fas fa-user"></i>
                        <span class="detail-label">Shared by:</span>
                        <span class="detail-value">${this.getSharerName(share.sharedByUserId)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span class="detail-label">Shared on:</span>
                        <span class="detail-value">${this.formatDate(share.createdAt)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span class="detail-label">Last updated:</span>
                        <span class="detail-value">${this.formatDate(page.updatedAt)}</span>
                    </div>
                </div>

                <div class="page-footer">
                    <button class="btn btn-primary btn-sm open-page-btn" data-page-id="${page.id}" data-permission="${share.permissionLevel}">
                        <i class="fas fa-external-link-alt"></i>
                        ${share.permissionLevel === 'edit' ? 'Edit Page' : 'View Page'}
                    </button>
                    <button class="btn btn-secondary btn-sm page-info-btn" data-page-id="${page.id}">
                        <i class="fas fa-info-circle"></i>
                        Page Info
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for page cards
     */
    setupPageCardListeners() {
        const listContainer = document.getElementById('shared-pages-list');
        if (!listContainer) return;

        // Open page buttons
        const openPageBtns = listContainer.querySelectorAll('.open-page-btn');
        openPageBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pageId = btn.dataset.pageId;
                const permission = btn.dataset.permission;
                this.openPage(pageId, permission);
            });
        });

        // Page info buttons
        const pageInfoBtns = listContainer.querySelectorAll('.page-info-btn');
        pageInfoBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pageId = btn.dataset.pageId;
                this.showPageInfo(pageId);
            });
        });

        // Card click handlers
        const pageCards = listContainer.querySelectorAll('.shared-page-card');
        pageCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const pageId = card.dataset.pageId;
                    const share = this.sharedPages.find(s => s.page.id === pageId);
                    if (share) {
                        this.openPage(pageId, share.permissionLevel);
                    }
                }
            });
        });
    }

    /**
     * Open a shared page
     */
    openPage(pageId, permission) {
        if (this.options.onPageClick && typeof this.options.onPageClick === 'function') {
            this.options.onPageClick(pageId, permission);
        } else {
            // Default behavior: navigate to page editor
            this.navigateToPage(pageId, permission);
        }
    }

    /**
     * Navigate to page editor/viewer
     */
    navigateToPage(pageId, permission) {
        // Switch to editor section
        const editorBtn = document.querySelector('[data-section="editor"]');
        if (editorBtn) {
            editorBtn.click();
        }

        // Load the page
        if (window.app && window.app.loadPage) {
            window.app.loadPage(pageId);
        } else {
            console.warn('SharedPagesDashboard: Unable to navigate to page - app.loadPage not available');
        }
    }

    /**
     * Show page information
     */
    showPageInfo(pageId) {
        const share = this.sharedPages.find(s => s.page.id === pageId);
        if (!share) return;

        const page = share.page;
        const sharerName = this.getSharerName(share.sharedByUserId);

        // Create a simple modal or alert with page info
        const info = `
Page Information:
• Title: ${page.title}
• ID: ${page.id}
• Template: ${page.templateId}
• Components: ${page.componentCount}
• Shared by: ${sharerName}
• Permission: ${share.permissionLevel}
• Created: ${this.formatDate(page.createdAt)}
• Updated: ${this.formatDate(page.updatedAt)}
        `;

        alert(info);
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        const loadingEl = document.getElementById('shared-pages-loading');
        if (loadingEl) {
            loadingEl.style.display = loading ? 'block' : 'none';
        }
    }

    /**
     * Set error state
     */
    setErrorState(hasError, message = '') {
        const errorEl = document.getElementById('shared-pages-error');
        const messageEl = errorEl?.querySelector('.error-message');
        
        if (errorEl) {
            errorEl.style.display = hasError ? 'block' : 'none';
        }
        
        if (messageEl && message) {
            messageEl.textContent = message;
        }
    }

    /**
     * Set empty state
     */
    setEmptyState(empty) {
        const emptyEl = document.getElementById('shared-pages-empty');
        if (emptyEl) {
            emptyEl.style.display = empty ? 'block' : 'none';
        }
    }

    /**
     * Get sharer name by user ID
     */
    getSharerName(userId) {
        // Mock user data - in a real app, this would come from a user service
        const mockUsers = {
            '550e8400-e29b-41d4-a716-446655440010': 'John Doe',
            '550e8400-e29b-41d4-a716-446655440011': 'Jane Smith',
            '550e8400-e29b-41d4-a716-446655440012': 'Bob Johnson',
            '550e8400-e29b-41d4-a716-446655440013': 'Alice Brown',
            '550e8400-e29b-41d4-a716-446655440014': 'Charlie Wilson'
        };
        
        return mockUsers[userId] || 'Unknown User';
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return 'Unknown date';
        }
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
     * Refresh the dashboard
     */
    refresh() {
        this.loadSharedPages();
    }

    /**
     * Get current shared pages
     */
    getSharedPages() {
        return this.sharedPages;
    }

    /**
     * Destroy the dashboard
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharedPagesDashboard;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.SharedPagesDashboard = SharedPagesDashboard;
}
