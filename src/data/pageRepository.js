/**
 * Page Repository
 * Work Order #2: Implement Page Content Management API Endpoints
 * 
 * This module provides data access layer for page operations,
 * handling database interactions for page retrieval and updates.
 * Currently uses in-memory storage but structured for easy database integration.
 */

const { v4: uuidv4 } = require('uuid');
const Page = require('../models/Page');

class PageRepository {
    constructor() {
        // In-memory storage for pages (structured like database)
        this.pages = new Map();
        this.initializeSampleData();
    }

    /**
     * Initialize sample data for testing
     */
    initializeSampleData() {
        // Sample pages with realistic component data
        const samplePages = [
            {
                id: '750e8400-e29b-41d4-a716-446655440001',
                templateId: '650e8400-e29b-41d4-a716-446655440001', // Modern Business Homepage
                components: [
                    {
                        id: 'banner-001',
                        type: 'BannerComponent',
                        data: {
                            headlineText: 'Welcome to Our Platform',
                            backgroundImageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                            backgroundImageAltText: 'Modern workspace with laptop and coffee',
                            callToAction: {
                                buttonText: 'Get Started',
                                linkUrl: '/get-started',
                                linkTarget: '_self'
                            },
                            style: 'default'
                        },
                        order: 1
                    },
                    {
                        id: 'text-001',
                        type: 'TextComponent',
                        data: {
                            content: {
                                format: 'html',
                                data: '<p>Build amazing things with our powerful tools and intuitive interface. Perfect for businesses and individuals alike.</p>',
                                metadata: {
                                    version: '1.0',
                                    created: new Date().toISOString(),
                                    lastModified: new Date().toISOString()
                                }
                            }
                        },
                        order: 2
                    },
                    {
                        id: 'card-001',
                        type: 'CardComponent',
                        data: {
                            title: 'Advanced Features',
                            description: {
                                format: 'html',
                                data: '<p>Discover our comprehensive suite of tools designed to help you create stunning content.</p>',
                                metadata: {
                                    version: '1.0',
                                    created: new Date().toISOString(),
                                    lastModified: new Date().toISOString()
                                }
                            },
                            imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                            altText: 'Data visualization charts and graphs',
                            linkUrl: '/features',
                            linkText: 'Learn More',
                            linkTarget: '_self',
                            style: 'default'
                        },
                        order: 3
                    }
                ],
                createdAt: new Date('2024-01-15T10:00:00Z'),
                updatedAt: new Date('2024-01-15T10:00:00Z')
            },
            {
                id: '750e8400-e29b-41d4-a716-446655440002',
                templateId: '650e8400-e29b-41d4-a716-446655440002', // E-commerce Product Showcase
                components: [
                    {
                        id: 'banner-002',
                        type: 'BannerComponent',
                        data: {
                            headlineText: 'Shop Our Latest Collection',
                            backgroundImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                            backgroundImageAltText: 'Modern retail store interior',
                            callToAction: {
                                buttonText: 'Shop Now',
                                linkUrl: '/products',
                                linkTarget: '_self'
                            },
                            style: 'default'
                        },
                        order: 1
                    },
                    {
                        id: 'accordion-001',
                        type: 'AccordionComponent',
                        data: {
                            items: [
                                {
                                    id: 'accordion-item-1',
                                    header: 'What payment methods do you accept?',
                                    content: {
                                        format: 'html',
                                        data: '<p>We accept all major credit cards, PayPal, and bank transfers. All transactions are secure and encrypted.</p>',
                                        metadata: {
                                            version: '1.0',
                                            created: new Date().toISOString(),
                                            lastModified: new Date().toISOString()
                                        }
                                    },
                                    isOpen: false,
                                    order: 1
                                },
                                {
                                    id: 'accordion-item-2',
                                    header: 'What is your return policy?',
                                    content: {
                                        format: 'html',
                                        data: '<p>We offer a 30-day return policy for all items. Items must be in original condition with tags attached.</p>',
                                        metadata: {
                                            version: '1.0',
                                            created: new Date().toISOString(),
                                            lastModified: new Date().toISOString()
                                        }
                                    },
                                    isOpen: false,
                                    order: 2
                                }
                            ],
                            allowMultipleOpen: true,
                            style: 'default'
                        },
                        order: 2
                    }
                ],
                createdAt: new Date('2024-01-16T14:30:00Z'),
                updatedAt: new Date('2024-01-16T14:30:00Z')
            },
            {
                id: '750e8400-e29b-41d4-a716-446655440003',
                templateId: '650e8400-e29b-41d4-a716-446655440003', // Creative Portfolio Landing
                components: [
                    {
                        id: 'text-002',
                        type: 'TextComponent',
                        data: {
                            content: {
                                format: 'html',
                                data: '<h1>Creative Portfolio</h1><p>Showcasing innovative design and development work.</p>',
                                metadata: {
                                    version: '1.0',
                                    created: new Date().toISOString(),
                                    lastModified: new Date().toISOString()
                                }
                            }
                        },
                        order: 1
                    },
                    {
                        id: 'linkgroup-001',
                        type: 'LinkGroupComponent',
                        data: {
                            title: 'Navigation',
                            links: [
                                {
                                    id: 'link-001',
                                    linkText: 'Portfolio',
                                    linkUrl: '/portfolio',
                                    linkTarget: '_self',
                                    order: 0
                                },
                                {
                                    id: 'link-002',
                                    linkText: 'About',
                                    linkUrl: '/about',
                                    linkTarget: '_self',
                                    order: 1
                                },
                                {
                                    id: 'link-003',
                                    linkText: 'Contact',
                                    linkUrl: '/contact',
                                    linkTarget: '_self',
                                    order: 2
                                }
                            ],
                            style: 'default'
                        },
                        order: 2
                    }
                ],
                createdAt: new Date('2024-01-17T09:15:00Z'),
                updatedAt: new Date('2024-01-17T09:15:00Z')
            }
        ];

        // Store sample pages
        samplePages.forEach(pageData => {
            this.pages.set(pageData.id, pageData);
        });
    }

