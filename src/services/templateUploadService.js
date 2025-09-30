/**
 * Template Upload Service
 * Work Order #38: Implement File Upload Step for Template Creation Wizard
 * 
 * Handles template file upload session management, including upload initiation,
 * progress tracking, and completion verification.
 */

const s3Service = require('./s3Service');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for upload sessions (in production, this would be Redis or a database)
const uploadSessions = new Map();

// Upload session timeout (1 hour)
const UPLOAD_SESSION_TIMEOUT = 60 * 60 * 1000;

/**
 * Template Upload Session class
 */
class TemplateUploadSession {
    constructor(uploadId, fileName, fileType, fileSize, s3Key) {
        this.uploadId = uploadId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.s3Key = s3Key;
        this.status = 'initiated'; // initiated, uploading, completed, failed
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.progress = 0;
        this.error = null;
        this.presignedUrl = null;
        this.expiresAt = null;
    }

    updateProgress(progress) {
        this.progress = Math.min(100, Math.max(0, progress));
        this.updatedAt = new Date();
    }

    setStatus(status, error = null) {
        this.status = status;
        this.error = error;
        this.updatedAt = new Date();
    }

    setPresignedUrl(presignedUrl, expiresIn) {
        this.presignedUrl = presignedUrl;
        this.expiresAt = new Date(Date.now() + (expiresIn * 1000));
    }

    isExpired() {
        return this.expiresAt && new Date() > this.expiresAt;
    }

    toJSON() {
        return {
            uploadId: this.uploadId,
            fileName: this.fileName,
            fileType: this.fileType,
            fileSize: this.fileSize,
            status: this.status,
            progress: this.progress,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            error: this.error,
            expiresAt: this.expiresAt
        };
    }
}

/**
 * Initiates a template file upload session
 */
const initiateTemplateUpload = async (fileName, fileType, fileSize) => {
    try {
        // Validate file
        const validation = s3Service.validateFile(fileName, fileType, fileSize);
        if (!validation.isValid) {
            throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
        }

        // Generate upload ID
        const uploadId = s3Service.generateUploadId();
        
        // Generate S3 key
        const s3Key = s3Service.generateS3Key(uploadId, fileName, validation.extension);
        
        // Create upload session
        const session = new TemplateUploadSession(
            uploadId,
            fileName,
            fileType,
            fileSize,
            s3Key
        );

        // Generate pre-signed URL
        const presignedData = await s3Service.generatePresignedUrl(
            fileName,
            fileType,
            fileSize,
            uploadId
        );

        // Update session with presigned URL
        session.setPresignedUrl(presignedData.presignedUrl, presignedData.expiresIn);
        session.setStatus('initiated');

        // Store session
        uploadSessions.set(uploadId, session);

        // Clean up expired sessions
        cleanupExpiredSessions();

        return {
            uploadId,
            presignedUrl: presignedData.presignedUrl,
            s3Key: presignedData.s3Key,
            expiresIn: presignedData.expiresIn,
            session: session.toJSON()
        };

    } catch (error) {
        console.error('TemplateUploadService: Error initiating upload:', error);
        throw new Error(`Failed to initiate template upload: ${error.message}`);
    }
};

/**
 * Updates upload progress
 */
const updateUploadProgress = (uploadId, progress) => {
    const session = uploadSessions.get(uploadId);
    if (!session) {
        throw new Error(`Upload session not found: ${uploadId}`);
    }

    if (session.isExpired()) {
        uploadSessions.delete(uploadId);
        throw new Error(`Upload session expired: ${uploadId}`);
    }

    session.updateProgress(progress);
    return session.toJSON();
};

/**
 * Completes a template file upload
 */
const completeTemplateUpload = async (uploadId) => {
    try {
        const session = uploadSessions.get(uploadId);
        if (!session) {
            throw new Error(`Upload session not found: ${uploadId}`);
        }

        if (session.isExpired()) {
            uploadSessions.delete(uploadId);
            throw new Error(`Upload session expired: ${uploadId}`);
        }

        // Verify file was uploaded to S3
        const verification = await s3Service.verifyUpload(session.s3Key);
        if (!verification.exists) {
            session.setStatus('failed', 'File not found in S3 after upload');
            throw new Error('File upload verification failed: File not found in S3');
        }

        // Update session status
        session.setStatus('completed');
        session.updateProgress(100);

        // Get public URL
        const publicUrl = s3Service.getPublicUrl(session.s3Key);

        return {
            uploadId,
            status: 'completed',
            s3Key: session.s3Key,
            publicUrl,
            fileSize: verification.size,
            contentType: verification.contentType,
            lastModified: verification.lastModified,
            session: session.toJSON()
        };

    } catch (error) {
        console.error('TemplateUploadService: Error completing upload:', error);
        
        // Mark session as failed
        const session = uploadSessions.get(uploadId);
        if (session) {
            session.setStatus('failed', error.message);
        }
        
        throw new Error(`Failed to complete template upload: ${error.message}`);
    }
};

/**
 * Gets upload session status
 */
const getUploadStatus = (uploadId) => {
    const session = uploadSessions.get(uploadId);
    if (!session) {
        throw new Error(`Upload session not found: ${uploadId}`);
    }

    if (session.isExpired()) {
        uploadSessions.delete(uploadId);
        throw new Error(`Upload session expired: ${uploadId}`);
    }

    return session.toJSON();
};

/**
 * Cancels an upload session
 */
const cancelUpload = (uploadId) => {
    const session = uploadSessions.get(uploadId);
    if (!session) {
        throw new Error(`Upload session not found: ${uploadId}`);
    }

    session.setStatus('cancelled');
    uploadSessions.delete(uploadId);
    
    return {
        uploadId,
        status: 'cancelled'
    };
};

/**
 * Cleans up expired upload sessions
 */
const cleanupExpiredSessions = () => {
    const now = new Date();
    for (const [uploadId, session] of uploadSessions.entries()) {
        if (session.isExpired() || (now - session.createdAt) > UPLOAD_SESSION_TIMEOUT) {
            uploadSessions.delete(uploadId);
        }
    }
};

/**
 * Gets all active upload sessions (for debugging/admin purposes)
 */
const getActiveSessions = () => {
    cleanupExpiredSessions();
    return Array.from(uploadSessions.values()).map(session => session.toJSON());
};

// Clean up expired sessions every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

module.exports = {
    initiateTemplateUpload,
    updateUploadProgress,
    completeTemplateUpload,
    getUploadStatus,
    cancelUpload,
    getActiveSessions,
    TemplateUploadSession
};