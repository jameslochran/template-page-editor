/**
 * AccordionComponent Model
 * Work Order #13: Implement Accordion Component Data Model Structure
 * 
 * This model provides structured data management for accordion components
 * with collapsible items containing headers and rich text content.
 */

const { v4: uuidv4 } = require('uuid');
const TextComponent = require('./TextComponent');

class AccordionComponent {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.type = 'AccordionComponent';
        this.data = this.initializeData(data.data);
        this.order = data.order || 1;
        this.createdAt = data.createdAt || data.created_at || new Date();
        this.updatedAt = data.updatedAt || data.updated_at || new Date();
    }

    /**
     * Initialize accordion data with proper structure
     * @param {Object} data - Data object or undefined
     * @returns {Object} Structured accordion data
     */
    initializeData(data) {
        if (!data) {
            return {
                items: [this.createDefaultItem()],
                allowMultipleOpen: true,
                style: 'default'
            };
        }

        return {
            items: Array.isArray(data.items) ? data.items.map(item => this.initializeItem(item)) : [this.createDefaultItem()],
            allowMultipleOpen: data.allowMultipleOpen !== undefined ? data.allowMultipleOpen : true,
            style: data.style || 'default'
        };
    }

    /**
     * Initialize an accordion item with proper structure
     * @param {Object} item - Item data or undefined
     * @returns {Object} Structured accordion item
     */
    initializeItem(item) {
        if (!item) {
            return this.createDefaultItem();
        }

        return {
            id: item.id || uuidv4(),
            header: this.validateHeader(item.header) || 'New Accordion Item',
            content: this.initializeItemContent(item.content),
            isOpen: item.isOpen !== undefined ? item.isOpen : false,
            order: typeof item.order === 'number' ? item.order : 1
        };
    }

    /**
     * Initialize item content using TextComponent structure
     * @param {Object|string} content - Content data or undefined
     * @returns {Object} Structured content object
     */
    initializeItemContent(content) {
        if (!content) {
            return {
                format: 'html',
                data: '<p>Click to edit content</p>',
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            };
        }

        // Handle string content
        if (typeof content === 'string') {
            return {
                format: 'html',
                data: content,
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
                data: content.data || '<p>Click to edit content</p>',
                metadata: {
                    version: content.metadata?.version || '1.0',
                    created: content.metadata?.created || new Date().toISOString(),
                    lastModified: content.metadata?.lastModified || new Date().toISOString()
                }
            };
        }

        return {
            format: 'html',
            data: '<p>Click to edit content</p>',
            metadata: {
                version: '1.0',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            }
        };
    }

    /**
     * Create a default accordion item
     * @returns {Object} Default accordion item
     */
    createDefaultItem() {
        return {
            id: uuidv4(),
            header: 'New Accordion Item',
            content: {
                format: 'html',
                data: '<p>Click to edit content</p>',
                metadata: {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            },
            isOpen: false,
            order: 1
        };
    }

    /**
     * Validate header field (max 255 characters)
     * @param {string} header - Header text
     * @returns {string|null} Validated header or null if invalid
     */
    validateHeader(header) {
        if (!header || typeof header !== 'string') {
            return null;
        }

        // Trim whitespace and enforce 255 character limit
        const trimmedHeader = header.trim();
        return trimmedHeader.length <= 255 ? trimmedHeader : null;
    }

    /**
     * Validate the AccordionComponent structure
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        // Validate ID
        if (!this.id || typeof this.id !== 'string') {
            errors.push('ID must be a non-empty string');
        }

        // Validate type
        if (this.type !== 'AccordionComponent') {
            errors.push('Type must be AccordionComponent');
        }

        // Validate order
        if (typeof this.order !== 'number' || this.order < 0) {
            errors.push('Order must be a non-negative number');
        }

        // Validate data structure
        const dataValidation = this.validateData(this.data);
        if (!dataValidation.isValid) {
            errors.push(...dataValidation.errors);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate accordion data structure
     * @param {Object} data - Data object to validate
     * @returns {Object} Validation result
     */
    validateData(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            return { isValid: false, errors: ['Data must be an object'] };
        }

        // Validate items array
        if (!Array.isArray(data.items)) {
            errors.push('Items must be an array');
        } else {
            const itemValidation = this.validateItems(data.items);
            if (!itemValidation.isValid) {
                errors.push(...itemValidation.errors);
            }
        }

        // Validate allowMultipleOpen
        if (typeof data.allowMultipleOpen !== 'boolean') {
            errors.push('allowMultipleOpen must be a boolean');
        }

        // Validate style
        if (data.style && typeof data.style !== 'string') {
            errors.push('Style must be a string');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate items array
     * @param {Array} items - Items array to validate
     * @returns {Object} Validation result
     */
    validateItems(items) {
        const errors = [];

        if (!Array.isArray(items)) {
            return { isValid: false, errors: ['Items must be an array'] };
        }

        if (items.length === 0) {
            errors.push('Items array cannot be empty');
        }

        const itemIds = new Set();
        const itemOrders = new Set();

        items.forEach((item, index) => {
            // Validate item structure
            if (!item || typeof item !== 'object') {
                errors.push(`Item at index ${index} must be an object`);
                return;
            }

            // Validate required fields
            const requiredFields = ['id', 'header', 'content', 'order'];
            requiredFields.forEach(field => {
                if (!(field in item)) {
                    errors.push(`Item at index ${index} missing required field: ${field}`);
                }
            });

            // Validate field types
            if (item.id !== undefined && typeof item.id !== 'string') {
                errors.push(`Item at index ${index}: id must be a string`);
            }
            
            if (item.header !== undefined && typeof item.header !== 'string') {
                errors.push(`Item at index ${index}: header must be a string`);
            }
            
            if (item.content !== undefined && typeof item.content !== 'object') {
                errors.push(`Item at index ${index}: content must be an object`);
            }
            
            if (item.order !== undefined && typeof item.order !== 'number') {
                errors.push(`Item at index ${index}: order must be a number`);
            }

            if (item.isOpen !== undefined && typeof item.isOpen !== 'boolean') {
                errors.push(`Item at index ${index}: isOpen must be a boolean`);
            }

            // Validate header length
            if (item.header && item.header.length > 255) {
                errors.push(`Item at index ${index}: header exceeds 255 character limit`);
            }

            // Check for duplicate IDs
            if (item.id) {
                if (itemIds.has(item.id)) {
                    errors.push(`Duplicate item ID found: '${item.id}'`);
                } else {
                    itemIds.add(item.id);
                }
            }

            // Check for duplicate orders
            if (typeof item.order === 'number') {
                if (itemOrders.has(item.order)) {
                    errors.push(`Duplicate item order found: ${item.order}`);
                } else {
                    itemOrders.add(item.order);
                }
            }

            // Validate content structure using TextComponent validation
            if (item.content) {
                const textComponent = new TextComponent({ content: item.content });
                const contentValidation = textComponent.validateContent(item.content);
                if (!contentValidation.isValid) {
                    errors.push(...contentValidation.errors.map(err => `Item at index ${index}: ${err}`));
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Add a new accordion item
     * @param {Object} itemData - Item data (optional)
     * @returns {string} New item ID
     */
    addItem(itemData = {}) {
        const newItem = this.createDefaultItem();
        
        if (itemData.header) {
            const validatedHeader = this.validateHeader(itemData.header);
            if (validatedHeader) {
                newItem.header = validatedHeader;
            }
        }

        if (itemData.content) {
            newItem.content = this.initializeItemContent(itemData.content);
        }

        // Set order to be after the last item
        newItem.order = this.data.items.length + 1;

        this.data.items.push(newItem);
        this.updatedAt = new Date();
        return newItem.id;
    }

    /**
     * Remove an accordion item by ID
     * @param {string} itemId - Item ID to remove
     * @returns {boolean} Success status
     */
    removeItem(itemId) {
        const index = this.data.items.findIndex(item => item.id === itemId);
        if (index === -1) {
            throw new Error(`Item with ID '${itemId}' not found`);
        }

        // Don't allow removing the last item
        if (this.data.items.length <= 1) {
            throw new Error('Cannot remove the last accordion item');
        }

        this.data.items.splice(index, 1);
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Update an accordion item
     * @param {string} itemId - Item ID to update
     * @param {Object} updates - Fields to update
     * @returns {boolean} Success status
     */
    updateItem(itemId, updates) {
        const item = this.getItemById(itemId);
        if (!item) {
            throw new Error(`Item with ID '${itemId}' not found`);
        }

        // Create updated item
        const updatedItem = { ...item, ...updates };

        // Validate header if being updated
        if (updates.header !== undefined) {
            const validatedHeader = this.validateHeader(updates.header);
            if (!validatedHeader) {
                throw new Error('Invalid header: must be a string with maximum 255 characters');
            }
            updatedItem.header = validatedHeader;
        }

        // Validate content if being updated
        if (updates.content !== undefined) {
            updatedItem.content = this.initializeItemContent(updates.content);
        }

        // Check for duplicate order if order is being updated
        if (updates.order !== undefined && updates.order !== item.order) {
            const existingOrder = this.getItemByOrder(updates.order);
            if (existingOrder && existingOrder.id !== itemId) {
                throw new Error(`Item with order ${updates.order} already exists`);
            }
        }

        // Update the item
        const index = this.data.items.findIndex(i => i.id === itemId);
        this.data.items[index] = updatedItem;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Get accordion item by ID
     * @param {string} itemId - Item ID
     * @returns {Object|null} Item object or null if not found
     */
    getItemById(itemId) {
        return this.data.items.find(item => item.id === itemId) || null;
    }

    /**
     * Get accordion item by order
     * @param {number} order - Item order
     * @returns {Object|null} Item object or null if not found
     */
    getItemByOrder(order) {
        return this.data.items.find(item => item.order === order) || null;
    }

    /**
     * Get items ordered by their order field
     * @returns {Array} Sorted items array
     */
    getOrderedItems() {
        return [...this.data.items].sort((a, b) => a.order - b.order);
    }

    /**
     * Reorder accordion items
     * @param {Array} itemIds - Array of item IDs in new order
     * @returns {boolean} Success status
     */
    reorderItems(itemIds) {
        const reorderedItems = [];
        
        itemIds.forEach((id, index) => {
            const item = this.getItemById(id);
            if (!item) {
                throw new Error(`Item with ID '${id}' not found`);
            }
            reorderedItems.push({
                ...item,
                order: index + 1
            });
        });

        // Add any remaining items that weren't in the reorder list
        this.data.items.forEach(item => {
            if (!itemIds.includes(item.id)) {
                reorderedItems.push({
                    ...item,
                    order: reorderedItems.length + 1
                });
            }
        });

        this.data.items = reorderedItems;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Toggle item open/closed state
     * @param {string} itemId - Item ID to toggle
     * @returns {boolean} New open state
     */
    toggleItem(itemId) {
        const item = this.getItemById(itemId);
        if (!item) {
            throw new Error(`Item with ID '${itemId}' not found`);
        }

        const newState = !item.isOpen;
        
        // If allowing only one open at a time, close others
        if (!this.data.allowMultipleOpen && newState) {
            this.data.items.forEach(i => {
                if (i.id !== itemId) {
                    i.isOpen = false;
                }
            });
        }

        item.isOpen = newState;
        this.updatedAt = new Date();
        return newState;
    }

    /**
     * Get all open items
     * @returns {Array} Array of open items
     */
    getOpenItems() {
        return this.data.items.filter(item => item.isOpen);
    }

    /**
     * Get all closed items
     * @returns {Array} Array of closed items
     */
    getClosedItems() {
        return this.data.items.filter(item => !item.isOpen);
    }

    /**
     * Get item count
     * @returns {number} Number of items
     */
    getItemCount() {
        return this.data.items.length;
    }

    /**
     * Get content statistics
     * @returns {Object} Content statistics
     */
    getContentStats() {
        const stats = {
            totalItems: this.data.items.length,
            openItems: this.getOpenItems().length,
            closedItems: this.getClosedItems().length,
            totalCharacters: 0,
            totalWords: 0
        };

        this.data.items.forEach(item => {
            const textComponent = new TextComponent({ content: item.content });
            const plainText = textComponent.getAsPlainText();
            stats.totalCharacters += plainText.length;
            stats.totalWords += plainText.split(/\s+/).filter(word => word.length > 0).length;
        });

        return stats;
    }

    /**
     * Clone the AccordionComponent
     * @returns {AccordionComponent} Cloned instance
     */
    clone() {
        return new AccordionComponent({
            data: JSON.parse(JSON.stringify(this.data)),
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
            data: this.data,
            order: this.order,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Create AccordionComponent instance from JSON
     * @param {Object} json - JSON object
     * @returns {AccordionComponent} AccordionComponent instance
     */
    static fromJSON(json) {
        return new AccordionComponent(json);
    }

    /**
     * Create a new AccordionComponent with default items
     * @param {number} itemCount - Number of default items to create
     * @returns {AccordionComponent} New AccordionComponent instance
     */
    static createDefault(itemCount = 2) {
        const items = [];
        for (let i = 0; i < itemCount; i++) {
            items.push({
                id: uuidv4(),
                header: `Accordion Item ${i + 1}`,
                content: {
                    format: 'html',
                    data: `<p>Content for item ${i + 1}</p>`,
                    metadata: {
                        version: '1.0',
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString()
                    }
                },
                isOpen: i === 0, // First item open by default
                order: i + 1
            });
        }

        return new AccordionComponent({
            data: {
                items: items,
                allowMultipleOpen: true,
                style: 'default'
            }
        });
    }
}

module.exports = AccordionComponent;
