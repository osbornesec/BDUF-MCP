# Implementation Prompt 006: Database Schema Design (1.2.1)

## Persona
You are a **Senior Database Architect and Data Engineer** with 15+ years of experience in designing scalable, high-performance database systems for enterprise applications. You specialize in PostgreSQL optimization, data modeling, indexing strategies, and database migration patterns for complex business domains.

## Context: Interactive BDUF Orchestrator
You are implementing the **Database Schema Design** component as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system will provide the foundational data persistence layer that supports all BDUF orchestration processes with ACID compliance, performance optimization, and scalability.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP server that orchestrates comprehensive project analysis and planning. The Database Schema you're building will:

1. **Support complex project data** with requirements, architecture, and analysis results
2. **Enable real-time collaboration** with session management and state synchronization  
3. **Provide audit trails** for all changes and decision points
4. **Scale to enterprise volumes** with millions of projects and analyses
5. **Maintain data integrity** with proper constraints and relationships
6. **Support advanced querying** for analytics and reporting

### Technical Context
- **Dependencies**: Integrates with all data persistence and retrieval operations
- **Architecture**: PostgreSQL-based system with enterprise patterns
- **Integration**: Core data foundation for all other components
- **Scalability**: Handle large datasets with efficient indexing and partitioning
- **Quality**: ACID compliance, data integrity, and performance optimization

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/database-schema-design

# Regular commits with descriptive messages
git add .
git commit -m "feat(database): implement comprehensive database schema design

- Add core project and task entity schemas with relationships
- Implement user management and authentication schema
- Create collaboration and session management tables
- Add comprehensive indexing strategy for performance
- Implement audit logging and change tracking schema
- Add migration framework with version control"

# Push and create PR
git push origin feature/database-schema-design
```

## Required Context7 Integration

Before implementing any database components, you MUST use Context7 to research database design patterns:

```typescript
// Research database design patterns and best practices
await context7.getLibraryDocs('/postgresql/postgresql');
await context7.getLibraryDocs('/database-design/normalization');
await context7.getLibraryDocs('/database/migrations');

// Research performance optimization patterns
await context7.getLibraryDocs('/postgresql/indexing');
await context7.getLibraryDocs('/database/partitioning');
await context7.getLibraryDocs('/database/query-optimization');

// Research audit and versioning patterns
await context7.getLibraryDocs('/database/audit-logging');
await context7.getLibraryDocs('/database/versioning');
await context7.getLibraryDocs('/database/soft-deletes');
```

## Implementation Requirements

### 1. Core Schema Design

```sql
-- src/infrastructure/database/migrations/001_initial_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'archived', 'cancelled');
CREATE TYPE analysis_type AS ENUM ('requirements', 'architecture', 'technology', 'risk', 'quality');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'review', 'done', 'cancelled', 'deferred');
CREATE TYPE collaboration_role AS ENUM ('owner', 'admin', 'contributor', 'viewer');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Users and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations for multi-tenancy
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User organization memberships
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role collaboration_role NOT NULL DEFAULT 'viewer',
    permissions JSONB DEFAULT '[]',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Projects - core entity
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'draft',
    
    -- Project metadata
    project_type VARCHAR(100),
    industry VARCHAR(100),
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    estimated_duration_weeks INTEGER,
    estimated_budget DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Technical details
    technology_stack JSONB DEFAULT '[]',
    constraints JSONB DEFAULT '{}',
    assumptions JSONB DEFAULT '[]',
    
    -- Timestamps and versioning
    version INTEGER DEFAULT 1,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project requirements
CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
    
    -- Requirement details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    acceptance_criteria JSONB DEFAULT '[]',
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    category VARCHAR(100),
    
    -- Analysis metadata
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    effort_estimate_hours INTEGER,
    dependencies JSONB DEFAULT '[]',
    
    -- Status and validation
    is_validated BOOLEAN DEFAULT false,
    validation_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Architectural components
