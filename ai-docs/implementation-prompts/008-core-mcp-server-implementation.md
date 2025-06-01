# Implementation Prompt 008: Core MCP Server Implementation (1.3.1)

## Persona
You are a **Senior Systems Architect and Protocol Engineer** with 12+ years of experience in building distributed systems, protocol implementations, and real-time communication platforms. You specialize in MCP protocol compliance, WebSocket management, request/response handling, and building scalable server architectures.

## Context: Interactive BDUF Orchestrator
You are implementing the **Core MCP Server Implementation** component as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system will provide the foundational MCP protocol server that handles all client communications, tool execution, and capability management.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP server that orchestrates comprehensive project analysis and planning. The Core MCP Server you're building will:

1. **Implement MCP protocol compliance** with full specification adherence
2. **Handle concurrent connections** with efficient session management
3. **Provide tool execution** with comprehensive error handling and security
4. **Enable real-time communication** with WebSocket and HTTP support
5. **Support capability negotiation** with dynamic feature discovery
6. **Maintain high performance** with optimized request/response handling

### Technical Context
- **Dependencies**: Built on tool registry, data models, and shared infrastructure
- **Architecture**: Event-driven server with protocol compliance and extensibility
- **Integration**: Core communication foundation for all MCP operations
- **Scalability**: Handle 1000+ concurrent connections with high throughput
- **Quality**: 90%+ test coverage, comprehensive error handling and monitoring

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/core-mcp-server-implementation

# Regular commits with descriptive messages
git add .
git commit -m "feat(mcp): implement comprehensive core MCP server

- Add MCP protocol implementation with full specification compliance
- Implement capability management and negotiation system
- Create session lifecycle management with connection pooling
- Add request/response handling pipeline with validation
- Implement tool execution framework with security controls
- Add comprehensive error handling and recovery mechanisms"

# Push and create PR
git push origin feature/core-mcp-server-implementation
```

## Required Context7 Integration

Before implementing any MCP server components, you MUST use Context7 to research MCP patterns:

```typescript
// Research MCP protocol and implementation patterns
await context7.getLibraryDocs('/mcp/model-context-protocol');
await context7.getLibraryDocs('/websocket/ws');
await context7.getLibraryDocs('/protocol/jsonrpc');

// Research server architecture patterns
await context7.getLibraryDocs('/nodejs/event-emitter');
await context7.getLibraryDocs('/architecture/event-driven');
await context7.getLibraryDocs('/concurrency/worker-threads');

// Research validation and security patterns
await context7.getLibraryDocs('/validation/json-schema');
await context7.getLibraryDocs('/security/rate-limiting');
await context7.getLibraryDocs('/authentication/jwt');
```

## Implementation Requirements

### 1. Core MCP Server Class

```typescript
// src/server/mcp-server.ts
export class MCPServer extends EventEmitter {
  private config: MCPServerConfig;
  private sessionManager: SessionManager;
  private capabilityManager: CapabilityManager;
  private toolRegistry: ToolRegistry;
  private requestHandler: RequestHandler;
  private webSocketServer: WebSocketServer;
  private httpServer: HttpServer;
  private logger: Logger;
  private metrics: MetricsCollector;
  private isRunning: boolean = false;

  constructor(config: MCPServerConfig) {
    super();
    this.config = config;
    this.logger = new Logger('MCPServer');
    this.metrics = new MetricsCollector(config.metrics);
    
    this.initializeComponents();
  }

