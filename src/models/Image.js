/**
 * Image Data Model
 * Work Order #26: Build ImageUploader Component for Banner Background Images
 * 
 * Represents an uploaded image with metadata and S3 storage information.
 */

const { v4: uuidv4 } = require('uuid');

class Image {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.url = data.url || '';
        this.altText = data.altText || '';
        this.s3Key = data.s3Key || '';
        this.bucket = data.bucket || '';
        this.uploadedBy = data.uploadedBy || '';
        this.fileName = data.fileName || '';
        this.fileSize = data.fileSize || 0;
        this.contentType = data.contentType || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Validates the image data
     */
    validate() {
        const errors = [];

        if (!this.id || typeof this.id !== 'string') {
            errors.push('Image ID must be a valid string');
        }

        if (!this.url || typeof this.url !== 'string') {
            errors.push('Image URL must be a valid string');
        }

        if (this.altText && typeof this.altText !== 'string') {
            errors.push('Alt text must be a valid string');
        }

        if (!this.s3Key || typeof this.s3Key !== 'string') {
            errors.push('S3 key must be a valid string');
        }

        if (!this.bucket || typeof this.bucket !== 'string') {
            errors.push('S3 bucket must be a valid string');
        }

        if (!this.uploadedBy || typeof this.uploadedBy !== 'string') {
            errors.push('Uploaded by user ID must be a valid string');
        }

        if (!this.fileName || typeof this.fileName !== 'string') {
            errors.push('File name must be a valid string');
        }

        if (this.fileSize && (typeof this.fileSize !== 'number' || this.fileSize < 0)) {
            errors.push('File size must be a non-negative number');
        }

        if (!this.contentType || typeof this.contentType !== 'string') {
            errors.push('Content type must be a valid string');
        }

        if (!this.createdAt || typeof this.createdAt !== 'string') {
            errors.push('Created at must be a valid ISO string');
        }

        if (!this.updatedAt || typeof this.updatedAt !== 'string') {
            errors.push('Updated at must be a valid ISO string');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Updates the image data
     */
    update(data) {
        if (data.url !== undefined) this.url = data.url;
        if (data.altText !== undefined) this.altText = data.altText;
        if (data.s3Key !== undefined) this.s3Key = data.s3Key;
        if (data.bucket !== undefined) this.bucket = data.bucket;
        if (data.uploadedBy !== undefined) this.uploadedBy = data.uploadedBy;
        if (data.fileName !== undefined) this.fileName = data.fileName;
        if (data.fileSize !== undefined) this.fileSize = data.fileSize;
        if (data.contentType !== undefined) this.contentType = data.contentType;
        
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Converts the image to a plain object
     */
    toJSON() {
        return {
            id: this.id,
            url: this.url,
            altText: this.altText,
            s3Key: this.s3Key,
            bucket: this.bucket,
            uploadedBy: this.uploadedBy,
            fileName: this.fileName,
            fileSize: this.fileSize,
            contentType: this.contentType,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Creates an Image instance from a plain object
     */
    static fromJSON(data) {
        return new Image(data);
    }
}

module.exports = Image;
