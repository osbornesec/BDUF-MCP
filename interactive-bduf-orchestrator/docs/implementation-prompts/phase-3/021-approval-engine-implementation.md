# Implementation Prompt 021: Approval Engine Implementation (3.2.1)

## Persona
You are a **Senior Workflow Engineer** with 10+ years of experience in building approval systems, business process automation, and enterprise workflow management platforms. You specialize in designing flexible, scalable approval engines that handle complex business rules and multi-stage approval processes.

## Context: Interactive BDUF Orchestrator
You are implementing the **Approval Engine** as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system enables comprehensive project analysis, architecture generation, and collaborative development workflows through AI-powered automation.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP (Model Context Protocol) server that orchestrates comprehensive project analysis and planning. The Approval Engine you're building will be a core component that:

1. **Manages approval workflows** for architecture decisions, requirements, and designs
2. **Orchestrates multi-stage approvals** with configurable business rules
3. **Handles approval routing** based on roles, responsibilities, and organizational hierarchy
4. **Tracks approval status** and provides real-time notifications
5. **Maintains approval history** and audit trails
6. **Integrates with collaboration** and notification systems

### Technical Context
- **Architecture**: TypeScript-based modular system with enterprise patterns
- **Integration**: Must integrate with Context7 MCP for documentation lookup
- **Scalability**: Handle 1000+ concurrent approval processes
- **Quality**: 90%+ test coverage, comprehensive error handling
- **Performance**: Sub-200ms approval processing, real-time status updates

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/approval-engine-implementation

# Regular commits with descriptive messages
git add .
git commit -m "feat(approval): implement core approval engine

- Add workflow definition and execution engine
- Implement approval routing and notification system
- Create approval status tracking and audit trails
- Add business rule engine for approval criteria
- Implement integration with collaboration system"

# Push and create PR
git push origin feature/approval-engine-implementation
```

### Commit Message Format
```
<type>(approval): <description>

<body explaining what and why>

Closes #<issue-number>
```

## Required Context7 Integration

Before implementing any approval components, you MUST use Context7 to research current best practices:

```typescript
// Research workflow and approval systems
await context7.getLibraryDocs('/argoproj/argo-workflows');
await context7.getLibraryDocs('/camunda/camunda-bpm-platform');
await context7.getLibraryDocs('/zeebe-io/zeebe');

// Research notification and queue systems
await context7.getLibraryDocs('/taskforcesh/bullmq');
await context7.getLibraryDocs('/automattic/kue');
```

## Implementation Requirements

### 1. Core Approval Engine Architecture

Create a comprehensive approval workflow engine:

```typescript
// src/core/approval/ApprovalEngine.ts
export interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  version: number;
  status: WorkflowStatus;
  type: WorkflowType;
  stages: ApprovalStage[];
  rules: WorkflowRule[];
  settings: WorkflowSettings;
  metadata: WorkflowMetadata;
  created: Date;
  lastModified: Date;
}

export interface ApprovalStage {
  id: string;
  name: string;
  description: string;
  order: number;
  type: StageType;
  approvers: ApproverDefinition[];
  criteria: ApprovalCriteria;
  timeouts: StageTimeouts;
  escalation: EscalationRule[];
  conditions: StageCondition[];
  actions: StageAction[];
  settings: StageSettings;
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived'
}

export enum WorkflowType {
  ARCHITECTURE_APPROVAL = 'architecture_approval',
  REQUIREMENTS_APPROVAL = 'requirements_approval',
  DESIGN_APPROVAL = 'design_approval',
  DOCUMENT_APPROVAL = 'document_approval',
  CHANGE_REQUEST = 'change_request',
  MILESTONE_APPROVAL = 'milestone_approval'
}

export enum StageType {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  CONDITIONAL = 'conditional',
  VOTING = 'voting',
  CONSENSUS = 'consensus'
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  title: string;
  description: string;
  requesterId: string;
  projectId: string;
  itemId: string;
  itemType: ApprovalItemType;
  currentStage: number;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  approvals: ApprovalRecord[];
  timeline: ApprovalTimelineEntry[];
  metadata: RequestMetadata;
  created: Date;
  lastActivity: Date;
  deadline?: Date;
}

export enum ApprovalStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  ON_HOLD = 'on_hold'
}

export enum ApprovalItemType {
  ARCHITECTURE_DOCUMENT = 'architecture_document',
  REQUIREMENTS_SPECIFICATION = 'requirements_specification',
  DESIGN_DOCUMENT = 'design_document',
  CODE_REVIEW = 'code_review',
  MILESTONE_DELIVERABLE = 'milestone_deliverable',
  CHANGE_REQUEST = 'change_request'
}

export class ApprovalEngine {
  private workflows: Map<string, ApprovalWorkflow>;
  private activeRequests: Map<string, ApprovalRequest>;
  private workflowExecutor: WorkflowExecutor;
  private ruleEngine: ApprovalRuleEngine;
  private notificationService: ApprovalNotificationService;
  private auditService: ApprovalAuditService;
  private escalationManager: EscalationManager;
  private persistenceService: ApprovalPersistenceService;

  constructor(
    private config: ApprovalEngineConfig,
    private logger: Logger,
    private eventBus: EventBus,
    private userService: UserService,
    private authService: AuthenticationService
  ) {
    this.workflows = new Map();
    this.activeRequests = new Map();
    this.setupEngine();
    this.startBackgroundTasks();
  }

