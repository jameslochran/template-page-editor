/**
 * Template Upload Service
 * Work Order #32: Template Upload Initiation and Completion API Endpoints
 * 
 * Manages template-related business logic for file uploads, including
 * creating initial Template records and triggering background processing.
 */

const { v4: uuidv4 } = require('uuid');
const s3Service = require('./s3Service');
const backgroundTasks = require('./backgroundTasks');

// In-memory store for tracking upload sessions
// In production, this would be stored in Redis or a database
const uploadSessions = new Map();

// Template types enum
const TEMPLATE_TYPES = {
    FIGMA: 'Figma',
    PNG: 'PNG'
};

/**
 * Creates a new upload session
 */
const createUploadSession = (fileName, fileType, fileSize, userId) => {
    const uploadId = s3Service.generateUploadId();
    const session = {
        uploadId,
        fileName,
        fileType,
        fileSize,
        userId,
        status: 'initiated',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    uploadSessions.set(uploadId, session);
    return session;
};

/**
 * Gets an upload session by ID
 */
const getUploadSession = (uploadId) => {
    return uploadSessions.get(uploadId);
};

/**
 * Updates an upload session
 */
const updateUploadSession = (uploadId, updates) => {
    const session = uploadSessions.get(uploadId);
    if (!session) {
        throw new Error(`Upload session not found: ${uploadId}`);
    }
    
    const updatedSession = {
        ...session,
        ...updates,
        updatedAt: new Date().toISOString()
    };
    
    uploadSessions.set(uploadId, updatedSession);
    return updatedSession;
};

/**
 * Deletes an upload session
 */
const deleteUploadSession = (uploadId) => {
    return uploadSessions.delete(uploadId);
};

/**
 * Initiates a template upload by generating pre-signed URL
 */
const initiateTemplateUpload = async (fileName, fileType, fileSize, userId) => {
    try {
        // Create upload session
        const session = createUploadSession(fileName, fileType, fileSize, userId);
        
        // Generate pre-signed URL
        const uploadInfo = await s3Service.generatePresignedUrl(
            fileName, 
            fileType, 
            fileSize, 
            session.uploadId
        );
        
        // Update session with S3 information
        updateUploadSession(session.uploadId, {
            s3Key: uploadInfo.s3Key,
            s3Bucket: uploadInfo.bucket,
            presignedUrl: uploadInfo.presignedUrl
        });
        
        return {
            uploadId: session.uploadId,
            presignedUrl: uploadInfo.presignedUrl,
            expiresIn: uploadInfo.expiresIn,
            s3Key: uploadInfo.s3Key
        };
        
    } catch (error) {
        console.error('Error initiating template upload:', error);
        throw new Error(`Failed to initiate template upload: ${error.message}`);
    }
};

/**
 * Completes a template upload and triggers appropriate processing
 */
const completeTemplateUpload = async (uploadId, templateType, originalFileName) => {
    try {
        // Get upload session
        const session = getUploadSession(uploadId);
        if (!session) {
            throw new Error(`Upload session not found: ${uploadId}`);
        }
        
        // Verify upload in S3
        const uploadVerification = await s3Service.verifyUpload(session.s3Key);
        if (!uploadVerification.exists) {
            throw new Error('File was not successfully uploaded to S3');
        }
        
        // Update session status
        updateUploadSession(uploadId, {
            status: 'uploaded',
            s3Verification: uploadVerification
        });
        
        // Determine template type from file extension if not provided
        const fileExtension = originalFileName.split('.').pop().toLowerCase();
        const finalTemplateType = templateType || (fileExtension === 'figma' ? TEMPLATE_TYPES.FIGMA : TEMPLATE_TYPES.PNG);
        
        // Create template record based on type
        let templateRecord;
        
        if (finalTemplateType === TEMPLATE_TYPES.FIGMA) {
            // For Figma files, create initial record and trigger background processing
            templateRecord = await createFigmaTemplateRecord(session, uploadVerification);
            
            // Trigger background processing for Figma files
            await backgroundTasks.queueFigmaProcessing({
                templateId: templateRecord.id,
                s3Key: session.s3Key,
                fileName: originalFileName,
                uploadId: uploadId
            });
            
        } else if (finalTemplateType === TEMPLATE_TYPES.PNG) {
            // For PNG files, create complete template record
            templateRecord = await createPngTemplateRecord(session, uploadVerification);
        } else {
            throw new Error(`Unsupported template type: ${finalTemplateType}`);
        }
        
        // Update session with template information
        updateUploadSession(uploadId, {
            status: 'completed',
            templateId: templateRecord.id,
            templateType: finalTemplateType
        });
        
        return {
            templateId: templateRecord.id,
            templateType: finalTemplateType,
            status: 'completed',
            processingStatus: finalTemplateType === TEMPLATE_TYPES.FIGMA ? 'processing' : 'ready'
        };
        
    } catch (error) {
        console.error('Error completing template upload:', error);
        throw new Error(`Failed to complete template upload: ${error.message}`);
    }
};

/**
 * Creates a template record for Figma files (initial state)
 */
const createFigmaTemplateRecord = async (session, uploadVerification) => {
    const templateId = uuidv4();
    
    // In a real application, this would be saved to a database
    const templateRecord = {
        id: templateId,
        name: session.fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        type: 'Figma',
        status: 'processing',
        fileInfo: {
            originalName: session.fileName,
            s3Key: session.s3Key,
            s3Bucket: session.s3Bucket,
            size: uploadVerification.size,
            contentType: uploadVerification.contentType,
            uploadedAt: uploadVerification.lastModified
        },
        processingInfo: {
            status: 'queued',
            queuedAt: new Date().toISOString(),
            estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Store in memory (in production, save to database)
    // This would be stored in a templates table
    console.log('Created Figma template record:', templateRecord);
    
    return templateRecord;
};

/**
 * Creates a template record for PNG files (complete state)
 */
const createPngTemplateRecord = async (session, uploadVerification) => {
    const templateId = uuidv4();
    
    // In a real application, this would be saved to a database
    const templateRecord = {
        id: templateId,
        name: session.fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        type: 'PNG',
        status: 'ready',
        fileInfo: {
            originalName: session.fileName,
            s3Key: session.s3Key,
            s3Bucket: session.s3Bucket,
            size: uploadVerification.size,
            contentType: uploadVerification.contentType,
            uploadedAt: uploadVerification.lastModified,
            publicUrl: s3Service.getPublicUrl(session.s3Key)
        },
        previewInfo: {
            thumbnailUrl: s3Service.getPublicUrl(session.s3Key), // PNG files can be used as thumbnails directly
            generatedAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Store in memory (in production, save to database)
    console.log('Created PNG template record:', templateRecord);
    
    return templateRecord;
};

/**
 * Gets upload session status
 */
const getUploadStatus = (uploadId) => {
    const session = getUploadSession(uploadId);
    if (!session) {
        throw new Error(`Upload session not found: ${uploadId}`);
    }
    
    return {
        uploadId: session.uploadId,
        status: session.status,
        fileName: session.fileName,
        fileType: session.fileType,
        fileSize: session.fileSize,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        templateId: session.templateId,
        templateType: session.templateType
    };
};

/**
 * Cleans up expired upload sessions
 */
const cleanupExpiredSessions = () => {
    const now = new Date();
    const expiredSessions = [];
    
    for (const [uploadId, session] of uploadSessions.entries()) {
        if (new Date(session.expiresAt) < now) {
            expiredSessions.push(uploadId);
        }
    }
    
    expiredSessions.forEach(uploadId => {
        uploadSessions.delete(uploadId);
    });
    
    return expiredSessions.length;
};

module.exports = {
    initiateTemplateUpload,
    completeTemplateUpload,
    getUploadStatus,
    createUploadSession,
    getUploadSession,
    updateUploadSession,
    deleteUploadSession,
    cleanupExpiredSessions,
    TEMPLATE_TYPES
};
