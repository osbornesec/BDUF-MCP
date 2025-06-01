# Prompt 003: Constants and Enums Implementation

## Persona
You are a **Senior TypeScript System Architect** with 8+ years of experience designing maintainable, scalable application constants and type systems. You specialize in creating comprehensive enum and constant systems that provide excellent developer experience, type safety, and maintainability. You have deep expertise in TypeScript enums, const assertions, and application configuration patterns.

## Context
You are implementing the constants and enums system for the Interactive BDUF Orchestrator MCP Server. This system will provide centralized, type-safe constants used throughout the application for error codes, status values, configuration keys, and business logic constants.

## Git Workflow
Before starting implementation, create a new feature branch:
```bash
git checkout -b feature/003-constants-and-enums
```

## Required Context from Context7
- TypeScript enum best practices and patterns
- Const assertion patterns for type safety
- Application configuration and constants organization

## Implementation Requirements

### 1. Error Codes and Messages
Create comprehensive error code system:

```typescript
// Error codes with descriptions
export const ErrorCodes = {
  // Validation errors (1000-1999)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Authentication/Authorization errors (2000-2999)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Resource errors (3000-3999)
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  
  // External service errors (4000-4999)
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  CONTEXT7_ERROR: 'CONTEXT7_ERROR',
  PERPLEXITY_ERROR: 'PERPLEXITY_ERROR',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  
  // System errors (5000-5999)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

### 2. Status Enums
Define comprehensive status enumerations:

```typescript
export enum ProjectStatus {
  INITIATION = 'initiation',
  ANALYSIS = 'analysis',
  DESIGN = 'design',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
  NEEDS_REVIEW = 'needs_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum SessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  TERMINATED = 'terminated'
}
```

### 3. Priority and Severity Levels
Create priority and severity systems:

```typescript
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  VERY_COMPLEX = 'very_complex'
}

export enum ConfidenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}
```

### 4. User Roles and Permissions
Define role-based access control constants:

```typescript
export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  ARCHITECT = 'architect',
  TECH_LEAD = 'tech_lead',
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  QA_ENGINEER = 'qa_engineer',
  BUSINESS_ANALYST = 'business_analyst',
  STAKEHOLDER = 'stakeholder',
  VIEWER = 'viewer'
}

export enum Permission {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  EXECUTE = 'execute',
  MANAGE_USERS = 'manage_users',
  MANAGE_PROJECTS = 'manage_projects',
  MANAGE_SYSTEM = 'manage_system'
}

export const RolePermissions = {
  [UserRole.ADMIN]: [
    Permission.CREATE,
    Permission.READ,
    Permission.UPDATE,
    Permission.DELETE,
    Permission.APPROVE,
    Permission.EXECUTE,
    Permission.MANAGE_USERS,
    Permission.MANAGE_PROJECTS,
    Permission.MANAGE_SYSTEM
  ],
  [UserRole.PROJECT_MANAGER]: [
    Permission.CREATE,
    Permission.READ,
    Permission.UPDATE,
    Permission.DELETE,
    Permission.APPROVE,
    Permission.MANAGE_PROJECTS
  ],
  [UserRole.ARCHITECT]: [
    Permission.CREATE,
    Permission.READ,
    Permission.UPDATE,
    Permission.APPROVE
  ],
  [UserRole.DEVELOPER]: [
    Permission.CREATE,
    Permission.READ,
    Permission.UPDATE,
    Permission.EXECUTE
  ],
  [UserRole.VIEWER]: [
    Permission.READ
  ]
} as const;
```

### 5. Event Types and Categories
Define event system constants:

```typescript
export enum EventType {
  // Project events
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_STATUS_CHANGED = 'project_status_changed',
  PROJECT_DELETED = 'project_deleted',
  
  // Task events
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  
  // Collaboration events
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  MESSAGE_SENT = 'message_sent',
  
  // Approval events
  APPROVAL_REQUESTED = 'approval_requested',
  APPROVAL_GRANTED = 'approval_granted',
  APPROVAL_DENIED = 'approval_denied',
  APPROVAL_EXPIRED = 'approval_expired',
  
  // System events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  ERROR_OCCURRED = 'error_occurred',
  PERFORMANCE_ALERT = 'performance_alert'
}

