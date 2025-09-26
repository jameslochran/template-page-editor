/**
 * AWS S3 Service
 * Work Order #32: Template Upload Initiation and Completion API Endpoints
 * 
 * Handles all AWS S3 interactions including pre-signed URL generation
 * and upload verification for template file uploads.
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

// AWS S3 Configuration
const S3_CONFIG = {
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET_NAME || 'template-editor-uploads',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock-access-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock-secret-key'
};

// Initialize S3 client
const s3Client = new S3Client({
    region: S3_CONFIG.region,
    credentials: {
        accessKeyId: S3_CONFIG.accessKeyId,
        secretAccessKey: S3_CONFIG.secretAccessKey
    }
});

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
    'figma': ['application/zip', 'application/x-zip-compressed'],
    'png': ['image/png'],
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg']
};

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
    'figma': 50 * 1024 * 1024, // 50MB
    'png': 10 * 1024 * 1024,   // 10MB
    'jpg': 10 * 1024 * 1024,   // 10MB
    'jpeg': 10 * 1024 * 1024   // 10MB
};

/**
 * Validates file type and size
 */
const validateFile = (fileName, fileType, fileSize) => {
    const errors = [];
    
    // Extract file extension
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (!ALLOWED_FILE_TYPES[extension]) {
        errors.push(`File type '${extension}' is not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`);
    }
    
    if (fileSize && fileSize > MAX_FILE_SIZES[extension]) {
        errors.push(`File size exceeds maximum allowed size of ${MAX_FILE_SIZES[extension] / (1024 * 1024)}MB`);
    }
    
    if (fileType && ALLOWED_FILE_TYPES[extension] && !ALLOWED_FILE_TYPES[extension].includes(fileType)) {
        errors.push(`MIME type '${fileType}' does not match file extension '${extension}'`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        extension
    };
};

/**
 * Generates a unique S3 key for the file
 */
const generateS3Key = (uploadId, fileName, fileType) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = fileName.split('.').pop().toLowerCase();
    return `templates/${fileType}/${uploadId}/${timestamp}-${fileName}`;
};

/**
 * Generates a pre-signed URL for S3 upload
 */
const generatePresignedUrl = async (fileName, fileType, fileSize, uploadId) => {
    try {
        // Validate file
        const validation = validateFile(fileName, fileType, fileSize);
        if (!validation.isValid) {
            throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Generate S3 key
        const s3Key = generateS3Key(uploadId, fileName, fileType);
        
        // Create S3 command
        const command = new PutObjectCommand({
            Bucket: S3_CONFIG.bucket,
            Key: s3Key,
            ContentType: fileType,
            ContentLength: fileSize,
            Metadata: {
                'upload-id': uploadId,
                'original-filename': fileName,
                'upload-timestamp': new Date().toISOString()
            }
        });
        
        // Generate pre-signed URL (expires in 1 hour)
        const presignedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 3600 // 1 hour
        });
        
        return {
            presignedUrl,
            s3Key,
            bucket: S3_CONFIG.bucket,
            expiresIn: 3600
        };
        
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
    }
};

/**
 * Verifies that a file was successfully uploaded to S3
 */
const verifyUpload = async (s3Key) => {
    try {
        // For mock/testing mode, simulate successful verification
        if (S3_CONFIG.accessKeyId === 'mock-access-key') {
            return {
                exists: true,
                size: 1024000, // Mock file size
                lastModified: new Date(),
                contentType: 'application/zip',
                metadata: {
                    'upload-id': s3Key.split('/')[2],
                    'original-filename': s3Key.split('/').pop(),
                    'upload-timestamp': new Date().toISOString()
                }
            };
        }
        
        const command = new HeadObjectCommand({
            Bucket: S3_CONFIG.bucket,
            Key: s3Key
        });
        
        const response = await s3Client.send(command);
        
        return {
            exists: true,
            size: response.ContentLength,
            lastModified: response.LastModified,
            contentType: response.ContentType,
            metadata: response.Metadata
        };
        
    } catch (error) {
        if (error.name === 'NotFound') {
            return {
                exists: false,
                error: 'File not found in S3'
            };
        }
        
        console.error('Error verifying upload:', error);
        throw new Error(`Failed to verify upload: ${error.message}`);
    }
};

/**
 * Gets the public URL for an uploaded file
 */
const getPublicUrl = (s3Key) => {
    return `https://${S3_CONFIG.bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${s3Key}`;
};

/**
 * Generates a unique upload ID
 */
const generateUploadId = () => {
    return uuidv4();
};

module.exports = {
    generatePresignedUrl,
    verifyUpload,
    getPublicUrl,
    generateUploadId,
    validateFile,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZES,
    S3_CONFIG
};