  private initializeComponents(): void {
    this.sessionManager = new SessionManager(this.config.session);
    this.capabilityManager = new CapabilityManager(this.config.capabilities);
    this.toolRegistry = new ToolRegistry(this.config.tools);
    this.requestHandler = new RequestHandler({
      sessionManager: this.sessionManager,
      toolRegistry: this.toolRegistry,
      capabilityManager: this.capabilityManager,
      metrics: this.metrics
    });

    this.webSocketServer = new WebSocketServer({
      port: this.config.websocket.port,
      host: this.config.websocket.host,
      maxConnections: this.config.websocket.maxConnections,
      pingInterval: this.config.websocket.pingInterval,
      pongTimeout: this.config.websocket.pongTimeout
    });

    this.httpServer = new HttpServer({
      port: this.config.http.port,
      host: this.config.http.host,
      cors: this.config.http.cors,
      rateLimit: this.config.http.rateLimit
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // WebSocket connection handling
    this.webSocketServer.on('connection', this.handleWebSocketConnection.bind(this));
    this.webSocketServer.on('error', this.handleWebSocketError.bind(this));

    // HTTP request handling
    this.httpServer.on('request', this.handleHttpRequest.bind(this));
    this.httpServer.on('error', this.handleHttpError.bind(this));

    // Session management events
    this.sessionManager.on('sessionCreated', this.handleSessionCreated.bind(this));
    this.sessionManager.on('sessionDestroyed', this.handleSessionDestroyed.bind(this));
    this.sessionManager.on('sessionError', this.handleSessionError.bind(this));

    // Request handler events
    this.requestHandler.on('requestProcessed', this.handleRequestProcessed.bind(this));
    this.requestHandler.on('requestError', this.handleRequestError.bind(this));

    // Graceful shutdown handling
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new MCPServerError('Server is already running');
    }

    try {
      this.logger.info('Starting MCP server', {
        version: this.config.version,
        websocketPort: this.config.websocket.port,
        httpPort: this.config.http.port
      });

      // Initialize all components
      await this.sessionManager.initialize();
      await this.capabilityManager.initialize();
      await this.toolRegistry.initialize();

      // Start network servers
      await this.webSocketServer.start();
      await this.httpServer.start();

      this.isRunning = true;

      this.logger.info('MCP server started successfully');
      this.emit('started');

      // Record metrics
      this.metrics.increment('mcp.server.started');
      this.metrics.gauge('mcp.server.uptime', 0);

    } catch (error) {
      this.logger.error('Failed to start MCP server', { error });
      throw new MCPServerError('Failed to start server', error);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping MCP server');

    try {
      // Stop accepting new connections
      await this.webSocketServer.stop();
      await this.httpServer.stop();

      // Close all active sessions
      await this.sessionManager.closeAllSessions();

      // Cleanup components
      await this.toolRegistry.cleanup();
      await this.capabilityManager.cleanup();

      this.isRunning = false;

      this.logger.info('MCP server stopped successfully');
      this.emit('stopped');

      this.metrics.increment('mcp.server.stopped');

    } catch (error) {
      this.logger.error('Error stopping MCP server', { error });
      throw new MCPServerError('Failed to stop server gracefully', error);
    }
  }

  private async handleWebSocketConnection(ws: WebSocket, request: IncomingMessage): Promise<void> {
    const connectionId = generateId();
    const timer = this.metrics.timer('mcp.connection.setup');

    try {
      this.logger.info('New WebSocket connection', { connectionId });

      // Create session
      const session = await this.sessionManager.createSession({
        id: connectionId,
        type: 'websocket',
        transport: ws,
        clientInfo: this.extractClientInfo(request),
        capabilities: []
      });

      // Setup WebSocket event handlers
      ws.on('message', (data) => this.handleWebSocketMessage(session, data));
      ws.on('close', () => this.handleWebSocketClose(session));
      ws.on('error', (error) => this.handleWebSocketError(error, session));
      ws.on('ping', () => this.handleWebSocketPing(session));
      ws.on('pong', () => this.handleWebSocketPong(session));

      // Send initialization message
      await this.sendInitializationMessage(session);

      timer.stop();
      this.metrics.increment('mcp.connections.established');
      this.metrics.gauge('mcp.connections.active', this.sessionManager.getActiveSessionCount());

    } catch (error) {
      timer.stop({ error: true });
      this.logger.error('Failed to handle WebSocket connection', { error, connectionId });
      ws.close(1011, 'Server error during connection setup');
    }
  }

  private async handleWebSocketMessage(session: MCPSession, data: Buffer | string): Promise<void> {
    const timer = this.metrics.timer('mcp.message.processing');

    try {
      // Parse message
      const message = this.parseMessage(data);
      
      this.logger.debug('Received WebSocket message', {
        sessionId: session.id,
        messageType: message.method || 'response',
        messageId: message.id
      });

      // Update session activity
      session.updateLastActivity();

      // Process message
      const response = await this.requestHandler.handleMessage(session, message);

      // Send response if needed
      if (response) {
        await this.sendMessage(session, response);
      }

      timer.stop();
      this.metrics.increment('mcp.messages.processed');

    } catch (error) {
      timer.stop({ error: true });
      
      this.logger.error('Error processing WebSocket message', {
        error,
        sessionId: session.id
      });

      // Send error response
      await this.sendErrorResponse(session, error);
      this.metrics.increment('mcp.messages.errors');
    }
  }

  private async sendInitializationMessage(session: MCPSession): Promise<void> {
    const initMessage: MCPInitMessage = {
      jsonrpc: '2.0',
      id: generateId(),
      method: 'initialize',
      params: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: await this.capabilityManager.getServerCapabilities(),
        serverInfo: {
          name: this.config.name,
          version: this.config.version,
          vendor: this.config.vendor,
          description: this.config.description
        }
      }
    };

    await this.sendMessage(session, initMessage);
  }

  private async sendMessage(session: MCPSession, message: MCPMessage): Promise<void> {
    try {
      const serialized = JSON.stringify(message);
      
      if (session.transport && session.transport.readyState === WebSocket.OPEN) {
        session.transport.send(serialized);
        
        this.metrics.increment('mcp.messages.sent');
        this.metrics.histogram('mcp.message.size', serialized.length);
      } else {
        throw new Error('WebSocket connection is not open');
      }

    } catch (error) {
      this.logger.error('Failed to send message', {
        error,
        sessionId: session.id,
        messageId: message.id
      });
      throw new MCPServerError('Failed to send message', error);
    }
  }

  private parseMessage(data: Buffer | string): MCPMessage {
    try {
      const messageText = typeof data === 'string' ? data : data.toString('utf8');
      const message = JSON.parse(messageText);

      // Validate message structure
      this.validateMessage(message);

      return message as MCPMessage;

    } catch (error) {
      throw new MCPProtocolError('Invalid message format', error);
    }
  }

  private validateMessage(message: any): void {
    if (!message.jsonrpc || message.jsonrpc !== '2.0') {
      throw new MCPProtocolError('Invalid JSON-RPC version');
    }

    if (!message.id && !message.method) {
      throw new MCPProtocolError('Message must have either id or method');
    }

    if (message.method && typeof message.method !== 'string') {
      throw new MCPProtocolError('Method must be a string');
    }
  }

  private extractClientInfo(request: IncomingMessage): ClientInfo {
    return {
      userAgent: request.headers['user-agent'] || 'Unknown',
      ipAddress: this.getClientIP(request),
      origin: request.headers.origin,
      acceptLanguage: request.headers['accept-language'],
      timestamp: new Date()
    };
  }

  private getClientIP(request: IncomingMessage): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.socket.remoteAddress || 'unknown';
  }

