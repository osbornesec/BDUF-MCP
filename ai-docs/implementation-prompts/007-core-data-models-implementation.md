# Implementation Prompt 007: Core Data Models Implementation (1.2.2)

## Persona
You are a **Senior Backend Engineer and Domain Modeling Expert** with 12+ years of experience in building robust data access layers, domain models, and repository patterns for enterprise applications. You specialize in TypeScript, ORM design, data validation, and implementing clean architecture principles.

## Context: Interactive BDUF Orchestrator
You are implementing the **Core Data Models Implementation** component as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system will provide the foundational data access layer that bridges the database schema with business logic through well-designed domain models and repositories.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP server that orchestrates comprehensive project analysis and planning. The Core Data Models you're building will:

1. **Provide domain entities** with rich business logic and validation
2. **Implement repository patterns** for clean data access abstraction
3. **Enable type-safe operations** with comprehensive TypeScript models
4. **Support complex relationships** between projects, tasks, and analyses
5. **Maintain data integrity** through validation and business rules
6. **Enable efficient querying** with optimized data access patterns

### Technical Context
- **Dependencies**: Built on database schema design and shared utilities
- **Architecture**: Clean architecture with domain-driven design patterns
- **Integration**: Core data foundation for all business logic components
- **Scalability**: Efficient data access with caching and optimization
- **Quality**: 90%+ test coverage, comprehensive validation and error handling

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/core-data-models-implementation

# Regular commits with descriptive messages
git add .
git commit -m "feat(data): implement comprehensive core data models

- Add domain entities with business logic and validation
- Implement repository pattern with base and specific repositories
- Create comprehensive TypeScript type definitions
- Add data access layer with connection management
- Implement entity relationships and associations
- Add query builders and optimization utilities"

# Push and create PR
git push origin feature/core-data-models-implementation
```

## Required Context7 Integration

Before implementing any data model components, you MUST use Context7 to research data modeling patterns:

```typescript
// Research data modeling and ORM patterns
await context7.getLibraryDocs('/typeorm/typeorm');
await context7.getLibraryDocs('/sequelize/sequelize');
await context7.getLibraryDocs('/prisma/prisma');

// Research domain-driven design patterns
await context7.getLibraryDocs('/domain-driven-design/entities');
await context7.getLibraryDocs('/architecture/repository-pattern');
await context7.getLibraryDocs('/typescript/decorators');

// Research validation and data integrity
await context7.getLibraryDocs('/validation/joi');
await context7.getLibraryDocs('/validation/yup');
await context7.getLibraryDocs('/typescript/type-guards');
```

## Implementation Requirements

### 1. Domain Entities

```typescript
// src/infrastructure/database/entities/BaseEntity.ts
export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;

  constructor() {
    this.id = generateId();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;
  }

  touch(): void {
    this.updatedAt = new Date();
    this.version += 1;
  }

  equals(other: BaseEntity): boolean {
    return this.id === other.id;
  }

  abstract validate(): ValidationResult;
}

// src/infrastructure/database/entities/Project.ts
export class ProjectEntity extends BaseEntity {
  organizationId: string;
  createdBy: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  projectType?: string;
  industry?: string;
  complexityScore?: number;
  estimatedDurationWeeks?: number;
  estimatedBudget?: number;
  currency: string;
  technologyStack: string[];
  constraints: Record<string, any>;
  assumptions: string[];
  isArchived: boolean;
  archivedAt?: Date;

  // Relationships
  requirements: RequirementEntity[];
  architecturalComponents: ArchitecturalComponentEntity[];
  analyses: AnalysisEntity[];
  tasks: TaskEntity[];
  collaborationSessions: CollaborationSessionEntity[];
  approvals: ApprovalEntity[];

