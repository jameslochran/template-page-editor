# Database Schema Documentation

## Overview

This directory contains the database schema for the Template Page Editor project. The schema implements the foundational data model for the template browser system (Work Order #1) and the page data model with component storage (Work Order #7).

## Schema Files

### `schema.sql`
The main schema definition file containing:
- **Category Table**: Stores template categories for organization and filtering
- **Template Table**: Stores template metadata and component configurations
- **Page Table**: Stores pages with their component instances and configurations
- **Indexes**: Optimized for efficient querying
- **Constraints**: Data integrity and validation rules
- **Triggers**: Automatic timestamp updates
- **Views**: Common query patterns
- **Sample Data**: For testing and development

### `migrations/20250103000000_create_pages_table.sql`
Migration file for creating the Page table with all constraints, indexes, and sample data.

## Database Requirements

- **PostgreSQL 12+** (required for JSONB and UUID support)
- **UUID Extension**: `uuid-ossp` extension enabled

## Quick Setup

### 1. Create Database
```sql
CREATE DATABASE template_page_editor;
```

### 2. Run Schema
```bash
psql -d template_page_editor -f database/schema.sql
```

### 3. Verify Setup
```sql
-- Check tables were created
\dt

-- Check sample data
SELECT * FROM template_with_category;
```

## Schema Structure

### Category Table
```sql
Category (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### Template Table
```sql
Template (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES Category(id),
    preview_image_url VARCHAR(2048),
    components JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### Page Table
```sql
Page (
    id UUID PRIMARY KEY,
    template_id UUID REFERENCES Template(id),
    components JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

## Component JSONB Structure

### Template Components
Template `components` field stores component definitions with this structure:

```json
[
    {
        "type": "banner|text|image|button|container",
        "configuration": {
            "property1": "value1",
            "property2": "value2"
        },
        "defaultValues": {
            "content": "Default content",
            "text": "Default text"
        }
    }
]
```

### Page Components
Page `components` field stores component instances with this structure:

```json
[
    {
        "id": "unique-component-id",
        "type": "TextComponent|ImageComponent|BannerComponent|...",
        "data": {
            "content": "Actual content",
            "configuration": {...}
        },
        "order": 1
    }
]
```

## Indexes

### Category Indexes
- `idx_category_name`: Fast category name lookups

### Template Indexes
- `idx_template_category_id`: Fast template filtering by category
- `idx_template_name`: Fast template name lookups
- `idx_template_components`: Fast JSONB component queries (GIN index)
- `idx_template_category_name`: Composite index for category-based queries

### Page Indexes
- `idx_page_template_id`: Fast template-based page queries
- `idx_page_components`: Fast JSONB component queries (GIN index)
- `idx_page_template_created`: Composite index for template-based page queries with ordering

## Views

### `template_with_category`
Combines template and category data for easy querying:
```sql
SELECT * FROM template_with_category WHERE category_name = 'Landing Pages';
```

### `category_stats`
Provides template counts per category:
```sql
SELECT * FROM category_stats ORDER BY template_count DESC;
```

### `page_with_template`
Combines page data with template and category information:
```sql
SELECT * FROM page_with_template WHERE template_name = 'Hero Landing Page';
```

### `page_component_stats`
Provides component statistics for each page:
```sql
SELECT * FROM page_component_stats ORDER BY component_count DESC;
```

## Constraints

### Template Component Structure Validation
Ensures each template component object has required fields:
- `type`: Component type identifier
- `configuration`: Component-specific settings
- `defaultValues`: Default content/values

### Page Component Structure Validation
Ensures each page component object has required fields:
- `id`: Unique component identifier within the page
- `type`: Component type identifier
- `data`: Component-specific content and configuration
- `order`: Component position/sequence number

### Uniqueness Constraints
- Component IDs must be unique within each page
- Component order values must be unique within each page
- Only supported component types are allowed

### URL Validation
Basic validation for preview image URLs (must be HTTP/HTTPS).

## Sample Queries

### Get all templates in a category
```sql
SELECT t.*, c.name as category_name 
FROM Template t 
JOIN Category c ON t.category_id = c.id 
WHERE c.name = 'Landing Pages';
```

### Find templates with specific component type
```sql
SELECT * FROM Template 
WHERE components @> '[{"type": "banner"}]';
```

### Get category statistics
```sql
SELECT c.name, COUNT(t.id) as template_count
FROM Category c
LEFT JOIN Template t ON c.id = t.category_id
GROUP BY c.id, c.name
ORDER BY template_count DESC;
```

### Get all pages for a template
```sql
SELECT p.*, t.name as template_name
FROM Page p
JOIN Template t ON p.template_id = t.id
WHERE t.name = 'Hero Landing Page';
```

### Get components for a page ordered by position
```sql
SELECT jsonb_agg(component ORDER BY (component->>'order')::numeric) as ordered_components
FROM (
    SELECT jsonb_array_elements(components) as component
    FROM Page 
    WHERE id = 'page-uuid-here'
) AS components;
```

### Find pages with specific component types
```sql
SELECT p.id, t.name as template_name, 
       jsonb_array_length(p.components) as component_count
FROM Page p
JOIN Template t ON p.template_id = t.id
WHERE p.components @> '[{"type": "BannerComponent"}]';
```

## Development Notes

### Adding New Component Types
When adding new component types to the system:
1. Update the component type validation in both Template and Page constraints
2. Update the Page model's `validComponentTypes` array
3. Add sample data with the new component type
4. Update documentation with new component configuration options
5. Consider the mapping between template component types and page component types

### Performance Considerations
- Use the provided indexes for efficient querying
- Consider pagination for large result sets
- The GIN index on components supports complex JSONB queries

### Data Migration
If migrating from an existing system:
1. Map existing data to the new schema structure
2. Ensure template component JSONB structure matches the required format (type, configuration, defaultValues)
3. Ensure page component JSONB structure matches the required format (id, type, data, order)
4. Generate unique component IDs for existing page components
5. Assign proper order values to existing page components
6. Test data integrity with the provided constraints

## Troubleshooting

### Common Issues

**UUID Extension Not Available**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Component Structure Validation Fails**
Ensure each component object has exactly:
- `type` field
- `configuration` field  
- `defaultValues` field

**Foreign Key Constraint Violations**
- Ensure all `category_id` values in Template table reference existing Category records
- Ensure all `template_id` values in Page table reference existing Template records

**Page Component Validation Errors**
- Ensure each page component has unique ID within the page
- Ensure each page component has unique order value within the page
- Ensure all component types are in the supported list

## Future Enhancements

This schema provides a solid foundation for:
- Template versioning
- Page versioning and history
- User permissions and access control
- Template and page sharing and collaboration
- Advanced component configurations
- Template and page usage analytics
- Component-level permissions and access control
- Page publishing and workflow management

## Work Order Compliance

### Work Order #1 (Template Browser Data Model)
This implementation fulfills all requirements:
- ✅ Template table with specified fields and types
- ✅ Category table with specified fields and types  
- ✅ Foreign key relationship between tables
- ✅ JSONB components array with required structure
- ✅ Unique constraints on Template.name and Category.name
- ✅ Proper indexing for efficient querying
- ✅ Data integrity constraints and validation

### Work Order #7 (Page Data Model with Component Storage)
This implementation fulfills all requirements:
- ✅ Page table with UUID primary key, templateId (FK), and components (JSONB array)
- ✅ Components JSONB field stores array with 'id', 'type', 'data', and 'order' fields
- ✅ Each component instance has unique ID within page's components array
- ✅ Support for component types like 'TextComponent', 'ImageComponent', etc.
- ✅ 'data' field as JSONB for flexible component content/configuration
- ✅ 'order' field maintains component sequence/position
- ✅ Foreign key relationship between Page.templateId and Template.id
- ✅ Support for page initialization from Template components
- ✅ Comprehensive validation and constraints
- ✅ ORM model with full component management functionality
