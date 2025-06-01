import { MCPTool, ToolHandler, MCPResponse, ValidationResult } from '../shared/types/mcp';
import { Logger } from '../shared/logger';
import { ValidationError } from '../shared/errors';

export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private handlers: Map<string, ToolHandler> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ToolRegistry');
  }

  register(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      throw new ValidationError(`Tool ${tool.name} is already registered`);
    }

    // Validate tool definition
    const validation = this.validateTool(tool);
    if (!validation.isValid) {
      throw new ValidationError(`Invalid tool definition: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.tools.set(tool.name, tool);
    this.handlers.set(tool.name, tool.handler);

    this.logger.info(`Registered tool: ${tool.name}`, {
      operation: 'register',
      metadata: {
        toolName: tool.name,
        requiresAuth: tool.requiresAuth,
        progressReporting: tool.progressReporting
      }
    });
  }

  unregister(toolName: string): boolean {
    const removed = this.tools.delete(toolName) && this.handlers.delete(toolName);
    
    if (removed) {
      this.logger.info(`Unregistered tool: ${toolName}`, {
        operation: 'unregister',
        metadata: { toolName }
      });
    }

    return removed;
  }

  async execute(toolName: string, params: unknown, context?: Record<string, unknown>): Promise<MCPResponse> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new ValidationError(`Tool ${toolName} not found`);
    }

    const startTime = Date.now();
    this.logger.info(`Executing tool: ${toolName}`, {
      operation: 'execute',
      metadata: { toolName, hasContext: !!context }
    });

    try {
      // Validate parameters against schema
      await this.validateParams(tool, params);

      // Execute handler
      const handler = this.handlers.get(toolName)!;
      const response = await handler(params);

      const processingTime = Date.now() - startTime;

      // Enhance response with metadata
      response.metadata = {
        ...response.metadata,
        processingTime,
        toolName
      };

      this.logger.info(`Tool execution completed: ${toolName}`, {
        operation: 'execute',
        metadata: {
          toolName,
          processingTime,
          success: response.success
        }
      });

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Tool execution failed: ${toolName}`, error as Error, {
        operation: 'execute',
        metadata: { toolName, processingTime }
      });

      return {
        success: false,
        error: {
          code: 'TOOL_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId(),
          processingTime,
          toolName
        }
      };
    }
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  hasCapability(toolName: string, capability: string): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return false;
    }

    // Check for specific capabilities
    switch (capability) {
      case 'progress_reporting':
        return tool.progressReporting === true;
      case 'requires_auth':
        return tool.requiresAuth === true;
      default:
        return false;
    }
  }

  validateTool(tool: MCPTool): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Validate required fields
    if (!tool.name || tool.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Tool name is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!tool.description || tool.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Tool description is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!tool.handler || typeof tool.handler !== 'function') {
      errors.push({
        field: 'handler',
        message: 'Tool handler must be a function',
        code: 'INVALID_TYPE'
      });
    }

    // Validate input schema
    if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
      errors.push({
        field: 'inputSchema',
        message: 'Tool input schema is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      if (tool.inputSchema.type !== 'object') {
        errors.push({
          field: 'inputSchema.type',
          message: 'Input schema type must be "object"',
          code: 'INVALID_VALUE'
        });
      }

      if (!tool.inputSchema.properties || typeof tool.inputSchema.properties !== 'object') {
        errors.push({
          field: 'inputSchema.properties',
          message: 'Input schema properties are required',
          code: 'REQUIRED_FIELD'
        });
      }
    }

    // Validate tool name format
    if (tool.name && !/^[a-z][a-z0-9_]*$/.test(tool.name)) {
      errors.push({
        field: 'name',
        message: 'Tool name must start with lowercase letter and contain only lowercase letters, numbers, and underscores',
        code: 'INVALID_FORMAT'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async validateParams(tool: MCPTool, params: unknown): Promise<void> {
    // Basic type validation
    if (tool.inputSchema.type === 'object' && (typeof params !== 'object' || params === null)) {
      throw new ValidationError('Parameters must be an object');
    }

    const paramsObj = params as Record<string, unknown>;

    // Check required fields
    if (tool.inputSchema.required) {
      for (const requiredField of tool.inputSchema.required) {
        if (!(requiredField in paramsObj)) {
          throw new ValidationError(`Required parameter '${requiredField}' is missing`);
        }
      }
    }

    // Validate each property
    if (tool.inputSchema.properties) {
      for (const [key, schema] of Object.entries(tool.inputSchema.properties)) {
        if (key in paramsObj) {
          this.validateProperty(key, paramsObj[key], schema);
        }
      }
    }
  }

  private validateProperty(key: string, value: unknown, schema: any): void {
    // Type validation
    const actualType = this.getValueType(value);
    if (actualType !== schema.type) {
      throw new ValidationError(`Parameter '${key}' must be of type ${schema.type}, got ${actualType}`);
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      throw new ValidationError(`Parameter '${key}' must be one of: ${schema.enum.join(', ')}`);
    }

    // String validations
    if (schema.type === 'string' && typeof value === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        throw new ValidationError(`Parameter '${key}' must be at least ${schema.minLength} characters long`);
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        throw new ValidationError(`Parameter '${key}' must be at most ${schema.maxLength} characters long`);
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        throw new ValidationError(`Parameter '${key}' does not match required pattern`);
      }
    }

    // Number validations
    if (schema.type === 'number' && typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        throw new ValidationError(`Parameter '${key}' must be at least ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        throw new ValidationError(`Parameter '${key}' must be at most ${schema.maximum}`);
      }
    }
  }

  private getValueType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}