CREATE TABLE architectural_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES architectural_components(id) ON DELETE CASCADE,
    
    -- Component details
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- service, database, frontend, etc.
    description TEXT,
    
    -- Technical specifications
    technology VARCHAR(100),
    patterns JSONB DEFAULT '[]',
    interfaces JSONB DEFAULT '{}',
    dependencies JSONB DEFAULT '[]',
    
    -- Quality attributes
    scalability_requirements JSONB DEFAULT '{}',
    performance_requirements JSONB DEFAULT '{}',
    security_requirements JSONB DEFAULT '{}',
    
    -- Status
    implementation_status VARCHAR(50) DEFAULT 'planned',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis results
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type analysis_type NOT NULL,
    
    -- Analysis metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    methodology VARCHAR(100),
    
    -- Results and findings
    findings JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    risks JSONB DEFAULT '[]',
    opportunities JSONB DEFAULT '[]',
    
    -- Quality metrics
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    completeness_score DECIMAL(3,2) CHECK (completeness_score >= 0 AND completeness_score <= 1),
    
    -- Processing metadata
    processing_time_seconds INTEGER,
    ai_model_used VARCHAR(100),
    context_sources JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks and work breakdown structure
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Task details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    acceptance_criteria JSONB DEFAULT '[]',
    
    -- Work breakdown
    work_type VARCHAR(100),
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    
    -- Estimation
    estimated_hours INTEGER,
    actual_hours INTEGER,
    
    -- Dependencies and relationships
    dependencies JSONB DEFAULT '[]',
    blockers JSONB DEFAULT '[]',
    
    -- Assignment and tracking
    assigned_to UUID REFERENCES users(id),
    status task_status DEFAULT 'pending',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Scheduling
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration sessions
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Session details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(100), -- review, planning, brainstorming, etc.
    
    -- Session state
    status VARCHAR(50) DEFAULT 'active',
    current_phase VARCHAR(100),
    session_data JSONB DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Configuration
    max_participants INTEGER DEFAULT 50,
    requires_approval BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session participants
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role collaboration_role DEFAULT 'contributor',
    
    -- Participation tracking
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Permissions
    can_edit BOOLEAN DEFAULT true,
    can_approve BOOLEAN DEFAULT false,
    
    UNIQUE(session_id, user_id)
);

-- Approval workflows
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    
    -- Approval details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    approval_type VARCHAR(100), -- design, requirements, architecture, etc.
    
    -- Approval target
    target_type VARCHAR(100), -- project, requirement, analysis, etc.
    target_id UUID NOT NULL,
    
    -- Decision making
    status approval_status DEFAULT 'pending',
    decision_rationale TEXT,
    conditions JSONB DEFAULT '[]',
    
    -- Workflow configuration
    requires_unanimous BOOLEAN DEFAULT false,
    required_approver_count INTEGER DEFAULT 1,
    auto_approve_after_hours INTEGER,
    
    -- Resolution
    approved_by UUID REFERENCES users(id),
    rejected_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval participants
CREATE TABLE approval_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Response
    response approval_status,
    response_notes TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Configuration
    is_required BOOLEAN DEFAULT true,
    weight INTEGER DEFAULT 1,
    
    UNIQUE(approval_id, user_id)
);

-- Audit log for change tracking
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What changed
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    
    -- Who made the change
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES collaboration_sessions(id),
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    changed_fields JSONB,
    
    -- Context
    change_reason VARCHAR(255),
    client_ip INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments and discussions
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Comment target
    target_type VARCHAR(100) NOT NULL, -- project, requirement, task, etc.
    target_id UUID NOT NULL,
    
    -- Comment details
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text', -- text, markdown
    
    -- Threading
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    thread_id UUID,
    
    -- Status
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Notification target
    target_type VARCHAR(100),
    target_id UUID,
    
    -- Delivery
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    delivery_method VARCHAR(50) DEFAULT 'in-app', -- in-app, email, sms
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Indexing Strategy