  constructor(data: Partial<ProjectEntity>) {
    super();
    Object.assign(this, {
      status: ProjectStatus.DRAFT,
      currency: 'USD',
      technologyStack: [],
      constraints: {},
      assumptions: [],
      isArchived: false,
      requirements: [],
      architecturalComponents: [],
      analyses: [],
      tasks: [],
      collaborationSessions: [],
      approvals: [],
      ...data
    });
  }

  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push(new ValidationError('name', 'Project name is required'));
    }

    if (this.name && this.name.length > 255) {
      errors.push(new ValidationError('name', 'Project name must be 255 characters or less'));
    }

    if (!this.organizationId) {
      errors.push(new ValidationError('organizationId', 'Organization ID is required'));
    }

    if (!this.createdBy) {
      errors.push(new ValidationError('createdBy', 'Created by user ID is required'));
    }

    if (this.complexityScore && (this.complexityScore < 1 || this.complexityScore > 10)) {
      errors.push(new ValidationError('complexityScore', 'Complexity score must be between 1 and 10'));
    }

    if (this.estimatedDurationWeeks && this.estimatedDurationWeeks < 1) {
      errors.push(new ValidationError('estimatedDurationWeeks', 'Estimated duration must be positive'));
    }

    if (this.estimatedBudget && this.estimatedBudget < 0) {
      errors.push(new ValidationError('estimatedBudget', 'Estimated budget cannot be negative'));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Business logic methods
  canBeArchived(): boolean {
    return this.status === ProjectStatus.COMPLETED || 
           this.status === ProjectStatus.CANCELLED;
  }

  archive(): void {
    if (!this.canBeArchived()) {
      throw new BusinessRuleError('Project cannot be archived in current status');
    }
    this.isArchived = true;
    this.archivedAt = new Date();
    this.touch();
  }

  addRequirement(requirement: RequirementEntity): void {
    requirement.projectId = this.id;
    this.requirements.push(requirement);
    this.touch();
  }

  removeRequirement(requirementId: string): void {
    this.requirements = this.requirements.filter(r => r.id !== requirementId);
    this.touch();
  }

  calculateProgress(): number {
    if (this.tasks.length === 0) return 0;
    
    const totalProgress = this.tasks.reduce((sum, task) => sum + task.progressPercentage, 0);
    return Math.round(totalProgress / this.tasks.length);
  }

  getActiveRequirements(): RequirementEntity[] {
    return this.requirements.filter(r => !r.isArchived);
  }

  getHighPriorityTasks(): TaskEntity[] {
    return this.tasks.filter(t => t.priority >= 4 && t.status !== TaskStatus.DONE);
  }
}

// src/infrastructure/database/entities/Requirement.ts
export class RequirementEntity extends BaseEntity {
  projectId: string;
  parentId?: string;
  title: string;
  description?: string;
  acceptanceCriteria: string[];
  priority: number;
  category?: string;
  complexityScore?: number;
  effortEstimateHours?: number;
  dependencies: string[];
  isValidated: boolean;
  validationNotes?: string;

  // Relationships
  project: ProjectEntity;
  parent?: RequirementEntity;
  children: RequirementEntity[];

  constructor(data: Partial<RequirementEntity>) {
    super();
    Object.assign(this, {
      acceptanceCriteria: [],
      priority: 3,
      dependencies: [],
      isValidated: false,
      children: [],
      ...data
    });
  }

  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push(new ValidationError('title', 'Requirement title is required'));
    }

    if (!this.projectId) {
      errors.push(new ValidationError('projectId', 'Project ID is required'));
    }

    if (this.priority < 1 || this.priority > 5) {
      errors.push(new ValidationError('priority', 'Priority must be between 1 and 5'));
    }

    if (this.complexityScore && (this.complexityScore < 1 || this.complexityScore > 10)) {
      errors.push(new ValidationError('complexityScore', 'Complexity score must be between 1 and 10'));
    }

    if (this.effortEstimateHours && this.effortEstimateHours < 0) {
      errors.push(new ValidationError('effortEstimateHours', 'Effort estimate cannot be negative'));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isHighPriority(): boolean {
    return this.priority >= 4;
  }

  hasChildren(): boolean {
    return this.children.length > 0;
  }

  isLeaf(): boolean {
    return !this.hasChildren();
  }

  addChild(child: RequirementEntity): void {
    child.parentId = this.id;
    child.projectId = this.projectId;
    this.children.push(child);
    this.touch();
  }
}
```

### 2. Repository Pattern Implementation

```typescript
// src/infrastructure/repositories/BaseRepository.ts
export abstract class BaseRepository<T extends BaseEntity> {
  protected pool: Pool;
  protected logger: Logger;
  protected tableName: string;

