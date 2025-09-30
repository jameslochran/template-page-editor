/**
 * Validation Utilities for Component Data
 * Work Order 16: Implement Component-Specific Editors for Content Types
 * 
 * This file provides centralized validation functions for component data
 * to ensure data integrity and provide user-friendly error messages.
 */

/**
 * Validation result object
 */
class ValidationResult {
    constructor(isValid, errors = []) {
        this.isValid = isValid;
        this.errors = errors;
    }

    addError(field, message) {
        this.errors.push({ field, message });
        this.isValid = false;
    }

    getFirstError() {
        return this.errors.length > 0 ? this.errors[0] : null;
    }

    getAllErrors() {
        return this.errors;
    }
}

/**
 * Text content validation
 * @param {Object} content - Content object with format and data
 * @returns {ValidationResult} Validation result
 */
function validateTextContent(content) {
    const result = new ValidationResult(true);

    if (!content) {
        result.addError('content', 'Content is required');
        return result;
    }

    if (typeof content !== 'object') {
        result.addError('content', 'Content must be an object');
        return result;
    }

    // Validate format
    if (!content.format) {
        result.addError('format', 'Content format is required');
    } else if (!['html', 'markdown', 'plain'].includes(content.format)) {
        result.addError('format', 'Content format must be html, markdown, or plain');
    }

    // Validate data
    if (!content.data) {
        result.addError('data', 'Content data is required');
    } else if (typeof content.data !== 'string') {
        result.addError('data', 'Content data must be a string');
    } else if (content.data.trim().length === 0) {
        result.addError('data', 'Content data cannot be empty');
    } else if (content.data.length > 10000) {
        result.addError('data', 'Content data cannot exceed 10,000 characters');
    }

    // Validate HTML content if format is html
    if (content.format === 'html' && content.data) {
        const htmlValidation = validateHTML(content.data);
        if (!htmlValidation.isValid) {
            result.errors.push(...htmlValidation.errors);
            result.isValid = false;
        }
    }

    return result;
}

/**
 * HTML content validation
 * @param {string} html - HTML string to validate
 * @returns {ValidationResult} Validation result
 */
function validateHTML(html) {
    const result = new ValidationResult(true);

    if (typeof html !== 'string') {
        result.addError('html', 'HTML must be a string');
        return result;
    }

    // Check for potentially dangerous tags
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input'];
    const htmlLower = html.toLowerCase();
    
    for (const tag of dangerousTags) {
        if (htmlLower.includes(`<${tag}`)) {
            result.addError('html', `HTML cannot contain <${tag}> tags for security reasons`);
        }
    }

    // Check for balanced tags (basic check)
    const openTags = html.match(/<[^/][^>]*>/g) || [];
    const closeTags = html.match(/<\/[^>]*>/g) || [];
    
    if (openTags.length !== closeTags.length) {
        result.addError('html', 'HTML tags must be properly balanced');
    }

    return result;
}

/**
 * Image URL validation
 * @param {string} url - Image URL to validate
 * @returns {ValidationResult} Validation result
 */
function validateImageUrl(url) {
    const result = new ValidationResult(true);

    if (!url) {
        result.addError('url', 'Image URL is required');
        return result;
    }

    if (typeof url !== 'string') {
        result.addError('url', 'Image URL must be a string');
        return result;
    }

    if (url.trim().length === 0) {
        result.addError('url', 'Image URL cannot be empty');
        return result;
    }

    // Basic URL format validation
    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            result.addError('url', 'Image URL must use HTTP or HTTPS protocol');
        }
    } catch (e) {
        result.addError('url', 'Image URL must be a valid URL');
    }

    // Check for common image file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
        url.toLowerCase().includes(ext)
    );

    if (!hasImageExtension) {
        result.addError('url', 'Image URL should include a common image file extension');
    }

    return result;
}

/**
 * Accordion item validation
 * @param {Object} item - Accordion item to validate
 * @returns {ValidationResult} Validation result
 */
function validateAccordionItem(item) {
    const result = new ValidationResult(true);

    if (!item) {
        result.addError('item', 'Accordion item is required');
        return result;
    }

    if (typeof item !== 'object') {
        result.addError('item', 'Accordion item must be an object');
        return result;
    }

    // Validate title
    if (!item.title) {
        result.addError('title', 'Item title is required');
    } else if (typeof item.title !== 'string') {
        result.addError('title', 'Item title must be a string');
    } else if (item.title.trim().length === 0) {
        result.addError('title', 'Item title cannot be empty');
    } else if (item.title.length > 200) {
        result.addError('title', 'Item title cannot exceed 200 characters');
    }

    // Validate content
    if (!item.content) {
        result.addError('content', 'Item content is required');
    } else if (typeof item.content !== 'object') {
        result.addError('content', 'Item content must be an object');
    } else {
        const contentValidation = validateTextContent(item.content);
        if (!contentValidation.isValid) {
            result.errors.push(...contentValidation.errors.map(error => ({
                field: `content.${error.field}`,
                message: error.message
            })));
            result.isValid = false;
        }
    }

    // Validate order if present
    if (item.order !== undefined) {
        if (typeof item.order !== 'number' || !Number.isInteger(item.order) || item.order < 0) {
            result.addError('order', 'Item order must be a non-negative integer');
        }
    }

    return result;
}

