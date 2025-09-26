-- Migration: Create PageVersion Table
-- Work Order #28: Implement PageVersion Data Model for Page Saving and Version Management
-- 
-- This migration creates the PageVersion table to store page snapshots with metadata
-- for version history and page restoration functionality.

-- Create PageVersion table
CREATE TABLE IF NOT EXISTS page_versions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to Page table
    page_id UUID NOT NULL,
    
    -- Version metadata
    version_number INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- User information
    user_id UUID NOT NULL,
    
    -- Version description
    version_name VARCHAR(255),
    change_description TEXT,
    
    -- Complete page snapshot
    components JSONB NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE page_versions 
ADD CONSTRAINT fk_page_versions_page_id 
FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

-- Note: User table foreign key constraint is commented out since User model may not exist yet
-- Uncomment the following line when User table is available:
-- ALTER TABLE page_versions 
-- ADD CONSTRAINT fk_page_versions_user_id 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add unique constraint to ensure version numbers are unique per page
ALTER TABLE page_versions 
ADD CONSTRAINT uk_page_versions_page_version 
UNIQUE (page_id, version_number);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_versions_page_id ON page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_versions_user_id ON page_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_page_versions_timestamp ON page_versions(timestamp);
CREATE INDEX IF NOT EXISTS idx_page_versions_version_number ON page_versions(page_id, version_number);

-- Add GIN index for JSONB components field for efficient querying
CREATE INDEX IF NOT EXISTS idx_page_versions_components_gin ON page_versions USING GIN (components);

-- Create function to automatically increment version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_page_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO next_version
    FROM page_versions 
    WHERE page_id = p_page_id;
    
    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set version number if not provided
CREATE OR REPLACE FUNCTION set_version_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set version number if it's NULL or 0
    IF NEW.version_number IS NULL OR NEW.version_number = 0 THEN
        NEW.version_number := get_next_version_number(NEW.page_id);
    END IF;
    
    -- Ensure timestamp is set
    IF NEW.timestamp IS NULL THEN
        NEW.timestamp := CURRENT_TIMESTAMP;
    END IF;
    
    -- Set audit timestamps
    NEW.created_at := CURRENT_TIMESTAMP;
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER tr_page_versions_set_version_number
    BEFORE INSERT ON page_versions
    FOR EACH ROW
    EXECUTE FUNCTION set_version_number();

-- Create trigger for UPDATE operations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_page_versions_update_updated_at
    BEFORE UPDATE ON page_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Add comments for documentation
COMMENT ON TABLE page_versions IS 'Stores version history and snapshots of pages for restoration and tracking purposes';
COMMENT ON COLUMN page_versions.id IS 'Unique identifier for the page version';
COMMENT ON COLUMN page_versions.page_id IS 'Foreign key reference to the page this version belongs to';
COMMENT ON COLUMN page_versions.version_number IS 'Sequential version number for the page, auto-incremented per page';
COMMENT ON COLUMN page_versions.timestamp IS 'When this version was created';
COMMENT ON COLUMN page_versions.user_id IS 'User who created this version';
COMMENT ON COLUMN page_versions.version_name IS 'Optional human-readable name for this version';
COMMENT ON COLUMN page_versions.change_description IS 'Optional description of changes made in this version';
COMMENT ON COLUMN page_versions.components IS 'Complete JSONB snapshot of page components at time of version creation';
COMMENT ON COLUMN page_versions.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN page_versions.updated_at IS 'Record last update timestamp';

-- Create view for easy version history querying
CREATE OR REPLACE VIEW page_version_history AS
SELECT 
    pv.id,
    pv.page_id,
    pv.version_number,
    pv.timestamp,
    pv.user_id,
    pv.version_name,
    pv.change_description,
    pv.created_at,
    pv.updated_at,
    -- Component statistics
    jsonb_array_length(pv.components) as component_count,
    -- Version metadata
    CASE 
        WHEN pv.version_number = (SELECT MAX(version_number) FROM page_versions pv2 WHERE pv2.page_id = pv.page_id)
        THEN true 
        ELSE false 
    END as is_latest_version
FROM page_versions pv
ORDER BY pv.page_id, pv.version_number DESC;

COMMENT ON VIEW page_version_history IS 'Convenient view for querying page version history with metadata';

-- Create function to get latest version for a page
CREATE OR REPLACE FUNCTION get_latest_page_version(p_page_id UUID)
RETURNS TABLE (
    id UUID,
    page_id UUID,
    version_number INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    version_name VARCHAR(255),
    change_description TEXT,
    components JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pv.id,
        pv.page_id,
        pv.version_number,
        pv.timestamp,
        pv.user_id,
        pv.version_name,
        pv.change_description,
        pv.components,
        pv.created_at,
        pv.updated_at
    FROM page_versions pv
    WHERE pv.page_id = p_page_id
    ORDER BY pv.version_number DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to get version count for a page
CREATE OR REPLACE FUNCTION get_page_version_count(p_page_id UUID)
RETURNS INTEGER AS $$
DECLARE
    version_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    INTO version_count
    FROM page_versions 
    WHERE page_id = p_page_id;
    
    RETURN COALESCE(version_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to validate components JSONB structure
CREATE OR REPLACE FUNCTION validate_page_components(p_components JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if components is an array
    IF jsonb_typeof(p_components) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if array is not empty (optional validation)
    -- IF jsonb_array_length(p_components) = 0 THEN
    --     RETURN FALSE;
    -- END IF;
    
    -- Additional validation can be added here for component structure
    -- For now, we'll accept any valid JSONB array
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint to validate components structure
ALTER TABLE page_versions 
ADD CONSTRAINT chk_page_versions_components_valid 
CHECK (validate_page_components(components));

-- Create function to clean up old versions (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_page_versions(
    p_page_id UUID,
    p_keep_versions INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old versions, keeping only the most recent p_keep_versions
    WITH versions_to_delete AS (
        SELECT id
        FROM page_versions
        WHERE page_id = p_page_id
        ORDER BY version_number DESC
        OFFSET p_keep_versions
    )
    DELETE FROM page_versions
    WHERE id IN (SELECT id FROM versions_to_delete);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON page_versions TO your_app_user;
-- GRANT USAGE ON SCHEMA public TO your_app_user;
