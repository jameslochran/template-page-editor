# Database Schema Documentation

## Overview

This directory contains the database schema for the Template Page Editor project. The schema implements the foundational data model for the template browser system as specified in Work Order #1.

## Schema Files

### `schema.sql`
The main schema definition file containing:
- **Category Table**: Stores template categories for organization and filtering
- **Template Table**: Stores template metadata and component configurations
- **Indexes**: Optimized for efficient querying
- **Constraints**: Data integrity and validation rules
- **Triggers**: Automatic timestamp updates
- **Views**: Common query patterns
- **Sample Data**: For testing and development

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

## Component JSONB Structure

The `components` field stores an array of component objects with this structure:

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

## Indexes

- `idx_category_name`: Fast category name lookups
- `idx_template_category_id`: Fast template filtering by category
- `idx_template_name`: Fast template name lookups
- `idx_template_components`: Fast JSONB component queries (GIN index)
- `idx_template_category_name`: Composite index for category-based queries

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

## Constraints

### Component Structure Validation
Ensures each component object has required fields:
- `type`: Component type identifier
- `configuration`: Component-specific settings
- `defaultValues`: Default content/values

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

## Development Notes

### Adding New Component Types
When adding new component types to the system:
1. Update the component structure validation if needed
2. Add sample data with the new component type
3. Update documentation with new component configuration options

### Performance Considerations
- Use the provided indexes for efficient querying
- Consider pagination for large result sets
- The GIN index on components supports complex JSONB queries

### Data Migration
If migrating from an existing system:
1. Map existing data to the new schema structure
2. Ensure component JSONB structure matches the required format
3. Test data integrity with the provided constraints

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
Ensure all `category_id` values in Template table reference existing Category records.

## Future Enhancements

This schema provides a solid foundation for:
- Template versioning
- User permissions and access control
- Template sharing and collaboration
- Advanced component configurations
- Template usage analytics

## Work Order Compliance

This implementation fulfills all requirements from Work Order #1:
- ✅ Template table with specified fields and types
- ✅ Category table with specified fields and types  
- ✅ Foreign key relationship between tables
- ✅ JSONB components array with required structure
- ✅ Unique constraints on Template.name and Category.name
- ✅ Proper indexing for efficient querying
- ✅ Data integrity constraints and validation
