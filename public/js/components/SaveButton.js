/**
 * SaveButton Component - Work Order 29
 * 
 * A reusable button component that triggers the save version modal.
 * Provides a clean interface for initiating page version saves.
 */

class SaveButton {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            text: options.text || 'Save Version',
            className: options.className || 'save-version-btn',
            disabled: options.disabled || false,
            ...options
        };
        
        this.isDisabled = this.options.disabled;
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the save button
     */
    render() {
        this.container.innerHTML = `
            <button 
                type="button" 
                class="${this.options.className}"
                ${this.isDisabled ? 'disabled' : ''}
                data-action="save-version"
            >
                <span class="btn-icon">💾</span>
                <span class="btn-text">${this.options.text}</span>
            </button>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const button = this.container.querySelector('button');
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (!this.isDisabled) {
                    this.handleClick();
                }
            });
        }
    }

    /**
     * Handle button click
     */
    handleClick() {
        // Emit custom event to open save version modal
        const event = new CustomEvent('saveVersionRequested', {
            detail: {
                source: 'SaveButton',
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Enable the button
     */
    enable() {
        this.isDisabled = false;
        const button = this.container.querySelector('button');
        if (button) {
            button.disabled = false;
            button.classList.remove('disabled');
        }
    }

    /**
     * Disable the button
     */
    disable() {
        this.isDisabled = true;
        const button = this.container.querySelector('button');
        if (button) {
            button.disabled = true;
            button.classList.add('disabled');
        }
    }

    /**
     * Update button text
     */
    updateText(newText) {
        this.options.text = newText;
        const textSpan = this.container.querySelector('.btn-text');
        if (textSpan) {
            textSpan.textContent = newText;
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const button = this.container.querySelector('button');
        const textSpan = this.container.querySelector('.btn-text');
        if (button && textSpan) {
            button.classList.add('loading');
            textSpan.textContent = 'Saving...';
            this.disable();
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const button = this.container.querySelector('button');
        const textSpan = this.container.querySelector('.btn-text');
        if (button && textSpan) {
            button.classList.remove('loading');
            textSpan.textContent = this.options.text;
            this.enable();
        }
    }

    /**
     * Show success state
     */
    showSuccess() {
        const button = this.container.querySelector('button');
        const textSpan = this.container.querySelector('.btn-text');
        if (button && textSpan) {
            button.classList.add('success');
            textSpan.textContent = 'Saved!';
            
            // Reset after 2 seconds
            setTimeout(() => {
                button.classList.remove('success');
                textSpan.textContent = this.options.text;
            }, 2000);
        }
    }

    /**
     * Show error state
     */
    showError() {
        const button = this.container.querySelector('button');
        const textSpan = this.container.querySelector('.btn-text');
        if (button && textSpan) {
            button.classList.add('error');
            textSpan.textContent = 'Error';
            
            // Reset after 3 seconds
            setTimeout(() => {
                button.classList.remove('error');
                textSpan.textContent = this.options.text;
            }, 3000);
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        const button = this.container.querySelector('button');
        if (button) {
            button.removeEventListener('click', this.handleClick);
        }
        this.container.innerHTML = '';
    }
}

// Make SaveButton available globally
window.SaveButton = SaveButton;