    /**
     * Get a page by ID
     * @param {string} pageId - Page ID
     * @returns {Object|null} Page data or null if not found
     */
    async getPageById(pageId) {
        try {
            // Validate pageId format
            if (!this.isValidUUID(pageId)) {
                throw new Error('Invalid page ID format');
            }

            const pageData = this.pages.get(pageId);
            if (!pageData) {
                return null;
            }

            // Return a copy to prevent external modification
            return {
                id: pageData.id,
                templateId: pageData.templateId,
                components: JSON.parse(JSON.stringify(pageData.components)),
                createdAt: pageData.createdAt,
                updatedAt: pageData.updatedAt
            };
        } catch (error) {
            console.error('Error fetching page:', error);
            throw error;
        }
    }

    /**
     * Update page components atomically
     * @param {string} pageId - Page ID
     * @param {Array} components - New components array
     * @returns {Object} Updated page data
     */
    async updatePageComponents(pageId, components) {
        try {
            // Validate pageId format
            if (!this.isValidUUID(pageId)) {
                throw new Error('Invalid page ID format');
            }

            // Check if page exists
            const existingPage = this.pages.get(pageId);
            if (!existingPage) {
                throw new Error('Page not found');
            }

            // Validate components using Page model
            const page = new Page({ ...existingPage, components });
            const validation = page.validateComponents(components);
            if (!validation.isValid) {
                throw new Error(`Component validation failed: ${validation.errors.join(', ')}`);
            }

            // Simulate atomic transaction
            const updatedPage = {
                ...existingPage,
                components: JSON.parse(JSON.stringify(components)), // Deep copy
                updatedAt: new Date()
            };

            // Atomic update
            this.pages.set(pageId, updatedPage);

            // Return updated page data
            return {
                id: updatedPage.id,
                templateId: updatedPage.templateId,
                components: updatedPage.components,
                createdAt: updatedPage.createdAt,
                updatedAt: updatedPage.updatedAt
            };
        } catch (error) {
            console.error('Error updating page components:', error);
            throw error;
        }
    }

    /**
     * Create a new page
     * @param {string} templateId - Template ID
     * @param {Array} components - Initial components array
     * @returns {Object} Created page data
     */
    async createPage(templateId, components = []) {
        try {
            // Validate templateId format
            if (!this.isValidUUID(templateId)) {
                throw new Error('Invalid template ID format');
            }

            const pageId = uuidv4();
            const now = new Date();

            const newPage = {
                id: pageId,
                templateId,
                components: JSON.parse(JSON.stringify(components)), // Deep copy
                createdAt: now,
                updatedAt: now
            };

            // Validate using Page model
            const page = new Page(newPage);
            const validation = page.validate();
            if (!validation.isValid) {
                throw new Error(`Page validation failed: ${validation.errors.join(', ')}`);
            }

            // Store the page
            this.pages.set(pageId, newPage);

            return {
                id: newPage.id,
                templateId: newPage.templateId,
                components: newPage.components,
                createdAt: newPage.createdAt,
                updatedAt: newPage.updatedAt
            };
        } catch (error) {
            console.error('Error creating page:', error);
            throw error;
        }
    }

    /**
     * Delete a page
     * @param {string} pageId - Page ID
     * @returns {boolean} Success status
     */
    async deletePage(pageId) {
        try {
            // Validate pageId format
            if (!this.isValidUUID(pageId)) {
                throw new Error('Invalid page ID format');
            }

            const pageExists = this.pages.has(pageId);
            if (!pageExists) {
                return false;
            }

            this.pages.delete(pageId);
            return true;
        } catch (error) {
            console.error('Error deleting page:', error);
            throw error;
        }
    }

    /**
     * Get all pages (for debugging/admin purposes)
     * @returns {Array} Array of page summaries
     */
    async getAllPages() {
        try {
            const pages = [];
            for (const [id, pageData] of this.pages) {
                pages.push({
                    id: pageData.id,
                    templateId: pageData.templateId,
                    componentCount: pageData.components.length,
                    createdAt: pageData.createdAt,
                    updatedAt: pageData.updatedAt
                });
            }
            return pages;
        } catch (error) {
            console.error('Error fetching all pages:', error);
            throw error;
        }
    }

    /**
     * Validate UUID format
     * @param {string} uuid - UUID string
     * @returns {boolean} Valid UUID
     */
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Get page statistics
     * @returns {Object} Page statistics
     */
    async getPageStats() {
        try {
            const stats = {
                totalPages: this.pages.size,
                totalComponents: 0,
                componentTypes: {},
                averageComponentsPerPage: 0
            };

            for (const [id, pageData] of this.pages) {
                stats.totalComponents += pageData.components.length;
                
                pageData.components.forEach(component => {
                    const type = component.type;
                    stats.componentTypes[type] = (stats.componentTypes[type] || 0) + 1;
                });
            }

            stats.averageComponentsPerPage = stats.totalPages > 0 ? 
                Math.round(stats.totalComponents / stats.totalPages) : 0;

            return stats;
        } catch (error) {
            console.error('Error getting page stats:', error);
            throw error;
        }
    }
}

// Create singleton instance
const pageRepository = new PageRepository();

module.exports = pageRepository;
