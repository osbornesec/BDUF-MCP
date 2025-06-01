# MCP Server Architecture and Implementation Patterns

## Overview

Building robust Model Context Protocol (MCP) servers requires careful attention to architectural patterns, implementation practices, and operational considerations. This guide outlines the best practices and patterns for creating maintainable, scalable, and interoperable MCP servers based on the official MCP specification and expert recommendations.

## Core Architectural Principles

### 1. Simplicity & Focus
- **Single Responsibility**: Each MCP server should have a narrow, well-defined focus
- **Minimal Complexity**: Keep implementation simple and maintainable
- **Clear Boundaries**: Define explicit server capabilities and limitations
- **Easy to Build**: Reduce barriers to server creation and modification

### 2. Composability
- **Modular Design**: Implement each server as a self-contained module
- **Specific Functions**: Provide only well-defined capabilities (e.g., search, summarization, code execution)
- **Easy Replacement**: Allow servers to be swapped without affecting others
- **Extensible Architecture**: Support adding new capabilities through composition

### 3. Isolation
- **Context Separation**: Servers should not access entire conversation history
- **Data Privacy**: Only receive relevant, minimal context from host
- **Security Boundaries**: Maintain strict separation between server instances
- **Stateful Sessions**: Each client maintains dedicated connection with single server

## Server Implementation Patterns

### Basic Server Structure

```typescript
interface MCPServer {
  // Core lifecycle methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  
  // Capability declaration
  getCapabilities(): ServerCapabilities;
  
  // Tool handling
  listTools(): Tool[];
  callTool(name: string, arguments: any): Promise<ToolResult>;
  
  // Resource handling (optional)
  listResources?(): Resource[];
  readResource?(uri: string): Promise<ResourceContent>;
  
  // Prompt templates (optional)
  listPrompts?(): Prompt[];
  getPrompt?(name: string, arguments: any): Promise<PromptContent>;
}
```

### Capability Negotiation Pattern

```typescript
class ExampleMCPServer implements MCPServer {
  async initialize(): Promise<void> {
    // Declare supported features during initialization
    this.capabilities = {
      tools: true,
      resources: false,
      prompts: true,
      experimental: {
        sampling: false
      }
    };
  }

  getCapabilities(): ServerCapabilities {
    return this.capabilities;
  }

  listTools(): Tool[] {
    // Only return tools if capability is declared
    if (!this.capabilities.tools) {
      return [];
    }
    
    return [
      {
        name: 'search',
        description: 'Search for information',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'number', default: 10 }
          },
          required: ['query']
        }
      }
    ];
  }
}
```

## Tool Definition Best Practices

### 1. Declarative Tool Capabilities

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  examples?: ToolExample[];
  metadata?: {
    version: string;
    category: string;
    tags: string[];
  };
}

// Example: Well-defined search tool
const searchTool: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for current information',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
        minLength: 1,
        maxLength: 500
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results',
        minimum: 1,
        maximum: 20,
        default: 10
      },
      time_filter: {
        type: 'string',
        enum: ['day', 'week', 'month', 'year', 'all'],
        default: 'all',
        description: 'Filter results by time period'
      }
    },
    required: ['query']
  },
  examples: [
    {
      query: 'latest AI research papers',
      max_results: 5,
      time_filter: 'month'
    }
  ]
};
```

### 2. Minimal Interfaces

```typescript
// Good: Focused, minimal interface
interface FileSearchTool {
  search(pattern: string, directory?: string): Promise<FileResult[]>;
}

// Avoid: Overly complex interfaces
interface ComplexTool {
  search(query: string, options: {
    type?: string;
    format?: string;
    encoding?: string;
    recursive?: boolean;
    caseSensitive?: boolean;
    regex?: boolean;
    // ... many more options
  }): Promise<any>;
}
```

### 3. Extensible Design

```typescript
interface ExtensibleTool {
  name: string;
  version: string;
  supports: string[]; // List of supported features
  
  execute(params: ToolParams): Promise<ToolResult>;
  
  // Allow for future extensions
  getMetadata?(): ToolMetadata;
  validateInput?(params: ToolParams): ValidationResult;
  supportsFeature?(feature: string): boolean;
}
```

## Communication Protocol Patterns

### 1. Base Protocol Implementation

```typescript
class MCPConnection {
  private protocol: MCPProtocol;
  
