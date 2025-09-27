const { v4: uuidv4 } = require('uuid');
const { isValidUUID } = require('../utils/uuidValidation');

/**
 * Category Service
 * Handles business logic for category CRUD operations
 */
class CategoryService {
    constructor() {
        // In-memory storage for categories (in a real app, this would be a database)
        this.categories = new Map();
        this.templates = new Map();
        
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

        // Sample templates (to check for active templates)
        const template1 = {
            id: '750e8400-e29b-41d4-a716-446655440001',
            name: 'Sample Template',
            description: 'A sample template for testing',
            categoryId: category1.id,
            previewImageUrl: 'https://example.com/preview1.png',
            components: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
        };

        const template2 = {
            id: '750e8400-e29b-41d4-a716-446655440002',
            name: 'Test Template',
            description: 'A test template for Work Order 36',
            categoryId: category2.id,
            previewImageUrl: 'https://example.com/test-preview.png',
            components: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
        };

        this.templates.set(template1.id, template1);
        this.templates.set(template2.id, template2);
    }

    /**
     * Create a new category
     * @param {Object} categoryData - Category data
     * @param {string} categoryData.name - Category name
     * @param {string} categoryData.description - Category description
     * @returns {Object} Created category
     */
    async createCategory(categoryData) {
        const { name, description } = categoryData;

        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('Category name is required and must be a non-empty string');
        }

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            throw new Error('Category description is required and must be a non-empty string');
        }

        // Check for duplicate category name
        const existingCategory = Array.from(this.categories.values()).find(
            c => c.name.toLowerCase() === name.toLowerCase()
        );
        if (existingCategory) {
            throw new Error(`Category with name "${name}" already exists`);
        }

        // Create new category
        const categoryId = uuidv4();
        const now = new Date();
        
        const newCategory = {
            id: categoryId,
            name: name.trim(),
            description: description.trim(),
            createdAt: now,
            updatedAt: now
        };

        this.categories.set(categoryId, newCategory);

        return { ...newCategory };
    }

    /**
     * Update an existing category
     * @param {string} categoryId - Category ID
     * @param {Object} updateData - Update data
     * @param {string} updateData.name - Category name
     * @param {string} updateData.description - Category description
     * @returns {Object} Updated category
     */
    async updateCategory(categoryId, updateData) {
        if (!isValidUUID(categoryId)) {
            throw new Error('Category ID must be a valid UUID');
        }

        const existingCategory = this.categories.get(categoryId);
        if (!existingCategory) {
            throw new Error(`Category with ID ${categoryId} does not exist`);
        }

        const { name, description } = updateData;

        // Validate required fields
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('Category name is required and must be a non-empty string');
        }

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            throw new Error('Category description is required and must be a non-empty string');
        }

        // Check for duplicate category name (excluding current category)
        const existingCategoryWithName = Array.from(this.categories.values()).find(
            c => c.id !== categoryId && c.name.toLowerCase() === name.toLowerCase()
        );
        if (existingCategoryWithName) {
            throw new Error(`Category with name "${name}" already exists`);
        }

        // Update category
        const updatedCategory = {
            ...existingCategory,
            name: name.trim(),
            description: description.trim(),
            updatedAt: new Date()
        };

        this.categories.set(categoryId, updatedCategory);

        return { ...updatedCategory };
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
     * Check if category has active templates
     * @param {string} categoryId - Category ID
     * @returns {boolean} True if category has active templates
     */
    async hasActiveTemplates(categoryId) {
        if (!isValidUUID(categoryId)) {
            throw new Error('Category ID must be a valid UUID');
        }

        const activeTemplates = Array.from(this.templates.values()).filter(
            template => template.categoryId === categoryId && template.isActive === true
        );

        return activeTemplates.length > 0;
    }

    /**
     * Get active templates for a category
     * @param {string} categoryId - Category ID
     * @returns {Array} Array of active templates
     */
    async getActiveTemplatesForCategory(categoryId) {
        if (!isValidUUID(categoryId)) {
            throw new Error('Category ID must be a valid UUID');
        }

        return Array.from(this.templates.values()).filter(
            template => template.categoryId === categoryId && template.isActive === true
        );
    }

    /**
     * Delete category by ID
     * @param {string} categoryId - Category ID
     * @returns {boolean} True if deleted, false if not found
     */
    async deleteCategory(categoryId) {
        if (!isValidUUID(categoryId)) {
            throw new Error('Category ID must be a valid UUID');
        }

        const category = this.categories.get(categoryId);
        if (!category) {
            return false;
        }

        // Check if category has active templates
        const hasActive = await this.hasActiveTemplates(categoryId);
        if (hasActive) {
            throw new Error(`Cannot delete category "${category.name}" because it has active templates`);
        }

        return this.categories.delete(categoryId);
    }

    /**
     * Get category statistics
     * @param {string} categoryId - Category ID
     * @returns {Object} Category statistics
     */
    async getCategoryStats(categoryId) {
        if (!isValidUUID(categoryId)) {
            throw new Error('Category ID must be a valid UUID');
        }

        const category = this.categories.get(categoryId);
        if (!category) {
            throw new Error(`Category with ID ${categoryId} does not exist`);
        }

        const allTemplates = Array.from(this.templates.values()).filter(
            template => template.categoryId === categoryId
        );

        const activeTemplates = allTemplates.filter(template => template.isActive === true);
        const inactiveTemplates = allTemplates.filter(template => template.isActive === false);

        return {
            categoryId,
            categoryName: category.name,
            totalTemplates: allTemplates.length,
            activeTemplates: activeTemplates.length,
            inactiveTemplates: inactiveTemplates.length,
            canDelete: activeTemplates.length === 0
        };
    }
}

module.exports = new CategoryService();