/**
 * Accordion data validation
 * @param {Object} data - Accordion data to validate
 * @returns {ValidationResult} Validation result
 */
function validateAccordionData(data) {
    const result = new ValidationResult(true);

    if (!data) {
        result.addError('data', 'Accordion data is required');
        return result;
    }

    if (typeof data !== 'object') {
        result.addError('data', 'Accordion data must be an object');
        return result;
    }

    // Validate title
    if (data.title !== undefined) {
        if (typeof data.title !== 'string') {
            result.addError('title', 'Accordion title must be a string');
        } else if (data.title.length > 200) {
            result.addError('title', 'Accordion title cannot exceed 200 characters');
        }
    }

    // Validate items
    if (!data.items) {
        result.addError('items', 'Accordion items are required');
    } else if (!Array.isArray(data.items)) {
        result.addError('items', 'Accordion items must be an array');
    } else if (data.items.length === 0) {
        result.addError('items', 'Accordion must have at least one item');
    } else if (data.items.length > 20) {
        result.addError('items', 'Accordion cannot have more than 20 items');
    } else {
        // Validate each item
        data.items.forEach((item, index) => {
            const itemValidation = validateAccordionItem(item);
            if (!itemValidation.isValid) {
                itemValidation.errors.forEach(error => {
                    result.addError(`items[${index}].${error.field}`, error.message);
                });
            }
        });
    }

    return result;
}

/**
 * Card data validation
 * @param {Object} data - Card data to validate
 * @returns {ValidationResult} Validation result
 */
function validateCardData(data) {
    const result = new ValidationResult(true);

    if (!data) {
        result.addError('data', 'Card data is required');
        return result;
    }

    if (typeof data !== 'object') {
        result.addError('data', 'Card data must be an object');
        return result;
    }

    // Validate title
    if (data.title !== undefined) {
        if (typeof data.title !== 'string') {
            result.addError('title', 'Card title must be a string');
        } else if (data.title.length > 200) {
            result.addError('title', 'Card title cannot exceed 200 characters');
        }
    }

    // Validate description
    if (data.description !== undefined) {
        const descriptionValidation = validateTextContent(data.description);
        if (!descriptionValidation.isValid) {
            descriptionValidation.errors.forEach(error => {
                result.addError(`description.${error.field}`, error.message);
            });
            result.isValid = false;
        }
    }

    // Validate image URL
    if (data.imageUrl !== undefined && data.imageUrl !== '') {
        const imageValidation = validateImageUrl(data.imageUrl);
        if (!imageValidation.isValid) {
            result.errors.push(...imageValidation.errors.map(error => ({
                field: `imageUrl.${error.field}`,
                message: error.message
            })));
            result.isValid = false;
        }
    }

    // Validate alt text
    if (data.altText !== undefined) {
        if (typeof data.altText !== 'string') {
            result.addError('altText', 'Alt text must be a string');
        } else if (data.altText.length > 200) {
            result.addError('altText', 'Alt text cannot exceed 200 characters');
        }
    }

    // Validate link URL
    if (data.linkUrl !== undefined && data.linkUrl !== '') {
        try {
            new URL(data.linkUrl);
        } catch (e) {
            result.addError('linkUrl', 'Link URL must be a valid URL');
        }
    }

    // Validate link text
    if (data.linkText !== undefined) {
        if (typeof data.linkText !== 'string') {
            result.addError('linkText', 'Link text must be a string');
        } else if (data.linkText.length > 100) {
            result.addError('linkText', 'Link text cannot exceed 100 characters');
        }
    }

    // Validate link target
    if (data.linkTarget !== undefined) {
        if (!['_self', '_blank', '_parent', '_top'].includes(data.linkTarget)) {
            result.addError('linkTarget', 'Link target must be _self, _blank, _parent, or _top');
        }
    }

    return result;
}

/**
 * Get user-friendly error message
 * @param {ValidationResult} validationResult - Validation result
 * @returns {string} User-friendly error message
 */
function getErrorMessage(validationResult) {
    if (validationResult.isValid) {
        return '';
    }

    const firstError = validationResult.getFirstError();
    return firstError ? firstError.message : 'Validation failed';
}

/**
 * Template name validation
 * @param {string} name - Template name to validate
 * @returns {ValidationResult} Validation result
 */
