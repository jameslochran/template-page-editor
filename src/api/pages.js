/**
 * Page API Routes
 * Work Order #2: Implement Page Content Management API Endpoints
 * 
 * This module defines the REST API endpoints for page content management,
 * including retrieval and updating of page components with proper validation.
 */

const express = require('express');
const router = express.Router();
const pageRepository = require('../data/pageRepository');
const Page = require('../models/Page');

/**
 * GET /api/pages/:pageId
 * Retrieve a page by ID with its components
 */
router.get('/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;

        // Validate pageId parameter
        if (!pageId) {
            return res.status(400).json({
                error: 'Page ID is required',
                code: 'MISSING_PAGE_ID'
            });
        }

        // Validate UUID format
        if (!pageRepository.isValidUUID(pageId)) {
            return res.status(400).json({
                error: 'Invalid page ID format. Must be a valid UUID.',
                code: 'INVALID_PAGE_ID_FORMAT'
            });
        }

        // Fetch page from repository
        const page = await pageRepository.getPageById(pageId);

        if (!page) {
            return res.status(404).json({
                error: 'Page not found',
                code: 'PAGE_NOT_FOUND',
                pageId: pageId
            });
        }

        // Return page data
        res.json({
            id: page.id,
            templateId: page.templateId,
            components: page.components,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt
        });

    } catch (error) {
        console.error('Error in GET /api/pages/:pageId:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message
        });
    }
});

/**
 * PUT /api/pages/:pageId
 * Update page components with validation and atomic updates
 */
router.put('/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const { components } = req.body;

        // Validate pageId parameter
        if (!pageId) {
            return res.status(400).json({
                error: 'Page ID is required',
                code: 'MISSING_PAGE_ID'
            });
        }

        // Validate UUID format
        if (!pageRepository.isValidUUID(pageId)) {
            return res.status(400).json({
                error: 'Invalid page ID format. Must be a valid UUID.',
                code: 'INVALID_PAGE_ID_FORMAT'
            });
        }

        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                error: 'Request body is required and must be a JSON object',
                code: 'INVALID_REQUEST_BODY'
            });
        }

        // Validate components array
        if (!components) {
            return res.status(400).json({
                error: 'Components array is required',
                code: 'MISSING_COMPONENTS'
            });
        }

        if (!Array.isArray(components)) {
            return res.status(400).json({
                error: 'Components must be an array',
                code: 'INVALID_COMPONENTS_TYPE'
            });
        }

        // Additional validation using Page model
        const page = new Page({ id: pageId, components });
        const validation = page.validateComponents(components);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Component validation failed',
                code: 'COMPONENT_VALIDATION_ERROR',
                details: validation.errors
            });
        }

        // Check if page exists before updating
        const existingPage = await pageRepository.getPageById(pageId);
        if (!existingPage) {
            return res.status(404).json({
                error: 'Page not found',
                code: 'PAGE_NOT_FOUND',
                pageId: pageId
            });
        }

        // Update page components atomically
        const updatedPage = await pageRepository.updatePageComponents(pageId, components);

        // Return updated page data
        res.json({
            id: updatedPage.id,
            templateId: updatedPage.templateId,
            components: updatedPage.components,
            createdAt: updatedPage.createdAt,
            updatedAt: updatedPage.updatedAt
        });

    } catch (error) {
        console.error('Error in PUT /api/pages/:pageId:', error);
        
        // Handle specific error types
        if (error.message.includes('Component validation failed')) {
            return res.status(400).json({
                error: 'Component validation failed',
                code: 'COMPONENT_VALIDATION_ERROR',
                message: error.message
            });
        }

        if (error.message.includes('Page not found')) {
            return res.status(404).json({
                error: 'Page not found',
                code: 'PAGE_NOT_FOUND',
                pageId: req.params.pageId
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message
        });
    }
});

/**
 * POST /api/pages
 * Create a new page (bonus endpoint for completeness)
 */
router.post('/', async (req, res) => {
    try {
        const { templateId, components = [] } = req.body;

        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                error: 'Request body is required and must be a JSON object',
                code: 'INVALID_REQUEST_BODY'
            });
        }

        // Validate templateId
        if (!templateId) {
            return res.status(400).json({
                error: 'Template ID is required',
                code: 'MISSING_TEMPLATE_ID'
            });
        }

        if (!pageRepository.isValidUUID(templateId)) {
            return res.status(400).json({
                error: 'Invalid template ID format. Must be a valid UUID.',
                code: 'INVALID_TEMPLATE_ID_FORMAT'
            });
        }

        // Validate components array
        if (!Array.isArray(components)) {
            return res.status(400).json({
                error: 'Components must be an array',
                code: 'INVALID_COMPONENTS_TYPE'
            });
        }

        // Create new page
        const newPage = await pageRepository.createPage(templateId, components);

        // Return created page data
        res.status(201).json({
            id: newPage.id,
            templateId: newPage.templateId,
            components: newPage.components,
            createdAt: newPage.createdAt,
            updatedAt: newPage.updatedAt
        });

    } catch (error) {
        console.error('Error in POST /api/pages:', error);
        
        if (error.message.includes('Page validation failed')) {
            return res.status(400).json({
                error: 'Page validation failed',
                code: 'PAGE_VALIDATION_ERROR',
                message: error.message
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message
        });
    }
});

/**
 * DELETE /api/pages/:pageId
 * Delete a page (bonus endpoint for completeness)
 */
router.delete('/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;

        // Validate pageId parameter
        if (!pageId) {
            return res.status(400).json({
                error: 'Page ID is required',
                code: 'MISSING_PAGE_ID'
            });
        }

        // Validate UUID format
        if (!pageRepository.isValidUUID(pageId)) {
            return res.status(400).json({
                error: 'Invalid page ID format. Must be a valid UUID.',
                code: 'INVALID_PAGE_ID_FORMAT'
            });
        }

        // Delete page
        const deleted = await pageRepository.deletePage(pageId);

        if (!deleted) {
            return res.status(404).json({
                error: 'Page not found',
                code: 'PAGE_NOT_FOUND',
                pageId: pageId
            });
        }

        res.status(204).send();

    } catch (error) {
        console.error('Error in DELETE /api/pages/:pageId:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message
        });
    }
});

/**
 * GET /api/pages
 * Get all pages (bonus endpoint for debugging/admin)
 */
router.get('/', async (req, res) => {
    try {
        const pages = await pageRepository.getAllPages();
        res.json(pages);
    } catch (error) {
        console.error('Error in GET /api/pages:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message
        });
    }
});

/**
 * GET /api/pages/stats
 * Get page statistics (bonus endpoint)
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await pageRepository.getPageStats();
        res.json(stats);
    } catch (error) {
        console.error('Error in GET /api/pages/stats:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message
        });
    }
});

module.exports = router;