```sql
-- src/infrastructure/database/migrations/002_indexes.sql

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- Organizations table indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- Organization members indexes
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);

-- Projects table indexes
CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_type ON projects(project_type);
CREATE INDEX idx_projects_industry ON projects(industry);
CREATE INDEX idx_projects_complexity ON projects(complexity_score);
CREATE INDEX idx_projects_active ON projects(is_archived) WHERE is_archived = false;
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Full-text search on projects
CREATE INDEX idx_projects_search ON projects USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Requirements table indexes
CREATE INDEX idx_requirements_project_id ON requirements(project_id);
CREATE INDEX idx_requirements_parent_id ON requirements(parent_id);
CREATE INDEX idx_requirements_priority ON requirements(priority);
CREATE INDEX idx_requirements_category ON requirements(category);
CREATE INDEX idx_requirements_validated ON requirements(is_validated);

-- Full-text search on requirements
CREATE INDEX idx_requirements_search ON requirements USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Architectural components indexes
CREATE INDEX idx_arch_components_project_id ON architectural_components(project_id);
CREATE INDEX idx_arch_components_parent_id ON architectural_components(parent_id);
CREATE INDEX idx_arch_components_type ON architectural_components(type);
CREATE INDEX idx_arch_components_technology ON architectural_components(technology);
CREATE INDEX idx_arch_components_status ON architectural_components(implementation_status);

-- Analyses table indexes
CREATE INDEX idx_analyses_project_id ON analyses(project_id);
CREATE INDEX idx_analyses_type ON analyses(type);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_confidence ON analyses(confidence_score);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);

-- Tasks table indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_work_type ON tasks(work_type);
CREATE INDEX idx_tasks_planned_dates ON tasks(planned_start_date, planned_end_date);
CREATE INDEX idx_tasks_progress ON tasks(progress_percentage);

-- Full-text search on tasks
CREATE INDEX idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Collaboration sessions indexes
CREATE INDEX idx_sessions_project_id ON collaboration_sessions(project_id);
CREATE INDEX idx_sessions_created_by ON collaboration_sessions(created_by);
CREATE INDEX idx_sessions_status ON collaboration_sessions(status);
CREATE INDEX idx_sessions_type ON collaboration_sessions(session_type);
CREATE INDEX idx_sessions_started_at ON collaboration_sessions(started_at);

-- Session participants indexes
CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX idx_session_participants_active ON session_participants(is_active) WHERE is_active = true;

-- Approvals table indexes
CREATE INDEX idx_approvals_project_id ON approvals(project_id);
CREATE INDEX idx_approvals_requested_by ON approvals(requested_by);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_type ON approvals(approval_type);
CREATE INDEX idx_approvals_target ON approvals(target_type, target_id);
CREATE INDEX idx_approvals_created_at ON approvals(created_at);

-- Approval participants indexes
CREATE INDEX idx_approval_participants_approval_id ON approval_participants(approval_id);
CREATE INDEX idx_approval_participants_user_id ON approval_participants(user_id);
CREATE INDEX idx_approval_participants_response ON approval_participants(response);

-- Audit log indexes
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_session_id ON audit_log(session_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);

-- Comments table indexes
CREATE INDEX idx_comments_target ON comments(target_type, target_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_thread_id ON comments(thread_id);
CREATE INDEX idx_comments_resolved ON comments(is_resolved);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_target ON notifications(target_type, target_id);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for);
```

### 3. Migration Framework

```typescript
// src/infrastructure/database/MigrationManager.ts
export interface MigrationManager {
  runMigrations(): Promise<void>;
  rollbackMigration(version: number): Promise<void>;
  getCurrentVersion(): Promise<number>;
  getPendingMigrations(): Promise<Migration[]>;
  validateMigrations(): Promise<ValidationResult>;
}

export interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
  checksum: string;
  appliedAt?: Date;
}

export class PostgreSQLMigrationManager implements MigrationManager {
  private pool: Pool;
  private logger: Logger;
  
  constructor(pool: Pool) {
    this.pool = pool;
    this.logger = new Logger('MigrationManager');
  }
  
  async runMigrations(): Promise<void> {
    // Ensure migration table exists
    await this.ensureMigrationTable();
    
    // Get pending migrations
    const pending = await this.getPendingMigrations();
    
    if (pending.length === 0) {
      this.logger.info('No pending migrations');
      return;
    }
    
    this.logger.info(`Running ${pending.length} pending migrations`);
    
    for (const migration of pending) {
      await this.runSingleMigration(migration);
    }
    
    this.logger.info('All migrations completed successfully');
  }
  
  private async runSingleMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      this.logger.info(`Running migration ${migration.version}: ${migration.name}`);
      
      // Execute migration
      await client.query(migration.up);
      
      // Record migration
      await client.query(
        'INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES ($1, $2, $3, NOW())',
        [migration.version, migration.name, migration.checksum]
      );
      
      await client.query('COMMIT');
      
      this.logger.info(`Migration ${migration.version} completed successfully`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Migration ${migration.version} failed`, { error });
      throw new MigrationError(`Migration ${migration.version} failed: ${error.message}`, error);
    } finally {
      client.release();
    }
  }
}
```

## Success Criteria

### Functional Requirements
1. **Complete Schema**: All entities and relationships properly modeled
2. **Data Integrity**: Proper constraints, foreign keys, and validation
3. **Performance**: Optimized indexing strategy for query patterns
4. **Scalability**: Schema supports large datasets and concurrent access
5. **Audit Trail**: Complete change tracking and audit logging
6. **Migration Support**: Versioned migrations with rollback capability

### Technical Requirements
1. **ACID Compliance**: Full transactional support with proper isolation
2. **Query Performance**: Sub-100ms response for typical queries
3. **Concurrent Access**: Support for 1000+ concurrent connections
4. **Data Security**: Proper access controls and data encryption
5. **Backup/Recovery**: Point-in-time recovery capability

### Quality Standards
1. **Normalization**: Proper 3NF normalization with performance considerations
2. **Documentation**: Complete schema documentation with ER diagrams
3. **Testing**: Comprehensive migration and query testing
4. **Monitoring**: Database performance monitoring and alerting
5. **Maintenance**: Regular maintenance procedures and optimization

Remember that this database schema is the foundation for all data persistence and must support complex queries, real-time collaboration, and enterprise-scale performance requirements.