  async createWorkflow(definition: WorkflowDefinition): Promise<ApprovalWorkflow> {
    try {
      // Validate workflow definition
      await this.validateWorkflowDefinition(definition);

      const workflow: ApprovalWorkflow = {
        id: generateWorkflowId(),
        name: definition.name,
        description: definition.description,
        version: 1,
        status: WorkflowStatus.DRAFT,
        type: definition.type,
        stages: await this.processStageDefinitions(definition.stages),
        rules: definition.rules || [],
        settings: {
          ...this.getDefaultWorkflowSettings(),
          ...definition.settings
        },
        metadata: {
          createdBy: definition.creatorId,
          tags: definition.tags || [],
          category: definition.category
        },
        created: new Date(),
        lastModified: new Date()
      };

      // Store workflow
      this.workflows.set(workflow.id, workflow);
      await this.persistenceService.saveWorkflow(workflow);

      this.logger.info('Approval workflow created', {
        workflowId: workflow.id,
        name: workflow.name,
        type: workflow.type,
        stages: workflow.stages.length
      });

      this.eventBus.emit('workflow:created', { workflow });

      return workflow;

    } catch (error) {
      this.logger.error('Failed to create workflow', { error, definition });
      throw new ApprovalEngineError('Failed to create workflow', error);
    }
  }

  async submitApprovalRequest(request: ApprovalRequestSubmission): Promise<ApprovalRequest> {
    try {
      // Validate request
      await this.validateApprovalRequest(request);

      // Get workflow
      const workflow = await this.getWorkflow(request.workflowId);
      if (!workflow || workflow.status !== WorkflowStatus.ACTIVE) {
        throw new ApprovalEngineError('Workflow not found or not active');
      }

      // Create approval request
      const approvalRequest: ApprovalRequest = {
        id: generateRequestId(),
        workflowId: request.workflowId,
        title: request.title,
        description: request.description,
        requesterId: request.requesterId,
        projectId: request.projectId,
        itemId: request.itemId,
        itemType: request.itemType,
        currentStage: 0,
        status: ApprovalStatus.PENDING,
        priority: request.priority || ApprovalPriority.MEDIUM,
        approvals: [],
        timeline: [{
          timestamp: new Date(),
          event: 'request_submitted',
          userId: request.requesterId,
          details: 'Approval request submitted'
        }],
        metadata: {
          submittedBy: request.requesterId,
          attachments: request.attachments || [],
          customFields: request.customFields || {}
        },
        created: new Date(),
        lastActivity: new Date(),
        deadline: request.deadline
      };

      // Store request
      this.activeRequests.set(approvalRequest.id, approvalRequest);
      await this.persistenceService.saveApprovalRequest(approvalRequest);

      // Start workflow execution
      await this.workflowExecutor.startExecution(workflow, approvalRequest);

      this.logger.info('Approval request submitted', {
        requestId: approvalRequest.id,
        workflowId: workflow.id,
        requesterId: request.requesterId,
        itemType: request.itemType
      });

      this.eventBus.emit('approval:request:submitted', {
        request: approvalRequest,
        workflow
      });

      return approvalRequest;

    } catch (error) {
      this.logger.error('Failed to submit approval request', { error, request });
      throw error;
    }
  }

