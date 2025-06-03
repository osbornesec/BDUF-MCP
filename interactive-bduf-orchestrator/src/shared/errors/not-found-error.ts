import { BaseError, ErrorMetadata, ErrorSeverityLevel } from './base-error.js';

export class NotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly errorCode = 'RESOURCE_NOT_FOUND';
  readonly category = 'client';
  readonly severity: ErrorSeverityLevel = {
    level: 'low',
    impact: 'user',
    recovery: 'manual'
  };

  constructor(
    resource: string,
    identifier?: string | number,
    metadata: ErrorMetadata = {}
  ) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(message, {
      ...metadata,
      resource,
      identifier,
      operation: 'resource_lookup'
    });
  }

  static forEntity(entityType: string, id: string | number): NotFoundError {
    return new NotFoundError(entityType, id, {
      entityType,
      entityId: String(id)
    });
  }

  static forPath(path: string): NotFoundError {
    return new NotFoundError('Endpoint', path, {
      path,
      operation: 'route_lookup'
    });
  }

  static forFile(filePath: string): NotFoundError {
    return new NotFoundError('File', filePath, {
      filePath,
      operation: 'file_access'
    });
  }

  static forUser(userId: string): NotFoundError {
    return new NotFoundError('User', userId, {
      userId,
      operation: 'user_lookup'
    });
  }

  static forProject(projectId: string): NotFoundError {
    return new NotFoundError('Project', projectId, {
      projectId,
      operation: 'project_lookup'
    });
  }

  static forSession(sessionId: string): NotFoundError {
    return new NotFoundError('Session', sessionId, {
      sessionId,
      operation: 'session_lookup'
    });
  }

  static forTool(toolName: string): NotFoundError {
    return new NotFoundError('MCP Tool', toolName, {
      toolName,
      operation: 'tool_lookup'
    });
  }
}