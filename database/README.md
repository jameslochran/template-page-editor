# Database Schema Documentation

## Overview

This directory contains the database schema and migrations for the Template Page Editor application. The schema supports template browsing, page creation, and version management functionality.

## Files

- `schema.sql` - Complete database schema with all tables, constraints, and sample data
- `migrations/` - Individual migration files for incremental database changes
- `README.md` - This documentation file

## Database Tables

### Core Tables

#### Category
Stores template categories for organization and filtering.
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Unique category name
- `description` (TEXT) - Optional description
- `created_at`, `updated_at` (TIMESTAMP) - Audit timestamps

#### Template
Stores template metadata and component configurations.
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Unique template name
- `description` (TEXT) - Template description
- `category_id` (UUID) - Foreign key to Category
- `preview_image_url` (VARCHAR) - Preview image URL
- `components` (JSONB) - Component configurations
- `created_at`, `updated_at` (TIMESTAMP) - Audit timestamps

#### Page
Stores pages with their component instances and configurations.
- `id` (UUID) - Primary key
- `template_id` (UUID) - Foreign key to Template
- `components` (JSONB) - Component instances
- `created_at`, `updated_at` (TIMESTAMP) - Audit timestamps

#### PageVersion
Stores version history and snapshots of pages for restoration and tracking.
- `id` (UUID) - Primary key
- `page_id` (UUID) - Foreign key to Page
- `version_number` (INTEGER) - Sequential version number per page
- `timestamp` (TIMESTAMP) - When version was created
- `user_id` (UUID) - User who created the version
- `version_name` (VARCHAR) - Optional human-readable name
- `change_description` (TEXT) - Optional change description
- `components` (JSONB) - Complete page component snapshot
- `created_at`, `updated_at` (TIMESTAMP) - Audit timestamps

## Migrations

### 001_create_pages_table.sql
Creates the initial Page table with component storage.

### 002_create_pages_table.sql
Alternative Page table creation (if needed).

### 003_create_page_versions_table.sql
Creates the PageVersion table for version management with:
- Automatic version number incrementing
- Foreign key relationships
- JSONB component storage
- Performance indexes
- Utility functions and triggers

## Key Features

### Version Management
- Automatic version number incrementing per page
- Complete component snapshots in JSONB format
- User tracking for version creation
- Optional version names and change descriptions
- Foreign key integrity with cascade delete

### Performance Optimizations
- GIN indexes on JSONB fields for efficient querying
- Composite indexes for common query patterns
- Optimized foreign key indexes

### Data Integrity
- Comprehensive constraint validation
- Component structure validation
- Unique constraints for version numbers
- Referential integrity with foreign keys

## Usage Examples

### Creating a Page Version
```sql
INSERT INTO PageVersion (page_id, user_id, version_name, change_description, components)
VALUES (
    'page-uuid-here',
    'user-uuid-here',
    'Initial Version',
    'First version of the page',
    '{"components": [...]}'::jsonb
);
```

### Querying Version History
```sql
SELECT * FROM page_version_history 
WHERE page_id = 'page-uuid-here' 
ORDER BY version_number DESC;
```

### Getting Latest Version
```sql
SELECT * FROM PageVersion 
WHERE page_id = 'page-uuid-here' 
ORDER BY version_number DESC 
LIMIT 1;
```

## Dependencies

- PostgreSQL 12+ (for JSONB support)
- UUID extension (uuid-ossp)
- Proper user permissions for table creation and data access

## Notes

- The User table foreign key constraint is commented out in the migration as the User model may not exist yet
- All timestamps use TIME ZONE for proper timezone handling
- JSONB fields are validated with check constraints to ensure data integrity
- The schema includes comprehensive sample data for testing and development