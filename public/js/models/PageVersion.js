/**
 * PageVersion Model - Work Order 40
 * Represents a single page version with metadata and content
 */
class PageVersion {
    constructor(data = {}) {
        this.id = data.id || null;
        this.pageId = data.pageId || null;
        this.versionNumber = data.versionNumber || 1;
        this.versionName = data.versionName || null;
        this.changeDescription = data.changeDescription || null;
        this.content = data.content || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.createdBy = data.createdBy || null;
        this.isActive = data.isActive || false;
        
        // Validate required fields
        this.validate();
    }

    /**
     * Validate the PageVersion data
     */
    validate() {
        if (!this.pageId) {
            throw new Error('PageVersion requires a pageId');
        }
        if (!this.versionNumber || this.versionNumber < 1) {
            throw new Error('PageVersion requires a valid versionNumber');
        }
        if (!this.createdAt) {
            throw new Error('PageVersion requires a createdAt timestamp');
        }
    }

    /**
     * Get formatted timestamp for display
     * @returns {string} Formatted date string
     */
    getFormattedTimestamp() {
        try {
            const date = new Date(this.createdAt);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Invalid Date';
        }
    }

    /**
     * Get relative time string (e.g., "2 hours ago")
     * @returns {string} Relative time string
     */
    getRelativeTime() {
        try {
            const now = new Date();
            const date = new Date(this.createdAt);
            const diffMs = now - date;
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffSeconds < 60) {
                return 'Just now';
            } else if (diffMinutes < 60) {
                return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
            } else if (diffHours < 24) {
                return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
            } else if (diffDays < 7) {
                return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
            } else {
                return this.getFormattedTimestamp();
            }
        } catch (error) {
            console.error('Error calculating relative time:', error);
            return 'Unknown time';
        }
    }

    /**
     * Get display name for the version
     * @returns {string} Version display name
     */
    getDisplayName() {
        if (this.versionName && this.versionName.trim()) {
            return this.versionName.trim();
        }
        return `Version ${this.versionNumber}`;
    }

    /**
     * Get user display name
     * @returns {string} User display name
     */
    getUserDisplayName() {
        if (this.createdBy) {
            // If createdBy is an object with name property
            if (typeof this.createdBy === 'object' && this.createdBy.name) {
                return this.createdBy.name;
            }
            // If createdBy is a string (user ID or name)
            if (typeof this.createdBy === 'string') {
                return this.createdBy;
            }
        }
        return 'Unknown User';
    }

    /**
     * Check if this version is the current/active version
     * @returns {boolean} True if this is the active version
     */
    isCurrentVersion() {
        return this.isActive === true;
    }

    /**
     * Get a summary of changes for display
     * @returns {string} Change summary
     */
    getChangeSummary() {
        if (this.changeDescription && this.changeDescription.trim()) {
            const description = this.changeDescription.trim();
            // Truncate if too long
            if (description.length > 100) {
                return description.substring(0, 97) + '...';
            }
            return description;
        }
        return 'No description provided';
    }

    /**
     * Convert to JSON representation
     * @returns {Object} JSON representation of the PageVersion
     */
    toJSON() {
        return {
            id: this.id,
            pageId: this.pageId,
            versionNumber: this.versionNumber,
            versionName: this.versionName,
            changeDescription: this.changeDescription,
            content: this.content,
            createdAt: this.createdAt,
            createdBy: this.createdBy,
            isActive: this.isActive
        };
    }

    /**
     * Create PageVersion from API response data
     * @param {Object} apiData - Data from API response
     * @returns {PageVersion} New PageVersion instance
     */
    static fromAPI(apiData) {
        return new PageVersion(apiData);
    }

    /**
     * Create array of PageVersions from API response
     * @param {Array} apiDataArray - Array of data from API response
     * @returns {Array<PageVersion>} Array of PageVersion instances
     */
    static fromAPIArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            return [];
        }
        return apiDataArray.map(data => PageVersion.fromAPI(data));
    }

    /**
     * Sort versions by creation date (newest first)
     * @param {Array<PageVersion>} versions - Array of PageVersion instances
     * @returns {Array<PageVersion>} Sorted array
     */
    static sortByDate(versions) {
        if (!Array.isArray(versions)) {
            return [];
        }
        return versions.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA; // Newest first
        });
    }

    /**
     * Find the current/active version
     * @param {Array<PageVersion>} versions - Array of PageVersion instances
     * @returns {PageVersion|null} Current version or null
     */
    static findCurrentVersion(versions) {
        if (!Array.isArray(versions)) {
            return null;
        }
        return versions.find(version => version.isCurrentVersion()) || null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageVersion;
} else {
    window.PageVersion = PageVersion;
}
