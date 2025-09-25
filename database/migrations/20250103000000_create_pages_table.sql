-- Migration: Create Pages Table
-- Work Order #7: Implement Page Data Model with Component Storage
-- 
-- This migration creates the Page table to store pages with their ordered component instances,
-- enabling dynamic page content creation and editing through a flexible component-based architecture.

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

-- =====================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

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
-- Each component object must have 'id', 'type', 'data', and 'order' fields
ALTER TABLE Page 
ADD CONSTRAINT check_components_structure 
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
-- This constraint ensures no duplicate component IDs within a single page
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
-- This constraint ensures no duplicate order values within a single page
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
-- This constraint ensures only valid component types are used
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
-- TRIGGER FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Trigger for Page table to update the updated_at timestamp
CREATE TRIGGER update_page_updated_at 
    BEFORE UPDATE ON Page 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample pages with component instances
-- Note: These reference templates created in the main schema
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
                    "content": "In today's rapidly evolving web development landscape, understanding modern frameworks, tools, and best practices is crucial for building scalable and maintainable applications...",
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
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get components ordered by their order field
CREATE OR REPLACE FUNCTION get_ordered_components(page_uuid UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(component ORDER BY (component->>'order')::numeric)
        FROM (
            SELECT jsonb_array_elements(components) as component
            FROM Page 
            WHERE id = page_uuid
        ) AS components
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get component by ID within a page
CREATE OR REPLACE FUNCTION get_component_by_id(page_uuid UUID, component_id TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT component
        FROM (
            SELECT jsonb_array_elements(components) as component
            FROM Page 
            WHERE id = page_uuid
        ) AS components
        WHERE component->>'id' = component_id
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE Page IS 'Stores pages with their component instances and configurations for dynamic page content creation';

COMMENT ON COLUMN Page.id IS 'Unique identifier for the page (UUID)';
COMMENT ON COLUMN Page.template_id IS 'Foreign key reference to Template.id linking page to source template';
COMMENT ON COLUMN Page.components IS 'JSONB array containing component instances with id, type, data, and order fields';

COMMENT ON CONSTRAINT check_components_structure ON Page IS 'Ensures components field contains valid JSONB array with required object structure (id, type, data, order)';
COMMENT ON CONSTRAINT check_unique_component_ids ON Page IS 'Ensures component IDs are unique within each page';
COMMENT ON CONSTRAINT check_unique_component_orders ON Page IS 'Ensures component order values are unique within each page';
COMMENT ON CONSTRAINT check_valid_component_types ON Page IS 'Validates that only supported component types are used';

COMMENT ON VIEW page_with_template IS 'Combines page data with template and category information for easy querying';
COMMENT ON VIEW page_component_stats IS 'Provides component statistics and types for each page';

COMMENT ON FUNCTION get_ordered_components(UUID) IS 'Returns components for a page ordered by their order field';
COMMENT ON FUNCTION get_component_by_id(UUID, TEXT) IS 'Returns a specific component by ID within a page';