  async initialize(): Promise<void> {
    // Version negotiation
    const serverInfo = await this.protocol.initialize({
      protocolVersion: '2024-11-05',
      capabilities: this.getCapabilities(),
      serverInfo: {
        name: 'example-server',
        version: '1.0.0'
      }
    });
    
    // Validate client capabilities
    this.validateClientCapabilities(serverInfo.capabilities);
  }
  
  private validateClientCapabilities(capabilities: ClientCapabilities): void {
    if (!capabilities.sampling && this.requiresSampling) {
      throw new Error('Client does not support required sampling capability');
    }
  }
}
```

### 2. Stateful Connection Management

```typescript
class StatefulMCPServer {
  private connections = new Map<string, ClientConnection>();
  
  async handleConnection(clientId: string): Promise<void> {
    const connection = new ClientConnection(clientId);
    await connection.initialize();
    
    this.connections.set(clientId, connection);
    
    // Set up resource subscriptions if supported
    if (connection.capabilities.resources) {
      await this.setupResourceSubscriptions(connection);
    }
  }
  
  async handleDisconnection(clientId: string): Promise<void> {
    const connection = this.connections.get(clientId);
    if (connection) {
      await connection.cleanup();
      this.connections.delete(clientId);
    }
  }
}
```

### 3. Event-driven Notifications

```typescript
class ResourceAwareMCPServer {
  private subscriptions = new Map<string, Set<string>>();
  
  async subscribeToResource(clientId: string, uri: string): Promise<void> {
    if (!this.subscriptions.has(clientId)) {
      this.subscriptions.set(clientId, new Set());
    }
    
    this.subscriptions.get(clientId)!.add(uri);
    
    // Set up file watcher or other notification mechanism
    this.watchResource(uri, (change) => {
      this.notifyResourceChange(clientId, uri, change);
    });
  }
  
  private async notifyResourceChange(
    clientId: string, 
    uri: string, 
    change: ResourceChange
  ): Promise<void> {
    const connection = this.connections.get(clientId);
    if (connection) {
      await connection.send({
        method: 'notifications/resources/updated',
        params: { uri, change }
      });
    }
  }
}
```

## Error Handling Patterns

### 1. Explicit Error Channels

```typescript
enum MCPErrorCode {
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  CAPABILITY_NOT_SUPPORTED = -32000,
  RESOURCE_NOT_FOUND = -32001,
  TOOL_ERROR = -32002
}

class MCPError extends Error {
  constructor(
    public code: MCPErrorCode,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

// Usage in tool implementation
async function callTool(name: string, args: any): Promise<ToolResult> {
  try {
    if (!this.tools.has(name)) {
      throw new MCPError(
        MCPErrorCode.METHOD_NOT_FOUND,
        `Tool '${name}' not found`,
        { availableTools: Array.from(this.tools.keys()) }
      );
    }
    
    const tool = this.tools.get(name)!;
    return await tool.execute(args);
    
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }
    
    throw new MCPError(
      MCPErrorCode.TOOL_ERROR,
      `Tool execution failed: ${error.message}`,
      { originalError: error.message }
    );
  }
}
```

### 2. Capability Enforcement

```typescript
class CapabilityEnforcingServer {
  async handleRequest(method: string, params: any): Promise<any> {
    // Check if requested capability is supported
    if (method.startsWith('resources/') && !this.capabilities.resources) {
      throw new MCPError(
        MCPErrorCode.CAPABILITY_NOT_SUPPORTED,
        'Resource operations not supported by this server',
        { supportedCapabilities: Object.keys(this.capabilities) }
      );
    }
    
    return await this.processRequest(method, params);
  }
}
```

### 3. Resilience Patterns

```typescript
class ResilientMCPServer {
  private retryConfig = {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2
  };
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.retryConfig.maxAttempts || !this.isRetryableError(error)) {
          break;
        }
        
        const delay = this.retryConfig.backoffMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        await this.sleep(delay);
        
        this.logger.warn(`${operationName} failed, retrying (${attempt}/${this.retryConfig.maxAttempts})`, {
          error: error.message,
          nextRetryIn: delay
        });
      }
    }
    
    throw new MCPError(
      MCPErrorCode.INTERNAL_ERROR,
      `${operationName} failed after ${this.retryConfig.maxAttempts} attempts`,
      { lastError: lastError.message }
    );
  }
  
  private isRetryableError(error: Error): boolean {
    // Network errors, temporary service unavailable, etc.
    return error.message.includes('ECONNRESET') || 
           error.message.includes('timeout') ||
           error.message.includes('503');
  }
}
```

## Deployment Strategies

### 1. Modular Deployment

```dockerfile
# Dockerfile for containerized MCP server
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server code
COPY src/ ./src/
COPY config/ ./config/