export enum EventCategory {
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  AUDIT = 'audit'
}
```

### 6. Configuration Keys and Defaults
Create configuration management constants:

```typescript
export const ConfigKeys = {
  // Server configuration
  SERVER_PORT: 'server.port',
  SERVER_HOST: 'server.host',
  SERVER_NODE_ENV: 'server.nodeEnv',
  
  // Database configuration
  DATABASE_HOST: 'database.host',
  DATABASE_PORT: 'database.port',
  DATABASE_NAME: 'database.name',
  DATABASE_USER: 'database.user',
  DATABASE_PASSWORD: 'database.password',
  DATABASE_SSL: 'database.ssl',
  DATABASE_MAX_CONNECTIONS: 'database.maxConnections',
  
  // Redis configuration
  REDIS_HOST: 'redis.host',
  REDIS_PORT: 'redis.port',
  REDIS_PASSWORD: 'redis.password',
  REDIS_DB: 'redis.db',
  
  // Authentication
  JWT_SECRET: 'auth.jwtSecret',
  JWT_EXPIRES_IN: 'auth.jwtExpiresIn',
  BCRYPT_ROUNDS: 'auth.bcryptRounds',
  
  // External APIs
  CONTEXT7_API_KEY: 'externalApis.context7ApiKey',
  PERPLEXITY_API_KEY: 'externalApis.perplexityApiKey',
  OPENAI_API_KEY: 'externalApis.openaiApiKey',
  
  // Logging
  LOG_LEVEL: 'logging.level',
  LOG_FORMAT: 'logging.format',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 'rateLimit.windowMs',
  RATE_LIMIT_MAX_REQUESTS: 'rateLimit.maxRequests',
  
  // Features
  ENABLE_COLLABORATION: 'features.enableCollaboration',
  ENABLE_AI_ANALYSIS: 'features.enableAiAnalysis',
  ENABLE_APPROVAL_WORKFLOWS: 'features.enableApprovalWorkflows'
} as const;

export const DefaultConfig = {
  [ConfigKeys.SERVER_PORT]: 3000,
  [ConfigKeys.SERVER_HOST]: 'localhost',
  [ConfigKeys.SERVER_NODE_ENV]: 'development',
  [ConfigKeys.DATABASE_PORT]: 5432,
  [ConfigKeys.DATABASE_SSL]: false,
  [ConfigKeys.DATABASE_MAX_CONNECTIONS]: 20,
  [ConfigKeys.REDIS_PORT]: 6379,
  [ConfigKeys.REDIS_DB]: 0,
  [ConfigKeys.JWT_EXPIRES_IN]: '24h',
  [ConfigKeys.BCRYPT_ROUNDS]: 12,
  [ConfigKeys.LOG_LEVEL]: 'info',
  [ConfigKeys.LOG_FORMAT]: 'json',
  [ConfigKeys.RATE_LIMIT_WINDOW_MS]: 900000,
  [ConfigKeys.RATE_LIMIT_MAX_REQUESTS]: 100,
  [ConfigKeys.ENABLE_COLLABORATION]: true,
  [ConfigKeys.ENABLE_AI_ANALYSIS]: true,
  [ConfigKeys.ENABLE_APPROVAL_WORKFLOWS]: true
} as const;
```

### 7. MCP Protocol Constants
Define MCP-specific constants:

```typescript
export const MCPConstants = {
  PROTOCOL_VERSION: '2025-03-26',
  MAX_REQUEST_SIZE: 10485760, // 10MB
  MAX_RESPONSE_SIZE: 10485760, // 10MB
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_CONCURRENT_REQUESTS: 100,
  
  CAPABILITY_NAMES: {
    TOOLS: 'tools',
    RESOURCES: 'resources',
    PROMPTS: 'prompts',
    LOGGING: 'logging'
  },
  
  TOOL_CATEGORIES: {
    ANALYSIS: 'analysis',
    COLLABORATION: 'collaboration',
    PLANNING: 'planning',
    EXECUTION: 'execution',
    DOCUMENTATION: 'documentation'
  }
} as const;

