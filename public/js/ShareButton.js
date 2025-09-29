/**
 * ShareButton Component
 * Work Order #30: Implement ShareButton Component for Page Sharing Initiation
 * 
 * This component provides a clickable button with sharing icon that triggers
 * the opening of the SharePageModal component.
 */
class ShareButton {
    constructor(options = {}) {
        this.options = {
            onClick: () => {},
            disabled: false,
            loading: false,
            ...options
        };
        
        this.element = null;
        this.isLoading = false;
        this.isDisabled = false;
        
        this.init();
    }

    /**
     * Initialize the ShareButton component
     */
    init() {
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the ShareButton HTML
     */
    render() {
        this.element = document.createElement('button');
        this.element.className = 'btn btn-secondary share-button';
        this.element.type = 'button';
        this.element.title = 'Share Page';
        this.element.disabled = this.isDisabled || this.isLoading;
        
        this.updateContent();
    }

    /**
     * Update button content based on state
     */
    updateContent() {
        if (!this.element) return;

        if (this.isLoading) {
            this.element.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <span>Sharing...</span>
            `;
            this.element.disabled = true;
        } else {
            this.element.innerHTML = `
                <i class="fas fa-share-alt"></i>
                <span>Share</span>
            `;
            this.element.disabled = this.isDisabled;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.element) {
            this.element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.isDisabled && !this.isLoading) {
                    this.handleClick();
                }
            });
        }
    }

    /**
     * Handle button click
     */
    handleClick() {
        if (this.options.onClick && typeof this.options.onClick === 'function') {
            this.options.onClick();
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
     * Set disabled state
     * @param {boolean} disabled - Disabled state
     */
    setDisabled(disabled) {
        this.isDisabled = disabled;
        this.updateContent();
    }

    /**
     * Get the button element
     * @returns {HTMLElement} Button element
     */
    getElement() {
        return this.element;
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}

// Export for use in other modules
window.ShareButton = ShareButton;