  async processApproval(
    requestId: string,
    approverId: string,
    decision: ApprovalDecision
  ): Promise<ApprovalProcessResult> {
    try {
      const request = await this.getApprovalRequest(requestId);
      if (!request) {
        throw new ApprovalEngineError(`Approval request not found: ${requestId}`);
      }

      const workflow = await this.getWorkflow(request.workflowId);
      if (!workflow) {
        throw new ApprovalEngineError(`Workflow not found: ${request.workflowId}`);
      }

      // Validate approver permissions
      await this.validateApproverPermissions(request, approverId);

      // Get current stage
      const currentStage = workflow.stages[request.currentStage];
      if (!currentStage) {
        throw new ApprovalEngineError('Invalid stage index');
      }

      // Create approval record
      const approvalRecord: ApprovalRecord = {
        id: generateApprovalId(),
        requestId: request.id,
        stageId: currentStage.id,
        approverId,
        decision: decision.action,
        comments: decision.comments,
        attachments: decision.attachments || [],
        timestamp: new Date(),
        metadata: {
          ipAddress: decision.metadata?.ipAddress,
          userAgent: decision.metadata?.userAgent
        }
      };

      // Add approval to request
      request.approvals.push(approvalRecord);
      request.lastActivity = new Date();

      // Add timeline entry
      request.timeline.push({
        timestamp: new Date(),
        event: 'approval_submitted',
        userId: approverId,
        details: `${decision.action} by ${approverId}`,
        stageId: currentStage.id
      });

      // Process stage logic
      const stageResult = await this.processStageApproval(
        workflow,
        request,
        currentStage,
        approvalRecord
      );

      // Update request status based on stage result
      await this.updateRequestStatus(request, stageResult);

      // Persist changes
      await this.persistenceService.updateApprovalRequest(request);

      // Send notifications
      await this.notificationService.sendApprovalNotifications(
        request,
        workflow,
        approvalRecord,
        stageResult
      );

      // Execute post-approval actions
      await this.executePostApprovalActions(workflow, request, stageResult);

      const result: ApprovalProcessResult = {
        success: true,
        request,
        approvalRecord,
        stageResult,
        nextStage: stageResult.nextStage
      };

      this.logger.info('Approval processed', {
        requestId,
        approverId,
        decision: decision.action,
        stageComplete: stageResult.stageComplete,
        workflowComplete: stageResult.workflowComplete
      });

      this.eventBus.emit('approval:processed', {
        request,
        approval: approvalRecord,
        result: stageResult
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to process approval', { error, requestId, approverId });
      throw error;
    }
  }

  async getApprovalRequests(
    filters: ApprovalRequestFilters
  ): Promise<ApprovalRequestSummary[]> {
    try {
      const allRequests = Array.from(this.activeRequests.values());
      let filteredRequests = allRequests;

      // Apply filters
      if (filters.status) {
        filteredRequests = filteredRequests.filter(r => r.status === filters.status);
      }

      if (filters.workflowId) {
        filteredRequests = filteredRequests.filter(r => r.workflowId === filters.workflowId);
      }

      if (filters.projectId) {
        filteredRequests = filteredRequests.filter(r => r.projectId === filters.projectId);
      }

      if (filters.requesterId) {
        filteredRequests = filteredRequests.filter(r => r.requesterId === filters.requesterId);
      }

      if (filters.approverId) {
        filteredRequests = filteredRequests.filter(r => 
          this.isUserApproverForRequest(r, filters.approverId!)
        );
      }

      if (filters.priority) {
        filteredRequests = filteredRequests.filter(r => r.priority === filters.priority);
      }

      // Sort by criteria
      const sortedRequests = this.sortRequests(filteredRequests, filters.sortBy, filters.sortOrder);

      // Apply pagination
      const startIndex = (filters.page - 1) * filters.limit;
      const paginatedRequests = sortedRequests.slice(startIndex, startIndex + filters.limit);

      // Convert to summaries
      const summaries = await Promise.all(
        paginatedRequests.map(request => this.createRequestSummary(request))
      );

      return summaries;

    } catch (error) {
      this.logger.error('Failed to get approval requests', { error, filters });
      throw error;
    }
  }

  async getPendingApprovals(userId: string): Promise<PendingApproval[]> {
    try {
      const pendingApprovals: PendingApproval[] = [];

      for (const request of this.activeRequests.values()) {
        if (request.status === ApprovalStatus.IN_PROGRESS) {
          const workflow = await this.getWorkflow(request.workflowId);
          if (workflow) {
            const currentStage = workflow.stages[request.currentStage];
            
            if (currentStage && await this.isUserApproverForStage(currentStage, userId, request)) {
              // Check if user hasn't already approved this stage
              const existingApproval = request.approvals.find(
                approval => approval.stageId === currentStage.id && approval.approverId === userId
              );

              if (!existingApproval) {
                pendingApprovals.push({
                  requestId: request.id,
                  workflowId: request.workflowId,
                  stageId: currentStage.id,
                  title: request.title,
                  description: request.description,
                  priority: request.priority,
                  deadline: request.deadline,
                  requesterId: request.requesterId,
                  stageName: currentStage.name,
                  stageType: currentStage.type,
                  submitted: request.created,
                  timeInStage: Date.now() - Math.max(
                    ...request.timeline
                      .filter(t => t.stageId === currentStage.id)
                      .map(t => t.timestamp.getTime()),
                    request.created.getTime()
                  )
                });
              }
            }
          }
        }
      }

      // Sort by priority and age
      pendingApprovals.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timeInStage - a.timeInStage;
      });

      return pendingApprovals;

    } catch (error) {
      this.logger.error('Failed to get pending approvals', { error, userId });
      throw error;
    }
  }

  async getApprovalMetrics(
    projectId?: string,
    timeRange?: TimeRange
  ): Promise<ApprovalMetrics> {
    try {
      const requests = Array.from(this.activeRequests.values());
      let filteredRequests = requests;

      if (projectId) {
        filteredRequests = filteredRequests.filter(r => r.projectId === projectId);
      }

      if (timeRange) {
        filteredRequests = filteredRequests.filter(r => 
          r.created >= timeRange.start && r.created <= timeRange.end
        );
      }

      const metrics: ApprovalMetrics = {
        totalRequests: filteredRequests.length,
        pendingRequests: filteredRequests.filter(r => 
          r.status === ApprovalStatus.PENDING || r.status === ApprovalStatus.IN_PROGRESS
        ).length,
        approvedRequests: filteredRequests.filter(r => r.status === ApprovalStatus.APPROVED).length,
        rejectedRequests: filteredRequests.filter(r => r.status === ApprovalStatus.REJECTED).length,
        expiredRequests: filteredRequests.filter(r => r.status === ApprovalStatus.EXPIRED).length,
        averageApprovalTime: this.calculateAverageApprovalTime(
          filteredRequests.filter(r => r.status === ApprovalStatus.APPROVED)
        ),
        averageStageTime: this.calculateAverageStageTime(filteredRequests),
        approvalRateByStage: this.calculateApprovalRateByStage(filteredRequests),
        bottleneckStages: this.identifyBottleneckStages(filteredRequests),
        topApprovers: this.getTopApprovers(filteredRequests),
        requestsByType: this.getRequestCountByType(filteredRequests),
        requestsByPriority: this.getRequestCountByPriority(filteredRequests)
      };

      return metrics;

    } catch (error) {
      this.logger.error('Failed to get approval metrics', { error, projectId, timeRange });
      throw error;
    }
  }