  constructor(pool: Pool, tableName: string) {
    this.pool = pool;
    this.tableName = tableName;
    this.logger = new Logger(`${this.constructor.name}`);
  }

  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 AND is_archived = false`;
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
    } catch (error) {
      this.logger.error('Failed to find entity by ID', { error, id, table: this.tableName });
      throw new RepositoryError(`Failed to find entity by ID: ${error.message}`, error);
    }
  }

  async findMany(criteria: QueryCriteria): Promise<T[]> {
    const { whereClause, params } = this.buildWhereClause(criteria);
    const { orderClause } = this.buildOrderClause(criteria.orderBy);
    const { limitClause } = this.buildLimitClause(criteria.limit, criteria.offset);

    const query = `
      SELECT * FROM ${this.tableName} 
      ${whereClause} 
      ${orderClause} 
      ${limitClause}
    `;

    try {
      const result = await this.pool.query(query, params);
      return result.rows.map(row => this.mapRowToEntity(row));
    } catch (error) {
      this.logger.error('Failed to find entities', { error, criteria, table: this.tableName });
      throw new RepositoryError(`Failed to find entities: ${error.message}`, error);
    }
  }

  async save(entity: T): Promise<T> {
    const validation = entity.validate();
    if (!validation.isValid) {
      throw new ValidationError('Entity validation failed', validation.errors);
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const existingEntity = await this.findById(entity.id);
      let savedEntity: T;

      if (existingEntity) {
        savedEntity = await this.update(entity, client);
      } else {
        savedEntity = await this.insert(entity, client);
      }

      await client.query('COMMIT');
      
      this.logger.info('Entity saved successfully', { 
        entityId: entity.id, 
        table: this.tableName,
        operation: existingEntity ? 'update' : 'insert'
      });

      return savedEntity;

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to save entity', { error, entityId: entity.id, table: this.tableName });
      throw new RepositoryError(`Failed to save entity: ${error.message}`, error);
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    // Soft delete by setting is_archived = true
    const query = `
      UPDATE ${this.tableName} 
      SET is_archived = true, archived_at = NOW(), updated_at = NOW() 
      WHERE id = $1 AND is_archived = false
    `;

    try {
      const result = await this.pool.query(query, [id]);
      const deleted = result.rowCount > 0;
      
      if (deleted) {
        this.logger.info('Entity soft deleted', { entityId: id, table: this.tableName });
      }

      return deleted;
    } catch (error) {
      this.logger.error('Failed to delete entity', { error, entityId: id, table: this.tableName });
      throw new RepositoryError(`Failed to delete entity: ${error.message}`, error);
    }
  }

  async count(criteria: QueryCriteria = {}): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(criteria);
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;

    try {
      const result = await this.pool.query(query, params);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      this.logger.error('Failed to count entities', { error, criteria, table: this.tableName });
      throw new RepositoryError(`Failed to count entities: ${error.message}`, error);
    }
  }

  protected abstract mapRowToEntity(row: any): T;
  protected abstract mapEntityToRow(entity: T): any;

  protected async insert(entity: T, client: PoolClient): Promise<T> {
    const row = this.mapEntityToRow(entity);
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;

    const result = await client.query(query, values);
    return this.mapRowToEntity(result.rows[0]);
  }

  protected async update(entity: T, client: PoolClient): Promise<T> {
    entity.touch(); // Update timestamp and version
    
    const row = this.mapEntityToRow(entity);
    const columns = Object.keys(row).filter(col => col !== 'id');
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');
    const values = [entity.id, ...columns.map(col => row[col])];

    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause} 
      WHERE id = $1 AND version = $${values.length + 1}
      RETURNING *
    `;

    values.push(entity.version - 1); // Optimistic locking

    const result = await client.query(query, values);
    