# Set up non-root user
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001
USER mcpuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["node", "src/index.js"]
```

### 2. Orchestration with Docker Compose

```yaml
# docker-compose.yml for multiple MCP servers
version: '3.8'
services:
  mcp-host:
    image: mcp-host:latest
    ports:
      - "8080:8080"
    environment:
      - MCP_SERVERS=search,context7,perplexity
    depends_on:
      - mcp-search
      - mcp-context7
      - mcp-perplexity
    networks:
      - mcp-network

  mcp-search:
    image: mcp-search:latest
    environment:
      - SEARCH_API_KEY=${SEARCH_API_KEY}
    networks:
      - mcp-network
    deploy:
      replicas: 2

  mcp-context7:
    image: mcp-context7:latest
    environment:
      - CONTEXT7_API_KEY=${CONTEXT7_API_KEY}
    networks:
      - mcp-network

  mcp-perplexity:
    image: mcp-perplexity:latest
    environment:
      - PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

### 3. Stateless Design

```typescript
// Example of stateless MCP server design
class StatelessMCPServer {
  // No instance state - all state passed in requests
  async callTool(name: string, args: any, context: RequestContext): Promise<ToolResult> {
    // Context contains all necessary information
    const { sessionId, userId, preferences } = context;
    
    // Create temporary state for this request only
    const executor = this.createToolExecutor(name, context);
    
    try {
      return await executor.execute(args);
    } finally {
      // Clean up any temporary resources
      await executor.cleanup();
    }
  }
  
  private createToolExecutor(name: string, context: RequestContext): ToolExecutor {
    // Factory pattern - create executor with context
    return new ToolExecutor(name, {
      apiKeys: this.getApiKeys(context.userId),
      preferences: context.preferences,
      sessionState: this.getSessionState(context.sessionId)
    });
  }
}
```

### 4. Monitoring and Observability

```typescript
class ObservableMCPServer {
  private metrics = {
    requestCount: 0,
    errorCount: 0,
    responseTimeSum: 0,
    activeConnections: 0
  };
  
  async handleRequest(method: string, params: any): Promise<any> {
    const startTime = Date.now();
    this.metrics.requestCount++;
    
    try {
      const result = await this.processRequest(method, params);
      
      // Record success metrics
      const duration = Date.now() - startTime;
      this.metrics.responseTimeSum += duration;
      
      this.logger.info('Request completed', {
        method,
        duration,
        success: true
      });
      
      return result;
      
    } catch (error) {
      this.metrics.errorCount++;
      
      this.logger.error('Request failed', {
        method,
        error: error.message,
        duration: Date.now() - startTime
      });
      
      throw error;
    }
  }
  
  getHealthMetrics(): HealthMetrics {
    const avgResponseTime = this.metrics.requestCount > 0 
      ? this.metrics.responseTimeSum / this.metrics.requestCount 
      : 0;
      
    return {
      requestCount: this.metrics.requestCount,
      errorRate: this.metrics.errorCount / Math.max(this.metrics.requestCount, 1),
      averageResponseTime: avgResponseTime,
      activeConnections: this.metrics.activeConnections,
      status: this.getHealthStatus()
    };
  }
}
```

## Summary of Best Practices

| Aspect | Recommended Practice |
|--------|---------------------|
| **Server Implementation** | Simple, focused, composable, isolated, clear capability negotiation |
| **Tool Definition** | Declarative capability set, minimal interfaces, extensible design |
| **Communication** | Protocol version/capability negotiation, stateful connections, security boundaries |
| **Error Handling** | Explicit error channels, capability enforcement, resilience patterns |
| **Deployment** | Modular containerization, stateless design, orchestration, monitoring |

## Key Takeaways

1. **Modular Architecture**: MCP encourages narrowly scoped, composable server implementations
2. **Clear Separation**: Host orchestrates, client manages connections, server provides capabilities
3. **Progressive Enhancement**: Capability negotiation enables backward compatibility and feature evolution
4. **Security First**: Isolation and controlled access are fundamental design principles
5. **Operational Excellence**: Monitoring, logging, and observability are essential for production deployments

These architectural patterns and practices ensure that MCP servers are robust, maintainable, and adaptable for evolving AI toolchains and integrations, following the core MCP design principles of simplicity, composability, and interoperability.