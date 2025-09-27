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

        // Sample template
        const template1 = {
            id: '750e8400-e29b-41d4-a716-446655440001',
            name: 'Sample Template',
            description: 'A sample template for testing',
            categoryId: category1.id,
            previewImageUrl: 'https://example.com/preview1.png',
            components: [
                {
                    id: 'comp1',
                    type: 'TextComponent',
                    content: 'Sample text content',
                    styles: { fontSize: '16px', color: '#333' }
                },
                {
                    id: 'comp2',
                    type: 'BannerComponent',
                    title: 'Sample Banner',
                    subtitle: 'Sample subtitle',
                    backgroundImage: 'https://example.com/banner.jpg'
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.templates.set(template1.id, template1);
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
     * @returns {Object|null} Template or null if not found
     */
    async getTemplateById(templateId) {
        if (!isValidUUID(templateId)) {
            throw new Error('Template ID must be a valid UUID');
        }

        const template = this.templates.get(templateId);
        return template ? { ...template } : null;
    }

    /**
     * Get all templates
     * @returns {Array} Array of templates
     */
    async getAllTemplates() {
        return Array.from(this.templates.values()).map(template => ({ ...template }));
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
}

module.exports = new TemplateService();