  private async gracefulShutdown(): Promise<void> {
    this.logger.info('Received shutdown signal, beginning graceful shutdown');

    try {
      // Stop accepting new connections
      await this.stop();

      // Give time for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.logger.info('Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      this.logger.error('Error during graceful shutdown', { error });
      process.exit(1);
    }
  }

  // Event handlers
  private handleSessionCreated(session: MCPSession): void {
    this.logger.info('Session created', { sessionId: session.id });
    this.emit('sessionCreated', session);
  }

  private handleSessionDestroyed(session: MCPSession): void {
    this.logger.info('Session destroyed', { sessionId: session.id });
    this.emit('sessionDestroyed', session);
    this.metrics.gauge('mcp.connections.active', this.sessionManager.getActiveSessionCount());
  }

  private handleSessionError(error: Error, session: MCPSession): void {
    this.logger.error('Session error', { error, sessionId: session.id });
    this.emit('sessionError', error, session);
  }

  private handleRequestProcessed(request: MCPRequest, response: MCPResponse, session: MCPSession): void {
    this.logger.debug('Request processed', {
      method: request.method,
      sessionId: session.id,
      duration: response.metadata?.processingTime
    });
    this.emit('requestProcessed', request, response, session);
  }

  private handleRequestError(error: Error, request: MCPRequest, session: MCPSession): void {
    this.logger.error('Request processing error', {
      error,
      method: request.method,
      sessionId: session.id
    });
    this.emit('requestError', error, request, session);
  }

