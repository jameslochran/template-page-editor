const templateService = require('../services/templateService');
const {
    validateCreateTemplateRequest,
    validateUpdateTemplateRequest,
    validateTemplateId,
    sanitizeTemplateResponse,
    createErrorResponse,
    createSuccessResponse
} = require('../schemas/templateSchemas');

/**
 * Admin Template Controller
 * Handles template CRUD operations for administrators
 */

/**
 * Create a new template
 * POST /api/admin/templates
 */
const createTemplate = async (req, res) => {
    try {
        const { name, description, categoryId, previewImageUrl, components } = req.body;
        const userId = req.userId; // From adminAuth middleware

        // Validate request data
        const validation = validateCreateTemplateRequest(req.body);
        if (!validation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid request data', 'INVALID_REQUEST_DATA', validation.errors)
            );
        }

        // Create template
        const templateData = {
            name,
            description,
            categoryId,
            previewImageUrl,
            components
        };

        const newTemplate = await templateService.createTemplate(templateData);
        const sanitizedTemplate = sanitizeTemplateResponse(newTemplate);

        res.status(201).json(
            createSuccessResponse(sanitizedTemplate, 'Template created successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error creating template:', error);
        
        // Handle specific error types
        if (error.message.includes('already exists')) {
            return res.status(409).json(
                createErrorResponse(error.message, 'TEMPLATE_NAME_CONFLICT')
            );
        }
        
        if (error.message.includes('does not exist')) {
            return res.status(400).json(
                createErrorResponse(error.message, 'CATEGORY_NOT_FOUND')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Update an existing template
 * PUT /api/admin/templates/:templateId
 */
const updateTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const { name, description, categoryId, previewImageUrl, components } = req.body;
        const userId = req.userId; // From adminAuth middleware

        // Validate template ID
        const idValidation = validateTemplateId(templateId);
        if (!idValidation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid template ID', 'INVALID_TEMPLATE_ID', idValidation.errors)
            );
        }

        // Validate request data
        const validation = validateUpdateTemplateRequest(req.body);
        if (!validation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid request data', 'INVALID_REQUEST_DATA', validation.errors)
            );
        }

        // Update template
        const updateData = {
            name,
            description,
            categoryId,
            previewImageUrl,
            components
        };

        const updatedTemplate = await templateService.updateTemplate(templateId, updateData);
        const sanitizedTemplate = sanitizeTemplateResponse(updatedTemplate);

        res.status(200).json(
            createSuccessResponse(sanitizedTemplate, 'Template updated successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error updating template:', error);
        
        // Handle specific error types
        if (error.message.includes('does not exist')) {
            return res.status(404).json(
                createErrorResponse(error.message, 'TEMPLATE_NOT_FOUND')
            );
        }
        
        if (error.message.includes('already exists')) {
            return res.status(409).json(
                createErrorResponse(error.message, 'TEMPLATE_NAME_CONFLICT')
            );
        }
        
        if (error.message.includes('Category with ID') && error.message.includes('does not exist')) {
            return res.status(400).json(
                createErrorResponse(error.message, 'CATEGORY_NOT_FOUND')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Get template by ID
 * GET /api/admin/templates/:templateId
 */
const getTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;

        // Validate template ID
        const idValidation = validateTemplateId(templateId);
        if (!idValidation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid template ID', 'INVALID_TEMPLATE_ID', idValidation.errors)
            );
        }

        const template = await templateService.getTemplateById(templateId);
        if (!template) {
            return res.status(404).json(
                createErrorResponse('Template not found', 'TEMPLATE_NOT_FOUND')
            );
        }

        const sanitizedTemplate = sanitizeTemplateResponse(template);
        res.status(200).json(
            createSuccessResponse(sanitizedTemplate, 'Template retrieved successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error getting template:', error);
        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Get all templates
 * GET /api/admin/templates
 */
const getAllTemplates = async (req, res) => {
    try {
        const templates = await templateService.getAllTemplates();
        const sanitizedTemplates = templates.map(template => sanitizeTemplateResponse(template));

        res.status(200).json(
            createSuccessResponse(sanitizedTemplates, 'Templates retrieved successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error getting templates:', error);
        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Delete template by ID
 * DELETE /api/admin/templates/:templateId
 */
const deleteTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;

        // Validate template ID
        const idValidation = validateTemplateId(templateId);
        if (!idValidation.isValid) {
            return res.status(400).json(
                createErrorResponse('Invalid template ID', 'INVALID_TEMPLATE_ID', idValidation.errors)
            );
        }

        const deleted = await templateService.deleteTemplate(templateId);
        if (!deleted) {
            return res.status(404).json(
                createErrorResponse('Template not found', 'TEMPLATE_NOT_FOUND')
            );
        }

        res.status(200).json(
            createSuccessResponse(null, 'Template deleted successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error deleting template:', error);
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
        const categories = await templateService.getAllCategories();
        const sanitizedCategories = categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        }));

        res.status(200).json(
            createSuccessResponse(sanitizedCategories, 'Categories retrieved successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error getting categories:', error);
        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

module.exports = {
    createTemplate,
    updateTemplate,
    getTemplate,
    getAllTemplates,
    deleteTemplate,
    getAllCategories
};
