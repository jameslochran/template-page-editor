/**
 * DrawingUtils - Work Order 43
 * 
 * Utility functions for drawing, geometry, and hit testing operations.
 * Used by the PNG Region Editor for canvas interactions.
 */

class DrawingUtils {
    /**
     * Check if a point is inside a rectangle
     * @param {number} x - Point x coordinate
     * @param {number} y - Point y coordinate
     * @param {number} rectX - Rectangle x coordinate
     * @param {number} rectY - Rectangle y coordinate
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @returns {boolean} True if point is inside rectangle
     */
    static isPointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
        return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
    }

    /**
     * Check if a point is inside a circle
     * @param {number} x - Point x coordinate
     * @param {number} y - Point y coordinate
     * @param {number} centerX - Circle center x coordinate
     * @param {number} centerY - Circle center y coordinate
     * @param {number} radius - Circle radius
     * @returns {boolean} True if point is inside circle
     */
    static isPointInCircle(x, y, centerX, centerY, radius) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        return distance <= radius;
    }

    /**
     * Get the distance between two points
     * @param {number} x1 - First point x coordinate
     * @param {number} y1 - First point y coordinate
     * @param {number} x2 - Second point x coordinate
     * @param {number} y2 - Second point y coordinate
     * @returns {number} Distance between points
     */
    static getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /**
     * Normalize rectangle coordinates (ensure width and height are positive)
     * @param {number} x1 - First x coordinate
     * @param {number} y1 - First y coordinate
     * @param {number} x2 - Second x coordinate
     * @param {number} y2 - Second y coordinate
     * @returns {Object} Normalized rectangle {x, y, width, height}
     */
    static normalizeRect(x1, y1, x2, y2) {
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        return { x, y, width, height };
    }

    /**
     * Constrain a value within min and max bounds
     * @param {number} value - Value to constrain
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Constrained value
     */
    static constrain(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Get resize handle type based on mouse position relative to rectangle
     * @param {number} x - Mouse x coordinate
     * @param {number} y - Mouse y coordinate
     * @param {number} rectX - Rectangle x coordinate
     * @param {number} rectY - Rectangle y coordinate
     * @param {number} rectWidth - Rectangle width
     * @param {number} rectHeight - Rectangle height
     * @param {number} handleSize - Size of resize handles
     * @returns {string|null} Handle type or null if not over a handle
     */
    static getResizeHandle(x, y, rectX, rectY, rectWidth, rectHeight, handleSize = 8) {
        const halfHandle = handleSize / 2;
        
        // Check each corner and edge
        const handles = {
            'nw': { x: rectX - halfHandle, y: rectY - halfHandle }, // Top-left
            'n': { x: rectX + rectWidth / 2 - halfHandle, y: rectY - halfHandle }, // Top
            'ne': { x: rectX + rectWidth - halfHandle, y: rectY - halfHandle }, // Top-right
            'e': { x: rectX + rectWidth - halfHandle, y: rectY + rectHeight / 2 - halfHandle }, // Right
            'se': { x: rectX + rectWidth - halfHandle, y: rectY + rectHeight - halfHandle }, // Bottom-right
            's': { x: rectX + rectWidth / 2 - halfHandle, y: rectY + rectHeight - halfHandle }, // Bottom
            'sw': { x: rectX - halfHandle, y: rectY + rectHeight - halfHandle }, // Bottom-left
            'w': { x: rectX - halfHandle, y: rectY + rectHeight / 2 - halfHandle } // Left
        };

        for (const [handleType, handlePos] of Object.entries(handles)) {
            if (this.isPointInRect(x, y, handlePos.x, handlePos.y, handleSize, handleSize)) {
                return handleType;
            }
        }

        return null;
    }

    /**
     * Get cursor style for resize handle
     * @param {string} handleType - Type of resize handle
     * @returns {string} CSS cursor style
     */
    static getResizeCursor(handleType) {
        const cursors = {
            'nw': 'nw-resize',
            'n': 'n-resize',
            'ne': 'ne-resize',
            'e': 'e-resize',
            'se': 'se-resize',
            's': 's-resize',
            'sw': 'sw-resize',
            'w': 'w-resize'
        };
        return cursors[handleType] || 'default';
    }

    /**
     * Apply resize operation to rectangle based on handle type
     * @param {Object} rect - Rectangle {x, y, width, height}
     * @param {string} handleType - Type of resize handle
     * @param {number} deltaX - Change in x coordinate
     * @param {number} deltaY - Change in y coordinate
     * @param {number} minSize - Minimum size constraint
     * @returns {Object} New rectangle coordinates
     */
    static applyResize(rect, handleType, deltaX, deltaY, minSize = 20) {
        const { x, y, width, height } = rect;
        let newX = x, newY = y, newWidth = width, newHeight = height;

        switch (handleType) {
            case 'nw': // Top-left
                newX = x + deltaX;
                newY = y + deltaY;
                newWidth = width - deltaX;
                newHeight = height - deltaY;
                break;
            case 'n': // Top
                newY = y + deltaY;
                newHeight = height - deltaY;
                break;
            case 'ne': // Top-right
                newY = y + deltaY;
                newWidth = width + deltaX;
                newHeight = height - deltaY;
                break;
            case 'e': // Right
                newWidth = width + deltaX;
                break;
            case 'se': // Bottom-right
                newWidth = width + deltaX;
                newHeight = height + deltaY;
                break;
            case 's': // Bottom
                newHeight = height + deltaY;
                break;
            case 'sw': // Bottom-left
                newX = x + deltaX;
                newWidth = width - deltaX;
                newHeight = height + deltaY;
                break;
            case 'w': // Left
                newX = x + deltaX;
                newWidth = width - deltaX;
                break;
        }

        // Apply minimum size constraints
        if (newWidth < minSize) {
            if (handleType.includes('w')) {
                newX = x + width - minSize;
            }
            newWidth = minSize;
        }
        if (newHeight < minSize) {
            if (handleType.includes('n')) {
                newY = y + height - minSize;
            }
            newHeight = minSize;
        }

        return { x: newX, y: newY, width: newWidth, height: newHeight };
    }

    /**
     * Convert screen coordinates to canvas coordinates
     * @param {number} screenX - Screen x coordinate
     * @param {number} screenY - Screen y coordinate
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} zoom - Current zoom level
     * @param {number} panX - Current pan x offset
     * @param {number} panY - Current pan y offset
     * @returns {Object} Canvas coordinates {x, y}
     */
    static screenToCanvas(screenX, screenY, canvas, zoom = 1, panX = 0, panY = 0) {
        const rect = canvas.getBoundingClientRect();
        const x = (screenX - rect.left - panX) / zoom;
        const y = (screenY - rect.top - panY) / zoom;
        return { x, y };
    }

    /**
     * Convert canvas coordinates to screen coordinates
     * @param {number} canvasX - Canvas x coordinate
     * @param {number} canvasY - Canvas y coordinate
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} zoom - Current zoom level
     * @param {number} panX - Current pan x offset
     * @param {number} panY - Current pan y offset
     * @returns {Object} Screen coordinates {x, y}
     */
    static canvasToScreen(canvasX, canvasY, canvas, zoom = 1, panX = 0, panY = 0) {
        const rect = canvas.getBoundingClientRect();
        const x = canvasX * zoom + panX + rect.left;
        const y = canvasY * zoom + panY + rect.top;
        return { x, y };
    }

    /**
     * Draw a rectangle with optional border and fill
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Rectangle x coordinate
     * @param {number} y - Rectangle y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {Object} options - Drawing options
     */
    static drawRect(ctx, x, y, width, height, options = {}) {
        const {
            fillColor = null,
            strokeColor = '#000000',
            strokeWidth = 1,
            strokeDash = null,
            opacity = 1
        } = options;

        ctx.save();
        ctx.globalAlpha = opacity;

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, width, height);
        }

        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            if (strokeDash) {
                ctx.setLineDash(strokeDash);
            }
            ctx.strokeRect(x, y, width, height);
        }

        ctx.restore();
    }

    /**
     * Draw resize handles around a rectangle
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Rectangle x coordinate
     * @param {number} y - Rectangle y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {Object} options - Drawing options
     */
    static drawResizeHandles(ctx, x, y, width, height, options = {}) {
        const {
            handleSize = 8,
            handleColor = '#ffffff',
            handleBorder = '#3b82f6',
            borderWidth = 2
        } = options;

        const halfHandle = handleSize / 2;
        const handles = [
            { x: x - halfHandle, y: y - halfHandle }, // Top-left
            { x: x + width / 2 - halfHandle, y: y - halfHandle }, // Top
            { x: x + width - halfHandle, y: y - halfHandle }, // Top-right
            { x: x + width - halfHandle, y: y + height / 2 - halfHandle }, // Right
            { x: x + width - halfHandle, y: y + height - halfHandle }, // Bottom-right
            { x: x + width / 2 - halfHandle, y: y + height - halfHandle }, // Bottom
            { x: x - halfHandle, y: y + height - halfHandle }, // Bottom-left
            { x: x - halfHandle, y: y + height / 2 - halfHandle } // Left
        ];

        handles.forEach(handle => {
            this.drawRect(ctx, handle.x, handle.y, handleSize, handleSize, {
                fillColor: handleColor,
                strokeColor: handleBorder,
                strokeWidth: borderWidth
            });
        });
    }

    /**
     * Draw text with optional background
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} text - Text to draw
     * @param {number} x - Text x coordinate
     * @param {number} y - Text y coordinate
     * @param {Object} options - Drawing options
     */
    static drawText(ctx, text, x, y, options = {}) {
        const {
            fontSize = 12,
            fontFamily = 'Arial, sans-serif',
            color = '#000000',
            backgroundColor = null,
            padding = 4,
            textAlign = 'left',
            textBaseline = 'top'
        } = options;

        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;

        if (backgroundColor) {
            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;
            const textHeight = fontSize;
            
            this.drawRect(ctx, x - padding, y - padding, textWidth + padding * 2, textHeight + padding * 2, {
                fillColor: backgroundColor,
                strokeColor: null
            });
        }

        ctx.fillText(text, x, y);
        ctx.restore();
    }

    /**
     * Check if two rectangles overlap
     * @param {Object} rect1 - First rectangle {x, y, width, height}
     * @param {Object} rect2 - Second rectangle {x, y, width, height}
     * @returns {boolean} True if rectangles overlap
     */
    static rectanglesOverlap(rect1, rect2) {
        return !(rect1.x + rect1.width < rect2.x || 
                rect2.x + rect2.width < rect1.x || 
                rect1.y + rect1.height < rect2.y || 
                rect2.y + rect2.height < rect1.y);
    }

    /**
     * Get the intersection of two rectangles
     * @param {Object} rect1 - First rectangle {x, y, width, height}
     * @param {Object} rect2 - Second rectangle {x, y, width, height}
     * @returns {Object|null} Intersection rectangle or null if no intersection
     */
    static getRectangleIntersection(rect1, rect2) {
        const x = Math.max(rect1.x, rect2.x);
        const y = Math.max(rect1.y, rect2.y);
        const width = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - x;
        const height = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - y;

        if (width <= 0 || height <= 0) {
            return null;
        }

        return { x, y, width, height };
    }
}

// Make DrawingUtils available globally
window.DrawingUtils = DrawingUtils;
