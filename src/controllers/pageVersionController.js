/**
 * Page Version Controller
 * Work Order #31: Implement Page Version Management API Endpoints
 * 
 * This controller handles the business logic for page version management,
 * including creating, retrieving, and reverting page versions.
 */

const PageVersion = require('../models/PageVersion');
const pageRepository = require('../data/pageRepository');

// In-memory data store for page versions (simulating database)
const pageVersions = [];

/**
 * Create a new page version
 * @param {string} pageId - Page ID
 * @param {Object} options - Version options
 * @returns {Object} Created version metadata
 */
async function createPageVersion(pageId, options = {}) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        // Get current page components
        const currentComponents = page.components || [];

        // Get next version number
        const nextVersionNumber = await getNextVersionNumber(pageId);

        // Create new page version
        const versionData = {
            pageId: pageId,
            components: currentComponents,
            versionNumber: nextVersionNumber,
            userId: options.userId || 'system', // In a real app, this would come from auth
            versionName: options.versionName || null,
            changeDescription: options.changeDescription || null
        };

        const pageVersion = new PageVersion(versionData);
        
        // Store the version
        pageVersions.push(pageVersion.toJSON());

        // Return metadata (excluding components for performance)
        return pageVersion.getMetadata();
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to create page version: ${error.message}`);
    }
}

/**
 * Get all versions for a page
 * @param {string} pageId - Page ID
 * @returns {Array} Array of version metadata
 */
async function getPageVersions(pageId) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        // Get all versions for this page
        const versions = pageVersions
            .filter(v => v.pageId === pageId)
            .sort((a, b) => b.versionNumber - a.versionNumber) // Sort by version number descending
            .map(versionData => {
                const version = new PageVersion(versionData);
                return version.getMetadata();
            });

        return versions;
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to get page versions: ${error.message}`);
    }
}

/**
 * Get specific version content
 * @param {string} pageId - Page ID
 * @param {string} versionId - Version ID
 * @returns {Object} Complete version data including components
 */
async function getPageVersionContent(pageId, versionId) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        // Find the specific version
        const versionData = pageVersions.find(v => v.id === versionId && v.pageId === pageId);
        if (!versionData) {
            const error = new Error('Version not found');
            error.code = 'VERSION_NOT_FOUND';
            throw error;
        }

        const pageVersion = new PageVersion(versionData);
        return pageVersion.getFullData();
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to get page version content: ${error.message}`);
    }
}

/**
 * Revert page to specific version
 * @param {string} pageId - Page ID
 * @param {string} versionId - Version ID to revert to
 * @param {boolean} createBackup - Whether to create a backup of current state
 * @returns {Object} Revert result
 */
async function revertPageToVersion(pageId, versionId, createBackup = true) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        // Find the version to revert to
        const versionData = pageVersions.find(v => v.id === versionId && v.pageId === pageId);
        if (!versionData) {
            const error = new Error('Version not found');
            error.code = 'VERSION_NOT_FOUND';
            throw error;
        }

        const targetVersion = new PageVersion(versionData);

        // Create backup of current state if requested
        let backupVersion = null;
        if (createBackup) {
            const currentComponents = page.components;
            
            // Check if current state is different from target version
            if (!targetVersion.hasSameComponents({ components: currentComponents })) {
                const nextVersionNumber = await getNextVersionNumber(pageId);
                
                const backupData = {
                    pageId: pageId,
                    components: currentComponents,
                    versionNumber: nextVersionNumber,
                    userId: 'system',
                    versionName: `Backup before revert to v${targetVersion.versionNumber}`,
                    changeDescription: `Automatic backup created before reverting to version ${targetVersion.versionNumber}`
                };

                backupVersion = new PageVersion(backupData);
                pageVersions.push(backupVersion.toJSON());
            }
        }

        // Update the page with the target version's components
        const updatedPage = await pageRepository.updatePageComponents(pageId, targetVersion.components);

        return {
            success: true,
            message: 'Page reverted successfully',
            revertedTo: {
                versionId: targetVersion.id,
                versionNumber: targetVersion.versionNumber,
                timestamp: targetVersion.timestamp
            },
            backup: backupVersion ? {
                versionId: backupVersion.id,
                versionNumber: backupVersion.versionNumber
            } : null,
            updatedPage: {
                id: updatedPage.id,
                componentCount: updatedPage.components.length,
                updatedAt: updatedPage.updatedAt
            }
        };
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to revert page: ${error.message}`);
    }
}

/**
 * Get the next version number for a page
 * @param {string} pageId - Page ID
 * @returns {number} Next version number
 */
async function getNextVersionNumber(pageId) {
    const pageVersionsForPage = pageVersions.filter(v => v.pageId === pageId);
    
    if (pageVersionsForPage.length === 0) {
        return 1;
    }

    const maxVersion = Math.max(...pageVersionsForPage.map(v => v.versionNumber));
    return maxVersion + 1;
}

/**
 * Get version statistics for a page
 * @param {string} pageId - Page ID
 * @returns {Object} Version statistics
 */
async function getPageVersionStats(pageId) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        const pageVersionsForPage = pageVersions.filter(v => v.pageId === pageId);
        
        const stats = {
            totalVersions: pageVersionsForPage.length,
            latestVersion: 0,
            oldestVersion: 0,
            versionHistory: []
        };

        if (pageVersionsForPage.length > 0) {
            const versions = pageVersionsForPage.map(v => new PageVersion(v));
            const sortedVersions = versions.sort((a, b) => b.versionNumber - a.versionNumber);
            
            stats.latestVersion = sortedVersions[0].versionNumber;
            stats.oldestVersion = sortedVersions[sortedVersions.length - 1].versionNumber;
            stats.versionHistory = sortedVersions.map(v => v.getSummary());
        }

        return stats;
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to get page version stats: ${error.message}`);
    }
}

/**
 * Delete a specific version
 * @param {string} pageId - Page ID
 * @param {string} versionId - Version ID to delete
 * @returns {Object} Deletion result
 */
async function deletePageVersion(pageId, versionId) {
    try {
        // Check if page exists
        const page = await pageRepository.getPageById(pageId);
        if (!page) {
            const error = new Error('Page not found');
            error.code = 'PAGE_NOT_FOUND';
            throw error;
        }

        // Find the version to delete
        const versionIndex = pageVersions.findIndex(v => v.id === versionId && v.pageId === pageId);
        if (versionIndex === -1) {
            const error = new Error('Version not found');
            error.code = 'VERSION_NOT_FOUND';
            throw error;
        }

        const deletedVersion = pageVersions[versionIndex];
        pageVersions.splice(versionIndex, 1);

        return {
            success: true,
            message: 'Version deleted successfully',
            deletedVersion: {
                id: deletedVersion.id,
                versionNumber: deletedVersion.versionNumber
            }
        };
    } catch (error) {
        if (error.code) {
            throw error;
        }
        throw new Error(`Failed to delete page version: ${error.message}`);
    }
}

module.exports = {
    createPageVersion,
    getPageVersions,
    getPageVersionContent,
    revertPageToVersion,
    getPageVersionStats,
    deletePageVersion
};