export enum MCPMethodType {
  INITIALIZE = 'initialize',
  LIST_TOOLS = 'tools/list',
  CALL_TOOL = 'tools/call',
  LIST_RESOURCES = 'resources/list',
  READ_RESOURCE = 'resources/read',
  LIST_PROMPTS = 'prompts/list',
  GET_PROMPT = 'prompts/get'
}
```

### 8. Business Logic Constants
Create domain-specific constants:

```typescript
export const BusinessConstants = {
  // Task estimation
  TASK_ESTIMATION: {
    MIN_HOURS: 0.5,
    MAX_HOURS: 80,
    DEFAULT_HOURS: 4,
    COMPLEXITY_MULTIPLIERS: {
      [ComplexityLevel.SIMPLE]: 1,
      [ComplexityLevel.MODERATE]: 2,
      [ComplexityLevel.COMPLEX]: 4,
      [ComplexityLevel.VERY_COMPLEX]: 8
    }
  },
  
  // Project limits
  PROJECT_LIMITS: {
    MAX_TASKS_PER_PROJECT: 1000,
    MAX_STAKEHOLDERS_PER_PROJECT: 50,
    MAX_PROJECT_DURATION_DAYS: 365,
    MAX_PROJECT_NAME_LENGTH: 255,
    MAX_PROJECT_DESCRIPTION_LENGTH: 2000
  },
  
  // Collaboration limits
  COLLABORATION_LIMITS: {
    MAX_PARTICIPANTS_PER_SESSION: 20,
    MAX_SESSION_DURATION_HOURS: 8,
    MAX_MESSAGE_LENGTH: 1000,
    MAX_FILE_SIZE_MB: 10
  },
  
  // Analysis thresholds
  ANALYSIS_THRESHOLDS: {
    REQUIREMENTS_COMPLETENESS_MIN: 0.8,
    ARCHITECTURE_CONFIDENCE_MIN: 0.7,
    RISK_SCORE_HIGH: 0.8,
    RISK_SCORE_CRITICAL: 0.9
  }
} as const;

export const DateFormats = {
  ISO_DATE: 'YYYY-MM-DD',
  ISO_DATETIME: 'YYYY-MM-DD[T]HH:mm:ss[Z]',
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_DATETIME: 'MMM DD, YYYY [at] h:mm A',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss'
} as const;

export const RegexPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
} as const;
```

### 9. HTTP and API Constants
Define HTTP-related constants:

```typescript
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

export const HttpHeaders = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  X_REQUEST_ID: 'X-Request-ID',
  X_CORRELATION_ID: 'X-Correlation-ID',
  X_API_KEY: 'X-API-Key',
  X_RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  X_RATE_LIMIT_RESET: 'X-RateLimit-Reset'
} as const;

export const MediaTypes = {
  JSON: 'application/json',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  MULTIPART_FORM: 'multipart/form-data'
} as const;
```

## File Structure
```
src/shared/constants/
├── error-codes.ts       # Error codes and messages
├── status-codes.ts      # Status enumerations
├── roles.ts            # User roles and permissions
├── permissions.ts      # Permission definitions
├── events.ts           # Event types and categories
├── config-keys.ts      # Configuration constants
├── mcp-constants.ts    # MCP protocol constants
├── business-constants.ts # Domain-specific constants
├── http-constants.ts   # HTTP and API constants
├── validation-patterns.ts # Regex patterns and validation
└── index.ts           # Main exports
```

## Advanced TypeScript Patterns

### 1. Branded Types for Type Safety
```typescript
// Create branded types for IDs
export type ProjectId = string & { readonly brand: unique symbol };
export type TaskId = string & { readonly brand: unique symbol };
export type UserId = string & { readonly brand: unique symbol };

export function createProjectId(id: string): ProjectId {
  return id as ProjectId;
}
```

### 2. Const Assertions for Immutable Objects
```typescript
export const API_ENDPOINTS = {
  PROJECTS: '/api/v1/projects',
  TASKS: '/api/v1/tasks',
  USERS: '/api/v1/users',
  SESSIONS: '/api/v1/sessions'
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
```

### 3. Template Literal Types for Dynamic Constants
```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogMessage<T extends string> = `[${LogLevel}] ${T}`;
```

## Success Criteria
- [ ] All constants are properly typed with TypeScript
- [ ] Enums use string values for better debugging
- [ ] Const assertions prevent accidental mutations
- [ ] Type-safe access to all configuration values
- [ ] Comprehensive JSDoc documentation
- [ ] No magic strings throughout the codebase
- [ ] Branded types for critical identifiers
- [ ] Template literal types for dynamic constants

## Quality Standards
- Use const assertions for immutable data structures
- Prefer string enums over numeric enums for better debugging
- Group related constants logically
- Use branded types for important identifiers
- Include comprehensive documentation
- Ensure all constants are exportable and tree-shakeable
- Follow consistent naming conventions

## Output Format
Implement the complete constants and enums system with:
1. All constant modules with proper TypeScript types
2. Comprehensive enum definitions with string values
3. Branded types for important identifiers
4. Configuration management utilities
5. Type-safe access patterns
6. Documentation with usage examples

Focus on creating a maintainable, type-safe constants system that enhances developer experience and prevents common errors.