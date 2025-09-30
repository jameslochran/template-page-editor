/**
 * PngTemplate - Work Order 43
 * 
 * Data model representing a PNG template with its image and defined component regions.
 * Manages the template metadata, image URL, and array of editable regions.
 */

class PngTemplate {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || 'Untitled PNG Template';
        this.description = data.description || '';
        this.imageUrl = data.imageUrl || '';
        this.imageWidth = data.imageWidth || 0;
        this.imageHeight = data.imageHeight || 0;
        this.regions = data.regions || [];
        this.categoryId = data.categoryId || null;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.createdBy = data.createdBy || null;
        this.tags = data.tags || [];
        this.version = data.version || 1;
    }

    /**
     * Generate a unique ID for the PNG template
     * @returns {string} Unique identifier
     */
    generateId() {
        return `png_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Set the template name
     * @param {string} name - Template name
     */
    setName(name) {
        this.name = name;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Set the template description
     * @param {string} description - Template description
     */
    setDescription(description) {
        this.description = description;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Set the image URL and dimensions
     * @param {string} imageUrl - Image URL
     * @param {number} width - Image width
     * @param {number} height - Image height
     */
    setImage(imageUrl, width, height) {
        this.imageUrl = imageUrl;
        this.imageWidth = width;
        this.imageHeight = height;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Add a component region to the template
     * @param {ComponentRegion} region - Component region to add
     */
    addRegion(region) {
        if (region instanceof ComponentRegion) {
            this.regions.push(region);
            this.updatedAt = new Date().toISOString();
        } else {
            throw new Error('Region must be an instance of ComponentRegion');
        }
    }

    /**
     * Remove a component region from the template
     * @param {string} regionId - ID of the region to remove
     * @returns {boolean} True if region was removed
     */
    removeRegion(regionId) {
        const index = this.regions.findIndex(region => region.id === regionId);
        if (index !== -1) {
            this.regions.splice(index, 1);
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    /**
     * Get a component region by ID
     * @param {string} regionId - ID of the region
     * @returns {ComponentRegion|null} Component region or null if not found
     */
    getRegion(regionId) {
        return this.regions.find(region => region.id === regionId) || null;
    }

    /**
     * Update a component region
     * @param {string} regionId - ID of the region to update
     * @param {Object} updates - Updates to apply
     * @returns {boolean} True if region was updated
     */
    updateRegion(regionId, updates) {
        const region = this.getRegion(regionId);
        if (region) {
            Object.assign(region, updates);
            region.updatedAt = new Date().toISOString();
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    /**
     * Get all regions of a specific component type
     * @param {string} componentType - Component type to filter by
     * @returns {Array} Array of component regions
     */
    getRegionsByType(componentType) {
        return this.regions.filter(region => region.componentType === componentType);
    }

    /**
     * Get the selected region
     * @returns {ComponentRegion|null} Selected region or null
     */
    getSelectedRegion() {
        return this.regions.find(region => region.isSelected) || null;
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.regions.forEach(region => region.setSelected(false));
    }

    /**
     * Select a region by ID
     * @param {string} regionId - ID of the region to select
     * @returns {boolean} True if region was selected
     */
    selectRegion(regionId) {
        this.clearSelection();
        const region = this.getRegion(regionId);
        if (region) {
            region.setSelected(true);
            return true;
        }
        return false;
    }

    /**
     * Get regions that contain a specific point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Array} Array of regions containing the point
     */
    getRegionsAtPoint(x, y) {
        return this.regions.filter(region => region.containsPoint(x, y));
    }

    /**
     * Get the topmost region at a specific point
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {ComponentRegion|null} Topmost region or null
     */
    getTopRegionAtPoint(x, y) {
        const regionsAtPoint = this.getRegionsAtPoint(x, y);
        return regionsAtPoint.length > 0 ? regionsAtPoint[regionsAtPoint.length - 1] : null;
    }

    /**
     * Validate all regions in the template
     * @returns {Object} Validation result with isValid and errors
     */
    validateRegions() {
        const errors = [];
        const regionErrors = [];

        this.regions.forEach((region, index) => {
            const validation = region.validate();
            if (!validation.isValid) {
                regionErrors.push({
                    index,
                    regionId: region.id,
                    errors: validation.errors
                });
            }
        });

        if (regionErrors.length > 0) {
            errors.push('Some regions have validation errors');
        }

        return {
            isValid: errors.length === 0,
            errors,
            regionErrors
        };
    }

    /**
     * Check for overlapping regions
     * @returns {Array} Array of overlapping region pairs
     */
    getOverlappingRegions() {
        const overlaps = [];
        
        for (let i = 0; i < this.regions.length; i++) {
            for (let j = i + 1; j < this.regions.length; j++) {
                const region1 = this.regions[i];
                const region2 = this.regions[j];
                
                if (window.DrawingUtils && window.DrawingUtils.rectanglesOverlap(
                    region1.getBounds(), 
                    region2.getBounds()
                )) {
                    overlaps.push({
                        region1: region1.id,
                        region2: region2.id,
                        intersection: window.DrawingUtils.getRectangleIntersection(
                            region1.getBounds(), 
                            region2.getBounds()
                        )
                    });
                }
            }
        }
        
        return overlaps;
    }

    /**
     * Generate the components array for the template
     * @returns {Array} Array of component objects
     */
    generateComponents() {
        return this.regions.map(region => ({
            id: region.id,
            type: region.componentType,
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height,
            defaultValues: region.defaultValues,
            label: region.label
        }));
    }

    /**
     * Set the category ID
     * @param {string} categoryId - Category ID
     */
    setCategory(categoryId) {
        this.categoryId = categoryId;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Add a tag to the template
     * @param {string} tag - Tag to add
     */
    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Remove a tag from the template
     * @param {string} tag - Tag to remove
     */
    removeTag(tag) {
        const index = this.tags.indexOf(tag);
        if (index !== -1) {
            this.tags.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    /**
     * Set the active state
     * @param {boolean} active - Whether the template is active
     */
    setActive(active) {
        this.isActive = active;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Get template statistics
     * @returns {Object} Template statistics
     */
    getStats() {
        const regionTypes = {};
        this.regions.forEach(region => {
            regionTypes[region.componentType] = (regionTypes[region.componentType] || 0) + 1;
        });

        return {
            totalRegions: this.regions.length,
            regionTypes,
            imageDimensions: {
                width: this.imageWidth,
                height: this.imageHeight
            },
            lastUpdated: this.updatedAt,
            version: this.version
        };
    }

    /**
     * Clone the template
     * @returns {PngTemplate} New template instance
     */
    clone() {
        const clonedTemplate = new PngTemplate({
            name: `${this.name} (Copy)`,
            description: this.description,
            imageUrl: this.imageUrl,
            imageWidth: this.imageWidth,
            imageHeight: this.imageHeight,
            categoryId: this.categoryId,
            tags: [...this.tags]
        });

        // Clone all regions
        this.regions.forEach(region => {
            clonedTemplate.addRegion(region.clone());
        });

        return clonedTemplate;
    }

    /**
     * Convert to JSON representation
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            imageUrl: this.imageUrl,
            imageWidth: this.imageWidth,
            imageHeight: this.imageHeight,
            regions: this.regions.map(region => region.toJSON()),
            categoryId: this.categoryId,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy,
            tags: this.tags,
            version: this.version
        };
    }

    /**
     * Create from JSON representation
     * @param {Object} json - JSON representation
     * @returns {PngTemplate} New template instance
     */
    static fromJSON(json) {
        const template = new PngTemplate(json);
        
        // Convert region JSON objects back to ComponentRegion instances
        template.regions = json.regions.map(regionData => 
            ComponentRegion.fromJSON(regionData)
        );
        
        return template;
    }

    /**
     * Create a new empty PNG template
     * @param {string} name - Template name
     * @param {string} imageUrl - Image URL
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {PngTemplate} New template instance
     */
    static create(name, imageUrl, width, height) {
        return new PngTemplate({
            name,
            imageUrl,
            imageWidth: width,
            imageHeight: height
        });
    }
}

// Make PngTemplate available globally
window.PngTemplate = PngTemplate;
