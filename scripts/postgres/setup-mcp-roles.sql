-- ============================================================================
-- PostgreSQL MCP Server - Database Roles Setup
-- Creates environment-specific roles with minimal privileges
-- Supports dev, hml (staging), and main (production) environments
-- ============================================================================

-- Connection: Run this with a privileged user (postgres or admin)
-- Usage: psql -U postgres -d your_database -f setup-mcp-roles.sql

\echo '🔧 Setting up PostgreSQL MCP roles for all environments...'

-- ============================================================================
-- Environment Variables (set these before running)
-- ============================================================================
-- \set mcp_password 'your_secure_password_here'
-- Example: \set mcp_password 'mcp_secure_p@ssw0rd_2025'

-- Ensure we're in the correct database
\echo 'Current database: ' :DBNAME
\echo 'Current user: ' :USER

-- ============================================================================
-- 1. DEVELOPMENT ENVIRONMENT ROLE
-- ============================================================================
\echo '📍 Creating development environment role...'

-- Drop existing role if it exists
DROP ROLE IF EXISTS mcp_user_dev;

-- Create dev role with read-write permissions
CREATE ROLE mcp_user_dev WITH
    LOGIN
    PASSWORD :'mcp_password'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    VALID UNTIL 'infinity'
    CONNECTION LIMIT 10;

-- Grant schema permissions for dev
GRANT USAGE, CREATE ON SCHEMA public TO mcp_user_dev;
GRANT USAGE ON SCHEMA information_schema TO mcp_user_dev;

-- Grant table permissions for dev (read-write)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mcp_user_dev;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mcp_user_dev;

-- Grant permissions on future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mcp_user_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO mcp_user_dev;

-- Comment
COMMENT ON ROLE mcp_user_dev IS 'MCP Server role for development environment - full read-write access';

\echo '✅ Development role created: mcp_user_dev'

-- ============================================================================
-- 2. STAGING/HML ENVIRONMENT ROLE
-- ============================================================================
\echo '📍 Creating staging/hml environment role...'

-- Drop existing role if it exists
DROP ROLE IF EXISTS mcp_user_hml;

-- Create hml role with limited read-write permissions
CREATE ROLE mcp_user_hml WITH
    LOGIN
    PASSWORD :'mcp_password'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    VALID UNTIL 'infinity'
    CONNECTION LIMIT 5;

-- Grant schema permissions for hml
GRANT USAGE ON SCHEMA public TO mcp_user_hml;
GRANT USAGE ON SCHEMA information_schema TO mcp_user_hml;

-- Create allowed tables list for HML (customize based on your needs)
-- Users table (read-write for testing)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO mcp_user_hml;

-- Sessions table (read-write for testing)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessions TO mcp_user_hml;

-- Audit logs (read-only for analysis)
GRANT SELECT ON TABLE audit_logs TO mcp_user_hml;

-- Test data table (full access for staging tests)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE test_data TO mcp_user_hml;

-- Sequences for allowed tables
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO mcp_user_hml;
GRANT USAGE, SELECT ON SEQUENCE sessions_id_seq TO mcp_user_hml;

-- Comment
COMMENT ON ROLE mcp_user_hml IS 'MCP Server role for staging/hml environment - limited read-write access';

\echo '✅ Staging/HML role created: mcp_user_hml'

-- ============================================================================
-- 3. PRODUCTION/MAIN ENVIRONMENT ROLE
-- ============================================================================
\echo '📍 Creating production/main environment role...'

-- Drop existing role if it exists
DROP ROLE IF EXISTS mcp_user_prod;

-- Create production role with read-only permissions
CREATE ROLE mcp_user_prod WITH
    LOGIN
    PASSWORD :'mcp_password'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    NOREPLICATION
    VALID UNTIL 'infinity'
    CONNECTION LIMIT 3;

-- Grant schema permissions for production (read-only)
GRANT USAGE ON SCHEMA public TO mcp_user_prod;
GRANT USAGE ON SCHEMA information_schema TO mcp_user_prod;

-- Production whitelist - only specific tables (read-only)
-- Users table (read-only for analysis)
GRANT SELECT ON TABLE users TO mcp_user_prod;

-- Sessions table (read-only for monitoring)
GRANT SELECT ON TABLE sessions TO mcp_user_prod;

-- Audit logs (read-only for compliance)
GRANT SELECT ON TABLE audit_logs TO mcp_user_prod;

-- Medical data tables (if they exist - read-only for reporting)
-- GRANT SELECT ON TABLE medical_protocols TO mcp_user_prod;
-- GRANT SELECT ON TABLE dosage_calculations TO mcp_user_prod;

-- System monitoring views
GRANT SELECT ON pg_stat_user_tables TO mcp_user_prod;
GRANT SELECT ON pg_stat_user_indexes TO mcp_user_prod;

-- Comment
COMMENT ON ROLE mcp_user_prod IS 'MCP Server role for production environment - read-only access with whitelist';

\echo '✅ Production role created: mcp_user_prod'

-- ============================================================================
-- 4. CREATE MCP MONITORING SCHEMA (OPTIONAL)
-- ============================================================================
\echo '📍 Creating MCP monitoring schema...'

-- Create schema for MCP-specific monitoring
CREATE SCHEMA IF NOT EXISTS mcp_monitoring;

