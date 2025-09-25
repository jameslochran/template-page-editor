-- Template Page Editor Database Schema
-- Work Order #1: Template Browser Data Model Implementation
-- 
-- This schema defines the foundational data model for the template browser system
-- enabling storage and management of template metadata, categories, and component configurations.

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CATEGORY TABLE
-- =====================================================
-- Stores template categories for organization and filtering
CREATE TABLE Category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TEMPLATE TABLE
-- =====================================================
-- Stores template metadata and component configurations
CREATE TABLE Template (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category_id UUID NOT NULL REFERENCES Category(id) ON DELETE CASCADE,
    preview_image_url VARCHAR(2048),
    components JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Index on Category.name for efficient category lookups
CREATE INDEX idx_category_name ON Category(name);

-- Index on Template.category_id for efficient template filtering by category
CREATE INDEX idx_template_category_id ON Template(category_id);

-- Index on Template.name for efficient template name lookups
CREATE INDEX idx_template_name ON Template(name);

-- GIN index on Template.components for efficient JSONB queries
CREATE INDEX idx_template_components ON Template USING GIN (components);

-- Composite index for category-based template queries
CREATE INDEX idx_template_category_name ON Template(category_id, name);

-- =====================================================
-- CONSTRAINTS AND VALIDATION
-- =====================================================

-- Ensure components field contains valid JSONB array structure
-- Each component object must have 'type', 'configuration', and 'defaultValues' fields
ALTER TABLE Template 
ADD CONSTRAINT check_components_structure 
CHECK (
    jsonb_typeof(components) = 'array' AND
    (
        components = '[]'::jsonb OR
        (
            SELECT bool_and(
                jsonb_typeof(value) = 'object' AND
                value ? 'type' AND
                value ? 'configuration' AND
                value ? 'defaultValues'
            )
            FROM jsonb_array_elements(components)
        )
    )
);

-- Ensure preview_image_url is a valid URL format (basic validation)
ALTER TABLE Template 
ADD CONSTRAINT check_preview_image_url_format 
CHECK (
    preview_image_url IS NULL OR
    preview_image_url ~ '^https?://[^\s/$.?#].[^\s]*$'
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for Category table
CREATE TRIGGER update_category_updated_at 
    BEFORE UPDATE ON Category 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for Template table
CREATE TRIGGER update_template_updated_at 
    BEFORE UPDATE ON Template 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- =====================================================

-- Insert sample categories
INSERT INTO Category (name, description) VALUES 
    ('Landing Pages', 'Templates for creating effective landing pages'),
    ('Blog Posts', 'Templates for blog post layouts and content'),
    ('Portfolio', 'Templates for showcasing work and projects'),
    ('E-commerce', 'Templates for product pages and online stores'),
    ('Corporate', 'Templates for business and corporate websites');

-- Insert sample templates with component configurations
INSERT INTO Template (name, description, category_id, preview_image_url, components) VALUES 
    (
        'Hero Landing Page',
        'A modern hero section template with call-to-action buttons',
        (SELECT id FROM Category WHERE name = 'Landing Pages'),
        'https://example.com/previews/hero-landing.jpg',
        '[
            {
                "type": "banner",
                "configuration": {
                    "height": "600px",
                    "backgroundType": "gradient",
                    "alignment": "center"
                },
                "defaultValues": {
                    "title": "Welcome to Our Platform",
                    "subtitle": "Build amazing things with our tools",
                    "buttonText": "Get Started"
                }
            },
            {
                "type": "text",
                "configuration": {
                    "fontSize": "18px",
                    "color": "#333333",
                    "alignment": "left"
                },
                "defaultValues": {
                    "content": "This is a sample text component that can be customized."
                }
            }
        ]'::jsonb
    ),
    (
        'Blog Article Layout',
        'A clean and readable template for blog articles',
        (SELECT id FROM Category WHERE name = 'Blog Posts'),
        'https://example.com/previews/blog-article.jpg',
        '[
            {
                "type": "text",
                "configuration": {
                    "fontSize": "24px",
                    "fontWeight": "bold",
                    "color": "#000000"
                },
                "defaultValues": {
                    "content": "Article Title"
                }
            },
            {
                "type": "text",
                "configuration": {
                    "fontSize": "16px",
                    "lineHeight": "1.6",
                    "color": "#444444"
                },
                "defaultValues": {
                    "content": "Article content goes here..."
                }
            }
        ]'::jsonb
    );

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for templates with category information
CREATE VIEW template_with_category AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.category_id,
    c.name as category_name,
    c.description as category_description,
    t.preview_image_url,
    t.components,
    t.created_at,
    t.updated_at
FROM Template t
JOIN Category c ON t.category_id = c.id;

-- View for category statistics
CREATE VIEW category_stats AS
SELECT 
    c.id,
    c.name,
    c.description,
    COUNT(t.id) as template_count,
    c.created_at,
    c.updated_at
FROM Category c
LEFT JOIN Template t ON c.id = t.category_id
GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE Category IS 'Stores template categories for organization and filtering in the template browser';
COMMENT ON TABLE Template IS 'Stores template metadata and component configurations for the template browser system';

COMMENT ON COLUMN Category.id IS 'Unique identifier for the category (UUID)';
COMMENT ON COLUMN Category.name IS 'Unique category name for display and filtering';
COMMENT ON COLUMN Category.description IS 'Optional description of the category purpose';

COMMENT ON COLUMN Template.id IS 'Unique identifier for the template (UUID)';
COMMENT ON COLUMN Template.name IS 'Unique template name for identification';
COMMENT ON COLUMN Template.description IS 'Optional description of the template purpose and features';
COMMENT ON COLUMN Template.category_id IS 'Foreign key reference to Category.id for template organization';
COMMENT ON COLUMN Template.preview_image_url IS 'URL to preview image for the template browser UI';
COMMENT ON COLUMN Template.components IS 'JSONB array containing component configurations with type, configuration, and defaultValues fields';

COMMENT ON CONSTRAINT check_components_structure ON Template IS 'Ensures components field contains valid JSONB array with required object structure';
COMMENT ON CONSTRAINT check_preview_image_url_format ON Template IS 'Basic validation for preview image URL format';
