/**
 * Admin Authentication Middleware
 * Work Order #32: Template Upload Initiation and Completion API Endpoints
 * 
 * Provides authentication and authorization for admin-only endpoints.
 * In a production environment, this would integrate with a proper auth system.
 */

// Mock admin user for demonstration
const MOCK_ADMIN_USER = {
    id: 'admin-user-123-abc-456-def',
    email: 'admin@templateeditor.com',
    role: 'admin',
    permissions: ['template_upload', 'template_management']
};

/**
 * Mock authentication middleware for admin endpoints
 * In a real application, this would verify JWT tokens, session cookies, etc.
 */
const authenticateAdmin = (req, res, next) => {
    try {
        // Mock authentication - in production, verify actual auth token
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTHENTICATION_REQUIRED',
                message: 'Please provide a valid authentication token'
            });
        }

        // Mock token validation - in production, verify JWT signature
        const token = authHeader.substring(7);
        if (token !== 'mock-admin-token-123') {
            return res.status(401).json({
                error: 'Invalid authentication token',
                code: 'INVALID_TOKEN',
                message: 'The provided authentication token is invalid'
            });
        }

        // Set user information in request object
        req.user = MOCK_ADMIN_USER;
        req.userId = MOCK_ADMIN_USER.id;
        
        next();
    } catch (error) {
        console.error('Admin authentication error:', error);
        res.status(500).json({
            error: 'Authentication service error',
            code: 'AUTH_SERVICE_ERROR',
            message: 'An error occurred during authentication'
        });
    }
};

/**
 * Authorization middleware to check admin permissions
 */
const authorizeAdmin = (requiredPermission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'User not authenticated',
                    code: 'USER_NOT_AUTHENTICATED',
                    message: 'User must be authenticated before authorization check'
                });
            }

            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'Insufficient privileges',
                    code: 'INSUFFICIENT_PRIVILEGES',
                    message: 'Admin role required for this operation'
                });
            }

            if (requiredPermission && !req.user.permissions.includes(requiredPermission)) {
                return res.status(403).json({
                    error: 'Permission denied',
                    code: 'PERMISSION_DENIED',
                    message: `Required permission: ${requiredPermission}`
                });
            }

            next();
        } catch (error) {
            console.error('Admin authorization error:', error);
            res.status(500).json({
                error: 'Authorization service error',
                code: 'AUTHZ_SERVICE_ERROR',
                message: 'An error occurred during authorization'
            });
        }
    };
};

/**
 * Combined middleware for admin authentication and authorization
 */
const requireAdmin = (requiredPermission = null) => {
    return [authenticateAdmin, authorizeAdmin(requiredPermission)];
};

module.exports = {
    authenticateAdmin,
    authorizeAdmin,
    requireAdmin,
    MOCK_ADMIN_USER
};