  private handleWebSocketClose(session: MCPSession): void {
    this.logger.info('WebSocket connection closed', { sessionId: session.id });
    this.sessionManager.destroySession(session.id);
  }

  private handleWebSocketError(error: Error, session?: MCPSession): void {
    this.logger.error('WebSocket error', {
      error,
      sessionId: session?.id
    });
    
    if (session) {
      this.sessionManager.destroySession(session.id);
    }
  }

  private handleWebSocketPing(session: MCPSession): void {
    session.updateLastActivity();
    this.metrics.increment('mcp.ping.received');
  }

  private handleWebSocketPong(session: MCPSession): void {
    session.updateLastActivity();
    session.recordPong();
    this.metrics.increment('mcp.pong.received');
  }

  private async sendErrorResponse(session: MCPSession, error: Error): Promise<void> {
    const errorResponse: MCPErrorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: this.getErrorCode(error),
        message: error.message,
        data: {
          type: error.constructor.name,
          timestamp: new Date().toISOString()
        }
      }
    };

    await this.sendMessage(session, errorResponse);
  }

  private getErrorCode(error: Error): number {
    if (error instanceof MCPProtocolError) return -32600; // Invalid Request
    if (error instanceof ValidationError) return -32602; // Invalid params
    if (error instanceof AuthenticationError) return -32001; // Unauthorized
    if (error instanceof RateLimitError) return -32003; // Rate limited
    return -32603; // Internal error
  }

  // Public API
  getServerInfo(): MCPServerInfo {
    return {
      name: this.config.name,
      version: this.config.version,
      isRunning: this.isRunning,
      activeConnections: this.sessionManager.getActiveSessionCount(),
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      capabilities: this.capabilityManager.getServerCapabilities()
    };
  }

  getServerStats(): MCPServerStats {
    return {
      connections: {
        active: this.sessionManager.getActiveSessionCount(),
        total: this.sessionManager.getTotalSessionCount(),
        peak: this.sessionManager.getPeakSessionCount()
      },
      messages: {
        processed: this.metrics.getCounter('mcp.messages.processed'),
        errors: this.metrics.getCounter('mcp.messages.errors'),
        sent: this.metrics.getCounter('mcp.messages.sent')
      },
      performance: {
        avgResponseTime: this.metrics.getHistogramStats('mcp.message.processing').mean,
        p95ResponseTime: this.metrics.getHistogramStats('mcp.message.processing').p95,
        memoryUsage: process.memoryUsage()
      }
    };
  }
}
```

### 2. Session Management

```typescript
// src/server/session-manager.ts
export class SessionManager extends EventEmitter {
  private sessions: Map<string, MCPSession>;
  private config: SessionConfig;
  private cleanupTimer: NodeJS.Timeout;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor(config: SessionConfig) {
    super();
    this.config = config;
    this.sessions = new Map();
    this.logger = new Logger('SessionManager');
    this.metrics = new MetricsCollector(config.metrics);
  }

  async initialize(): Promise<void> {
    // Start cleanup timer
    this.cleanupTimer = setInterval(
      () => this.cleanupInactiveSessions(),
      this.config.cleanupInterval || 60000
    );

    this.logger.info('Session manager initialized');
  }

  async createSession(options: CreateSessionOptions): Promise<MCPSession> {
    const session = new MCPSession({
      id: options.id,
      type: options.type,
      transport: options.transport,
      clientInfo: options.clientInfo,
      capabilities: options.capabilities || [],
      createdAt: new Date(),
      lastActivity: new Date(),
      maxIdleTime: this.config.maxIdleTime || 300000, // 5 minutes
      heartbeatInterval: this.config.heartbeatInterval || 30000 // 30 seconds
    });

    // Validate session limits
    if (this.sessions.size >= this.config.maxSessions) {
      throw new SessionLimitError('Maximum session limit reached');
    }

    this.sessions.set(session.id, session);

    this.logger.info('Session created', {
      sessionId: session.id,
      type: session.type,
      clientIP: session.clientInfo.ipAddress
    });

    this.emit('sessionCreated', session);
    this.metrics.increment('sessions.created');
    this.metrics.gauge('sessions.active', this.sessions.size);

    return session;
  }

