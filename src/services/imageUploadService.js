/**
 * Image Upload Service
 * Work Order #26: Build ImageUploader Component for Banner Background Images
 * 
 * Handles business logic for general image uploads, distinct from template uploads.
 */

const s3Service = require('./s3Service');
const imageRepository = require('../repositories/imageRepository');
const Image = require('../models/Image');
const { validateInitiateImageUpload, validateCompleteImageUpload } = require('../schemas/imageUpload');

// In-memory storage for upload sessions
const uploadSessions = new Map();

class ImageUploadService {
    /**
     * Initiates an image upload by generating a pre-signed URL
     */
    async initiateImageUpload(data, uploadedBy) {
        try {
            // Validate request data
            const validation = validateInitiateImageUpload(data);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Generate upload ID
            const uploadId = s3Service.generateUploadId();

            // Generate pre-signed URL
            const uploadInfo = await s3Service.generatePresignedUrl(
                data.fileName,
                data.fileType,
                data.fileSize,
                uploadId
            );

            // Store upload session
            const uploadSession = {
                uploadId,
                fileName: data.fileName,
                fileType: data.fileType,
                fileSize: data.fileSize,
                altText: data.altText || '',
                uploadedBy,
                s3Key: uploadInfo.s3Key,
                bucket: uploadInfo.bucket,
                createdAt: new Date().toISOString(),
                status: 'initiated'
            };

            uploadSessions.set(uploadId, uploadSession);

            return {
                uploadId,
                presignedUrl: uploadInfo.presignedUrl,
                expiresIn: uploadInfo.expiresIn,
                s3Key: uploadInfo.s3Key,
                bucket: uploadInfo.bucket
            };

        } catch (error) {
            console.error('Error initiating image upload:', error);
            throw new Error(`Failed to initiate image upload: ${error.message}`);
        }
    }

    /**
     * Completes an image upload and creates the image record
     */
    async completeImageUpload(data, uploadedBy) {
        try {
            // Validate request data
            const validation = validateCompleteImageUpload(data);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Get upload session
            const uploadSession = uploadSessions.get(data.uploadId);
            if (!uploadSession) {
                throw new Error('Upload session not found or expired');
            }

            // Verify upload in S3
            const verification = await s3Service.verifyUpload(data.s3Key);
            if (!verification.exists) {
                throw new Error('File not found in S3');
            }

            // Get public URL
            const publicUrl = s3Service.getPublicUrl(data.s3Key);

            // Create image record
            const image = new Image({
                url: publicUrl,
                altText: data.altText || uploadSession.altText,
                s3Key: data.s3Key,
                bucket: data.bucket,
                uploadedBy,
                fileName: data.fileName,
                fileSize: data.fileSize,
                contentType: data.contentType
            });

            // Save image to repository
            const savedImage = await imageRepository.saveImage(image);

            // Update upload session status
            uploadSession.status = 'completed';
            uploadSession.imageId = savedImage.id;
            uploadSession.completedAt = new Date().toISOString();

            return {
                imageId: savedImage.id,
                url: savedImage.url,
                altText: savedImage.altText,
                s3Key: savedImage.s3Key,
                bucket: savedImage.bucket,
                fileName: savedImage.fileName,
                fileSize: savedImage.fileSize,
                contentType: savedImage.contentType,
                createdAt: savedImage.createdAt
            };

        } catch (error) {
            console.error('Error completing image upload:', error);
            throw new Error(`Failed to complete image upload: ${error.message}`);
        }
    }

    /**
     * Gets upload session status
     */
    async getUploadStatus(uploadId) {
        try {
            if (!uploadId || typeof uploadId !== 'string') {
                throw new Error('Upload ID must be a valid string');
            }

            const uploadSession = uploadSessions.get(uploadId);
            if (!uploadSession) {
                return null;
            }

            return {
                uploadId: uploadSession.uploadId,
                fileName: uploadSession.fileName,
                fileType: uploadSession.fileType,
                fileSize: uploadSession.fileSize,
                status: uploadSession.status,
                createdAt: uploadSession.createdAt,
                completedAt: uploadSession.completedAt,
                imageId: uploadSession.imageId
            };

        } catch (error) {
            console.error('Error getting upload status:', error);
            throw new Error(`Failed to get upload status: ${error.message}`);
        }
    }

    /**
     * Gets all upload sessions for a user
     */
    async getUserUploadSessions(uploadedBy) {
        try {
            if (!uploadedBy || typeof uploadedBy !== 'string') {
                throw new Error('Uploader ID must be a valid string');
            }

            const userSessions = Array.from(uploadSessions.values())
                .filter(session => session.uploadedBy === uploadedBy)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return userSessions.map(session => ({
                uploadId: session.uploadId,
                fileName: session.fileName,
                fileType: session.fileType,
                fileSize: session.fileSize,
                status: session.status,
                createdAt: session.createdAt,
                completedAt: session.completedAt,
                imageId: session.imageId
            }));

        } catch (error) {
            console.error('Error getting user upload sessions:', error);
            throw new Error(`Failed to get user upload sessions: ${error.message}`);
        }
    }

    /**
     * Cancels an upload session
     */
    async cancelUpload(uploadId) {
        try {
            if (!uploadId || typeof uploadId !== 'string') {
                throw new Error('Upload ID must be a valid string');
            }

            const uploadSession = uploadSessions.get(uploadId);
            if (!uploadSession) {
                throw new Error('Upload session not found');
            }

            if (uploadSession.status === 'completed') {
                throw new Error('Cannot cancel completed upload');
            }

            uploadSession.status = 'cancelled';
            uploadSession.cancelledAt = new Date().toISOString();

            return true;

        } catch (error) {
            console.error('Error cancelling upload:', error);
            throw new Error(`Failed to cancel upload: ${error.message}`);
        }
    }

    /**
     * Gets upload statistics
     */
    async getUploadStats() {
        try {
            const allSessions = Array.from(uploadSessions.values());
            
            const stats = {
                total: allSessions.length,
                byStatus: {},
                byFileType: {},
                byUser: {},
                totalSize: allSessions.reduce((sum, session) => sum + session.fileSize, 0),
                recentUploads: allSessions
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10)
            };

            // Count by status
            allSessions.forEach(session => {
                stats.byStatus[session.status] = (stats.byStatus[session.status] || 0) + 1;
            });

            // Count by file type
            allSessions.forEach(session => {
                stats.byFileType[session.fileType] = (stats.byFileType[session.fileType] || 0) + 1;
            });

            // Count by user
            allSessions.forEach(session => {
                stats.byUser[session.uploadedBy] = (stats.byUser[session.uploadedBy] || 0) + 1;
            });

            return stats;

        } catch (error) {
            console.error('Error getting upload stats:', error);
            throw new Error(`Failed to get upload stats: ${error.message}`);
        }
    }

    /**
     * Cleans up expired upload sessions
     */
    async cleanupExpiredSessions() {
        try {
            const now = new Date();
            const expiredSessions = [];

            for (const [uploadId, session] of uploadSessions.entries()) {
                const sessionAge = now - new Date(session.createdAt);
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                if (sessionAge > maxAge && session.status !== 'completed') {
                    expiredSessions.push(uploadId);
                }
            }

            expiredSessions.forEach(uploadId => {
                uploadSessions.delete(uploadId);
            });

            return {
                cleaned: expiredSessions.length,
                remaining: uploadSessions.size
            };

        } catch (error) {
            console.error('Error cleaning up expired sessions:', error);
            throw new Error(`Failed to cleanup expired sessions: ${error.message}`);
        }
    }
}

module.exports = new ImageUploadService();
