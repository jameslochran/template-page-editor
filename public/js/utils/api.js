/**
 * API Utility Functions
 * Centralized API request functions for the application
 */

class ApiUtils {
    constructor() {
        this.baseUrl = '/api';
        this.adminToken = 'mock-admin-token-123'; // Mock admin token for development
    }

    /**
     * Get common headers for API requests
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth) {
            headers['Authorization'] = `Bearer ${this.adminToken}`;
        }

        return headers;
    }

    /**
     * Make a GET request
     */
    async get(url, includeAuth = true) {
        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                method: 'GET',
                headers: this.getHeaders(includeAuth)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`GET request failed for ${url}:`, error);
            throw error;
        }
    }

    /**
     * Make a POST request
     */
    async post(url, data, includeAuth = true) {
        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                method: 'POST',
                headers: this.getHeaders(includeAuth),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`POST request failed for ${url}:`, error);
            throw error;
        }
    }

    /**
     * Make a PUT request
     */
    async put(url, data, includeAuth = true) {
        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                method: 'PUT',
                headers: this.getHeaders(includeAuth),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`PUT request failed for ${url}:`, error);
            throw error;
        }
    }

    /**
     * Make a DELETE request
     */
    async delete(url, includeAuth = true) {
        try {
            const response = await fetch(`${this.baseUrl}${url}`, {
                method: 'DELETE',
                headers: this.getHeaders(includeAuth)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`DELETE request failed for ${url}:`, error);
            throw error;
        }
    }

    // Category-specific API methods
    /**
     * Get all categories
     */
    async getCategories() {
        return await this.get('/admin/categories');
    }

    /**
     * Get a specific category by ID
     */
    async getCategory(categoryId) {
        return await this.get(`/admin/categories/${categoryId}`);
    }

    /**
     * Create a new category
     */
    async createCategory(categoryData) {
        return await this.post('/admin/categories', categoryData);
    }

    /**
     * Update an existing category
     */
    async updateCategory(categoryId, categoryData) {
        return await this.put(`/admin/categories/${categoryId}`, categoryData);
    }

    /**
     * Delete a category
     */
    async deleteCategory(categoryId) {
        return await this.delete(`/admin/categories/${categoryId}`);
    }

    /**
     * Get category statistics (template count)
     */
    async getCategoryStats(categoryId) {
        return await this.get(`/admin/categories/${categoryId}/stats`);
    }
}

// Create a global instance
window.apiUtils = new ApiUtils();
