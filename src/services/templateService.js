const { v4: uuidv4 } = require('uuid');
const { isValidUUID } = require('../utils/uuidValidation');

/**
 * Template Service
 * Handles business logic for template CRUD operations
 */
class TemplateService {
    constructor() {
        // In-memory storage for templates (in a real app, this would be a database)
        this.templates = new Map();
        this.categories = new Map();
        
        // Initialize with some sample data
        this.initializeSampleData();
    }

    /**
     * Initialize sample data for testing
     */
    initializeSampleData() {
        // Sample categories
        const category1 = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'UI Components',
            description: 'User interface components',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const category2 = {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Layout Templates',
            description: 'Page layout templates',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.categories.set(category1.id, category1);
        this.categories.set(category2.id, category2);

        // Sample templates with different file types
        const template1 = {
            id: '750e8400-e29b-41d4-a716-446655440001',
            name: 'Modern Landing Page',
            description: 'A clean and modern landing page template with hero section and features',
            categoryId: category1.id,
            previewImageUrl: 'https://example.com/landing-page.png',
            components: [
                {
                    id: 'comp1',
                    type: 'BannerComponent',
                    title: 'Welcome to Our Platform',
                    subtitle: 'Build amazing experiences',
                    backgroundImage: 'https://example.com/hero-bg.jpg'
                },
                {
                    id: 'comp2',
                    type: 'TextComponent',
                    content: 'Discover our features and start building today',
                    styles: { fontSize: '18px', color: '#333' }
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const template2 = {
            id: '750e8400-e29b-41d4-a716-446655440002',
            name: 'E-commerce Product Page',
            description: 'Complete product showcase template with image gallery and purchase options',
            categoryId: category2.id,
            previewImageUrl: 'https://example.com/product-page.fig',
            components: [
                {
                    id: 'comp1',
                    type: 'ImageComponent',
                    src: 'https://example.com/product-image.jpg',
                    alt: 'Product Image'
                },
                {
                    id: 'comp2',
                    type: 'TextComponent',
                    content: 'Premium Quality Product',
                    styles: { fontSize: '24px', fontWeight: 'bold' }
                }
            ],
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
            updatedAt: new Date(Date.now() - 86400000)
        };

        const template3 = {
            id: '750e8400-e29b-41d4-a716-446655440003',
            name: 'Blog Article Layout',
            description: 'Professional blog article template with typography and reading experience',
            categoryId: category1.id,
            previewImageUrl: 'https://example.com/blog-article.png',
            components: [
                {
                    id: 'comp1',
                    type: 'TextComponent',
                    content: 'Article Title',
                    styles: { fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a' }
                },
                {
                    id: 'comp2',
                    type: 'TextComponent',
                    content: 'Article content goes here...',
                    styles: { fontSize: '16px', lineHeight: '1.6' }
                }
            ],
            createdAt: new Date(Date.now() - 172800000), // 2 days ago
            updatedAt: new Date(Date.now() - 172800000)
        };

        this.templates.set(template1.id, template1);
        this.templates.set(template2.id, template2);
        this.templates.set(template3.id, template3);
    }

    /**
     * Create a new template
     * @param {Object} templateData - Template data
     * @param {string} templateData.name - Template name
     * @param {string} templateData.description - Template description
     * @param {string} templateData.categoryId - Category ID
     * @param {string} templateData.previewImageUrl - Preview image URL
     * @param {Array} templateData.components - Components array
     * @returns {Object} Created template
     */
    async createTemplate(templateData) {
        const { name, description, categoryId, previewImageUrl, components } = templateData;

        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('Template name is required and must be a non-empty string');
        }

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            throw new Error('Template description is required and must be a non-empty string');
        }

        if (!categoryId || !isValidUUID(categoryId)) {
            throw new Error('Category ID is required and must be a valid UUID');
        }

        // Validate category exists
        if (!this.categories.has(categoryId)) {
            throw new Error(`Category with ID ${categoryId} does not exist`);
        }

        if (!previewImageUrl || typeof previewImageUrl !== 'string' || previewImageUrl.trim().length === 0) {
            throw new Error('Preview image URL is required and must be a non-empty string');
        }

        // Validate components
        if (!Array.isArray(components)) {
            throw new Error('Components must be an array');
        }

        // Validate each component has required fields
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            if (!component.id || typeof component.id !== 'string') {
                throw new Error(`Component at index ${i} must have a valid ID`);
            }
            if (!component.type || typeof component.type !== 'string') {
                throw new Error(`Component at index ${i} must have a valid type`);
            }
        }

        // Check for duplicate template name
        const existingTemplate = Array.from(this.templates.values()).find(
            t => t.name.toLowerCase() === name.toLowerCase()
        );
        if (existingTemplate) {
            throw new Error(`Template with name "${name}" already exists`);
        }

        // Create new template
        const templateId = uuidv4();
        const now = new Date();
        
        const newTemplate = {
            id: templateId,
            name: name.trim(),
            description: description.trim(),
            categoryId,
            previewImageUrl: previewImageUrl.trim(),
            components: JSON.parse(JSON.stringify(components)), // Deep copy
            createdAt: now,
            updatedAt: now
        };

        this.templates.set(templateId, newTemplate);

        return { ...newTemplate };
    }

    /**
     * Update an existing template
     * @param {string} templateId - Template ID
     * @param {Object} updateData - Update data
     * @param {string} updateData.name - Template name
     * @param {string} updateData.description - Template description
     * @param {string} updateData.categoryId - Category ID
     * @param {string} updateData.previewImageUrl - Preview image URL
     * @param {Array} updateData.components - Components array
     * @returns {Object} Updated template
     */
    async updateTemplate(templateId, updateData) {
        if (!isValidUUID(templateId)) {
            throw new Error('Template ID must be a valid UUID');
        }

        const existingTemplate = this.templates.get(templateId);
        if (!existingTemplate) {
            throw new Error(`Template with ID ${templateId} does not exist`);
        }

        const { name, description, categoryId, previewImageUrl, components } = updateData;

        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('Template name is required and must be a non-empty string');
        }

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            throw new Error('Template description is required and must be a non-empty string');
        }

        if (!categoryId || !isValidUUID(categoryId)) {
            throw new Error('Category ID is required and must be a valid UUID');
        }

        // Validate category exists
        if (!this.categories.has(categoryId)) {
            throw new Error(`Category with ID ${categoryId} does not exist`);
        }

        if (!previewImageUrl || typeof previewImageUrl !== 'string' || previewImageUrl.trim().length === 0) {
            throw new Error('Preview image URL is required and must be a non-empty string');
        }

        // Validate components
        if (!Array.isArray(components)) {
            throw new Error('Components must be an array');
        }

        // Validate each component has required fields
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            if (!component.id || typeof component.id !== 'string') {
                throw new Error(`Component at index ${i} must have a valid ID`);
            }
            if (!component.type || typeof component.type !== 'string') {
                throw new Error(`Component at index ${i} must have a valid type`);
            }
        }

