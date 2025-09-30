const templateService = require('../services/templateService');
const templateUploadService = require('../services/templateUploadService');
const s3Service = require('../services/s3Service');
const {
    validateCreateTemplateRequest,
    validateUpdateTemplateRequest,
    validateTemplateId,
    sanitizeTemplateResponse,
    createErrorResponse,
    createSuccessResponse
} = require('../schemas/templateSchemas');
const {
    sanitizeUploadSessionResponse
} = require('../schemas/templateUploadSchemas');

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

/**
 * Initiate template file upload
 * POST /api/admin/templates/upload/initiate
 */
const initiateTemplateUpload = async (req, res) => {
    try {
        const { fileName, fileType, fileSize } = req.validatedData; // From validation middleware
        const userId = req.userId; // From adminAuth middleware

        const result = await templateUploadService.initiateTemplateUpload(
            fileName,
            fileType,
            fileSize
        );

        const sanitizedSession = sanitizeUploadSessionResponse(result.session);

        // Get public URL for the uploaded file
        const publicUrl = s3Service.getPublicUrl(result.s3Key);

        res.status(200).json(
            createSuccessResponse({
                uploadId: result.uploadId,
                presignedUrl: result.presignedUrl,
                publicUrl: publicUrl,
                s3Key: result.s3Key,
                expiresIn: result.expiresIn,
                session: sanitizedSession
            }, 'Template upload initiated successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error initiating template upload:', error);
        
        // Handle specific error types
        if (error.message.includes('File validation failed')) {
            return res.status(400).json(
                createErrorResponse(error.message, 'FILE_VALIDATION_FAILED')
            );
        }
        
        if (error.message.includes('Failed to generate pre-signed URL')) {
            return res.status(500).json(
                createErrorResponse(error.message, 'S3_ERROR')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Complete template file upload
 * POST /api/admin/templates/upload/complete
 */
const completeTemplateUpload = async (req, res) => {
    try {
        const { uploadId } = req.validatedData; // From validation middleware
        const userId = req.userId; // From adminAuth middleware

        const result = await templateUploadService.completeTemplateUpload(uploadId);

        const sanitizedSession = sanitizeUploadSessionResponse(result.session);

        res.status(200).json(
            createSuccessResponse({
                uploadId: result.uploadId,
                status: result.status,
                s3Key: result.s3Key,
                publicUrl: result.publicUrl,
                fileSize: result.fileSize,
                contentType: result.contentType,
                lastModified: result.lastModified,
                session: sanitizedSession
            }, 'Template upload completed successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error completing template upload:', error);
        
        // Handle specific error types
        if (error.message.includes('Upload session not found')) {
            return res.status(404).json(
                createErrorResponse(error.message, 'UPLOAD_SESSION_NOT_FOUND')
            );
        }
        
        if (error.message.includes('Upload session expired')) {
            return res.status(410).json(
                createErrorResponse(error.message, 'UPLOAD_SESSION_EXPIRED')
            );
        }
        
        if (error.message.includes('File upload verification failed')) {
            return res.status(400).json(
                createErrorResponse(error.message, 'UPLOAD_VERIFICATION_FAILED')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Update upload progress
 * PUT /api/admin/templates/upload/:uploadId/progress
 */
const updateUploadProgress = async (req, res) => {
    try {
        const { uploadId, progress } = req.validatedData; // From validation middleware
        const userId = req.userId; // From adminAuth middleware

        const session = await templateUploadService.updateUploadProgress(uploadId, progress);
        const sanitizedSession = sanitizeUploadSessionResponse(session);

        res.status(200).json(
            createSuccessResponse(sanitizedSession, 'Upload progress updated successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error updating upload progress:', error);
        
        // Handle specific error types
        if (error.message.includes('Upload session not found')) {
            return res.status(404).json(
                createErrorResponse(error.message, 'UPLOAD_SESSION_NOT_FOUND')
            );
        }
        
        if (error.message.includes('Upload session expired')) {
            return res.status(410).json(
                createErrorResponse(error.message, 'UPLOAD_SESSION_EXPIRED')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Get upload status
 * GET /api/admin/templates/upload/:uploadId/status
 */
const getUploadStatus = async (req, res) => {
    try {
        const { uploadId } = req.validatedData; // From validation middleware
        const userId = req.userId; // From adminAuth middleware

        const session = await templateUploadService.getUploadStatus(uploadId);
        const sanitizedSession = sanitizeUploadSessionResponse(session);

        res.status(200).json(
            createSuccessResponse(sanitizedSession, 'Upload status retrieved successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error getting upload status:', error);
        
        // Handle specific error types
        if (error.message.includes('Upload session not found')) {
            return res.status(404).json(
                createErrorResponse(error.message, 'UPLOAD_SESSION_NOT_FOUND')
            );
        }
        
        if (error.message.includes('Upload session expired')) {
            return res.status(410).json(
                createErrorResponse(error.message, 'UPLOAD_SESSION_EXPIRED')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Cancel upload
 * DELETE /api/admin/templates/upload/:uploadId
 */
const cancelUpload = async (req, res) => {
    try {
        const { uploadId } = req.validatedData; // From validation middleware
        const userId = req.userId; // From adminAuth middleware

        const result = await templateUploadService.cancelUpload(uploadId);

        res.status(200).json(
            createSuccessResponse(result, 'Upload cancelled successfully')
        );

    } catch (error) {
        console.error('[adminTemplateController] Error cancelling upload:', error);
        
        // Handle specific error types
        if (error.message.includes('Upload session not found')) {
            return res.status(404).json(
                createErrorResponse(error.message, 'UPLOAD_SESSION_NOT_FOUND')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', [error.message])
        );
    }
};

/**
 * Create template from wizard
 * POST /api/admin/templates/wizard
 */
const createTemplateFromWizard = async (req, res) => {
    try {
        const { name, description, categoryId, previewImageUrl, components } = req.body;
        const userId = req.userId; // From adminAuth middleware

        // Validate required fields for wizard submission
        if (!name || !description || !categoryId || !previewImageUrl) {
            return res.status(400).json(
                createErrorResponse('Missing required fields', 'MISSING_REQUIRED_FIELDS', {
                    name: !name ? 'Template name is required' : null,
                    description: !description ? 'Template description is required' : null,
                    categoryId: !categoryId ? 'Category is required' : null,
                    previewImageUrl: !previewImageUrl ? 'Preview image URL is required' : null
                })
            );
        }

        // Create template data from wizard
        const templateData = {
            name: name.trim(),
            description: description.trim(),
            categoryId,
            previewImageUrl,
            components: components || [], // Components are optional for wizard
            createdBy: userId,
            source: 'wizard' // Mark as created via wizard
        };

        // Create template using service
        const newTemplate = await templateService.createTemplateFromWizard(templateData);
        const sanitizedTemplate = sanitizeTemplateResponse(newTemplate);

        res.status(201).json(
            createSuccessResponse(sanitizedTemplate, 'Template created successfully from wizard')
        );

    } catch (error) {
        console.error('Error creating template from wizard:', error);
        
        if (error.code === 'TEMPLATE_NAME_EXISTS') {
            return res.status(409).json(
                createErrorResponse('Template name already exists', 'TEMPLATE_NAME_EXISTS')
            );
        }
        
        if (error.code === 'CATEGORY_NOT_FOUND') {
            return res.status(404).json(
                createErrorResponse('Category not found', 'CATEGORY_NOT_FOUND')
            );
        }

        res.status(500).json(
            createErrorResponse('Internal server error', 'INTERNAL_SERVER_ERROR')
        );
    }
};

module.exports = {
    createTemplate,
    updateTemplate,
    getTemplate,
    getAllTemplates,
    deleteTemplate,
    getAllCategories,
    initiateTemplateUpload,
    completeTemplateUpload,
    updateUploadProgress,
    getUploadStatus,
    cancelUpload,
    createTemplateFromWizard
};