  // Private helper methods
  private async processStageApproval(
    workflow: ApprovalWorkflow,
    request: ApprovalRequest,
    stage: ApprovalStage,
    approval: ApprovalRecord
  ): Promise<StageProcessResult> {
    // Get all approvals for this stage
    const stageApprovals = request.approvals.filter(a => a.stageId === stage.id);

    // Check stage completion based on stage type
    const stageComplete = await this.checkStageCompletion(stage, stageApprovals);
    
    if (stageComplete) {
      // Check if stage was approved or rejected
      const stageApproved = await this.checkStageApprovalStatus(stage, stageApprovals);
      
      if (stageApproved) {
        // Move to next stage or complete workflow
        const nextStageIndex = request.currentStage + 1;
        
        if (nextStageIndex < workflow.stages.length) {
          // Move to next stage
          request.currentStage = nextStageIndex;
          request.status = ApprovalStatus.IN_PROGRESS;
          
          // Add timeline entry
          request.timeline.push({
            timestamp: new Date(),
            event: 'stage_completed',
            userId: 'system',
            details: `Stage ${stage.name} completed - moving to next stage`,
            stageId: stage.id
          });

          // Start next stage
          await this.startStage(workflow, request, workflow.stages[nextStageIndex]);

          return {
            stageComplete: true,
            stageApproved: true,
            workflowComplete: false,
            nextStage: workflow.stages[nextStageIndex]
          };
        } else {
          // Workflow complete - approved
          request.status = ApprovalStatus.APPROVED;
          
          request.timeline.push({
            timestamp: new Date(),
            event: 'workflow_completed',
            userId: 'system',
            details: 'All stages completed - workflow approved'
          });

          return {
            stageComplete: true,
            stageApproved: true,
            workflowComplete: true,
            nextStage: null
          };
        }
      } else {
        // Stage rejected - workflow rejected
        request.status = ApprovalStatus.REJECTED;
        
        request.timeline.push({
          timestamp: new Date(),
          event: 'workflow_rejected',
          userId: 'system',
          details: `Workflow rejected at stage ${stage.name}`,
          stageId: stage.id
        });

        return {
          stageComplete: true,
          stageApproved: false,
          workflowComplete: true,
          nextStage: null
        };
      }
    }

    return {
      stageComplete: false,
      stageApproved: null,
      workflowComplete: false,
      nextStage: null
    };
  }

  private async checkStageCompletion(
    stage: ApprovalStage,
    approvals: ApprovalRecord[]
  ): Promise<boolean> {
    switch (stage.type) {
      case StageType.SEQUENTIAL:
        // All approvers must approve in order
        return approvals.length >= stage.approvers.length;
      
      case StageType.PARALLEL:
        // All approvers must approve (order doesn't matter)
        const requiredApprovers = stage.approvers.filter(a => a.required).length;
        const receivedApprovals = approvals.filter(a => a.decision === ApprovalAction.APPROVE).length;
        return receivedApprovals >= requiredApprovers;
      
      case StageType.VOTING:
        // Majority vote or threshold
        const threshold = stage.criteria.votingThreshold || 0.5;
        const totalVotes = approvals.length;
        const approveVotes = approvals.filter(a => a.decision === ApprovalAction.APPROVE).length;
        const rejectVotes = approvals.filter(a => a.decision === ApprovalAction.REJECT).length;
        
        return (approveVotes / totalVotes) >= threshold || (rejectVotes / totalVotes) > (1 - threshold);
      
      case StageType.CONSENSUS:
        // All approvers must agree
        const allApprovers = stage.approvers.length;
        const consensusApprovals = approvals.filter(a => a.decision === ApprovalAction.APPROVE).length;
        return consensusApprovals === allApprovers;
      
      default:
        return false;
    }
  }

  private async checkStageApprovalStatus(
    stage: ApprovalStage,
    approvals: ApprovalRecord[]
  ): Promise<boolean> {
    switch (stage.type) {
      case StageType.SEQUENTIAL:
      case StageType.PARALLEL:
      case StageType.CONSENSUS:
        // Any rejection fails the stage
        return !approvals.some(a => a.decision === ApprovalAction.REJECT);
      
      case StageType.VOTING:
        // Check voting result
        const threshold = stage.criteria.votingThreshold || 0.5;
        const totalVotes = approvals.length;
        const approveVotes = approvals.filter(a => a.decision === ApprovalAction.APPROVE).length;
        return (approveVotes / totalVotes) >= threshold;
      
      default:
        return false;
    }
  }

  private async startStage(
    workflow: ApprovalWorkflow,
    request: ApprovalRequest,
    stage: ApprovalStage
  ): Promise<void> {
    // Send notifications to stage approvers
    for (const approver of stage.approvers) {
      await this.notificationService.sendApprovalRequest(
        request,
        workflow,
        stage,
        approver
      );
    }

    // Start stage timeout if configured
    if (stage.timeouts.stageTimeout) {
      await this.escalationManager.scheduleStageTimeout(request, stage);
    }

    this.eventBus.emit('approval:stage:started', {
      request,
      workflow,
      stage
    });
  }

  private setupEngine(): void {
    this.workflowExecutor = new WorkflowExecutor(
      this.config.executor,
      this.logger,
      this.eventBus
    );

    this.ruleEngine = new ApprovalRuleEngine(
      this.config.rules,
      this.logger
    );

    this.notificationService = new ApprovalNotificationService(
      this.config.notifications,
      this.logger,
      this.eventBus
    );

    this.auditService = new ApprovalAuditService(
      this.config.audit,
      this.logger
    );

    this.escalationManager = new EscalationManager(
      this.config.escalation,
      this.logger,
      this.eventBus
    );

    this.persistenceService = new ApprovalPersistenceService(
      this.config.persistence,
      this.logger
    );
  }

  private startBackgroundTasks(): void {
    // Check for expired requests
    setInterval(() => {
      this.checkExpiredRequests();
    }, this.config.expirationCheckInterval);

    // Process escalations
    setInterval(() => {
      this.escalationManager.processEscalations();
    }, this.config.escalationCheckInterval);

    // Cleanup completed requests
    setInterval(() => {
      this.cleanupCompletedRequests();
    }, this.config.cleanupInterval);
  }

  private async checkExpiredRequests(): Promise<void> {
    const now = new Date();
    
    for (const request of this.activeRequests.values()) {
      if (request.deadline && now > request.deadline && 
          (request.status === ApprovalStatus.PENDING || request.status === ApprovalStatus.IN_PROGRESS)) {
        
        await this.expireRequest(request);
      }
    }
  }

