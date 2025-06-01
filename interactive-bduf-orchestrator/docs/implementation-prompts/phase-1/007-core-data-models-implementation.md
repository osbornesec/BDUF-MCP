# Prompt 007: Core Data Models Implementation

## Persona
You are a **Senior Database Engineer & TypeScript Architect** with 12+ years of experience designing enterprise-grade data models and ORM implementations. You specialize in Prisma, PostgreSQL optimization, and creating type-safe data access layers that ensure data integrity while maintaining excellent performance. You have deep expertise in database design patterns, entity relationships, and repository pattern implementations.

## Context
You are implementing the core data models for the Interactive BDUF Orchestrator MCP Server. This includes creating Prisma models, repository implementations, and data access layers that will support complex project management workflows, real-time collaboration, and comprehensive analytics.

## Git Workflow
Before starting implementation, create a new feature branch:
```bash
git checkout -b feature/007-core-data-models-implementation
```

## Required Context from Context7
- Prisma latest features and best practices for enterprise applications
- Repository pattern implementations in TypeScript
- PostgreSQL advanced features and optimization techniques
- Type-safe database query patterns

## Implementation Requirements

### 1. Prisma Schema Models
Create comprehensive Prisma models based on the database schema:

```prisma
// Project management models
model Project {
  id                UUID      @id @default(cuid())
  name              String    @db.VarChar(255)
  description       String?   @db.Text
  status            ProjectStatus @default(INITIATION)
  complexity        ComplexityLevel @default(MODERATE)
  priority          Priority  @default(MEDIUM)
  
  // Metadata
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdBy         String    @db.Uuid
  organizationId    String?   @db.Uuid
  
  // Business fields
  startDate         DateTime?
  targetEndDate     DateTime?
  actualEndDate     DateTime?
  budgetAllocated   Decimal?  @db.Decimal(12,2)
  budgetUsed        Decimal?  @db.Decimal(12,2) @default(0)
  
  // Configuration and metadata
  settings          Json      @default("{}")
  metadata          Json      @default("{}")
  
  // Full-text search
  searchVector      String?   @db.Text
  
  // Relations
  creator           User      @relation("ProjectCreator", fields: [createdBy], references: [id])
  organization      Organization? @relation(fields: [organizationId], references: [id])
  tasks             Task[]
  requirements      Requirement[]
  architectureDecisions ArchitectureDecision[]
  risks             ProjectRisk[]
  collaborationSessions CollaborationSession[]
  approvalRequests  ApprovalRequest[]
  analytics         ProjectAnalytics[]
  
  @@map("projects")
  @@index([status, priority])
  @@index([organizationId, status])
  @@index([createdAt])
}

model Task {
  id                UUID      @id @default(cuid())
  projectId         String    @db.Uuid
  parentTaskId      String?   @db.Uuid
  
  // Core task information
  title             String    @db.VarChar(500)
  description       String?   @db.Text
  status            TaskStatus @default(PENDING)
  priority          Priority  @default(MEDIUM)
  complexity        ComplexityLevel @default(MODERATE)
  
  // Assignment and tracking
  assignedTo        String?   @db.Uuid
  assignedAt        DateTime?
  assignedBy        String?   @db.Uuid
  
  // Time tracking
  estimatedHours    Decimal?  @db.Decimal(6,2)
  actualHours       Decimal   @default(0) @db.Decimal(6,2)
  startedAt         DateTime?
  completedAt       DateTime?
  
  // Dependencies and sequencing
  sequenceOrder     Int?
  isMilestone       Boolean   @default(false)
  isCriticalPath    Boolean   @default(false)
  
  // Metadata
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdBy         String    @db.Uuid
  
  // Additional data
  customFields      Json      @default("{}")
  attachments       Json      @default("[]")
  tags              String[]  @default([])
  
  // Full-text search
  searchVector      String?   @db.Text
  
  // Relations
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parentTask        Task?     @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
  subtasks          Task[]    @relation("TaskHierarchy")
  assignee          User?     @relation("TaskAssignee", fields: [assignedTo], references: [id])
  assigner          User?     @relation("TaskAssigner", fields: [assignedBy], references: [id])
  creator           User      @relation("TaskCreator", fields: [createdBy], references: [id])
  dependencies      TaskDependency[] @relation("DependentTask")
  dependents        TaskDependency[] @relation("DependencyTask")
  
  @@map("tasks")
  @@index([projectId, status])
  @@index([assignedTo, status])
  @@index([parentTaskId, sequenceOrder])
}

model User {
  id                UUID      @id @default(cuid())
  email             String    @unique @db.VarChar(255)
  username          String    @unique @db.VarChar(100)
  passwordHash      String    @db.VarChar(255)
  
  // Profile information
  firstName         String?   @db.VarChar(100)
  lastName          String?   @db.VarChar(100)
  displayName       String?   @db.VarChar(200)
  avatarUrl         String?   @db.Text
  bio               String?   @db.Text
  timezone          String    @default("UTC") @db.VarChar(50)
  
  // Role and permissions
  role              UserRole  @default(DEVELOPER)
  permissions       String[]  @default([])
  isActive          Boolean   @default(true)
  isVerified        Boolean   @default(false)
  
  // Security
  lastLoginAt       DateTime?
  passwordChangedAt DateTime  @default(now())
  failedLoginAttempts Int     @default(0)
  lockedUntil       DateTime?
  
  // API access
  apiKeyHash        String?   @db.VarChar(255)
  apiKeyCreatedAt   DateTime?
  apiKeyLastUsed    DateTime?
  
  // Metadata
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Preferences
  preferences       Json      @default("{}")
  notificationSettings Json  @default("{\"email\":true,\"push\":true,\"inApp\":true,\"digestFrequency\":\"daily\"}")
  
  // Full-text search
  searchVector      String?   @db.Text
  
  // Relations
  createdProjects   Project[] @relation("ProjectCreator")
  assignedTasks     Task[]    @relation("TaskAssignee")
  assignedByTasks   Task[]    @relation("TaskAssigner")
  createdTasks      Task[]    @relation("TaskCreator")
  teamMemberships   TeamMembership[]
  createdRequirements Requirement[] @relation("RequirementCreator")
  architectureDecisions ArchitectureDecision[] @relation("ArchitectureDecisionCreator")
  sessionParticipations SessionParticipant[]
  approvalRequests  ApprovalRequest[] @relation("ApprovalRequestCreator")
  approvalResponses ApprovalResponse[]
  activities        UserActivity[]
  auditLogs         AuditLog[]
  
  @@map("users")
  @@index([email])
  @@index([isActive])
}
```

