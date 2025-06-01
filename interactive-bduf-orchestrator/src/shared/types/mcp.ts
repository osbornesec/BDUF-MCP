// Model Context Protocol specific types

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: MCPInputSchema;
  handler: ToolHandler;
  progressReporting?: boolean;
  requiresAuth?: boolean;
  rateLimit?: RateLimit;
}

export interface MCPInputSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: (string | number)[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  default?: unknown;
  optional?: boolean;
}

export type ToolHandler = (params: unknown) => Promise<MCPResponse>;

export interface MCPResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: MCPError;
  metadata: MCPMetadata;
  nextActions?: NextAction[];
  interactionRequired?: InteractionRequirement;
}

export interface MCPError {
  code: string;
  message: string;
  details?: unknown;
}

export interface MCPMetadata {
  timestamp: string;
  requestId: string;
  processingTime: number;
  aiConfidence?: number;
  humanReviewRequired?: boolean;
  version?: string;
  source?: string;
}

export interface NextAction {
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  assignee?: string;
  dependencies?: string[];
  estimatedDuration?: number;
}

export interface InteractionRequirement {
  type: 'approval' | 'input' | 'review' | 'clarification';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  deadline?: string;
  participants: string[];
  format: 'synchronous' | 'asynchronous' | 'either';
  data?: unknown;
}

export interface RateLimit {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (params: unknown) => string;
}

export interface ServerCapabilities {
  tools: {
    listChanged: boolean;
    supportsProgress: boolean;
  };
  resources: {
    subscribe: boolean;
    listChanged: boolean;
  };
  prompts: {
    listChanged: boolean;
  };
  logging: {
    level: LogLevel;
  };
  experimental?: {
    [feature: string]: boolean;
  };
}

export type LogLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';

export interface MCPSession {
  id: string;
  clientId: string;
  userId?: string;
  capabilities: ServerCapabilities;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionContext {
  sessionId: string;
  userId?: string;
  requestId: string;
  timestamp: Date;
  capabilities: ServerCapabilities;
  metadata?: Record<string, unknown>;
}

export interface ProgressUpdate {
  operationId: string;
  progress: number;
  stage: string;
  message?: string;
  estimatedTimeRemaining?: number;
  details?: unknown;
}