  private async expireRequest(request: ApprovalRequest): Promise<void> {
    request.status = ApprovalStatus.EXPIRED;
    request.lastActivity = new Date();
    
    request.timeline.push({
      timestamp: new Date(),
      event: 'request_expired',
      userId: 'system',
      details: 'Request expired due to deadline'
    });

    await this.persistenceService.updateApprovalRequest(request);

    this.eventBus.emit('approval:request:expired', { request });

    this.logger.warn('Approval request expired', {
      requestId: request.id,
      deadline: request.deadline
    });
  }
}
```

### 2. Workflow Execution Engine

```typescript
// src/core/approval/WorkflowExecutor.ts
export interface WorkflowExecutionContext {
  workflow: ApprovalWorkflow;
  request: ApprovalRequest;
  currentStage: ApprovalStage;
  executionState: ExecutionState;
  variables: WorkflowVariables;
}

export interface ExecutionState {
  startTime: Date;
  currentStageStartTime: Date;
  stageHistory: StageExecutionRecord[];
  errors: ExecutionError[];
  warnings: ExecutionWarning[];
}

export class WorkflowExecutor {
  private executionContexts: Map<string, WorkflowExecutionContext>;
  private conditionEvaluator: ConditionEvaluator;
  private actionExecutor: ActionExecutor;

  constructor(
    private config: WorkflowExecutorConfig,
    private logger: Logger,
    private eventBus: EventBus
  ) {
    this.executionContexts = new Map();
    this.conditionEvaluator = new ConditionEvaluator(config.conditions);
    this.actionExecutor = new ActionExecutor(config.actions);
  }

  async startExecution(
    workflow: ApprovalWorkflow,
    request: ApprovalRequest
  ): Promise<void> {
    try {
      // Create execution context
      const context: WorkflowExecutionContext = {
        workflow,
        request,
        currentStage: workflow.stages[0],
        executionState: {
          startTime: new Date(),
          currentStageStartTime: new Date(),
          stageHistory: [],
          errors: [],
          warnings: []
        },
        variables: await this.initializeWorkflowVariables(workflow, request)
      };

      this.executionContexts.set(request.id, context);

      // Execute workflow rules
      await this.executeWorkflowRules(context);

      // Start first stage
      await this.executeStage(context, workflow.stages[0]);

      this.logger.info('Workflow execution started', {
        workflowId: workflow.id,
        requestId: request.id
      });

    } catch (error) {
      this.logger.error('Failed to start workflow execution', { error, workflowId: workflow.id });
      throw error;
    }
  }

  async executeStage(
    context: WorkflowExecutionContext,
    stage: ApprovalStage
  ): Promise<void> {
    try {
      // Update context
      context.currentStage = stage;
      context.executionState.currentStageStartTime = new Date();

      // Check stage conditions
      const conditionsMet = await this.evaluateStageConditions(context, stage);
      if (!conditionsMet) {
        throw new WorkflowExecutionError('Stage conditions not met');
      }

      // Execute pre-stage actions
      await this.executeStageActions(context, stage, 'pre');

      // Configure stage based on type
      await this.configureStageExecution(context, stage);

      // Send notifications to approvers
      await this.notifyStageApprovers(context, stage);

      // Execute post-stage actions
      await this.executeStageActions(context, stage, 'post');

      // Record stage execution
      context.executionState.stageHistory.push({
        stageId: stage.id,
        startTime: context.executionState.currentStageStartTime,
        status: StageExecutionStatus.ACTIVE,
        approvers: await this.resolveStageApprovers(context, stage)
      });

      this.eventBus.emit('workflow:stage:started', {
        context,
        stage
      });

    } catch (error) {
      this.logger.error('Failed to execute stage', { error, stageId: stage.id });
      throw error;
    }
  }

  private async evaluateStageConditions(
    context: WorkflowExecutionContext,
    stage: ApprovalStage
  ): Promise<boolean> {
    if (!stage.conditions || stage.conditions.length === 0) {
      return true;
    }

    for (const condition of stage.conditions) {
      const result = await this.conditionEvaluator.evaluate(condition, context);
      if (!result) {
        this.logger.info('Stage condition not met', {
          stageId: stage.id,
          condition: condition.expression
        });
        return false;
      }
    }

    return true;
  }

  private async configureStageExecution(
    context: WorkflowExecutionContext,
    stage: ApprovalStage
  ): Promise<void> {
    switch (stage.type) {
      case StageType.SEQUENTIAL:
        await this.configureSequentialStage(context, stage);
        break;
      
      case StageType.PARALLEL:
        await this.configureParallelStage(context, stage);
        break;
      
      case StageType.CONDITIONAL:
        await this.configureConditionalStage(context, stage);
        break;
      
      case StageType.VOTING:
        await this.configureVotingStage(context, stage);
        break;
      
      case StageType.CONSENSUS:
        await this.configureConsensusStage(context, stage);
        break;
    }
  }

  private async configureSequentialStage(
    context: WorkflowExecutionContext,
    stage: ApprovalStage
  ): Promise<void> {
    // For sequential stages, approvers must approve in order
    // Only notify the first approver initially
    if (stage.approvers.length > 0) {
      const firstApprover = stage.approvers[0];
      await this.notifyApprover(context, stage, firstApprover);
    }
  }

  private async configureParallelStage(
    context: WorkflowExecutionContext,
    stage: ApprovalStage
  ): Promise<void> {
    // For parallel stages, notify all approvers simultaneously
    for (const approver of stage.approvers) {
      await this.notifyApprover(context, stage, approver);
    }
  }

