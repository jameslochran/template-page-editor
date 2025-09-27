/**
 * Image Repository
 * Work Order #26: Build ImageUploader Component for Banner Background Images
 * 
 * Handles database interactions for Image model operations.
 */

const Image = require('../models/Image');

// In-memory storage for images (in a real app, this would be a database)
const images = new Map();

class ImageRepository {
    /**
     * Saves an image to the repository
     */
    async saveImage(image) {
        try {
            if (!(image instanceof Image)) {
                throw new Error('Invalid image instance');
            }

            const validation = image.validate();
            if (!validation.isValid) {
                throw new Error(`Invalid image data: ${validation.errors.join(', ')}`);
            }

            images.set(image.id, image);
            return image;
        } catch (error) {
            console.error('Error saving image:', error);
            throw new Error(`Failed to save image: ${error.message}`);
        }
    }

    /**
     * Retrieves an image by ID
     */
    async getImageById(id) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Image ID must be a valid string');
            }

            const image = images.get(id);
            if (!image) {
                return null;
            }

            return image;
        } catch (error) {
            console.error('Error retrieving image:', error);
            throw new Error(`Failed to retrieve image: ${error.message}`);
        }
    }

    /**
     * Retrieves all images
     */
    async getAllImages() {
        try {
            return Array.from(images.values());
        } catch (error) {
            console.error('Error retrieving all images:', error);
            throw new Error(`Failed to retrieve images: ${error.message}`);
        }
    }

    /**
     * Retrieves images by uploader
     */
    async getImagesByUploader(uploadedBy) {
        try {
            if (!uploadedBy || typeof uploadedBy !== 'string') {
                throw new Error('Uploader ID must be a valid string');
            }

            const userImages = Array.from(images.values())
                .filter(image => image.uploadedBy === uploadedBy);
            
            return userImages;
        } catch (error) {
            console.error('Error retrieving images by uploader:', error);
            throw new Error(`Failed to retrieve images by uploader: ${error.message}`);
        }
    }

    /**
     * Updates an image
     */
    async updateImage(id, updateData) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Image ID must be a valid string');
            }

            const image = images.get(id);
            if (!image) {
                throw new Error('Image not found');
            }

            image.update(updateData);
            
            const validation = image.validate();
            if (!validation.isValid) {
                throw new Error(`Invalid updated image data: ${validation.errors.join(', ')}`);
            }

            images.set(id, image);
            return image;
        } catch (error) {
            console.error('Error updating image:', error);
            throw new Error(`Failed to update image: ${error.message}`);
        }
    }

    /**
     * Deletes an image
     */
    async deleteImage(id) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Image ID must be a valid string');
            }

            const image = images.get(id);
            if (!image) {
                throw new Error('Image not found');
            }

            images.delete(id);
            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }

    /**
     * Searches images by criteria
     */
    async searchImages(criteria = {}) {
        try {
            let results = Array.from(images.values());

            if (criteria.uploadedBy) {
                results = results.filter(image => image.uploadedBy === criteria.uploadedBy);
            }

            if (criteria.contentType) {
                results = results.filter(image => image.contentType === criteria.contentType);
            }

            if (criteria.minFileSize) {
                results = results.filter(image => image.fileSize >= criteria.minFileSize);
            }

            if (criteria.maxFileSize) {
                results = results.filter(image => image.fileSize <= criteria.maxFileSize);
            }

            if (criteria.createdAfter) {
                const afterDate = new Date(criteria.createdAfter);
                results = results.filter(image => new Date(image.createdAt) > afterDate);
            }

            if (criteria.createdBefore) {
                const beforeDate = new Date(criteria.createdBefore);
                results = results.filter(image => new Date(image.createdAt) < beforeDate);
            }

            return results;
        } catch (error) {
            console.error('Error searching images:', error);
            throw new Error(`Failed to search images: ${error.message}`);
        }
    }

    /**
     * Gets image statistics
     */
    async getImageStats() {
        try {
            const allImages = Array.from(images.values());
            
            const stats = {
                total: allImages.length,
                totalSize: allImages.reduce((sum, image) => sum + image.fileSize, 0),
                byContentType: {},
                byUploader: {},
                recentUploads: allImages
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10)
            };

            // Count by content type
            allImages.forEach(image => {
                stats.byContentType[image.contentType] = (stats.byContentType[image.contentType] || 0) + 1;
            });

            // Count by uploader
            allImages.forEach(image => {
                stats.byUploader[image.uploadedBy] = (stats.byUploader[image.uploadedBy] || 0) + 1;
            });

            return stats;
        } catch (error) {
            console.error('Error getting image stats:', error);
            throw new Error(`Failed to get image stats: ${error.message}`);
        }
    }
}

module.exports = new ImageRepository();
