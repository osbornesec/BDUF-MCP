import { BaseError, ErrorMetadata, ErrorSeverityLevel } from './base-error.js';

export class PermissionError extends BaseError {
  readonly statusCode = 403;
  readonly errorCode = 'INSUFFICIENT_PERMISSIONS';
  readonly category = 'security';
  readonly severity: ErrorSeverityLevel = {
    level: 'high',
    impact: 'security',
    recovery: 'manual'
  };

  constructor(
    action: string,
    resource?: string,
    requiredPermissions?: string[],
    metadata: ErrorMetadata = {}
  ) {
    const message = resource 
      ? `Insufficient permissions to ${action} ${resource}`
      : `Insufficient permissions to ${action}`;
    
    super(message, {
      ...metadata,
      action,
      resource,
      requiredPermissions,
      operation: 'authorization'
    });
  }

  static forAction(action: string, resource?: string): PermissionError {
    return new PermissionError(action, resource);
  }

  static forRole(action: string, resource: string, requiredRoles: string[]): PermissionError {
    return new PermissionError(action, resource, requiredRoles, {
      requiredRoles,
      operation: 'role_check'
    });
  }

  static forResource(resourceType: string, resourceId: string, action: string): PermissionError {
    return new PermissionError(action, `${resourceType}:${resourceId}`, undefined, {
      resourceType,
      resourceId,
      operation: 'resource_access'
    });
  }

  static forProject(projectId: string, action: string): PermissionError {
    return new PermissionError(action, `project:${projectId}`, ['project_access'], {
      projectId,
      operation: 'project_access'
    });
  }

  static forSession(sessionId: string, action: string): PermissionError {
    return new PermissionError(action, `session:${sessionId}`, ['session_access'], {
      sessionId,
      operation: 'session_access'
    });
  }

  static forTool(toolName: string, action: string): PermissionError {
    return new PermissionError(action, `tool:${toolName}`, ['tool_execution'], {
      toolName,
      operation: 'tool_execution'
    });
  }

  static forApiKey(action: string): PermissionError {
    return new PermissionError(action, 'API', ['valid_api_key'], {
      operation: 'api_key_validation'
    });
  }

  static forAuthentication(action: string): PermissionError {
    return new PermissionError(action, undefined, ['authenticated'], {
      operation: 'authentication_required'
    });
  }
}