### 2. Repository Pattern Implementation
Create a comprehensive repository pattern:

```typescript
// Base repository interface
export interface IBaseRepository<T, TCreate, TUpdate> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: Partial<T>): Promise<T[]>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<void>;
  count(filter?: Partial<T>): Promise<number>;
}

// Base repository implementation
export abstract class BaseRepository<T, TCreate, TUpdate> implements IBaseRepository<T, TCreate, TUpdate> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly model: any,
    protected readonly logger: Logger
  ) {}

  async findById(id: string): Promise<T | null> {
    try {
      const result = await this.model.findUnique({
        where: { id },
        ...this.getDefaultIncludes()
      });
      return result;
    } catch (error) {
      this.logger.error(`Error finding ${this.model.name} by ID`, error as Error, { id });
      throw new DatabaseError(`Failed to find ${this.model.name} by ID: ${id}`);
    }
  }

  async findMany(filter?: Partial<T>): Promise<T[]> {
    try {
      const result = await this.model.findMany({
        where: filter,
        ...this.getDefaultIncludes(),
        orderBy: this.getDefaultOrderBy()
      });
      return result;
    } catch (error) {
      this.logger.error(`Error finding many ${this.model.name}`, error as Error, { filter });
      throw new DatabaseError(`Failed to find ${this.model.name} records`);
    }
  }

  async create(data: TCreate): Promise<T> {
    try {
      const result = await this.model.create({
        data,
        ...this.getDefaultIncludes()
      });
      this.logger.info(`Created ${this.model.name}`, { id: result.id });
      return result;
    } catch (error) {
      this.logger.error(`Error creating ${this.model.name}`, error as Error, { data });
      throw new DatabaseError(`Failed to create ${this.model.name}`);
    }
  }

  async update(id: string, data: TUpdate): Promise<T> {
    try {
      const result = await this.model.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        ...this.getDefaultIncludes()
      });
      this.logger.info(`Updated ${this.model.name}`, { id });
      return result;
    } catch (error) {
      this.logger.error(`Error updating ${this.model.name}`, error as Error, { id, data });
      throw new DatabaseError(`Failed to update ${this.model.name}: ${id}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.model.delete({
        where: { id }
      });
      this.logger.info(`Deleted ${this.model.name}`, { id });
    } catch (error) {
      this.logger.error(`Error deleting ${this.model.name}`, error as Error, { id });
      throw new DatabaseError(`Failed to delete ${this.model.name}: ${id}`);
    }
  }

  async count(filter?: Partial<T>): Promise<number> {
    try {
      return await this.model.count({
        where: filter
      });
    } catch (error) {
      this.logger.error(`Error counting ${this.model.name}`, error as Error, { filter });
      throw new DatabaseError(`Failed to count ${this.model.name} records`);
    }
  }

  // Abstract methods for customization
  protected abstract getDefaultIncludes(): any;
  protected abstract getDefaultOrderBy(): any;
}
```

### 3. Specific Repository Implementations
Create specialized repositories for each entity:

```typescript
// Project Repository
export interface IProjectRepository extends IBaseRepository<Project, CreateProjectData, UpdateProjectData> {
  findByOrganization(organizationId: string): Promise<Project[]>;
  findByStatus(status: ProjectStatus): Promise<Project[]>;
  search(query: string, filters?: ProjectSearchFilters): Promise<Project[]>;
  getProjectMetrics(projectId: string): Promise<ProjectMetrics>;
  getProjectTimeline(projectId: string): Promise<ProjectTimelineEvent[]>;
}

