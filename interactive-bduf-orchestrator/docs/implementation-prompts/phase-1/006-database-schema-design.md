# Prompt 006: Database Schema Design and Implementation

## Persona
You are a **Senior Database Architect** with 12+ years of experience designing scalable, high-performance database systems for enterprise applications. You specialize in PostgreSQL optimization, data modeling, and migration strategies. You have deep expertise in ACID compliance, indexing strategies, and database performance tuning for complex business domains.

## Context
You are implementing the database schema for the Interactive BDUF Orchestrator MCP Server. This schema will support complex project management workflows, real-time collaboration, approval processes, and comprehensive analytics while maintaining data integrity and performance.

## Git Workflow
Before starting implementation, create a new feature branch:
```bash
git checkout -b feature/006-database-schema-design
```

## Required Context from Context7
- PostgreSQL advanced features and best practices
- Database migration strategies for production systems
- Enterprise data modeling patterns

## Implementation Requirements

### 1. Core Entity Schema Design
Create comprehensive database schema:

```sql
-- Core project management entities
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status_enum NOT NULL DEFAULT 'initiation',
    complexity complexity_level_enum NOT NULL DEFAULT 'moderate',
    priority priority_enum NOT NULL DEFAULT 'medium',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Business fields
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    budget_allocated DECIMAL(12,2),
    budget_used DECIMAL(12,2),
    
    -- Configuration
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Search optimization
    search_vector tsvector,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (
        start_date IS NULL OR target_end_date IS NULL OR start_date <= target_end_date
    ),
    CONSTRAINT valid_budget CHECK (
        budget_allocated IS NULL OR budget_allocated >= 0
    )
);

-- Task management with hierarchical structure
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Core task information
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status_enum NOT NULL DEFAULT 'pending',
    priority priority_enum NOT NULL DEFAULT 'medium',
    complexity complexity_level_enum NOT NULL DEFAULT 'moderate',
    
    -- Assignment and tracking
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by UUID REFERENCES users(id),
    
    -- Time tracking
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Dependencies and sequencing
    sequence_order INTEGER,
    is_milestone BOOLEAN DEFAULT FALSE,
    is_critical_path BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Additional data
    custom_fields JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    
    -- Search optimization
    search_vector tsvector,
    
    -- Constraints
    CONSTRAINT no_self_reference CHECK (id != parent_task_id),
    CONSTRAINT valid_hours CHECK (
        estimated_hours IS NULL OR estimated_hours >= 0
    ),
    CONSTRAINT valid_actual_hours CHECK (actual_hours >= 0)
);

-- User management and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    avatar_url TEXT,
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Role and permissions
    role user_role_enum NOT NULL DEFAULT 'developer',
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Security
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- API access
    api_key_hash VARCHAR(255),
    api_key_created_at TIMESTAMP WITH TIME ZONE,
    api_key_last_used TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{
        "email": true,
        "push": true,
        "in_app": true,
        "digest_frequency": "daily"
    }',
    
    -- Search optimization
    search_vector tsvector
);

-- Organization and team management
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    website_url TEXT,
    
    -- Configuration
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Billing
    billing_email VARCHAR(255),
    billing_address JSONB
);

-- Team membership and roles
CREATE TABLE team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'developer',
    
    -- Status
    status membership_status_enum DEFAULT 'active',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    -- Permissions
    custom_permissions TEXT[] DEFAULT '{}',
    
    UNIQUE(organization_id, user_id)
);
```

### 2. BDUF Analysis Schema
Design schema for analysis and requirements:

```sql
-- Requirements management
CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_requirement_id UUID REFERENCES requirements(id),
    
    -- Requirement details
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    type requirement_type_enum NOT NULL,
    priority priority_enum NOT NULL DEFAULT 'medium',
    status requirement_status_enum NOT NULL DEFAULT 'draft',
    
    -- Classification
    category VARCHAR(100),
    source VARCHAR(200),
    stakeholder_id UUID REFERENCES users(id),
    
    -- Analysis
    complexity_score DECIMAL(3,2),
    effort_estimate_hours DECIMAL(8,2),
    risk_level risk_level_enum DEFAULT 'medium',
    
    -- Traceability
    acceptance_criteria JSONB DEFAULT '[]',
    test_cases JSONB DEFAULT '[]',
    related_requirements UUID[] DEFAULT '{}',
    
    -- Versioning
    version INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Additional data
    custom_attributes JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    
    -- Search
    search_vector tsvector
);

-- Architecture decisions and options
CREATE TABLE architecture_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Decision details
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    context TEXT,
    decision TEXT NOT NULL,
    consequences TEXT,
    
    -- Classification
    category architecture_category_enum NOT NULL,
    status decision_status_enum NOT NULL DEFAULT 'proposed',
    
    -- Analysis
    options_considered JSONB DEFAULT '[]',
    evaluation_criteria JSONB DEFAULT '{}',
    risk_assessment JSONB DEFAULT '{}',
    trade_offs JSONB DEFAULT '{}',
    
    -- Decision tracking
    decided_by UUID REFERENCES users(id),
    decided_at TIMESTAMP WITH TIME ZONE,
    review_date DATE,
    superseded_by UUID REFERENCES architecture_decisions(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Versioning
    version INTEGER DEFAULT 1,
    
    -- Search
    search_vector tsvector
);

-- Risk management
CREATE TABLE project_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Risk details
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category risk_category_enum NOT NULL,
    
    -- Risk assessment
    probability risk_probability_enum NOT NULL,
    impact risk_impact_enum NOT NULL,
    risk_score DECIMAL(3,2) GENERATED ALWAYS AS (
        CASE probability
            WHEN 'very_low' THEN 0.1
            WHEN 'low' THEN 0.3
            WHEN 'medium' THEN 0.5
            WHEN 'high' THEN 0.7
            WHEN 'very_high' THEN 0.9
        END *
        CASE impact
            WHEN 'very_low' THEN 1
            WHEN 'low' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'high' THEN 4
            WHEN 'very_high' THEN 5
        END
    ) STORED,
    
    -- Mitigation
    mitigation_strategy TEXT,
    contingency_plan TEXT,
    owner_id UUID REFERENCES users(id),
    status risk_status_enum DEFAULT 'identified',
    
    -- Tracking
    identified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mitigated_at TIMESTAMP WITH TIME ZONE,
    review_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);
```

### 3. Collaboration and Workflow Schema
Design collaboration and approval workflows:

```sql
-- Collaboration sessions
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Session details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    session_type session_type_enum NOT NULL,
    status session_status_enum NOT NULL DEFAULT 'scheduled',
    
    -- Scheduling
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Configuration
    max_participants INTEGER DEFAULT 20,
    is_recording_enabled BOOLEAN DEFAULT FALSE,
    recording_url TEXT,
    
    -- Facilitator
    facilitator_id UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    CONSTRAINT valid_session_times CHECK (
        scheduled_start < scheduled_end
    )
);

-- Session participants
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Participation details
    role participant_role_enum DEFAULT 'participant',
    status participant_status_enum DEFAULT 'invited',
    
    -- Timing
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    
    -- Permissions
    can_edit BOOLEAN DEFAULT FALSE,
    can_moderate BOOLEAN DEFAULT FALSE,
    
    UNIQUE(session_id, user_id)
);

-- Approval workflows
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Workflow details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_type approval_type_enum NOT NULL,
    
    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    is_sequential BOOLEAN DEFAULT FALSE,
    required_approvals INTEGER DEFAULT 1,
    
    -- Conditions
    trigger_conditions JSONB DEFAULT '{}',
    approval_criteria JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- Approval requests and responses
CREATE TABLE approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Request details
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    request_type approval_request_type_enum NOT NULL,
    
    -- Subject of approval
    subject_type VARCHAR(50) NOT NULL, -- 'requirement', 'architecture', 'task', etc.
    subject_id UUID NOT NULL,
    
    -- Status and timing
    status approval_status_enum NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Requestor
    requested_by UUID NOT NULL REFERENCES users(id),
    
    -- Decision summary
    final_decision approval_decision_enum,
    decision_notes TEXT,
    
    -- Metadata
    context_data JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT valid_due_date CHECK (
        due_date IS NULL OR due_date > requested_at
    )
);

-- Individual approval responses
CREATE TABLE approval_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id),
    
    -- Response details
    decision approval_decision_enum NOT NULL,
    comments TEXT,
    conditions TEXT,
    
    -- Timing
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Context
    approval_data JSONB DEFAULT '{}',
    
    UNIQUE(request_id, approver_id)
);
```

### 4. Analytics and Reporting Schema
Design analytics and metrics storage:

```sql
-- Project analytics
CREATE TABLE project_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Metrics snapshot
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Progress metrics
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    in_progress_tasks INTEGER DEFAULT 0,
    blocked_tasks INTEGER DEFAULT 0,
    
    -- Time metrics
    total_estimated_hours DECIMAL(10,2) DEFAULT 0,
    total_actual_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Quality metrics
    requirements_completeness DECIMAL(3,2),
    architecture_coherence_score DECIMAL(3,2),
    risk_score DECIMAL(3,2),
    
    -- Team metrics
    active_team_members INTEGER DEFAULT 0,
    collaboration_sessions_count INTEGER DEFAULT 0,
    
    -- Custom metrics
    custom_metrics JSONB DEFAULT '{}',
    
    UNIQUE(project_id, snapshot_date)
);

-- User activity tracking
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type activity_type_enum NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Context
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- Timing
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    -- Session tracking
    session_id VARCHAR(255)
);

-- Event logging for audit trails
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event details
    event_type audit_event_type_enum NOT NULL,
    event_action VARCHAR(100) NOT NULL,
    event_description TEXT,
    
    -- Actor
    user_id UUID REFERENCES users(id),
    impersonated_by UUID REFERENCES users(id),
    
    -- Target
    target_type VARCHAR(50),
    target_id UUID,
    
    -- Context
    project_id UUID REFERENCES projects(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Timing and source
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);
```