  getSession(sessionId: string): MCPSession | undefined {
    return this.sessions.get(sessionId);
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Close transport if still open
    if (session.transport) {
      try {
        if (session.transport.readyState === WebSocket.OPEN) {
          session.transport.close(1000, 'Session ended');
        }
      } catch (error) {
        this.logger.warn('Error closing transport', { error, sessionId });
      }
    }

    this.sessions.delete(sessionId);

    this.logger.info('Session destroyed', { sessionId });
    this.emit('sessionDestroyed', session);
    this.metrics.increment('sessions.destroyed');
    this.metrics.gauge('sessions.active', this.sessions.size);

    return true;
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now();
    const inactiveSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > session.maxIdleTime) {
        inactiveSessions.push(sessionId);
      }
    }

    if (inactiveSessions.length > 0) {
      this.logger.info(`Cleaning up ${inactiveSessions.length} inactive sessions`);
      
      for (const sessionId of inactiveSessions) {
        this.destroySession(sessionId);
      }

      this.metrics.increment('sessions.cleanup', inactiveSessions.length);
    }
  }

  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  getAllSessions(): MCPSession[] {
    return Array.from(this.sessions.values());
  }

  async closeAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    
    this.logger.info(`Closing ${sessionIds.length} active sessions`);

    await Promise.all(
      sessionIds.map(sessionId => this.destroySession(sessionId))
    );
  }
}

// src/server/mcp-session.ts
export class MCPSession {
  readonly id: string;
  readonly type: SessionType;
  readonly transport: WebSocket;
  readonly clientInfo: ClientInfo;
  readonly createdAt: Date;
  readonly maxIdleTime: number;
  readonly heartbeatInterval: number;

  public capabilities: string[];
  public lastActivity: Date;
  public metadata: Record<string, any>;
  private heartbeatTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;

  constructor(options: MCPSessionOptions) {
    this.id = options.id;
    this.type = options.type;
    this.transport = options.transport;
    this.clientInfo = options.clientInfo;
    this.capabilities = options.capabilities;
    this.createdAt = options.createdAt;
    this.lastActivity = options.lastActivity;
    this.maxIdleTime = options.maxIdleTime;
    this.heartbeatInterval = options.heartbeatInterval;
    this.metadata = {};

    this.startHeartbeat();
  }

  updateLastActivity(): void {
    this.lastActivity = new Date();
  }

  addCapability(capability: string): void {
    if (!this.capabilities.includes(capability)) {
      this.capabilities.push(capability);
    }
  }

  removeCapability(capability: string): void {
    this.capabilities = this.capabilities.filter(c => c !== capability);
  }

  hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  getMetadata(key: string): any {
    return this.metadata[key];
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.transport.readyState === WebSocket.OPEN) {
        this.transport.ping();
      }
    }, this.heartbeatInterval);
  }

  recordPong(): void {
    this.updateLastActivity();
    // Could record latency metrics here
  }

  cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
    }
  }

  isActive(): boolean {
    return Date.now() - this.lastActivity.getTime() < this.maxIdleTime;
  }

  getDuration(): number {
    return Date.now() - this.createdAt.getTime();
  }
}
```

## Success Criteria

### Functional Requirements
1. **MCP Protocol Compliance**: Full adherence to MCP specification
2. **Concurrent Connections**: Support 1000+ concurrent WebSocket connections
3. **Real-time Communication**: Sub-100ms message processing
4. **Tool Execution**: Secure and efficient tool execution framework
5. **Session Management**: Robust session lifecycle management
6. **Error Handling**: Comprehensive error handling and recovery

### Technical Requirements
1. **High Performance**: Handle 10,000+ messages per second
2. **Scalability**: Horizontal scaling with load balancing support
3. **Reliability**: 99.9% uptime with graceful degradation
4. **Security**: Authentication, authorization, and rate limiting
5. **Monitoring**: Comprehensive metrics and health checks

### Quality Standards
1. **Testing**: 90%+ code coverage with comprehensive test scenarios
2. **Documentation**: Complete API documentation and protocol compliance
3. **Performance**: Optimized algorithms with minimal latency
4. **Maintainability**: Clean, well-structured, and extensible code
5. **Observability**: Detailed logging and metrics collection

Remember that this MCP server is the core communication foundation and must handle high-volume, real-time interactions while maintaining protocol compliance and enterprise-grade reliability.