function validateTemplateName(name) {
    const result = new ValidationResult(true);

    if (!name) {
        result.addError('name', 'Template name is required');
        return result;
    }

    if (typeof name !== 'string') {
        result.addError('name', 'Template name must be a string');
        return result;
    }

    if (name.trim().length === 0) {
        result.addError('name', 'Template name cannot be empty');
    } else if (name.length > 255) {
        result.addError('name', 'Template name cannot exceed 255 characters');
    }

    return result;
}

/**
 * Template description validation
 * @param {string} description - Template description to validate
 * @returns {ValidationResult} Validation result
 */
function validateTemplateDescription(description) {
    const result = new ValidationResult(true);

    if (!description) {
        result.addError('description', 'Template description is required');
        return result;
    }

    if (typeof description !== 'string') {
        result.addError('description', 'Template description must be a string');
        return result;
    }

    if (description.trim().length === 0) {
        result.addError('description', 'Template description cannot be empty');
    } else if (description.length > 1000) {
        result.addError('description', 'Template description cannot exceed 1000 characters');
    }

    return result;
}

/**
 * Category name validation
 * @param {string} name - Category name to validate
 * @returns {ValidationResult} Validation result
 */
function validateCategoryName(name) {
    const result = new ValidationResult(true);

    if (!name) {
        result.addError('name', 'Category name is required');
        return result;
    }

    if (typeof name !== 'string') {
        result.addError('name', 'Category name must be a string');
        return result;
    }

    if (name.trim().length === 0) {
        result.addError('name', 'Category name cannot be empty');
    } else if (name.length > 100) {
        result.addError('name', 'Category name cannot exceed 100 characters');
    }

    return result;
}

/**
 * Category description validation
 * @param {string} description - Category description to validate
 * @returns {ValidationResult} Validation result
 */
function validateCategoryDescription(description) {
    const result = new ValidationResult(true);

    if (!description) {
        result.addError('description', 'Category description is required');
        return result;
    }

    if (typeof description !== 'string') {
        result.addError('description', 'Category description must be a string');
        return result;
    }

    if (description.trim().length === 0) {
        result.addError('description', 'Category description cannot be empty');
    } else if (description.length > 500) {
        result.addError('description', 'Category description cannot exceed 500 characters');
    }

    return result;
}

/**
 * Template metadata validation
 * @param {Object} metadata - Template metadata to validate
 * @returns {ValidationResult} Validation result
 */
function validateTemplateMetadata(metadata) {
    const result = new ValidationResult(true);

    if (!metadata) {
        result.addError('metadata', 'Template metadata is required');
        return result;
    }

    if (typeof metadata !== 'object') {
        result.addError('metadata', 'Template metadata must be an object');
        return result;
    }

    // Validate template name
    const nameValidation = validateTemplateName(metadata.name);
    if (!nameValidation.isValid) {
        result.errors.push(...nameValidation.errors);
        result.isValid = false;
    }

    // Validate template description
    const descriptionValidation = validateTemplateDescription(metadata.description);
    if (!descriptionValidation.isValid) {
        result.errors.push(...descriptionValidation.errors);
        result.isValid = false;
    }

    // Validate category selection
    if (!metadata.categoryId && !metadata.newCategory) {
        result.addError('category', 'Either select an existing category or create a new one');
    }

    // If creating new category, validate new category data
    if (metadata.newCategory) {
        if (typeof metadata.newCategory !== 'object') {
            result.addError('newCategory', 'New category data must be an object');
        } else {
            const newCategoryNameValidation = validateCategoryName(metadata.newCategory.name);
            if (!newCategoryNameValidation.isValid) {
                newCategoryNameValidation.errors.forEach(error => {
                    result.addError(`newCategory.${error.field}`, error.message);
                });
                result.isValid = false;
            }

            const newCategoryDescriptionValidation = validateCategoryDescription(metadata.newCategory.description);
            if (!newCategoryDescriptionValidation.isValid) {
                newCategoryDescriptionValidation.errors.forEach(error => {
                    result.addError(`newCategory.${error.field}`, error.message);
                });
                result.isValid = false;
            }
        }
    }

    return result;
}

/**
 * Get all error messages
 * @param {ValidationResult} validationResult - Validation result
 * @returns {Array<string>} Array of error messages
 */
function getAllErrorMessages(validationResult) {
    return validationResult.errors.map(error => error.message);
}

// Export validation functions
window.ValidationUtils = {
    ValidationResult,
    validateTextContent,
    validateHTML,
    validateImageUrl,
    validateAccordionItem,
    validateAccordionData,
    validateCardData,
    validateTemplateName,
    validateTemplateDescription,
    validateCategoryName,
    validateCategoryDescription,
    validateTemplateMetadata,
    getErrorMessage,
    getAllErrorMessages
};