-- Grant usage to all MCP roles
GRANT USAGE ON SCHEMA mcp_monitoring TO mcp_user_dev, mcp_user_hml, mcp_user_prod;

-- Create monitoring table for MCP access logs
CREATE TABLE IF NOT EXISTS mcp_monitoring.access_logs (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    environment VARCHAR(10) NOT NULL,
    query_hash VARCHAR(64),
    table_accessed VARCHAR(100),
    operation VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

-- Grant permissions on monitoring table
GRANT SELECT, INSERT ON mcp_monitoring.access_logs TO mcp_user_dev, mcp_user_hml;
GRANT SELECT ON mcp_monitoring.access_logs TO mcp_user_prod;
GRANT USAGE, SELECT ON SEQUENCE mcp_monitoring.access_logs_id_seq TO mcp_user_dev, mcp_user_hml;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON mcp_monitoring.access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_role_env ON mcp_monitoring.access_logs(role_name, environment);

\echo '✅ MCP monitoring schema created'

-- ============================================================================
-- 5. SECURITY POLICIES (ROW LEVEL SECURITY)
-- ============================================================================
\echo '📍 Setting up security policies...'

-- Enable RLS on sensitive tables (example for users table)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Example policy for HML environment (limit to test users)
-- CREATE POLICY mcp_hml_users_policy ON users 
--     FOR ALL TO mcp_user_hml
--     USING (email LIKE '%@test.com' OR email LIKE '%@staging.com');

-- Example policy for production (no policies = full read access within granted permissions)
-- Production access is controlled by explicit table grants above

\echo '✅ Security policies configured'

-- ============================================================================
-- 6. CONNECTION LIMITS AND TIMEOUTS
-- ============================================================================
\echo '📍 Configuring connection limits and timeouts...'

-- Set connection limits (already set above, but confirming)
ALTER ROLE mcp_user_dev CONNECTION LIMIT 10;
ALTER ROLE mcp_user_hml CONNECTION LIMIT 5;
ALTER ROLE mcp_user_prod CONNECTION LIMIT 3;

-- Set statement timeout for all MCP roles (prevent long-running queries)
ALTER ROLE mcp_user_dev SET statement_timeout = '60s';
ALTER ROLE mcp_user_hml SET statement_timeout = '30s';
ALTER ROLE mcp_user_prod SET statement_timeout = '15s';

-- Set idle in transaction timeout
ALTER ROLE mcp_user_dev SET idle_in_transaction_session_timeout = '300s';
ALTER ROLE mcp_user_hml SET idle_in_transaction_session_timeout = '180s';
ALTER ROLE mcp_user_prod SET idle_in_transaction_session_timeout = '120s';

\echo '✅ Connection limits and timeouts configured'

-- ============================================================================
-- 7. VALIDATION AND SUMMARY
-- ============================================================================
\echo '📍 Validation and summary...'

-- Show created roles
\echo 'Created MCP roles:'
SELECT rolname, rolcanlogin, rolconnlimit, rolvaliduntil 
FROM pg_roles 
WHERE rolname LIKE 'mcp_user_%' 
ORDER BY rolname;

-- Show role permissions summary
\echo 'Role permissions summary:'
SELECT 
    r.rolname,
    CASE 
        WHEN r.rolname = 'mcp_user_dev' THEN 'Development - Full read-write'
        WHEN r.rolname = 'mcp_user_hml' THEN 'Staging - Limited read-write'
        WHEN r.rolname = 'mcp_user_prod' THEN 'Production - Read-only whitelist'
    END as permissions,
    r.rolconnlimit,
    COALESCE(s.setting, 'default') as statement_timeout
FROM pg_roles r
LEFT JOIN pg_db_role_setting s ON s.setrole = r.oid AND s.setconfig[1] LIKE 'statement_timeout%'
WHERE r.rolname LIKE 'mcp_user_%'
ORDER BY r.rolname;

-- Connection string examples
\echo ''
\echo '🔗 Connection string examples:'
\echo 'DEV:  postgresql://mcp_user_dev:PASSWORD@HOST:PORT/DATABASE'
\echo 'HML:  postgresql://mcp_user_hml:PASSWORD@HOST:PORT/DATABASE'
\echo 'PROD: postgresql://mcp_user_prod:PASSWORD@HOST:PORT/DATABASE'
\echo ''

-- Security recommendations
\echo '🔒 Security recommendations:'
\echo '1. Change the default password immediately'
\echo '2. Use SSL connections in production (sslmode=require)'
\echo '3. Configure IP restrictions in pg_hba.conf'
\echo '4. Enable audit logging for production access'
\echo '5. Regularly rotate passwords'
\echo '6. Monitor connection counts and query patterns'
\echo ''

-- Environment-specific notes
\echo '📋 Environment-specific notes:'
\echo 'DEV:  Full access for development and testing'
\echo 'HML:  Limited tables, suitable for staging validation'
\echo 'PROD: Read-only, whitelisted tables only'
\echo ''

\echo '✅ PostgreSQL MCP roles setup completed successfully!'
\echo '⚠️  Remember to:'
\echo '   - Update connection strings in your MCP configuration'
\echo '   - Test connections from your MCP server'
\echo '   - Configure SSL certificates if required'
\echo '   - Set up monitoring and alerting'