    if (result.rowCount === 0) {
      throw new OptimisticLockError('Entity was modified by another transaction');
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  protected buildWhereClause(criteria: QueryCriteria): { whereClause: string; params: any[] } {
    const conditions: string[] = ['is_archived = false'];
    const params: any[] = [];

    if (criteria.filters) {
      Object.entries(criteria.filters).forEach(([field, value]) => {
        params.push(value);
        conditions.push(`${field} = $${params.length}`);
      });
    }

    if (criteria.search) {
      params.push(`%${criteria.search}%`);
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    return {
      whereClause: conditions.length > 1 ? `WHERE ${conditions.join(' AND ')}` : 'WHERE is_archived = false',
      params
    };
  }

  protected buildOrderClause(orderBy?: OrderBy[]): { orderClause: string } {
    if (!orderBy || orderBy.length === 0) {
      return { orderClause: 'ORDER BY created_at DESC' };
    }

    const orderParts = orderBy.map(order => `${order.field} ${order.direction}`);
    return { orderClause: `ORDER BY ${orderParts.join(', ')}` };
  }

  protected buildLimitClause(limit?: number, offset?: number): { limitClause: string } {
    const parts: string[] = [];
    
    if (limit) {
      parts.push(`LIMIT ${limit}`);
    }
    
    if (offset) {
      parts.push(`OFFSET ${offset}`);
    }

    return { limitClause: parts.join(' ') };
  }
}

// src/infrastructure/repositories/ProjectRepository.ts
export class ProjectRepository extends BaseRepository<ProjectEntity> {
  constructor(pool: Pool) {
    super(pool, 'projects');
  }

  async findByOrganization(organizationId: string, criteria: QueryCriteria = {}): Promise<ProjectEntity[]> {
    return this.findMany({
      ...criteria,
      filters: {
        ...criteria.filters,
        organization_id: organizationId
      }
    });
  }

  async findByCreator(createdBy: string, criteria: QueryCriteria = {}): Promise<ProjectEntity[]> {
    return this.findMany({
      ...criteria,
      filters: {
        ...criteria.filters,
        created_by: createdBy
      }
    });
  }

  async findByStatus(status: ProjectStatus, criteria: QueryCriteria = {}): Promise<ProjectEntity[]> {
    return this.findMany({
      ...criteria,
      filters: {
        ...criteria.filters,
        status
      }
    });
  }

  async findWithRequirements(projectId: string): Promise<ProjectEntity | null> {
    const query = `
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', r.id,
            'title', r.title,
            'description', r.description,
            'priority', r.priority,
            'category', r.category,
            'is_validated', r.is_validated
          ) ORDER BY r.priority DESC, r.created_at
        ) FILTER (WHERE r.id IS NOT NULL) as requirements
      FROM projects p
      LEFT JOIN requirements r ON p.id = r.project_id AND r.is_archived = false
      WHERE p.id = $1 AND p.is_archived = false
      GROUP BY p.id
    `;

    try {
      const result = await this.pool.query(query, [projectId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const project = this.mapRowToEntity(row);
      
      if (row.requirements) {
        project.requirements = row.requirements.map((reqData: any) => 
          new RequirementEntity(reqData)
        );
      }

      return project;
    } catch (error) {
      this.logger.error('Failed to find project with requirements', { error, projectId });
      throw new RepositoryError(`Failed to find project with requirements: ${error.message}`, error);
    }
  }

  async getProjectStatistics(organizationId: string): Promise<ProjectStatistics> {
    const query = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE status = 'active') as active_projects,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_projects,
        AVG(complexity_score) as avg_complexity,
        SUM(estimated_budget) as total_estimated_budget
      FROM projects
      WHERE organization_id = $1 AND is_archived = false
    `;

    try {
      const result = await this.pool.query(query, [organizationId]);
      const row = result.rows[0];

      return {
        totalProjects: parseInt(row.total_projects, 10),
        activeProjects: parseInt(row.active_projects, 10),
        completedProjects: parseInt(row.completed_projects, 10),
        draftProjects: parseInt(row.draft_projects, 10),
        averageComplexity: parseFloat(row.avg_complexity) || 0,
        totalEstimatedBudget: parseFloat(row.total_estimated_budget) || 0
      };
    } catch (error) {
      this.logger.error('Failed to get project statistics', { error, organizationId });
      throw new RepositoryError(`Failed to get project statistics: ${error.message}`, error);
    }
  }

  protected mapRowToEntity(row: any): ProjectEntity {
    return new ProjectEntity({
      id: row.id,
      organizationId: row.organization_id,
      createdBy: row.created_by,
      name: row.name,
      description: row.description,
      status: row.status as ProjectStatus,
      projectType: row.project_type,
      industry: row.industry,
      complexityScore: row.complexity_score,
      estimatedDurationWeeks: row.estimated_duration_weeks,
      estimatedBudget: row.estimated_budget ? parseFloat(row.estimated_budget) : undefined,
      currency: row.currency,
      technologyStack: row.technology_stack || [],
      constraints: row.constraints || {},
      assumptions: row.assumptions || [],
      version: row.version,
      isArchived: row.is_archived,
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  protected mapEntityToRow(entity: ProjectEntity): any {
    return {
      id: entity.id,
      organization_id: entity.organizationId,
      created_by: entity.createdBy,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      project_type: entity.projectType,
      industry: entity.industry,
      complexity_score: entity.complexityScore,
      estimated_duration_weeks: entity.estimatedDurationWeeks,
      estimated_budget: entity.estimatedBudget,
      currency: entity.currency,
      technology_stack: JSON.stringify(entity.technologyStack),
      constraints: JSON.stringify(entity.constraints),
      assumptions: JSON.stringify(entity.assumptions),
      version: entity.version,
      is_archived: entity.isArchived,
      archived_at: entity.archivedAt,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }
}
```

### 3. Data Access Layer

```typescript
// src/infrastructure/database/DatabaseManager.ts
export class DatabaseManager {
  private pool: Pool;
  private config: DatabaseConfig;
  private logger: Logger;
  private repositories: Map<string, BaseRepository<any>>;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.logger = new Logger('DatabaseManager');
    this.repositories = new Map();
    this.initializePool();
  }

  private initializePool(): void {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      min: this.config.minConnections || 5,
      max: this.config.maxConnections || 20,
      idleTimeoutMillis: this.config.idleTimeout || 30000,
      connectionTimeoutMillis: this.config.connectionTimeout || 10000
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected database error', { error: err });
    });

    this.pool.on('connect', () => {
      this.logger.debug('New database connection established');
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.logger.info('Database connection established successfully');
      
      // Initialize repositories
      this.initializeRepositories();
      
    } catch (error) {
      this.logger.error('Failed to initialize database', { error });
      throw new DatabaseError('Failed to initialize database connection', error);
    }
  }

  private initializeRepositories(): void {
    this.repositories.set('projects', new ProjectRepository(this.pool));
    this.repositories.set('requirements', new RequirementRepository(this.pool));
    this.repositories.set('tasks', new TaskRepository(this.pool));
    this.repositories.set('analyses', new AnalysisRepository(this.pool));
    this.repositories.set('users', new UserRepository(this.pool));
    this.repositories.set('organizations', new OrganizationRepository(this.pool));
    this.repositories.set('collaborationSessions', new CollaborationSessionRepository(this.pool));
    this.repositories.set('approvals', new ApprovalRepository(this.pool));
  }

  getRepository<T extends BaseEntity>(name: string): BaseRepository<T> {
    const repository = this.repositories.get(name);
    if (!repository) {
      throw new Error(`Repository ${name} not found`);
    }
    return repository as BaseRepository<T>;
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getConnectionInfo(): Promise<ConnectionInfo> {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingConnections: this.pool.waitingCount
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database connections closed');
  }
}
```

## Success Criteria

### Functional Requirements
1. **Complete Entity Models**: All domain entities with business logic and validation
2. **Repository Pattern**: Clean data access abstraction with type safety
3. **Relationship Management**: Proper handling of entity relationships and associations
4. **Transaction Support**: ACID compliance with transaction management
5. **Query Optimization**: Efficient data access with caching strategies
6. **Data Validation**: Comprehensive validation and business rule enforcement

### Technical Requirements
1. **Type Safety**: Full TypeScript coverage with strict type checking
2. **Performance**: Optimized queries with sub-100ms response times
3. **Scalability**: Connection pooling and efficient resource management
4. **Error Handling**: Comprehensive error handling and recovery
5. **Testing**: 90%+ test coverage with unit and integration tests

### Quality Standards
1. **Clean Architecture**: Proper separation of concerns and dependencies
2. **Domain-Driven Design**: Rich domain models with business logic
3. **SOLID Principles**: Well-designed classes and interfaces
4. **Documentation**: Complete API documentation and usage examples
5. **Maintainability**: Clean, readable, and well-structured code

Remember that these data models are the foundation for all business logic and must provide a clean, type-safe interface between the database and application layers.