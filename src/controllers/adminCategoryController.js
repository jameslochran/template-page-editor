const categoryService = require('../services/categoryService');
const {
    validateCategoryId,
    sanitizeCategoryResponse,
    createErrorResponse,
    createSuccessResponse
} = require('../schemas/templateSchemas');

/**
 * Admin Category Controller
 * Handles category CRUD operations for administrators
 */

/**
 * Validate category creation/update request
 * @param {Object} data - Request data
 * @returns {Object} Validation result
 */
const validateCategoryRequest = (data) => {
    const errors = [];

    // Validate name
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Category name is required and must be a non-empty string');
    } else if (data.name.length > 255) {
        errors.push('Category name cannot exceed 255 characters');
    }

    // Validate description
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
        errors.push('Category description is required and must be a non-empty string');
    } else if (data.description.length > 1000) {
        errors.push('Category description cannot exceed 1000 characters');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Create a new category
 * POST /api/admin/categories
 */
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.userId; // From adminAuth middleware

        // Validate request data
        const validation = validateCategoryRequest(req.body);
        if (!validation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid request data', 'INVALID_REQUEST_DATA', validation.errors)
            );
        }

        // Create category
        const categoryData = {
            name,
            description
        };

        const newCategory = await categoryService.createCategory(categoryData);
        const sanitizedCategory = sanitizeCategoryResponse(newCategory);

        res.status(201).json(
            createSuccessResponse(sanitizedCategory, 'Category created successfully')
        );

    } catch (error) {
        console.error('[adminCategoryController] Error creating category:', error);
        
        // Handle specific error types
        if (error.message.includes('already exists')) {
            return res.status(409).json(
                createErrorResponse(error.message, 'CATEGORY_NAME_CONFLICT')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Update an existing category
 * PUT /api/admin/categories/:categoryId
 */
const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, description } = req.body;
        const userId = req.userId; // From adminAuth middleware

        // Validate category ID
        const idValidation = validateCategoryId(categoryId);
        if (!idValidation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid category ID', 'INVALID_CATEGORY_ID', idValidation.errors)
            );
        }

        // Validate request data
        const validation = validateCategoryRequest(req.body);
        if (!validation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid request data', 'INVALID_REQUEST_DATA', validation.errors)
            );
        }

        // Update category
        const updateData = {
            name,
            description
        };

        const updatedCategory = await categoryService.updateCategory(categoryId, updateData);
        const sanitizedCategory = sanitizeCategoryResponse(updatedCategory);

        res.status(200).json(
            createSuccessResponse(sanitizedCategory, 'Category updated successfully')
        );

    } catch (error) {
        console.error('[adminCategoryController] Error updating category:', error);
        
        // Handle specific error types
        if (error.message.includes('does not exist')) {
            return res.status(404).json(
                createErrorResponse(error.message, 'CATEGORY_NOT_FOUND')
            );
        }
        
        if (error.message.includes('already exists')) {
            return res.status(409).json(
                createErrorResponse(error.message, 'CATEGORY_NAME_CONFLICT')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Get category by ID
 * GET /api/admin/categories/:categoryId
 */
const getCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Validate category ID
        const idValidation = validateCategoryId(categoryId);
        if (!idValidation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid category ID', 'INVALID_CATEGORY_ID', idValidation.errors)
            );
        }

        const category = await categoryService.getCategoryById(categoryId);
        if (!category) {
            return res.status(404).json(
                createErrorResponse('Category not found', 'CATEGORY_NOT_FOUND')
            );
        }

        const sanitizedCategory = sanitizeCategoryResponse(category);
        res.status(200).json(
            createSuccessResponse(sanitizedCategory, 'Category retrieved successfully')
        );

    } catch (error) {
        console.error('[adminCategoryController] Error getting category:', error);
        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Get all categories
 * GET /api/admin/categories
 */
const getAllCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        const sanitizedCategories = categories.map(category => sanitizeCategoryResponse(category));

        res.status(200).json(
            createSuccessResponse(sanitizedCategories, 'Categories retrieved successfully')
        );

    } catch (error) {
        console.error('[adminCategoryController] Error getting categories:', error);
        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Delete category by ID
 * DELETE /api/admin/categories/:categoryId
 */
const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Validate category ID
        const idValidation = validateCategoryId(categoryId);
        if (!idValidation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid category ID', 'INVALID_CATEGORY_ID', idValidation.errors)
            );
        }

        const deleted = await categoryService.deleteCategory(categoryId);
        if (!deleted) {
            return res.status(404).json(
                createErrorResponse('Category not found', 'CATEGORY_NOT_FOUND')
            );
        }

        res.status(204).send();

    } catch (error) {
        console.error('[adminCategoryController] Error deleting category:', error);
        
        // Handle specific error types
        if (error.message.includes('active templates')) {
            return res.status(409).json(
                createErrorResponse(error.message, 'CATEGORY_HAS_ACTIVE_TEMPLATES')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Get category statistics
 * GET /api/admin/categories/:categoryId/stats
 */
const getCategoryStats = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Validate category ID
        const idValidation = validateCategoryId(categoryId);
        if (!idValidation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid category ID', 'INVALID_CATEGORY_ID', idValidation.errors)
            );
        }

        const stats = await categoryService.getCategoryStats(categoryId);
        res.status(200).json(
            createSuccessResponse(stats, 'Category statistics retrieved successfully')
        );

    } catch (error) {
        console.error('[adminCategoryController] Error getting category stats:', error);
        
        // Handle specific error types
        if (error.message.includes('does not exist')) {
            return res.status(404).json(
                createErrorResponse(error.message, 'CATEGORY_NOT_FOUND')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Get active templates for a category
 * GET /api/admin/categories/:categoryId/templates
 */
const getCategoryTemplates = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // Validate category ID
        const idValidation = validateCategoryId(categoryId);
        if (!idValidation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid category ID', 'INVALID_CATEGORY_ID', idValidation.errors)
            );
        }

        // Check if category exists
        const category = await categoryService.getCategoryById(categoryId);
        if (!category) {
            return res.status(404).json(
                createErrorResponse('Category not found', 'CATEGORY_NOT_FOUND')
            );
        }

        const templates = await categoryService.getActiveTemplatesForCategory(categoryId);
        res.status(200).json(
            createSuccessResponse(templates, 'Category templates retrieved successfully')
        );

    } catch (error) {
        console.error('[adminCategoryController] Error getting category templates:', error);
        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

module.exports = {
    createCategory,
    updateCategory,
    getCategory,
    getAllCategories,
    deleteCategory,
    getCategoryStats,
    getCategoryTemplates
};