  private async configureVotingStage(
    context: WorkflowExecutionContext,
    stage: ApprovalStage
  ): Promise<void> {
    // For voting stages, notify all voters and set up voting rules
    for (const approver of stage.approvers) {
      await this.notifyApprover(context, stage, approver, {
        votingInfo: {
          threshold: stage.criteria.votingThreshold,
          totalVoters: stage.approvers.length
        }
      });
    }
  }

  private async resolveStageApprovers(
    context: WorkflowExecutionContext,
    stage: ApprovalStage
  ): Promise<ResolvedApprover[]> {
    const resolvedApprovers: ResolvedApprover[] = [];

    for (const approverDef of stage.approvers) {
      const resolved = await this.resolveApprover(context, approverDef);
      resolvedApprovers.push(...resolved);
    }

    return resolvedApprovers;
  }

  private async resolveApprover(
    context: WorkflowExecutionContext,
    approverDef: ApproverDefinition
  ): Promise<ResolvedApprover[]> {
    switch (approverDef.type) {
      case ApproverType.USER:
        return [{
          id: approverDef.id,
          type: ApproverType.USER,
          name: approverDef.name,
          email: approverDef.email,
          required: approverDef.required
        }];
      
      case ApproverType.ROLE:
        return await this.resolveRoleApprovers(context, approverDef);
      
      case ApproverType.GROUP:
        return await this.resolveGroupApprovers(context, approverDef);
      
      case ApproverType.DYNAMIC:
        return await this.resolveDynamicApprovers(context, approverDef);
      
      default:
        throw new WorkflowExecutionError(`Unknown approver type: ${approverDef.type}`);
    }
  }

  private async resolveRoleApprovers(
    context: WorkflowExecutionContext,
    approverDef: ApproverDefinition
  ): Promise<ResolvedApprover[]> {
    // Get users with the specified role in the project
    const users = await this.userService.getUsersByRole(
      context.request.projectId,
      approverDef.id
    );

    return users.map(user => ({
      id: user.id,
      type: ApproverType.USER,
      name: user.name,
      email: user.email,
      required: approverDef.required,
      resolvedFrom: {
        type: ApproverType.ROLE,
        id: approverDef.id
      }
    }));
  }

  private async executeStageActions(
    context: WorkflowExecutionContext,
    stage: ApprovalStage,
    timing: 'pre' | 'post'
  ): Promise<void> {
    const actions = stage.actions.filter(action => action.timing === timing);
    
    for (const action of actions) {
      try {
        await this.actionExecutor.execute(action, context);
      } catch (error) {
        this.logger.error('Failed to execute stage action', {
          error,
          actionId: action.id,
          stageId: stage.id
        });
        
        if (action.required) {
          throw error;
        }
      }
    }
  }

  private async notifyStageApprovers(
    context: WorkflowExecutionContext,
    stage: ApprovalStage
  ): Promise<void> {
    const resolvedApprovers = await this.resolveStageApprovers(context, stage);
    
    for (const approver of resolvedApprovers) {
      await this.notifyApprover(context, stage, approver);
    }
  }

  private async notifyApprover(
    context: WorkflowExecutionContext,
    stage: ApprovalStage,
    approver: ApproverDefinition | ResolvedApprover,
    options?: NotificationOptions
  ): Promise<void> {
    const notification: ApprovalNotification = {
      type: NotificationType.APPROVAL_REQUEST,
      requestId: context.request.id,
      workflowId: context.workflow.id,
      stageId: stage.id,
      approverId: approver.id,
      title: `Approval Required: ${context.request.title}`,
      message: this.buildApprovalMessage(context, stage, approver),
      priority: context.request.priority,
      deadline: context.request.deadline,
      metadata: {
        stageType: stage.type,
        ...options
      }
    };

    await this.sendNotification(notification);
  }

  private buildApprovalMessage(
    context: WorkflowExecutionContext,
    stage: ApprovalStage,
    approver: ApproverDefinition | ResolvedApprover
  ): string {
    return `
      You have a pending approval request for "${context.request.title}".
      
      Stage: ${stage.name}
      Requested by: ${context.request.requesterId}
      Project: ${context.request.projectId}
      Priority: ${context.request.priority}
      
      ${context.request.description}
      
      Please review and provide your approval decision.
    `.trim();
  }
}
```

### 3. Rule Engine and Business Logic

```typescript
// src/core/approval/ApprovalRuleEngine.ts
export interface ApprovalRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
}

export enum RuleType {
  ROUTING = 'routing',
  VALIDATION = 'validation',
  ESCALATION = 'escalation',
  NOTIFICATION = 'notification',
  AUTO_APPROVAL = 'auto_approval'
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  dataType: DataType;
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

export class ApprovalRuleEngine {
  private rules: Map<string, ApprovalRule>;
  private conditionEvaluator: ConditionEvaluator;

  constructor(
    private config: RuleEngineConfig,
    private logger: Logger
  ) {
    this.rules = new Map();
    this.conditionEvaluator = new ConditionEvaluator();
    this.loadRules();
  }

  async evaluateRules(
    context: WorkflowExecutionContext,
    ruleType?: RuleType
  ): Promise<RuleEvaluationResult[]> {
    const results: RuleEvaluationResult[] = [];
    
    // Get applicable rules
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled && (!ruleType || rule.type === ruleType))
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    for (const rule of applicableRules) {
      try {
        const result = await this.evaluateRule(rule, context);
        results.push(result);
        
        if (result.matched && result.stopProcessing) {
          break;
        }
      } catch (error) {
        this.logger.error('Rule evaluation failed', {
          error,
          ruleId: rule.id,
          requestId: context.request.id
        });
        
        results.push({
          ruleId: rule.id,
          matched: false,
          error: error.message,
          stopProcessing: false
        });
      }
    }

    return results;
  }

