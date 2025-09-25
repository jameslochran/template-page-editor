-- Template Page Editor Database Schema
-- Work Order #1: Template Browser Data Model Implementation
-- Work Order #7: Page Data Model with Component Storage
-- 
-- This schema defines the foundational data model for the template browser system
-- enabling storage and management of template metadata, categories, component configurations,
-- and pages with their ordered component instances.

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
-- PAGE TABLE
-- =====================================================
-- Stores pages with their component instances and configurations
CREATE TABLE Page (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES Template(id) ON DELETE CASCADE,
    components JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on Page.template_id for efficient template-based page queries
CREATE INDEX idx_page_template_id ON Page(template_id);

-- GIN index on Page.components for efficient JSONB component queries
CREATE INDEX idx_page_components ON Page USING GIN (components);

-- Composite index for template-based page queries with ordering
CREATE INDEX idx_page_template_created ON Page(template_id, created_at);

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

-- Page table constraints

-- Ensure Page components field contains valid JSONB array structure
-- Each component object must have 'id', 'type', 'data', and 'order' fields
ALTER TABLE Page 
ADD CONSTRAINT check_page_components_structure 
CHECK (
    jsonb_typeof(components) = 'array' AND
    (
        components = '[]'::jsonb OR
        (
            SELECT bool_and(
                jsonb_typeof(value) = 'object' AND
                value ? 'id' AND
                value ? 'type' AND
                value ? 'data' AND
                value ? 'order' AND
                jsonb_typeof(value->'id') = 'string' AND
                jsonb_typeof(value->'type') = 'string' AND
                jsonb_typeof(value->'data') = 'object' AND
                jsonb_typeof(value->'order') = 'number'
            )
            FROM jsonb_array_elements(components)
        )
    )
);

-- Ensure component IDs are unique within each page's components array
ALTER TABLE Page 
ADD CONSTRAINT check_unique_component_ids 
CHECK (
    NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(components) AS comp1,
             jsonb_array_elements(components) AS comp2
        WHERE comp1->>'id' = comp2->>'id' 
        AND comp1 != comp2
    )
);

-- Ensure component order values are unique within each page
ALTER TABLE Page 
ADD CONSTRAINT check_unique_component_orders 
CHECK (
    NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(components) AS comp1,
             jsonb_array_elements(components) AS comp2
        WHERE (comp1->>'order')::numeric = (comp2->>'order')::numeric
        AND comp1 != comp2
    )
);

-- Validate component types are supported
ALTER TABLE Page 
ADD CONSTRAINT check_valid_component_types 
CHECK (
    NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(components)
        WHERE value->>'type' NOT IN (
            'TextComponent',
            'ImageComponent', 
            'BannerComponent',
            'ButtonComponent',
            'ContainerComponent',
            'CardComponent',
            'AccordionComponent',
            'LinkGroupComponent'
        )
    )
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

-- Trigger for Page table
CREATE TRIGGER update_page_updated_at 
    BEFORE UPDATE ON Page 
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

