/**
 * TextComponent Model
 * Work Order #8: Implement TextComponent Data Model Structure
 * 
 * This model provides structured data management for rich text content within pages,
 * supporting various rich text formats and ensuring content integrity.
 */

const { v4: uuidv4 } = require('uuid');

class TextComponent {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.type = 'TextComponent';
        this.content = this.initializeContent(data.content);
        this.order = data.order || 1;
        this.createdAt = data.createdAt || data.created_at || new Date();
        this.updatedAt = data.updatedAt || data.updated_at || new Date();
    }

    /**
     * Initialize content with proper structure
     * @param {Object|string} content - Content data or string
     * @returns {Object} Structured content object
     */
    initializeContent(content) {
        if (!content) {
            return {
                format: 'html',
                data: '<p>Click to edit text</p>',
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            };
        }

        // Handle string content (legacy or simple text)
        if (typeof content === 'string') {
            return {
                format: 'html',
                data: this.escapeHtml(content),
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            };
        }

        // Handle object content
        if (typeof content === 'object') {
            return {
                format: content.format || 'html',
                data: content.data || '<p>Click to edit text</p>',
                metadata: {
                    version: content.metadata?.version || '1.0',
                    created: content.metadata?.created || new Date().toISOString(),
                    lastModified: content.metadata?.lastModified || new Date().toISOString()
                }
            };
        }

        // Fallback for unexpected types
        return {
            format: 'html',
            data: '<p>Click to edit text</p>',
            metadata: {
                version: '1.0',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        };
    }

    /**
     * Validate the TextComponent structure
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Validate ID
        if (!this.id || typeof this.id !== 'string') {
            errors.push('ID must be a non-empty string');
        }

        // Validate type
        if (this.type !== 'TextComponent') {
            errors.push('Type must be TextComponent');
        }

        // Validate order
        if (typeof this.order !== 'number' || this.order < 0) {
            errors.push('Order must be a non-negative number');
        }

        // Validate content
        const contentValidation = this.validateContent(this.content);
        if (!contentValidation.isValid) {
            errors.push(...contentValidation.errors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate content structure
     * @param {Object} content - Content object to validate
     * @returns {Object} Validation result
     */
    validateContent(content) {
        const errors = [];

        if (!content || typeof content !== 'object') {
            return { isValid: false, errors: ['Content must be an object'] };
        }

        // Validate format
        const validFormats = ['html', 'json', 'markdown', 'plain'];
        if (!content.format || !validFormats.includes(content.format)) {
            errors.push(`Content format must be one of: ${validFormats.join(', ')}`);
        }

        // Validate data
        if (!content.data || typeof content.data !== 'string') {
            errors.push('Content data must be a non-empty string');
        }

        // Validate metadata
        if (!content.metadata || typeof content.metadata !== 'object') {
            errors.push('Content metadata must be an object');
        } else {
            const metadata = content.metadata;
            if (!metadata.version || typeof metadata.version !== 'string') {
                errors.push('Metadata version must be a string');
            }
            if (!metadata.created || !this.isValidISOString(metadata.created)) {
                errors.push('Metadata created must be a valid ISO string');
            }
            if (!metadata.lastModified || !this.isValidISOString(metadata.lastModified)) {
                errors.push('Metadata lastModified must be a valid ISO string');
            }
        }

        // Format-specific validation
        if (content.format === 'html') {
            const htmlValidation = this.validateHtml(content.data);
            if (!htmlValidation.isValid) {
                errors.push(...htmlValidation.errors);
            }
        } else if (content.format === 'json') {
            const jsonValidation = this.validateStructuredJson(content.data);
            if (!jsonValidation.isValid) {
                errors.push(...jsonValidation.errors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate HTML content
     * @param {string} html - HTML content to validate
     * @returns {Object} Validation result
     */
    validateHtml(html) {
        const errors = [];

        // Basic HTML structure validation
        if (typeof html !== 'string') {
            return { isValid: false, errors: ['HTML content must be a string'] };
        }

        // Check for basic HTML tags
        const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'];
        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/g;
        const foundTags = [];
        let match;

        while ((match = tagRegex.exec(html)) !== null) {
            foundTags.push(match[1].toLowerCase());
        }

        const invalidTags = foundTags.filter(tag => !allowedTags.includes(tag));
        if (invalidTags.length > 0) {
            errors.push(`Invalid HTML tags found: ${invalidTags.join(', ')}`);
        }

        // Check for script tags (security)
        if (/<script/i.test(html)) {
            errors.push('Script tags are not allowed for security reasons');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate structured JSON content
     * @param {string} jsonString - JSON string to validate
     * @returns {Object} Validation result
     */
    validateStructuredJson(jsonString) {
        const errors = [];

        try {
            const parsed = JSON.parse(jsonString);
            
            if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                errors.push('Structured JSON content must be an object');
            } else {
                // Basic structure validation for rich text editor formats
                if (!parsed.type) {
                    errors.push('Structured JSON must have a type field');
                }
                
                if (!parsed.content && !parsed.children) {
                    errors.push('Structured JSON must have content or children field');
                }
            }
        } catch (e) {
            errors.push('Invalid JSON format');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Update content with new data
     * @param {string|Object} newContent - New content data
     * @param {string} format - Content format (optional, defaults to current format)
     */
    updateContent(newContent, format = null) {
        const contentValidation = this.validateContent({
            format: format || this.content.format,
            data: typeof newContent === 'string' ? newContent : JSON.stringify(newContent),
            metadata: this.content.metadata
        });

        if (!contentValidation.isValid) {
            throw new Error(`Invalid content: ${contentValidation.errors.join(', ')}`);
        }

        this.content = {
            format: format || this.content.format,
            data: typeof newContent === 'string' ? newContent : JSON.stringify(newContent),
            metadata: {
                ...this.content.metadata,
                lastModified: new Date().toISOString()
            }
        };

        this.updatedAt = new Date();
    }

    /**
     * Get content as HTML
     * @returns {string} HTML representation
     */
    getAsHtml() {
        switch (this.content.format) {
            case 'html':
                return this.content.data;
            case 'markdown':
                return this.markdownToHtml(this.content.data);
            case 'json':
                return this.structuredJsonToHtml(this.content.data);
            case 'plain':
                return this.escapeHtml(this.content.data);
            default:
                return this.escapeHtml(this.content.data);
        }
    }

    /**
     * Get content as plain text
     * @returns {string} Plain text representation
     */
    getAsPlainText() {
        switch (this.content.format) {
            case 'html':
                return this.htmlToPlainText(this.content.data);
            case 'json':
                return this.structuredJsonToPlainText(this.content.data);
            case 'plain':
                return this.content.data;
            default:
                return this.content.data;
        }
    }

    /**
     * Convert markdown to HTML (basic implementation)
     * @param {string} markdown - Markdown content
     * @returns {string} HTML content
     */
    markdownToHtml(markdown) {
        // Basic markdown to HTML conversion
        let html = markdown
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/\n/g, '<br>');

        // Wrap in paragraph if no block elements
        if (!/<[h1-6]|<ul|<ol|<div/i.test(html)) {
            html = `<p>${html}</p>`;
        }

        return html;
    }

    /**
     * Convert structured JSON to HTML (basic implementation)
     * @param {string} jsonString - JSON string
     * @returns {string} HTML content
     */
    structuredJsonToHtml(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            
            if (parsed.type === 'doc' && parsed.content) {
                return this.convertNodesToHtml(parsed.content);
            } else if (parsed.children) {
                return this.convertNodesToHtml(parsed.children);
            } else {
                return this.escapeHtml(jsonString);
            }
        } catch (e) {
            return this.escapeHtml(jsonString);
        }
    }

    /**
     * Convert nodes array to HTML
     * @param {Array} nodes - Array of node objects
     * @returns {string} HTML content
     */
    convertNodesToHtml(nodes) {
        if (!Array.isArray(nodes)) return '';

        return nodes.map(node => {
            switch (node.type) {
                case 'paragraph':
                    return `<p>${node.content ? this.convertNodesToHtml(node.content) : ''}</p>`;
                case 'heading':
                    const level = node.attrs?.level || 1;
                    return `<h${level}>${node.content ? this.convertNodesToHtml(node.content) : ''}</h${level}>`;
                case 'text':
                    let text = node.text || '';
                    if (node.marks) {
                        node.marks.forEach(mark => {
                            switch (mark.type) {
                                case 'bold':
                                    text = `<strong>${text}</strong>`;
                                    break;
                                case 'italic':
                                    text = `<em>${text}</em>`;
                                    break;
                                case 'underline':
                                    text = `<u>${text}</u>`;
                                    break;
                                case 'link':
                                    text = `<a href="${mark.attrs?.href || '#'}">${text}</a>`;
                                    break;
                            }
                        });
                    }
                    return text;
                case 'bulletList':
                    return `<ul>${node.content ? this.convertNodesToHtml(node.content) : ''}</ul>`;
                case 'orderedList':
                    return `<ol>${node.content ? this.convertNodesToHtml(node.content) : ''}</ol>`;
                case 'listItem':
                    return `<li>${node.content ? this.convertNodesToHtml(node.content) : ''}</li>`;
                default:
                    return node.text || '';
            }
        }).join('');
    }

    /**
     * Convert HTML to plain text
     * @param {string} html - HTML content
     * @returns {string} Plain text
     */
    htmlToPlainText(html) {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }

    /**
     * Convert structured JSON to plain text
     * @param {string} jsonString - JSON string
     * @returns {string} Plain text
     */
    structuredJsonToPlainText(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            const html = this.structuredJsonToHtml(jsonString);
            return this.htmlToPlainText(html);
        } catch (e) {
            return jsonString;
        }
    }

    /**
     * Escape HTML characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(text) {
        const div = document ? document.createElement('div') : null;
        if (div) {
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Fallback for server-side
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Validate ISO string format
     * @param {string} dateString - Date string to validate
     * @returns {boolean} Valid ISO string
     */
    isValidISOString(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && date.toISOString() === dateString;
    }

    /**
     * Get content preview (first 100 characters)
     * @returns {string} Content preview
     */
    getPreview() {
        const plainText = this.getAsPlainText();
        return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
    }

    /**
     * Check if content is empty
     * @returns {boolean} Empty content
     */
    isEmpty() {
        const plainText = this.getAsPlainText();
        return !plainText || plainText.trim().length === 0;
    }

    /**
     * Clone the TextComponent
     * @returns {TextComponent} Cloned instance
     */
    clone() {
        return new TextComponent({
            id: uuidv4(),
            content: JSON.parse(JSON.stringify(this.content)),
            order: this.order + 1
        });
    }

    /**
     * Convert to JSON object
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            content: this.content,
            order: this.order,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create TextComponent instance from JSON
     * @param {Object} json - JSON object
     * @returns {TextComponent} TextComponent instance
     */
    static fromJSON(json) {
        return new TextComponent(json);
    }

    /**
     * Create a new TextComponent with default content
     * @param {string} defaultText - Default text content
     * @returns {TextComponent} New TextComponent instance
     */
    static createDefault(defaultText = 'Click to edit text') {
        return new TextComponent({
            content: {
                format: 'html',
                data: `<p>${defaultText}</p>`,
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            }
        });
    }
}

module.exports = TextComponent;