### 5. Database Enums and Types
Define comprehensive type system:

```sql
-- Project and task enums
CREATE TYPE project_status_enum AS ENUM (
    'initiation', 'analysis', 'design', 'planning', 
    'execution', 'completed', 'cancelled', 'on_hold'
);

CREATE TYPE task_status_enum AS ENUM (
    'pending', 'in_progress', 'completed', 'blocked', 
    'cancelled', 'needs_review', 'approved', 'rejected'
);

CREATE TYPE complexity_level_enum AS ENUM (
    'simple', 'moderate', 'complex', 'very_complex'
);

CREATE TYPE priority_enum AS ENUM (
    'low', 'medium', 'high', 'critical'
);

-- User and role enums
CREATE TYPE user_role_enum AS ENUM (
    'admin', 'project_manager', 'architect', 'tech_lead',
    'developer', 'designer', 'qa_engineer', 'business_analyst',
    'stakeholder', 'viewer'
);

CREATE TYPE membership_status_enum AS ENUM (
    'invited', 'active', 'inactive', 'suspended', 'left'
);

-- Requirements and analysis enums
CREATE TYPE requirement_type_enum AS ENUM (
    'functional', 'non_functional', 'business', 'technical', 
    'security', 'performance', 'usability', 'compliance'
);

CREATE TYPE requirement_status_enum AS ENUM (
    'draft', 'review', 'approved', 'implemented', 
    'tested', 'accepted', 'rejected', 'deprecated'
);

CREATE TYPE architecture_category_enum AS ENUM (
    'system', 'component', 'deployment', 'security', 
    'integration', 'data', 'ui_ux', 'performance'
);

CREATE TYPE decision_status_enum AS ENUM (
    'proposed', 'review', 'approved', 'implemented', 
    'superseded', 'rejected'
);

-- Risk management enums
CREATE TYPE risk_category_enum AS ENUM (
    'technical', 'business', 'security', 'performance',
    'resource', 'schedule', 'quality', 'external'
);

CREATE TYPE risk_probability_enum AS ENUM (
    'very_low', 'low', 'medium', 'high', 'very_high'
);

CREATE TYPE risk_impact_enum AS ENUM (
    'very_low', 'low', 'medium', 'high', 'very_high'
);

CREATE TYPE risk_status_enum AS ENUM (
    'identified', 'assessed', 'mitigated', 'monitoring', 
    'closed', 'occurred'
);

-- Collaboration enums
CREATE TYPE session_type_enum AS ENUM (
    'requirements_review', 'architecture_review', 'planning',
    'standup', 'retrospective', 'design_session', 'approval_meeting'
);

CREATE TYPE session_status_enum AS ENUM (
    'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'
);

CREATE TYPE participant_role_enum AS ENUM (
    'facilitator', 'presenter', 'participant', 'observer'
);

CREATE TYPE participant_status_enum AS ENUM (
    'invited', 'accepted', 'declined', 'joined', 'left'
);

-- Approval workflow enums
CREATE TYPE approval_type_enum AS ENUM (
    'requirement_approval', 'architecture_approval', 
    'design_approval', 'implementation_approval',
    'release_approval', 'change_request'
);

CREATE TYPE approval_status_enum AS ENUM (
    'pending', 'in_review', 'approved', 'rejected', 
    'cancelled', 'expired'
);

CREATE TYPE approval_decision_enum AS ENUM (
    'approve', 'reject', 'approve_with_conditions', 'delegate'
);

CREATE TYPE approval_request_type_enum AS ENUM (
    'requirement', 'architecture', 'design', 'implementation',
    'deployment', 'change_request'
);

-- Activity and audit enums
CREATE TYPE activity_type_enum AS ENUM (
    'create', 'update', 'delete', 'view', 'approve', 
    'reject', 'assign', 'unassign', 'comment', 'collaborate'
);

CREATE TYPE audit_event_type_enum AS ENUM (
    'authentication', 'authorization', 'data_change',
    'configuration_change', 'security_event', 'system_event'
);
```

### 6. Indexes and Performance Optimization
Create comprehensive indexing strategy:

```sql
-- Primary performance indexes
CREATE INDEX CONCURRENTLY idx_projects_status_priority 
ON projects (status, priority) WHERE status != 'completed';

CREATE INDEX CONCURRENTLY idx_projects_organization_status 
ON projects (organization_id, status);

CREATE INDEX CONCURRENTLY idx_projects_search_vector 
ON projects USING gin(search_vector);

CREATE INDEX CONCURRENTLY idx_tasks_project_status 
ON tasks (project_id, status);

CREATE INDEX CONCURRENTLY idx_tasks_assigned_status 
ON tasks (assigned_to, status) WHERE assigned_to IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_tasks_parent_sequence 
ON tasks (parent_task_id, sequence_order) WHERE parent_task_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_tasks_search_vector 
ON tasks USING gin(search_vector);

-- User and authentication indexes
CREATE INDEX CONCURRENTLY idx_users_email_active 
ON users (email) WHERE is_active = true;

CREATE INDEX CONCURRENTLY idx_users_organization_role 
ON team_memberships (organization_id, role);

CREATE INDEX CONCURRENTLY idx_users_api_key_hash 
ON users (api_key_hash) WHERE api_key_hash IS NOT NULL;

-- Analytics and reporting indexes
CREATE INDEX CONCURRENTLY idx_user_activities_user_occurred 
ON user_activities (user_id, occurred_at DESC);

CREATE INDEX CONCURRENTLY idx_user_activities_project_type 
ON user_activities (project_id, activity_type, occurred_at DESC);

CREATE INDEX CONCURRENTLY idx_audit_logs_target_occurred 
ON audit_logs (target_type, target_id, occurred_at DESC);

-- Collaboration indexes
CREATE INDEX CONCURRENTLY idx_collaboration_sessions_project_scheduled 
ON collaboration_sessions (project_id, scheduled_start);

CREATE INDEX CONCURRENTLY idx_approval_requests_status_due 
ON approval_requests (status, due_date) WHERE status = 'pending';

-- Partial indexes for performance
CREATE INDEX CONCURRENTLY idx_tasks_incomplete 
ON tasks (project_id, priority, created_at) 
WHERE status IN ('pending', 'in_progress', 'blocked');

CREATE INDEX CONCURRENTLY idx_requirements_current_version 
ON requirements (project_id, type, status) 
WHERE is_current_version = true;

-- JSONB indexes for metadata searches
CREATE INDEX CONCURRENTLY idx_projects_settings 
ON projects USING gin(settings);

CREATE INDEX CONCURRENTLY idx_tasks_custom_fields 
ON tasks USING gin(custom_fields);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_project_analytics_date_project 
ON project_analytics (snapshot_date DESC, project_id);

CREATE INDEX CONCURRENTLY idx_approval_workflow_active_type 
ON approval_workflows (workflow_type, is_active) WHERE is_active = true;
```

## File Structure
```
src/database/
├── migrations/
│   ├── 001_initial_schema.sql      # Core tables and enums
│   ├── 002_indexes_and_constraints.sql # Performance optimization
│   ├── 003_triggers_and_functions.sql  # Business logic
│   ├── 004_analytics_schema.sql    # Analytics and reporting
│   ├── 005_seed_data.sql          # Initial data setup
│   └── 999_cleanup_and_optimize.sql # Final optimizations
├── functions/
│   ├── update_search_vectors.sql   # Full-text search functions
│   ├── audit_triggers.sql         # Audit logging triggers
│   ├── validation_functions.sql   # Data validation functions
│   └── analytics_functions.sql    # Analytics calculations
├── views/
│   ├── project_dashboard.sql      # Dashboard views
│   ├── user_permissions.sql       # Permission views
│   └── analytics_summary.sql      # Analytics views
├── procedures/
│   ├── project_lifecycle.sql      # Project management procedures
│   ├── task_management.sql        # Task operations
│   └── approval_workflows.sql     # Approval processes
└── seeds/
    ├── default_organizations.sql   # Default data
    ├── default_users.sql          # Test users
    └── sample_projects.sql        # Sample data
```

## Success Criteria
- [ ] Complete database schema supporting all business requirements
- [ ] Optimized indexes for all critical query patterns
- [ ] Data integrity constraints and validation rules
- [ ] Audit trails and activity logging
- [ ] Full-text search capabilities
- [ ] Analytics and reporting support
- [ ] Migration scripts for safe deployment
- [ ] Performance benchmarks meeting requirements

## Quality Standards
- All foreign key relationships properly defined
- Comprehensive data validation at database level
- Optimized for read and write performance
- Proper use of JSONB for flexible schema requirements
- Database-level security and row-level security where needed
- Comprehensive backup and recovery procedures

## Output Format
Implement the complete database schema with:
1. All table definitions with proper relationships
2. Comprehensive enum types and constraints
3. Optimized indexing strategy
4. Migration scripts for safe deployment
5. Seed data for development and testing
6. Performance monitoring and optimization
7. Documentation for schema design decisions

Focus on creating a production-ready database schema that supports complex business workflows while maintaining excellent performance and data integrity.