-- Insert sample pages with component instances
INSERT INTO Page (template_id, components) VALUES 
    (
        (SELECT id FROM Template WHERE name = 'Hero Landing Page' LIMIT 1),
        '[
            {
                "id": "banner-001",
                "type": "BannerComponent",
                "data": {
                    "title": "Welcome to Our Platform",
                    "subtitle": "Build amazing things with our tools",
                    "buttonText": "Get Started",
                    "backgroundImage": "https://example.com/hero-bg.jpg",
                    "height": "600px",
                    "alignment": "center"
                },
                "order": 1
            },
            {
                "id": "text-001",
                "type": "TextComponent",
                "data": {
                    "content": "This is a sample text component that can be customized with rich content and formatting options.",
                    "fontSize": "18px",
                    "color": "#333333",
                    "alignment": "left",
                    "padding": "20px"
                },
                "order": 2
            },
            {
                "id": "button-001",
                "type": "ButtonComponent",
                "data": {
                    "text": "Learn More",
                    "url": "/about",
                    "style": "primary",
                    "size": "large",
                    "alignment": "center"
                },
                "order": 3
            }
        ]'::jsonb
    ),
    (
        (SELECT id FROM Template WHERE name = 'Blog Article Layout' LIMIT 1),
        '[
            {
                "id": "title-001",
                "type": "TextComponent",
                "data": {
                    "content": "Understanding Modern Web Development",
                    "fontSize": "32px",
                    "fontWeight": "bold",
                    "color": "#000000",
                    "alignment": "center",
                    "margin": "0 0 20px 0"
                },
                "order": 1
            },
            {
                "id": "meta-001",
                "type": "TextComponent",
                "data": {
                    "content": "Published on January 3, 2025 • 5 min read",
                    "fontSize": "14px",
                    "color": "#666666",
                    "alignment": "center",
                    "fontStyle": "italic",
                    "margin": "0 0 30px 0"
                },
                "order": 2
            },
            {
                "id": "content-001",
                "type": "TextComponent",
                "data": {
                    "content": "In today'\''s rapidly evolving web development landscape, understanding modern frameworks, tools, and best practices is crucial for building scalable and maintainable applications...",
                    "fontSize": "16px",
                    "lineHeight": "1.6",
                    "color": "#444444",
                    "alignment": "justify",
                    "padding": "20px"
                },
                "order": 3
            },
            {
                "id": "image-001",
                "type": "ImageComponent",
                "data": {
                    "src": "https://example.com/web-dev-image.jpg",
                    "alt": "Modern web development tools",
                    "width": "100%",
                    "height": "auto",
                    "alignment": "center",
                    "caption": "Modern web development ecosystem"
                },
                "order": 4
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

-- View for pages with template information
CREATE VIEW page_with_template AS
SELECT 
    p.id,
    p.template_id,
    t.name as template_name,
    t.description as template_description,
    c.name as category_name,
    p.components,
    p.created_at,
    p.updated_at
FROM Page p
JOIN Template t ON p.template_id = t.id
JOIN Category c ON t.category_id = c.id;

-- View for component statistics per page
CREATE VIEW page_component_stats AS
SELECT 
    p.id as page_id,
    t.name as template_name,
    jsonb_array_length(p.components) as component_count,
    (
        SELECT jsonb_agg(DISTINCT value->>'type')
        FROM jsonb_array_elements(p.components)
    ) as component_types,
    p.created_at,
    p.updated_at
FROM Page p
JOIN Template t ON p.template_id = t.id;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE Category IS 'Stores template categories for organization and filtering in the template browser';
COMMENT ON TABLE Template IS 'Stores template metadata and component configurations for the template browser system';
COMMENT ON TABLE Page IS 'Stores pages with their component instances and configurations for dynamic page content creation';

COMMENT ON COLUMN Category.id IS 'Unique identifier for the category (UUID)';
COMMENT ON COLUMN Category.name IS 'Unique category name for display and filtering';
COMMENT ON COLUMN Category.description IS 'Optional description of the category purpose';

COMMENT ON COLUMN Template.id IS 'Unique identifier for the template (UUID)';
COMMENT ON COLUMN Template.name IS 'Unique template name for identification';
COMMENT ON COLUMN Template.description IS 'Optional description of the template purpose and features';
COMMENT ON COLUMN Template.category_id IS 'Foreign key reference to Category.id for template organization';
COMMENT ON COLUMN Template.preview_image_url IS 'URL to preview image for the template browser UI';
COMMENT ON COLUMN Template.components IS 'JSONB array containing component configurations with type, configuration, and defaultValues fields';

COMMENT ON COLUMN Page.id IS 'Unique identifier for the page (UUID)';
COMMENT ON COLUMN Page.template_id IS 'Foreign key reference to Template.id linking page to source template';
COMMENT ON COLUMN Page.components IS 'JSONB array containing component instances with id, type, data, and order fields';

COMMENT ON CONSTRAINT check_components_structure ON Template IS 'Ensures components field contains valid JSONB array with required object structure';
COMMENT ON CONSTRAINT check_preview_image_url_format ON Template IS 'Basic validation for preview image URL format';

COMMENT ON CONSTRAINT check_page_components_structure ON Page IS 'Ensures components field contains valid JSONB array with required object structure (id, type, data, order)';
COMMENT ON CONSTRAINT check_unique_component_ids ON Page IS 'Ensures component IDs are unique within each page';
COMMENT ON CONSTRAINT check_unique_component_orders ON Page IS 'Ensures component order values are unique within each page';
COMMENT ON CONSTRAINT check_valid_component_types ON Page IS 'Validates that only supported component types are used';

COMMENT ON VIEW page_with_template IS 'Combines page data with template and category information for easy querying';
COMMENT ON VIEW page_component_stats IS 'Provides component statistics and types for each page';