        // Check for duplicate template name (excluding current template)
        const existingTemplateWithName = Array.from(this.templates.values()).find(
            t => t.id !== templateId && t.name.toLowerCase() === name.toLowerCase()
        );
        if (existingTemplateWithName) {
            throw new Error(`Template with name "${name}" already exists`);
        }

        // Update template
        const updatedTemplate = {
            ...existingTemplate,
            name: name.trim(),
            description: description.trim(),
            categoryId,
            previewImageUrl: previewImageUrl.trim(),
            components: JSON.parse(JSON.stringify(components)), // Deep copy
            updatedAt: new Date()
        };

        this.templates.set(templateId, updatedTemplate);

        return { ...updatedTemplate };
    }

    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @returns {Object|null} Template with enriched data or null if not found
     */
    async getTemplateById(templateId) {
        if (!isValidUUID(templateId)) {
            throw new Error('Template ID must be a valid UUID');
        }

        const template = this.templates.get(templateId);
        if (!template) {
            return null;
        }

        const enrichedTemplate = { ...template };
        
        // Add category name
        const category = this.categories.get(template.categoryId);
        if (category) {
            enrichedTemplate.categoryName = category.name;
        } else {
            enrichedTemplate.categoryName = 'Unknown Category';
        }
        
        // Add file type information
        enrichedTemplate.fileType = this.determineFileType(template);
        
        return enrichedTemplate;
    }

    /**
     * Get all templates
     * @returns {Array} Array of templates with enriched category data
     */
    async getAllTemplates() {
        return Array.from(this.templates.values()).map(template => {
            const enrichedTemplate = { ...template };
            
            // Add category name
            const category = this.categories.get(template.categoryId);
            if (category) {
                enrichedTemplate.categoryName = category.name;
            } else {
                enrichedTemplate.categoryName = 'Unknown Category';
            }
            
            // Add file type information
            enrichedTemplate.fileType = this.determineFileType(template);
            
            return enrichedTemplate;
        });
    }

    /**
     * Determine file type based on template data
     * @param {Object} template - Template object
     * @returns {string} File type (Figma, PNG, etc.)
     */
    determineFileType(template) {
        // Check preview image URL for file extension
        if (template.previewImageUrl) {
            const extension = template.previewImageUrl.split('.').pop().toLowerCase();
            if (extension === 'fig' || extension === 'figma') {
                return 'Figma';
            } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
                return 'PNG';
            }
        }
        
        // Check if template has Figma-specific components or metadata
        if (template.components && Array.isArray(template.components)) {
            const hasFigmaComponents = template.components.some(component => 
                component.type && component.type.toLowerCase().includes('figma')
            );
            if (hasFigmaComponents) {
                return 'Figma';
            }
        }
        
        // Default to PNG if we can't determine
        return 'PNG';
    }

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {Object|null} Category or null if not found
     */
    async getCategoryById(categoryId) {
        if (!isValidUUID(categoryId)) {
            throw new Error('Category ID must be a valid UUID');
        }

        const category = this.categories.get(categoryId);
        return category ? { ...category } : null;
    }

    /**
     * Get all categories
     * @returns {Array} Array of categories
     */
    async getAllCategories() {
        return Array.from(this.categories.values()).map(category => ({ ...category }));
    }

    /**
     * Delete template by ID
     * @param {string} templateId - Template ID
     * @returns {boolean} True if deleted, false if not found
     */
    async deleteTemplate(templateId) {
        if (!isValidUUID(templateId)) {
            throw new Error('Template ID must be a valid UUID');
        }

        return this.templates.delete(templateId);
    }

    /**
     * Create template from wizard
     * @param {Object} templateData - Template data from wizard
     * @returns {Object} Created template
     */
    async createTemplateFromWizard(templateData) {
        const { name, description, categoryId, previewImageUrl, components, createdBy, source } = templateData;

        // Validate category exists
        if (!this.categories.has(categoryId)) {
            const error = new Error('Category not found');
            error.code = 'CATEGORY_NOT_FOUND';
            throw error;
        }

        // Check if template name already exists
        const existingTemplate = Array.from(this.templates.values())
            .find(template => template.name.toLowerCase() === name.toLowerCase());
        
        if (existingTemplate) {
            const error = new Error('Template name already exists');
            error.code = 'TEMPLATE_NAME_EXISTS';
            throw error;
        }

        // Create new template
        const templateId = uuidv4();
        const now = new Date();
        
        const newTemplate = {
            id: templateId,
            name: name.trim(),
            description: description.trim(),
            categoryId,
            previewImageUrl,
            components: components || [],
            createdBy: createdBy || 'system',
            source: source || 'wizard',
            isActive: true,
            createdAt: now,
            updatedAt: now,
            version: 1,
            tags: [], // Tags can be added later
            metadata: {
                fileType: this.detectFileType(previewImageUrl),
                componentCount: components ? components.length : 0,
                createdVia: 'wizard'
            }
        };

        // Store template
        this.templates.set(templateId, newTemplate);

        console.log(`Template created from wizard: ${templateId} - ${name}`);
        
        return newTemplate;
    }

    /**
     * Detect file type from URL
     * @param {string} url - File URL
     * @returns {string} File type
     */
    detectFileType(url) {
        if (!url) return 'unknown';
        
        const extension = url.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
                return 'image';
            case 'fig':
                return 'figma';
            case 'svg':
                return 'vector';
            default:
                return 'unknown';
        }
    }
}

module.exports = new TemplateService();
