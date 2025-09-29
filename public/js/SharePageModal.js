/**
 * SharePageModal Component
 * Work Order #30: Implement ShareButton Component for Page Sharing Initiation
 * 
 * This modal component displays sharing options and handles its own loading/error states.
 * It provides methods to show and hide itself and manages the sharing workflow.
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
                        <p>Preparing sharing options...</p>
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
                    <div class="share-options">
                        <div class="share-option">
                            <div class="share-option-icon">
                                <i class="fas fa-link"></i>
                            </div>
                            <div class="share-option-content">
                                <h4>Share Link</h4>
                                <p>Generate a shareable link for this page</p>
                                <button class="btn btn-primary" id="generate-link-btn">
                                    <i class="fas fa-link"></i>
                                    Generate Link
                                </button>
                            </div>
                        </div>
                        
                        <div class="share-option">
                            <div class="share-option-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="share-option-content">
                                <h4>Email Share</h4>
                                <p>Send this page via email</p>
                                <button class="btn btn-secondary" id="email-share-btn">
                                    <i class="fas fa-envelope"></i>
                                    Email Share
                                </button>
                            </div>
                        </div>
                        
                        <div class="share-option">
                            <div class="share-option-icon">
                                <i class="fas fa-download"></i>
                            </div>
                            <div class="share-option-content">
                                <h4>Export Page</h4>
                                <p>Download this page as a file</p>
                                <button class="btn btn-secondary" id="export-page-btn">
                                    <i class="fas fa-download"></i>
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="share-info">
                        <p><strong>Page ID:</strong> <code>${this.pageId || 'Not available'}</code></p>
                        <p class="share-note">
                            <i class="fas fa-info-circle"></i>
                            Sharing options will be implemented in future work orders.
                        </p>
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
     * Cache DOM elements for easy access
     */
    cacheElements() {
        this.elements = {
            closeBtn: this.contentElement?.querySelector('.modal-close-btn'),
            closeModalBtn: this.contentElement?.querySelector('#close-modal-btn'),
            generateLinkBtn: this.contentElement?.querySelector('#generate-link-btn'),
            emailShareBtn: this.contentElement?.querySelector('#email-share-btn'),
            exportPageBtn: this.contentElement?.querySelector('#export-page-btn'),
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

        // Share action buttons
        if (this.elements.generateLinkBtn) {
            this.elements.generateLinkBtn.addEventListener('click', () => {
                this.handleGenerateLink();
            });
        }

        if (this.elements.emailShareBtn) {
            this.elements.emailShareBtn.addEventListener('click', () => {
                this.handleEmailShare();
            });
        }

        if (this.elements.exportPageBtn) {
            this.elements.exportPageBtn.addEventListener('click', () => {
                this.handleExportPage();
            });
        }

        // Retry button
        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', () => {
                this.hideError();
                this.show(this.pageId);
            });
        }
    }

    /**
     * Show the modal
     * @param {string} pageId - Page ID to share
     */
    async show(pageId) {
        this.pageId = pageId;
        this.isVisible = true;
        this.hideError();
        
        // Show loading state initially
        this.setLoading(true);
        
        if (this.modalElement) {
            this.modalElement.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        // Simulate loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Hide loading and show content
        this.setLoading(false);
        this.updateContent();
        this.setupEventListeners(); // Re-setup listeners after content update
    }

    /**
     * Hide the modal
     */
    hide() {
        this.isVisible = false;
        
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
     * Handle generate link action
     */
    handleGenerateLink() {
        if (this.options.onShare && typeof this.options.onShare === 'function') {
            this.options.onShare('link', this.pageId);
        }
        
        // For now, show a placeholder message
        this.showNotification('Link generation will be implemented in future work orders.', 'info');
    }

    /**
     * Handle email share action
     */
    handleEmailShare() {
        if (this.options.onShare && typeof this.options.onShare === 'function') {
            this.options.onShare('email', this.pageId);
        }
        
        // For now, show a placeholder message
        this.showNotification('Email sharing will be implemented in future work orders.', 'info');
    }

    /**
     * Handle export page action
     */
    handleExportPage() {
        if (this.options.onShare && typeof this.options.onShare === 'function') {
            this.options.onShare('export', this.pageId);
        }
        
        // For now, show a placeholder message
        this.showNotification('Page export will be implemented in future work orders.', 'info');
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