export class ProjectRepository extends BaseRepository<Project, CreateProjectData, UpdateProjectData> implements IProjectRepository {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, prisma.project, logger);
  }

  protected getDefaultIncludes() {
    return {
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            tasks: true,
            requirements: true,
            collaborationSessions: true
          }
        }
      }
    };
  }

  protected getDefaultOrderBy() {
    return { createdAt: 'desc' };
  }

  async findByOrganization(organizationId: string): Promise<Project[]> {
    try {
      return await this.prisma.project.findMany({
        where: { organizationId },
        ...this.getDefaultIncludes(),
        orderBy: this.getDefaultOrderBy()
      });
    } catch (error) {
      this.logger.error('Error finding projects by organization', error as Error, { organizationId });
      throw new DatabaseError(`Failed to find projects for organization: ${organizationId}`);
    }
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    try {
      return await this.prisma.project.findMany({
        where: { status },
        ...this.getDefaultIncludes(),
        orderBy: this.getDefaultOrderBy()
      });
    } catch (error) {
      this.logger.error('Error finding projects by status', error as Error, { status });
      throw new DatabaseError(`Failed to find projects with status: ${status}`);
    }
  }

  async search(query: string, filters?: ProjectSearchFilters): Promise<Project[]> {
    try {
      const whereClause: any = {
        AND: []
      };

      // Full-text search
      if (query) {
        whereClause.AND.push({
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { searchVector: { search: query } }
          ]
        });
      }

      // Apply filters
      if (filters?.status) {
        whereClause.AND.push({ status: filters.status });
      }
      if (filters?.priority) {
        whereClause.AND.push({ priority: filters.priority });
      }
      if (filters?.complexity) {
        whereClause.AND.push({ complexity: filters.complexity });
      }
      if (filters?.organizationId) {
        whereClause.AND.push({ organizationId: filters.organizationId });
      }

      return await this.prisma.project.findMany({
        where: whereClause,
        ...this.getDefaultIncludes(),
        orderBy: this.getDefaultOrderBy()
      });
    } catch (error) {
      this.logger.error('Error searching projects', error as Error, { query, filters });
      throw new DatabaseError('Failed to search projects');
    }
  }

  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: {
            select: {
              status: true,
              estimatedHours: true,
              actualHours: true,
              priority: true,
              complexity: true
            }
          },
          requirements: {
            select: {
              status: true,
              type: true
            }
          },
          risks: {
            select: {
              riskScore: true,
              status: true
            }
          },
          collaborationSessions: {
            select: {
              status: true,
              scheduledStart: true,
              actualEnd: true
            }
          }
        }
      });

      if (!project) {
        throw new NotFoundError(`Project not found: ${projectId}`);
      }

      // Calculate metrics
      const taskMetrics = this.calculateTaskMetrics(project.tasks);
      const requirementMetrics = this.calculateRequirementMetrics(project.requirements);
      const riskMetrics = this.calculateRiskMetrics(project.risks);
      const collaborationMetrics = this.calculateCollaborationMetrics(project.collaborationSessions);

      return {
        projectId,
        taskMetrics,
        requirementMetrics,
        riskMetrics,
        collaborationMetrics,
        overallProgress: this.calculateOverallProgress(taskMetrics, requirementMetrics),
        healthScore: this.calculateHealthScore(taskMetrics, riskMetrics)
      };
    } catch (error) {
      this.logger.error('Error getting project metrics', error as Error, { projectId });
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Failed to get project metrics: ${projectId}`);
    }
  }

  private calculateTaskMetrics(tasks: any[]): TaskMetrics {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const blocked = tasks.filter(t => t.status === 'BLOCKED').length;
    
    const totalEstimated = tasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + (Number(t.actualHours) || 0), 0);
    
    return {
      total,
      completed,
      inProgress,
      blocked,
      completionRate: total > 0 ? completed / total : 0,
      totalEstimatedHours: totalEstimated,
      totalActualHours: totalActual,
      estimationAccuracy: totalEstimated > 0 ? totalActual / totalEstimated : 1
    };
  }

  private calculateRequirementMetrics(requirements: any[]): RequirementMetrics {
    const total = requirements.length;
    const approved = requirements.filter(r => r.status === 'APPROVED').length;
    const implemented = requirements.filter(r => r.status === 'IMPLEMENTED').length;
    
    return {
      total,
      approved,
      implemented,
      approvalRate: total > 0 ? approved / total : 0,
      implementationRate: total > 0 ? implemented / total : 0
    };
  }

  private calculateRiskMetrics(risks: any[]): RiskMetrics {
    const total = risks.length;
    const active = risks.filter(r => r.status === 'IDENTIFIED' || r.status === 'ASSESSED').length;
    const mitigated = risks.filter(r => r.status === 'MITIGATED').length;
    const averageScore = risks.length > 0 
      ? risks.reduce((sum, r) => sum + Number(r.riskScore), 0) / risks.length 
      : 0;

    return {
      total,
      active,
      mitigated,
      averageRiskScore: averageScore,
      mitigationRate: total > 0 ? mitigated / total : 0
    };
  }

  private calculateCollaborationMetrics(sessions: any[]): CollaborationMetrics {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === 'COMPLETED').length;
    
    return {
      totalSessions: total,
      completedSessions: completed,
      completionRate: total > 0 ? completed / total : 0
    };
  }

  private calculateOverallProgress(taskMetrics: TaskMetrics, requirementMetrics: RequirementMetrics): number {
    return (taskMetrics.completionRate + requirementMetrics.implementationRate) / 2;
  }

  private calculateHealthScore(taskMetrics: TaskMetrics, riskMetrics: RiskMetrics): number {
    const taskHealth = taskMetrics.completionRate;
    const riskHealth = 1 - (riskMetrics.averageRiskScore / 5); // Assuming risk score is 0-5
    return (taskHealth + riskHealth) / 2;
  }
}
```

### 4. Task Repository Implementation
```typescript
export interface ITaskRepository extends IBaseRepository<Task, CreateTaskData, UpdateTaskData> {
  findByProject(projectId: string): Promise<Task[]>;
  findByAssignee(userId: string): Promise<Task[]>;
  findByStatus(status: TaskStatus): Promise<Task[]>;
  findSubtasks(parentTaskId: string): Promise<Task[]>;
  updateStatus(id: string, status: TaskStatus, userId: string): Promise<Task>;
  addDependency(taskId: string, dependsOnId: string): Promise<void>;
  removeDependency(taskId: string, dependsOnId: string): Promise<void>;
  getTaskPath(taskId: string): Promise<Task[]>;
  getCriticalPath(projectId: string): Promise<Task[]>;
}

export class TaskRepository extends BaseRepository<Task, CreateTaskData, UpdateTaskData> implements ITaskRepository {
  constructor(prisma: PrismaClient, logger: Logger) {
    super(prisma, prisma.task, logger);
  }

  protected getDefaultIncludes() {
    return {
      include: {
        assignee: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true
          }
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            subtasks: true,
            dependencies: true,
            dependents: true
          }
        }
      }
    };
  }

  protected getDefaultOrderBy() {
    return [
      { sequenceOrder: 'asc' },
      { priority: 'desc' },
      { createdAt: 'asc' }
    ];
  }

  async findByProject(projectId: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: { projectId },
        ...this.getDefaultIncludes(),
        orderBy: this.getDefaultOrderBy()
      });
    } catch (error) {
      this.logger.error('Error finding tasks by project', error as Error, { projectId });
      throw new DatabaseError(`Failed to find tasks for project: ${projectId}`);
    }
  }

  async findByAssignee(userId: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: { assignedTo: userId },
        ...this.getDefaultIncludes(),
        orderBy: this.getDefaultOrderBy()
      });
    } catch (error) {
      this.logger.error('Error finding tasks by assignee', error as Error, { userId });
      throw new DatabaseError(`Failed to find tasks for user: ${userId}`);
    }
  }

  async updateStatus(id: string, status: TaskStatus, userId: string): Promise<Task> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      // Set timestamps based on status
      if (status === 'IN_PROGRESS' && !updateData.startedAt) {
        updateData.startedAt = new Date();
      } else if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      const result = await this.prisma.task.update({
        where: { id },
        data: updateData,
        ...this.getDefaultIncludes()
      });

      this.logger.info(`Task status updated`, { 
        taskId: id, 
        status, 
        updatedBy: userId 
      });

      return result;
    } catch (error) {
      this.logger.error('Error updating task status', error as Error, { 
        id, 
        status, 
        userId 
      });
      throw new DatabaseError(`Failed to update task status: ${id}`);
    }
  }

  async getCriticalPath(projectId: string): Promise<Task[]> {
    try {
      // This is a simplified critical path calculation
      // In a real implementation, you might use more sophisticated algorithms
      const tasks = await this.prisma.task.findMany({
        where: { 
          projectId,
          isCriticalPath: true 
        },
        include: {
          dependencies: {
            include: {
              dependencyTask: {
                select: {
                  id: true,
                  title: true,
                  estimatedHours: true,
                  status: true
                }
              }
            }
          }
        },
        orderBy: { sequenceOrder: 'asc' }
      });

      return tasks;
    } catch (error) {
      this.logger.error('Error getting critical path', error as Error, { projectId });
      throw new DatabaseError(`Failed to get critical path for project: ${projectId}`);
    }
  }
}
```

## File Structure
```
src/repositories/
├── base/
│   ├── base-repository.ts          # Base repository implementation
│   ├── repository-interfaces.ts    # Common interfaces
│   └── index.ts                    # Base exports
├── project-repository.ts           # Project repository
├── task-repository.ts              # Task repository  
├── user-repository.ts              # User repository
├── requirement-repository.ts       # Requirements repository
├── architecture-repository.ts      # Architecture decisions repository
├── collaboration-repository.ts     # Collaboration sessions repository
├── approval-repository.ts          # Approval workflows repository
├── analytics-repository.ts         # Analytics repository
├── audit-repository.ts             # Audit logs repository
└── index.ts                        # Repository exports

src/models/
├── types/
│   ├── project-types.ts            # Project-related types
│   ├── task-types.ts               # Task-related types
│   ├── user-types.ts               # User-related types
│   ├── collaboration-types.ts      # Collaboration types
│   └── index.ts                    # Type exports
├── enums/
│   ├── project-enums.ts            # Project status, priority enums
│   ├── task-enums.ts               # Task status, complexity enums
│   ├── user-enums.ts               # User roles, permission enums
│   └── index.ts                    # Enum exports
└── index.ts                        # Model exports

prisma/
├── schema.prisma                   # Main Prisma schema
├── migrations/                     # Database migrations
├── seeds/                          # Database seed files
└── generated/                      # Generated Prisma client
```

## Success Criteria
- [ ] Complete Prisma schema with all entities and relationships
- [ ] Repository pattern implementation with proper error handling
- [ ] Type-safe database operations throughout
- [ ] Comprehensive unit tests for all repositories (>90% coverage)
- [ ] Database connection pooling and optimization
- [ ] Migration scripts for schema deployment
- [ ] Seed data for development and testing
- [ ] Performance benchmarks for data operations

## Quality Standards
- Use Prisma best practices for schema design
- Implement proper error handling with custom exceptions
- Include comprehensive logging for all database operations
- Ensure data integrity with proper constraints and validations
- Follow repository pattern consistently across all entities
- Implement proper connection management and pooling
- Use transactions for complex multi-table operations

## Output Format
Implement the complete data models system with:
1. Comprehensive Prisma schema with all relationships
2. Repository pattern implementation for all entities
3. Type-safe data access layer with proper error handling
4. Database migration and seed scripts
5. Unit tests for all repository methods
6. Performance optimization and monitoring
7. Documentation with usage examples

Focus on creating a production-ready data layer that ensures data integrity, performance, and maintainability while providing excellent developer experience.