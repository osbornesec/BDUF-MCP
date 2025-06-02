import { BaseError, ErrorMetadata, ErrorSeverityLevel } from './base-error.js';

export class ConflictError extends BaseError {
  readonly statusCode = 409;
  readonly errorCode = 'RESOURCE_CONFLICT';
  readonly category = 'client';
  readonly severity: ErrorSeverityLevel = {
    level: 'medium',
    impact: 'user',
    recovery: 'manual'
  };

  constructor(
    resource: string,
    conflictReason: string,
    metadata: ErrorMetadata = {}
  ) {
    super(`Conflict with ${resource}: ${conflictReason}`, {
      ...metadata,
      resource,
      conflictReason,
      operation: 'resource_conflict'
    });
  }

  static forDuplicate(resource: string, identifier: string): ConflictError {
    return new ConflictError(
      resource,
      `Resource with identifier '${identifier}' already exists`,
      { identifier, reason: 'duplicate' }
    );
  }

  static forConcurrency(resource: string, identifier: string, version?: string): ConflictError {
    return new ConflictError(
      resource,
      `Resource '${identifier}' was modified by another operation`,
      { identifier, version, reason: 'concurrency' }
    );
  }

  static forState(resource: string, currentState: string, requiredState: string): ConflictError {
    return new ConflictError(
      resource,
      `Resource is in state '${currentState}', required state is '${requiredState}'`,
      { currentState, requiredState, reason: 'invalid_state' }
    );
  }

  static forDependency(resource: string, dependency: string): ConflictError {
    return new ConflictError(
      resource,
      `Cannot perform operation due to dependency on '${dependency}'`,
      { dependency, reason: 'dependency_conflict' }
    );
  }

  static forLock(resource: string, lockHolder?: string): ConflictError {
    return new ConflictError(
      resource,
      `Resource is locked${lockHolder ? ` by ${lockHolder}` : ''}`,
      { lockHolder, reason: 'resource_locked' }
    );
  }

  static forSession(sessionId: string, reason: string): ConflictError {
    return new ConflictError(
      `session:${sessionId}`,
      reason,
      { sessionId, reason: 'session_conflict' }
    );
  }

  static forProject(projectId: string, reason: string): ConflictError {
    return new ConflictError(
      `project:${projectId}`,
      reason,
      { projectId, reason: 'project_conflict' }
    );
  }

  static forApproval(approvalId: string, currentStatus: string): ConflictError {
    return new ConflictError(
      `approval:${approvalId}`,
      `Approval is already in '${currentStatus}' state`,
      { approvalId, currentStatus, reason: 'approval_conflict' }
    );
  }

  static forTask(taskId: string, currentStatus: string): ConflictError {
    return new ConflictError(
      `task:${taskId}`,
      `Task is already in '${currentStatus}' state`,
      { taskId, currentStatus, reason: 'task_conflict' }
    );
  }
}