  private async evaluateRule(
    rule: ApprovalRule,
    context: WorkflowExecutionContext
  ): Promise<RuleEvaluationResult> {
    // Evaluate all conditions
    const conditionResults = await Promise.all(
      rule.conditions.map(condition => this.evaluateCondition(condition, context))
    );

    // All conditions must be true for rule to match
    const matched = conditionResults.every(result => result);

    if (matched) {
      // Execute rule actions
      const actionResults = await this.executeRuleActions(rule, context);
      
      return {
        ruleId: rule.id,
        matched: true,
        actionResults,
        stopProcessing: rule.actions.some(action => action.stopProcessing)
      };
    }

    return {
      ruleId: rule.id,
      matched: false,
      stopProcessing: false
    };
  }

  private async evaluateCondition(
    condition: RuleCondition,
    context: WorkflowExecutionContext
  ): Promise<boolean> {
    const fieldValue = await this.getFieldValue(condition.field, context);
    return this.conditionEvaluator.evaluate(condition, fieldValue);
  }

  private async getFieldValue(
    fieldPath: string,
    context: WorkflowExecutionContext
  ): Promise<any> {
    const pathParts = fieldPath.split('.');
    let value: any = {
      request: context.request,
      workflow: context.workflow,
      stage: context.currentStage,
      variables: context.variables
    };

    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async executeRuleActions(
    rule: ApprovalRule,
    context: WorkflowExecutionContext
  ): Promise<RuleActionResult[]> {
    const results: RuleActionResult[] = [];

    for (const action of rule.actions) {
      try {
        const result = await this.executeRuleAction(action, context);
        results.push({
          actionId: action.id,
          success: true,
          result
        });
      } catch (error) {
        this.logger.error('Rule action execution failed', {
          error,
          actionId: action.id,
          ruleId: rule.id
        });
        
        results.push({
          actionId: action.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  private async executeRuleAction(
    action: RuleAction,
    context: WorkflowExecutionContext
  ): Promise<any> {
    switch (action.type) {
      case RuleActionType.MODIFY_APPROVERS:
        return await this.modifyApprovers(action, context);
      
      case RuleActionType.SEND_NOTIFICATION:
        return await this.sendRuleNotification(action, context);
      
      case RuleActionType.AUTO_APPROVE:
        return await this.autoApprove(action, context);
      
      case RuleActionType.ESCALATE:
        return await this.escalateApproval(action, context);
      
      case RuleActionType.SET_VARIABLE:
        return await this.setVariable(action, context);
      
      default:
        throw new Error(`Unknown rule action type: ${action.type}`);
    }
  }

  private async modifyApprovers(
    action: RuleAction,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const stage = context.currentStage;
    const modification = action.parameters as ApproverModification;

    switch (modification.operation) {
      case 'add':
        stage.approvers.push(...modification.approvers);
        break;
      
      case 'remove':
        stage.approvers = stage.approvers.filter(
          approver => !modification.approvers.some(a => a.id === approver.id)
        );
        break;
      
      case 'replace':
        stage.approvers = modification.approvers;
        break;
    }

    this.logger.info('Approvers modified by rule', {
      ruleId: action.id,
      operation: modification.operation,
      stageId: stage.id
    });
  }

  private async autoApprove(
    action: RuleAction,
    context: WorkflowExecutionContext
  ): Promise<void> {
    const autoApprovalParameters = action.parameters as AutoApprovalParameters;
    
    // Create system approval
    const systemApproval: ApprovalRecord = {
      id: generateApprovalId(),
      requestId: context.request.id,
      stageId: context.currentStage.id,
      approverId: 'system',
      decision: ApprovalAction.APPROVE,
      comments: autoApprovalParameters.reason || 'Auto-approved by rule',
      attachments: [],
      timestamp: new Date(),
      metadata: {
        ruleId: action.id,
        autoApproval: true
      }
    };

    context.request.approvals.push(systemApproval);

    this.logger.info('Request auto-approved by rule', {
      ruleId: action.id,
      requestId: context.request.id,
      reason: autoApprovalParameters.reason
    });
  }

  private loadRules(): void {
    // Load default rules
    this.addRule({
      id: 'high-priority-escalation',
      name: 'High Priority Escalation',
      description: 'Escalate high priority requests after 4 hours',
      type: RuleType.ESCALATION,
      conditions: [
        {
          field: 'request.priority',
          operator: ConditionOperator.EQUALS,
          value: ApprovalPriority.HIGH,
          dataType: DataType.STRING
        }
      ],
      actions: [
        {
          id: 'escalate-to-manager',
          type: RuleActionType.ESCALATE,
          parameters: {
            escalationLevel: 1,
            delay: 4 * 60 * 60 * 1000 // 4 hours
          }
        }
      ],
      priority: 100,
      enabled: true
    });

    this.addRule({
      id: 'auto-approve-minor-changes',
      name: 'Auto-approve Minor Changes',
      description: 'Auto-approve requests marked as minor changes',
      type: RuleType.AUTO_APPROVAL,
      conditions: [
        {
          field: 'request.metadata.customFields.changeType',
          operator: ConditionOperator.EQUALS,
          value: 'minor',
          dataType: DataType.STRING
        }
      ],
      actions: [
        {
          id: 'auto-approve-minor',
          type: RuleActionType.AUTO_APPROVE,
          parameters: {
            reason: 'Auto-approved: Minor change'
          }
        }
      ],
      priority: 90,
      enabled: true
    });
  }

  addRule(rule: ApprovalRule): void {
    this.rules.set(rule.id, rule);
    this.logger.info('Approval rule added', { ruleId: rule.id, name: rule.name });
  }

  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.logger.info('Approval rule removed', { ruleId });
    }
    return removed;
  }

  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      this.logger.info('Approval rule enabled', { ruleId });
      return true;
    }
    return false;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      this.logger.info('Approval rule disabled', { ruleId });
      return true;
    }
    return false;
  }
}
```

## File Structure

```
src/core/approval/
├── index.ts                              # Main exports
├── ApprovalEngine.ts                     # Core approval engine
├── WorkflowExecutor.ts                   # Workflow execution engine
├── ApprovalRuleEngine.ts                 # Business rules engine
├── types/
│   ├── index.ts
│   ├── workflow.ts                       # Workflow type definitions
│   ├── approval.ts                       # Approval type definitions
│   ├── stage.ts                          # Stage type definitions
│   ├── rule.ts                           # Rule type definitions
│   └── notification.ts                   # Notification type definitions
├── services/
│   ├── index.ts
│   ├── ApprovalPersistenceService.ts     # Approval persistence
│   ├── ApprovalNotificationService.ts    # Approval notifications
│   ├── ApprovalAuditService.ts           # Approval auditing
│   ├── EscalationManager.ts              # Escalation management
│   └── WorkflowValidator.ts              # Workflow validation
├── engines/
│   ├── index.ts
│   ├── ConditionEvaluator.ts             # Condition evaluation
│   ├── ActionExecutor.ts                 # Action execution
│   ├── ApproverResolver.ts               # Approver resolution
│   └── TimeoutManager.ts                 # Timeout management
├── builders/
│   ├── index.ts
│   ├── WorkflowBuilder.ts                # Workflow definition builder
│   ├── StageBuilder.ts                   # Stage definition builder
│   └── RuleBuilder.ts                    # Rule definition builder
├── processors/
│   ├── index.ts
│   ├── SequentialProcessor.ts            # Sequential stage processor
│   ├── ParallelProcessor.ts              # Parallel stage processor
│   ├── VotingProcessor.ts                # Voting stage processor
│   └── ConditionalProcessor.ts           # Conditional stage processor
├── integrations/
│   ├── index.ts
│   ├── CollaborationIntegration.ts       # Collaboration system integration
│   ├── NotificationIntegration.ts        # Notification system integration
│   └── UserServiceIntegration.ts         # User service integration
├── utils/
│   ├── index.ts
│   ├── ApprovalUtils.ts                  # Approval utility functions
│   ├── WorkflowUtils.ts                  # Workflow utility functions
│   ├── StageUtils.ts                     # Stage utility functions
│   └── RuleUtils.ts                      # Rule utility functions
└── __tests__/
    ├── unit/
    │   ├── ApprovalEngine.test.ts
    │   ├── WorkflowExecutor.test.ts
    │   ├── ApprovalRuleEngine.test.ts
    │   └── ConditionEvaluator.test.ts
    ├── integration/
    │   ├── approval-workflow.test.ts
    │   ├── escalation-flow.test.ts
    │   └── rule-execution.test.ts
    └── fixtures/
        ├── test-workflows.json
        ├── test-requests.json
        ├── test-rules.json
        └── test-approvals.json
```

## Success Criteria

### Functional Requirements
1. **Workflow Management**: Support complex multi-stage approval workflows with configurable business rules
2. **Approval Processing**: Handle 1000+ concurrent approval requests with sub-200ms processing time
3. **Rule Engine**: Execute business rules for routing, validation, and automation
4. **Escalation Management**: Automatic escalation based on timeouts and business rules
5. **Audit Trail**: Complete audit trail of all approval decisions and workflow changes
6. **Integration**: Seamless integration with collaboration and notification systems
7. **Flexibility**: Support various approval patterns (sequential, parallel, voting, consensus)

### Technical Requirements
1. **Error Handling**: Comprehensive error handling with graceful degradation
2. **Logging**: Detailed logging for debugging and monitoring
3. **Metrics**: Performance and approval metrics collection
4. **Testing**: 90%+ code coverage with unit, integration, and end-to-end tests
5. **Documentation**: Complete API documentation and usage examples
6. **Configuration**: Flexible configuration for different approval scenarios
7. **Security**: Secure approval processing with proper access controls

### Quality Standards
1. **Performance**: High-throughput approval processing with minimal latency
2. **Reliability**: 99.9% approval system availability with proper failover
3. **Scalability**: Support for enterprise-scale approval volumes
4. **Maintainability**: Clean, well-documented, and extensible code architecture
5. **Compliance**: Full audit trail and compliance with enterprise requirements

## Output Format

### Implementation Deliverables
1. **Core Implementation**: Complete approval engine with workflow execution
2. **Unit Tests**: Comprehensive test suite with 90%+ coverage
3. **Integration Tests**: End-to-end approval workflow testing
4. **Performance Tests**: Load testing for high-volume approval scenarios
5. **API Documentation**: Detailed documentation of all approval APIs
6. **Configuration Examples**: Sample workflows and rules for different scenarios
7. **Admin Dashboard**: Approval management and monitoring interface

### Documentation Requirements
1. **Architecture Documentation**: System design and component interactions
2. **API Reference**: Complete approval engine API documentation
3. **Workflow Guide**: Creating and managing approval workflows
4. **Rule Engine Guide**: Business rule configuration and management
5. **Troubleshooting Guide**: Common issues and resolution steps
6. **Performance Tuning**: Optimization recommendations for high-volume scenarios

### Testing Requirements
1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions and approval flows
3. **Workflow Tests**: Test various workflow patterns and scenarios
4. **Rule Engine Tests**: Test business rule evaluation and execution
5. **Performance Tests**: Measure approval processing throughput and latency
6. **Security Tests**: Verify access controls and audit logging

Remember to leverage Context7 throughout the implementation to ensure you're using the most current workflow and approval system best practices and optimal libraries for enterprise approval engines.