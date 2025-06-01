# Implementation Prompt 019: WebSocket Server Implementation (3.1.1)

## Persona
You are a **Senior WebSocket Engineer** with 10+ years of experience in real-time communication systems, scalable WebSocket architectures, and enterprise collaboration platforms. You specialize in building high-performance, fault-tolerant real-time communication infrastructure for distributed teams.

## Context: Interactive BDUF Orchestrator
You are implementing the **WebSocket Server Implementation** as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system enables comprehensive project analysis, architecture generation, and collaborative development workflows through AI-powered automation.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP (Model Context Protocol) server that orchestrates comprehensive project analysis and planning. The WebSocket Server you're building will be a core component that:

1. **Manages real-time connections** between multiple collaborators
2. **Handles session management** with authentication and authorization
3. **Routes messages efficiently** between clients and server components
4. **Maintains connection state** and handles reconnection logic
5. **Scales horizontally** across multiple server instances
6. **Provides reliable message delivery** with acknowledgments and retries

### Technical Context
- **Architecture**: TypeScript-based modular system with enterprise patterns
- **Integration**: Must integrate with Context7 MCP for documentation lookup
- **Scalability**: Handle 1000+ concurrent connections per instance
- **Quality**: 90%+ test coverage, comprehensive error handling
- **Performance**: Sub-50ms message routing, 99.9% uptime SLA

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/websocket-server-implementation

# Regular commits with descriptive messages
git add .
git commit -m "feat(websocket): implement core WebSocket server infrastructure

- Add Socket.IO server with clustering support
- Implement connection management and session handling
- Create message routing and broadcasting system
- Add authentication and authorization middleware
- Implement connection state management and recovery"

# Push and create PR
git push origin feature/websocket-server-implementation
```

### Commit Message Format
```
<type>(websocket): <description>

<body explaining what and why>

Closes #<issue-number>
```

## Required Context7 Integration

Before implementing any WebSocket components, you MUST use Context7 to research current best practices:

```typescript
// Research WebSocket frameworks and libraries
await context7.getLibraryDocs('/socketio/socket.io');
await context7.getLibraryDocs('/websockets/ws');
await context7.getLibraryDocs('/unetworking/uwebsockets');

// Research scaling and clustering patterns
await context7.getLibraryDocs('/socketio/socket.io-cluster-adapter');
await context7.getLibraryDocs('/socketio/socket.io-redis-adapter');
```

## Implementation Requirements

### 1. Core WebSocket Server Architecture

Create a robust, scalable WebSocket server foundation:

```typescript
// src/infrastructure/websocket/WebSocketServer.ts
export interface WebSocketServerConfig {
  port: number;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  clustering: {
    enabled: boolean;
    adapter: 'redis' | 'memory';
    redisUrl?: string;
  };
  authentication: {
    enabled: boolean;
    jwtSecret: string;
    tokenExpiration: number;
  };
  rateLimit: {
    maxConnections: number;
    windowMs: number;
    maxRequestsPerWindow: number;
  };
  heartbeat: {
    interval: number;
    timeout: number;
  };
  compression: boolean;
  maxPayloadSize: number;
}

export interface ConnectionInfo {
  id: string;
  userId: string;
  sessionId: string;
  projectId?: string;
  roomIds: Set<string>;
  lastSeen: Date;
  metadata: ConnectionMetadata;
  isAuthenticated: boolean;
  permissions: UserPermissions;
}

export interface ConnectionMetadata {
  userAgent: string;
  ipAddress: string;
  clientVersion: string;
  capabilities: ClientCapabilities;
  timezone: string;
}

export class WebSocketServer {
  private io: Server;
  private connections: Map<string, ConnectionInfo>;
  private rooms: Map<string, Set<string>>;
  private messageQueue: MessageQueue;
  private authService: AuthenticationService;
  private logger: Logger;
  private metrics: MetricsCollector;
  private heartbeatManager: HeartbeatManager;

  constructor(private config: WebSocketServerConfig) {
    this.setupServer();
    this.setupMiddleware();
    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private setupServer(): void {
    // Initialize Socket.IO server with configuration
    this.io = new Server(this.config.port, {
      cors: this.config.cors,
      maxHttpBufferSize: this.config.maxPayloadSize,
      pingTimeout: this.config.heartbeat.timeout,
      pingInterval: this.config.heartbeat.interval,
      compression: this.config.compression,
      transports: ['websocket', 'polling']
    });

    // Setup clustering if enabled
    if (this.config.clustering.enabled) {
      this.setupClustering();
    }
  }

  private setupClustering(): void {
    if (this.config.clustering.adapter === 'redis') {
      const pubClient = createClient({ url: this.config.clustering.redisUrl });
      const subClient = pubClient.duplicate();
      
      this.io.adapter(createAdapter(pubClient, subClient));
    }
  }

  private setupMiddleware(): void {
    // Rate limiting middleware
    this.io.use(this.createRateLimitMiddleware());
    
    // Authentication middleware
    if (this.config.authentication.enabled) {
      this.io.use(this.createAuthMiddleware());
    }
    
    // Logging middleware
    this.io.use(this.createLoggingMiddleware());
  }

  private createAuthMiddleware(): (socket: Socket, next: (err?: Error) => void) => void {
    return async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const user = await this.authService.verifyToken(token);
        if (!user) {
          return next(new Error('Invalid authentication token'));
        }

        // Attach user info to socket
        socket.data.user = user;
        socket.data.userId = user.id;
        socket.data.permissions = user.permissions;
        
        next();
      } catch (error) {
        this.logger.error('Authentication failed', { error, socketId: socket.id });
        next(new Error('Authentication failed'));
      }
    };
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleNewConnection(socket);
    });
  }

  private async handleNewConnection(socket: Socket): Promise<void> {
    try {
      const connectionInfo = await this.createConnectionInfo(socket);
      this.connections.set(socket.id, connectionInfo);

      // Register event handlers for this connection
      this.registerSocketEventHandlers(socket);

      // Send connection acknowledgment
      socket.emit('connected', {
        connectionId: socket.id,
        sessionId: connectionInfo.sessionId,
        serverTime: new Date(),
        capabilities: this.getServerCapabilities()
      });

      this.logger.info('New connection established', {
        connectionId: socket.id,
        userId: connectionInfo.userId,
        sessionId: connectionInfo.sessionId
      });

      this.metrics.increment('websocket.connections.established');

    } catch (error) {
      this.logger.error('Failed to handle new connection', { error, socketId: socket.id });
      socket.disconnect(true);
    }
  }

  private registerSocketEventHandlers(socket: Socket): void {
    // Join room handler
    socket.on('join-room', async (data, callback) => {
      await this.handleJoinRoom(socket, data, callback);
    });

    // Leave room handler
    socket.on('leave-room', async (data, callback) => {
      await this.handleLeaveRoom(socket, data, callback);
    });

    // Message handler
    socket.on('message', async (data, callback) => {
      await this.handleMessage(socket, data, callback);
    });

    // Broadcast handler
    socket.on('broadcast', async (data, callback) => {
      await this.handleBroadcast(socket, data, callback);
    });

    // Disconnection handler
    socket.on('disconnect', async (reason) => {
      await this.handleDisconnection(socket, reason);
    });

    // Error handler
    socket.on('error', (error) => {
      this.handleSocketError(socket, error);
    });
  }

  async handleJoinRoom(socket: Socket, data: JoinRoomRequest, callback?: Function): Promise<void> {
    try {
      const { roomId, projectId } = data;
      const connectionInfo = this.connections.get(socket.id);
      
      if (!connectionInfo) {
        throw new Error('Connection not found');
      }

      // Validate room access permissions
      const hasAccess = await this.validateRoomAccess(
        connectionInfo.userId, 
        roomId, 
        projectId,
        connectionInfo.permissions
      );

      if (!hasAccess) {
        throw new Error('Access denied to room');
      }

      // Join the room
      await socket.join(roomId);
      connectionInfo.roomIds.add(roomId);
      
      if (projectId) {
        connectionInfo.projectId = projectId;
      }

      // Update room tracking
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId)!.add(socket.id);

      // Notify other room members
      socket.to(roomId).emit('user-joined', {
        userId: connectionInfo.userId,
        connectionId: socket.id,
        timestamp: new Date()
      });

      if (callback) {
        callback({ success: true, roomId, memberCount: this.rooms.get(roomId)!.size });
      }

      this.logger.info('User joined room', {
        userId: connectionInfo.userId,
        roomId,
        projectId
      });

    } catch (error) {
      this.logger.error('Failed to join room', { error, socketId: socket.id });
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  }

  async handleMessage(socket: Socket, data: MessageData, callback?: Function): Promise<void> {
    try {
      const connectionInfo = this.connections.get(socket.id);
      if (!connectionInfo) {
        throw new Error('Connection not found');
      }

      // Validate message
      const validatedMessage = await this.validateMessage(data, connectionInfo);

      // Route message based on type
      await this.routeMessage(socket, validatedMessage);

      if (callback) {
        callback({ success: true, messageId: validatedMessage.id });
      }

      this.metrics.increment('websocket.messages.processed');

    } catch (error) {
      this.logger.error('Failed to handle message', { error, socketId: socket.id });
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.io.listen(this.config.port);
        this.logger.info(`WebSocket server started on port ${this.config.port}`);
        resolve();
      } catch (error) {
        this.logger.error('Failed to start WebSocket server', { error });
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    // Gracefully close all connections
    this.io.disconnectSockets(true);
    
    // Close server
    this.io.close();
    
    // Clean up resources
    this.connections.clear();
    this.rooms.clear();
    
    this.logger.info('WebSocket server stopped');
  }

  // Health check endpoint
  getHealthStatus(): HealthStatus {
    return {
      status: 'healthy',
      connections: this.connections.size,
      rooms: this.rooms.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };
  }
}
```

### 2. Connection Management Service

```typescript
// src/infrastructure/websocket/ConnectionManager.ts
export interface ConnectionState {
  id: string;
  status: ConnectionStatus;
  user: UserInfo;
  session: SessionInfo;
  heartbeat: HeartbeatInfo;
  metrics: ConnectionMetrics;
}

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  IDLE = 'idle',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected'
}

export class ConnectionManager {
  private connections: Map<string, ConnectionState>;
  private userConnections: Map<string, Set<string>>;
  private sessionConnections: Map<string, Set<string>>;
  private cleanupTimer: NodeJS.Timer;

  constructor(
    private config: ConnectionManagerConfig,
    private logger: Logger,
    private metrics: MetricsCollector
  ) {
    this.connections = new Map();
    this.userConnections = new Map();
    this.sessionConnections = new Map();
    this.startCleanupTimer();
  }

  async addConnection(socket: Socket, user: UserInfo, session: SessionInfo): Promise<ConnectionState> {
    const connectionState: ConnectionState = {
      id: socket.id,
      status: ConnectionStatus.CONNECTED,
      user,
      session,
      heartbeat: {
        lastSeen: new Date(),
        responseTime: 0,
        missedPings: 0
      },
      metrics: {
        messagesReceived: 0,
        messagesSent: 0,
        bytesReceived: 0,
        bytesSent: 0,
        connectionTime: new Date(),
        lastActivity: new Date()
      }
    };

    this.connections.set(socket.id, connectionState);
    
    // Track user connections
    if (!this.userConnections.has(user.id)) {
      this.userConnections.set(user.id, new Set());
    }
    this.userConnections.get(user.id)!.add(socket.id);

    // Track session connections
    if (!this.sessionConnections.has(session.id)) {
      this.sessionConnections.set(session.id, new Set());
    }
    this.sessionConnections.get(session.id)!.add(socket.id);

    this.metrics.increment('connections.active');
    return connectionState;
  }

  updateConnectionStatus(connectionId: string, status: ConnectionStatus): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = status;
      connection.metrics.lastActivity = new Date();
    }
  }

  recordMessage(connectionId: string, direction: 'sent' | 'received', bytes: number): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      if (direction === 'sent') {
        connection.metrics.messagesSent++;
        connection.metrics.bytesSent += bytes;
      } else {
        connection.metrics.messagesReceived++;
        connection.metrics.bytesReceived += bytes;
      }
      connection.metrics.lastActivity = new Date();
    }
  }

  updateHeartbeat(connectionId: string, responseTime: number): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.heartbeat.lastSeen = new Date();
      connection.heartbeat.responseTime = responseTime;
      connection.heartbeat.missedPings = 0;
    }
  }

  getConnectionsForUser(userId: string): ConnectionState[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];

    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter(conn => conn !== undefined) as ConnectionState[];
  }

  getConnectionsForSession(sessionId: string): ConnectionState[] {
    const connectionIds = this.sessionConnections.get(sessionId);
    if (!connectionIds) return [];

    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter(conn => conn !== undefined) as ConnectionState[];
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from user connections
    const userConnections = this.userConnections.get(connection.user.id);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.user.id);
      }
    }

    // Remove from session connections
    const sessionConnections = this.sessionConnections.get(connection.session.id);
    if (sessionConnections) {
      sessionConnections.delete(connectionId);
      if (sessionConnections.size === 0) {
        this.sessionConnections.delete(connection.session.id);
      }
    }

    this.connections.delete(connectionId);
    this.metrics.decrement('connections.active');
  }

  getActiveConnections(): ConnectionState[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.status !== ConnectionStatus.DISCONNECTED);
  }

  getConnectionMetrics(): ConnectionManagerMetrics {
    const activeConnections = this.getActiveConnections();
    
    return {
      totalConnections: this.connections.size,
      activeConnections: activeConnections.length,
      uniqueUsers: this.userConnections.size,
      uniqueSessions: this.sessionConnections.size,
      averageResponseTime: this.calculateAverageResponseTime(activeConnections),
      connectionsPerUser: this.calculateConnectionsPerUser(),
      statusDistribution: this.getStatusDistribution()
    };
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleConnections();
    }, this.config.cleanupInterval);
  }

  private cleanupStaleConnections(): void {
    const staleThreshold = Date.now() - this.config.staleConnectionTimeout;
    
    for (const [connectionId, connection] of this.connections) {
      if (connection.heartbeat.lastSeen.getTime() < staleThreshold) {
        this.logger.warn('Removing stale connection', {
          connectionId,
          userId: connection.user.id,
          lastSeen: connection.heartbeat.lastSeen
        });
        
        this.removeConnection(connectionId);
      }
    }
  }
}
```

### 3. Message Routing System

```typescript
// src/infrastructure/websocket/MessageRouter.ts
export interface MessageRoute {
  pattern: string | RegExp;
  handler: MessageHandler;
  middleware: MessageMiddleware[];
  permissions: string[];
  rateLimit?: RateLimitConfig;
}

export interface RoutedMessage {
  id: string;
  type: string;
  route: string;
  data: any;
  metadata: MessageMetadata;
  context: MessageContext;
}

export class MessageRouter {
  private routes: Map<string, MessageRoute>;
  private globalMiddleware: MessageMiddleware[];
  private rateLimiter: RateLimiter;

  constructor(
    private config: MessageRouterConfig,
    private logger: Logger,
    private metrics: MetricsCollector
  ) {
    this.routes = new Map();
    this.globalMiddleware = [];
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.setupDefaultRoutes();
  }

  addRoute(name: string, route: MessageRoute): void {
    this.routes.set(name, route);
    this.logger.debug('Message route registered', { name, pattern: route.pattern });
  }

  addGlobalMiddleware(middleware: MessageMiddleware): void {
    this.globalMiddleware.push(middleware);
  }

  async routeMessage(
    socket: Socket, 
    message: IncomingMessage, 
    connectionInfo: ConnectionInfo
  ): Promise<void> {
    try {
      // Create routed message
      const routedMessage: RoutedMessage = {
        id: generateMessageId(),
        type: message.type,
        route: this.findMatchingRoute(message.type),
        data: message.data,
        metadata: {
          timestamp: new Date(),
          connectionId: socket.id,
          userId: connectionInfo.userId,
          sessionId: connectionInfo.sessionId,
          source: 'websocket'
        },
        context: {
          socket,
          connection: connectionInfo,
          permissions: connectionInfo.permissions
        }
      };

      // Apply rate limiting
      await this.rateLimiter.checkLimit(
        connectionInfo.userId, 
        message.type,
        routedMessage
      );

      // Execute middleware chain
      await this.executeMiddleware(routedMessage);

      // Route to handler
      await this.executeHandler(routedMessage);

      this.metrics.increment('messages.routed', { type: message.type });

    } catch (error) {
      this.logger.error('Message routing failed', {
        error,
        messageType: message.type,
        connectionId: socket.id
      });
      
      socket.emit('error', {
        messageId: message.id,
        error: error.message,
        code: 'ROUTING_ERROR'
      });
    }
  }

  private findMatchingRoute(messageType: string): string {
    for (const [name, route] of this.routes) {
      if (typeof route.pattern === 'string') {
        if (route.pattern === messageType) return name;
      } else if (route.pattern instanceof RegExp) {
        if (route.pattern.test(messageType)) return name;
      }
    }
    return 'default';
  }

  private async executeMiddleware(message: RoutedMessage): Promise<void> {
    const route = this.routes.get(message.route);
    const middleware = [...this.globalMiddleware];
    
    if (route) {
      middleware.push(...route.middleware);
    }

    for (const mw of middleware) {
      await mw.execute(message);
    }
  }

  private async executeHandler(message: RoutedMessage): Promise<void> {
    const route = this.routes.get(message.route);
    
    if (!route) {
      throw new Error(`No handler found for route: ${message.route}`);
    }

    // Check permissions
    if (route.permissions.length > 0) {
      const hasPermission = route.permissions.some(permission =>
        message.context.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        throw new Error('Insufficient permissions for this operation');
      }
    }

    await route.handler.handle(message);
  }

  private setupDefaultRoutes(): void {
    // Collaboration message routes
    this.addRoute('collaboration:document:update', {
      pattern: 'collaboration:document:update',
      handler: new DocumentUpdateHandler(),
      middleware: [new ValidationMiddleware(), new AuditMiddleware()],
      permissions: ['collaboration:write']
    });

    this.addRoute('collaboration:cursor:move', {
      pattern: 'collaboration:cursor:move',
      handler: new CursorMoveHandler(),
      middleware: [new ValidationMiddleware()],
      permissions: ['collaboration:read'],
      rateLimit: { maxRequests: 100, windowMs: 1000 }
    });

    // Approval workflow routes
    this.addRoute('approval:request', {
      pattern: 'approval:request',
      handler: new ApprovalRequestHandler(),
      middleware: [new ValidationMiddleware(), new AuditMiddleware()],
      permissions: ['approval:request']
    });

    // Notification routes
    this.addRoute('notification:subscribe', {
      pattern: 'notification:subscribe',
      handler: new NotificationSubscribeHandler(),
      middleware: [new ValidationMiddleware()],
      permissions: ['notification:read']
    });

    // Default route for unmatched messages
    this.addRoute('default', {
      pattern: /.*/, // Matches anything
      handler: new DefaultMessageHandler(),
      middleware: [new LoggingMiddleware()],
      permissions: []
    });
  }
}
```

### 4. Session Management

```typescript
// src/infrastructure/websocket/SessionManager.ts
export interface CollaborationSession {
  id: string;
  projectId: string;
  name: string;
  status: SessionStatus;
  participants: Map<string, Participant>;
  documents: Map<string, DocumentSession>;
  created: Date;
  lastActivity: Date;
  settings: SessionSettings;
  metadata: SessionMetadata;
}

export interface Participant {
  userId: string;
  connectionId: string;
  role: ParticipantRole;
  permissions: SessionPermission[];
  joinedAt: Date;
  lastActivity: Date;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  isActive: boolean;
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended'
}

export class SessionManager {
  private sessions: Map<string, CollaborationSession>;
  private userSessions: Map<string, Set<string>>;
  private projectSessions: Map<string, Set<string>>;

  constructor(
    private config: SessionManagerConfig,
    private logger: Logger,
    private eventBus: EventBus
  ) {
    this.sessions = new Map();
    this.userSessions = new Map();
    this.projectSessions = new Map();
  }

  async createSession(
    projectId: string, 
    creatorId: string, 
    settings: Partial<SessionSettings> = {}
  ): Promise<CollaborationSession> {
    const sessionId = generateSessionId();
    
    const session: CollaborationSession = {
      id: sessionId,
      projectId,
      name: settings.name || `Collaboration Session ${new Date().toISOString()}`,
      status: SessionStatus.ACTIVE,
      participants: new Map(),
      documents: new Map(),
      created: new Date(),
      lastActivity: new Date(),
      settings: {
        ...this.getDefaultSettings(),
        ...settings
      },
      metadata: {
        createdBy: creatorId,
        version: 1,
        tags: settings.tags || []
      }
    };

    this.sessions.set(sessionId, session);
    
    // Track by project
    if (!this.projectSessions.has(projectId)) {
      this.projectSessions.set(projectId, new Set());
    }
    this.projectSessions.get(projectId)!.add(sessionId);

    this.logger.info('Collaboration session created', {
      sessionId,
      projectId,
      creatorId
    });

    this.eventBus.emit('session:created', { session });

    return session;
  }

  async joinSession(
    sessionId: string, 
    userId: string, 
    connectionId: string,
    role: ParticipantRole = ParticipantRole.PARTICIPANT
  ): Promise<Participant> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new Error(`Session is not active: ${session.status}`);
    }

    // Check if user is already in session
    const existingParticipant = Array.from(session.participants.values())
      .find(p => p.userId === userId);

    if (existingParticipant) {
      // Update connection info for existing participant
      existingParticipant.connectionId = connectionId;
      existingParticipant.lastActivity = new Date();
      existingParticipant.isActive = true;
      
      this.updateUserSessionTracking(userId, sessionId);
      return existingParticipant;
    }

    // Create new participant
    const participant: Participant = {
      userId,
      connectionId,
      role,
      permissions: this.getDefaultPermissions(role),
      joinedAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    session.participants.set(userId, participant);
    session.lastActivity = new Date();

    // Track user sessions
    this.updateUserSessionTracking(userId, sessionId);

    this.logger.info('User joined session', {
      sessionId,
      userId,
      role,
      participantCount: session.participants.size
    });

    this.eventBus.emit('session:participant:joined', {
      session,
      participant,
      connectionId
    });

    return participant;
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(userId);
    if (!participant) return;

    // Mark as inactive first
    participant.isActive = false;
    participant.lastActivity = new Date();

    // Remove from session after delay (allow for reconnection)
    setTimeout(() => {
      if (!participant.isActive) {
        session.participants.delete(userId);
        this.removeUserSessionTracking(userId, sessionId);

        this.logger.info('User left session', {
          sessionId,
          userId,
          remainingParticipants: session.participants.size
        });

        this.eventBus.emit('session:participant:left', {
          session,
          userId
        });

        // End session if no active participants
        if (session.participants.size === 0) {
          this.endSession(sessionId);
        }
      }
    }, this.config.participantTimeout);
  }

  updateParticipantActivity(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(userId);
    if (participant) {
      participant.lastActivity = new Date();
      participant.isActive = true;
      session.lastActivity = new Date();
    }
  }

  updateParticipantCursor(
    sessionId: string, 
    userId: string, 
    cursor: CursorPosition
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.get(userId);
    if (participant) {
      participant.cursor = cursor;
      participant.lastActivity = new Date();

      this.eventBus.emit('session:cursor:updated', {
        sessionId,
        userId,
        cursor
      });
    }
  }

  getSessionsForUser(userId: string): CollaborationSession[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];

    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(session => session !== undefined) as CollaborationSession[];
  }

  getSessionsForProject(projectId: string): CollaborationSession[] {
    const sessionIds = this.projectSessions.get(projectId);
    if (!sessionIds) return [];

    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(session => session !== undefined) as CollaborationSession[];
  }

  getActiveParticipants(sessionId: string): Participant[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return Array.from(session.participants.values())
      .filter(p => p.isActive);
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = SessionStatus.ENDED;
    session.lastActivity = new Date();

    // Clean up tracking
    for (const participant of session.participants.values()) {
      this.removeUserSessionTracking(participant.userId, sessionId);
    }

    const projectSessions = this.projectSessions.get(session.projectId);
    if (projectSessions) {
      projectSessions.delete(sessionId);
      if (projectSessions.size === 0) {
        this.projectSessions.delete(session.projectId);
      }
    }

    this.logger.info('Session ended', {
      sessionId,
      projectId: session.projectId,
      duration: Date.now() - session.created.getTime(),
      participantCount: session.participants.size
    });

    this.eventBus.emit('session:ended', { session });

    // Archive session (could be moved to database)
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, this.config.sessionArchiveDelay);
  }

  getSessionMetrics(): SessionMetrics {
    const activeSessions = Array.from(this.sessions.values())
      .filter(s => s.status === SessionStatus.ACTIVE);

    return {
      totalSessions: this.sessions.size,
      activeSessions: activeSessions.length,
      totalParticipants: activeSessions.reduce(
        (sum, session) => sum + session.participants.size, 
        0
      ),
      averageParticipantsPerSession: activeSessions.length > 0 
        ? activeSessions.reduce((sum, session) => sum + session.participants.size, 0) / activeSessions.length
        : 0,
      sessionsPerProject: this.projectSessions.size,
      uniqueUsers: this.userSessions.size
    };
  }

  private updateUserSessionTracking(userId: string, sessionId: string): void {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);
  }

  private removeUserSessionTracking(userId: string, sessionId: string): void {
    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }
  }

  private getDefaultSettings(): SessionSettings {
    return {
      maxParticipants: 50,
      allowAnonymous: false,
      requireApproval: false,
      enableCursorSharing: true,
      enableVoiceChat: false,
      enableVideoChat: false,
      autoSave: true,
      autoSaveInterval: 30000,
      conflictResolution: ConflictResolutionStrategy.LAST_WRITE_WINS
    };
  }

  private getDefaultPermissions(role: ParticipantRole): SessionPermission[] {
    switch (role) {
      case ParticipantRole.OWNER:
        return [
          SessionPermission.READ,
          SessionPermission.WRITE,
          SessionPermission.MANAGE_PARTICIPANTS,
          SessionPermission.MANAGE_SETTINGS,
          SessionPermission.DELETE_SESSION
        ];
      case ParticipantRole.MODERATOR:
        return [
          SessionPermission.READ,
          SessionPermission.WRITE,
          SessionPermission.MANAGE_PARTICIPANTS
        ];
      case ParticipantRole.PARTICIPANT:
        return [
          SessionPermission.READ,
          SessionPermission.WRITE
        ];
      case ParticipantRole.OBSERVER:
        return [SessionPermission.READ];
      default:
        return [SessionPermission.READ];
    }
  }
}
```

### 5. Integration Layer

```typescript
// src/infrastructure/websocket/WebSocketIntegrationService.ts
export class WebSocketIntegrationService {
  private webSocketServer: WebSocketServer;
  private connectionManager: ConnectionManager;
  private sessionManager: SessionManager;
  private messageRouter: MessageRouter;

  constructor(
    private config: WebSocketConfig,
    private authService: AuthenticationService,
    private projectService: ProjectService,
    private logger: Logger,
    private eventBus: EventBus
  ) {
    this.setupWebSocketServer();
    this.setupEventHandlers();
  }

  private setupWebSocketServer(): void {
    this.webSocketServer = new WebSocketServer(this.config.server);
    this.connectionManager = new ConnectionManager(
      this.config.connectionManager,
      this.logger,
      new MetricsCollector()
    );
    this.sessionManager = new SessionManager(
      this.config.sessionManager,
      this.logger,
      this.eventBus
    );
    this.messageRouter = new MessageRouter(
      this.config.messageRouter,
      this.logger,
      new MetricsCollector()
    );
  }

  private setupEventHandlers(): void {
    // Integrate with BDUF orchestrator events
    this.eventBus.on('project:analysis:completed', this.handleAnalysisCompleted.bind(this));
    this.eventBus.on('architecture:generated', this.handleArchitectureGenerated.bind(this));
    this.eventBus.on('approval:requested', this.handleApprovalRequested.bind(this));
    this.eventBus.on('document:updated', this.handleDocumentUpdated.bind(this));
  }

  async start(): Promise<void> {
    try {
      await this.webSocketServer.start();
      this.logger.info('WebSocket integration service started');
    } catch (error) {
      this.logger.error('Failed to start WebSocket integration service', { error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.webSocketServer.stop();
      this.logger.info('WebSocket integration service stopped');
    } catch (error) {
      this.logger.error('Failed to stop WebSocket integration service', { error });
      throw error;
    }
  }

  // Event handlers for BDUF orchestrator integration
  private async handleAnalysisCompleted(event: AnalysisCompletedEvent): Promise<void> {
    const sessions = this.sessionManager.getSessionsForProject(event.projectId);
    
    for (const session of sessions) {
      this.webSocketServer.broadcast(`project:${event.projectId}`, {
        type: 'analysis:completed',
        data: event.analysis,
        timestamp: new Date()
      });
    }
  }

  private async handleArchitectureGenerated(event: ArchitectureGeneratedEvent): Promise<void> {
    const sessions = this.sessionManager.getSessionsForProject(event.projectId);
    
    for (const session of sessions) {
      this.webSocketServer.broadcast(`project:${event.projectId}`, {
        type: 'architecture:generated',
        data: event.architecture,
        timestamp: new Date()
      });
    }
  }

  getHealthStatus(): HealthStatus {
    return {
      ...this.webSocketServer.getHealthStatus(),
      sessions: this.sessionManager.getSessionMetrics(),
      connections: this.connectionManager.getConnectionMetrics()
    };
  }
}
```

## File Structure

```
src/infrastructure/websocket/
├── index.ts                           # Main exports
├── WebSocketServer.ts                 # Core WebSocket server
├── ConnectionManager.ts               # Connection state management
├── SessionManager.ts                  # Collaboration session management
├── MessageRouter.ts                   # Message routing system
├── WebSocketIntegrationService.ts     # Integration with BDUF orchestrator
├── types/
│   ├── index.ts
│   ├── connection.ts                  # Connection type definitions
│   ├── session.ts                     # Session type definitions
│   ├── message.ts                     # Message type definitions
│   └── websocket.ts                   # WebSocket configuration types
├── middleware/
│   ├── index.ts
│   ├── AuthenticationMiddleware.ts    # Socket authentication
│   ├── RateLimitMiddleware.ts         # Rate limiting
│   ├── ValidationMiddleware.ts        # Message validation
│   ├── LoggingMiddleware.ts           # Request/response logging
│   └── AuditMiddleware.ts             # Security auditing
├── handlers/
│   ├── index.ts
│   ├── DocumentUpdateHandler.ts       # Document collaboration handler
│   ├── CursorMoveHandler.ts           # Cursor position handler
│   ├── ApprovalRequestHandler.ts      # Approval workflow handler
│   ├── NotificationHandler.ts         # Notification handler
│   └── DefaultMessageHandler.ts       # Default message handler
├── services/
│   ├── index.ts
│   ├── HeartbeatManager.ts            # Connection heartbeat management
│   ├── RateLimiter.ts                 # Rate limiting service
│   ├── MessageValidator.ts            # Message validation service
│   └── BroadcastService.ts            # Message broadcasting service
├── adapters/
│   ├── index.ts
│   ├── RedisAdapter.ts                # Redis clustering adapter
│   └── MemoryAdapter.ts               # In-memory adapter for testing
├── utils/
│   ├── index.ts
│   ├── ConnectionUtils.ts             # Connection utility functions
│   ├── MessageUtils.ts                # Message utility functions
│   └── SessionUtils.ts                # Session utility functions
└── __tests__/
    ├── unit/
    │   ├── WebSocketServer.test.ts
    │   ├── ConnectionManager.test.ts
    │   ├── SessionManager.test.ts
    │   └── MessageRouter.test.ts
    ├── integration/
    │   ├── websocket-integration.test.ts
    │   └── session-lifecycle.test.ts
    └── fixtures/
        ├── test-connections.json
        ├── test-sessions.json
        └── test-messages.json
```

## Success Criteria

### Functional Requirements
1. **Real-time Communication**: Support 1000+ concurrent WebSocket connections with sub-50ms message latency
2. **Session Management**: Handle collaborative sessions with proper participant tracking and state management
3. **Message Routing**: Efficiently route messages between clients with proper validation and permissions
4. **Clustering Support**: Scale horizontally across multiple server instances using Redis adapter
5. **Authentication**: Secure WebSocket connections with JWT-based authentication
6. **Connection Recovery**: Handle reconnection scenarios gracefully with state preservation
7. **Rate Limiting**: Protect against abuse with configurable rate limiting per user/connection

### Technical Requirements
1. **Error Handling**: Comprehensive error handling with graceful degradation
2. **Logging**: Detailed logging for debugging and monitoring
3. **Metrics**: Performance and health metrics collection
4. **Testing**: 90%+ code coverage with unit, integration, and load tests
5. **Documentation**: Complete API documentation and usage examples
6. **Configuration**: Flexible configuration for different deployment scenarios
7. **Security**: Secure by default with proper input validation and sanitization

### Quality Standards
1. **Performance**: Handle high concurrency with minimal resource usage
2. **Reliability**: 99.9% uptime with proper failover mechanisms
3. **Scalability**: Horizontal scaling support with load balancing
4. **Maintainability**: Clean, well-documented, and extensible code architecture
5. **Security**: Enterprise-grade security with audit logging

## Output Format

### Implementation Deliverables
1. **Core Implementation**: Complete WebSocket server with all components
2. **Unit Tests**: Comprehensive test suite with 90%+ coverage
3. **Integration Tests**: End-to-end workflow testing
4. **Load Tests**: Performance testing under high concurrency
5. **API Documentation**: Detailed documentation of all WebSocket events and handlers
6. **Configuration Examples**: Sample configurations for different deployment scenarios
7. **Performance Benchmarks**: Baseline performance metrics and optimization recommendations

### Documentation Requirements
1. **Architecture Documentation**: System design and component interactions
2. **API Reference**: Complete WebSocket event and message documentation
3. **Deployment Guide**: Setup and configuration instructions
4. **Scaling Guide**: Horizontal scaling and clustering setup
5. **Troubleshooting Guide**: Common issues and resolution steps
6. **Security Guide**: Security best practices and configuration

### Testing Requirements
1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions and WebSocket protocols
3. **Load Tests**: Verify performance under high concurrent connections
4. **Failover Tests**: Test clustering and reconnection scenarios
5. **Security Tests**: Verify authentication and authorization
6. **Browser Compatibility Tests**: Ensure WebSocket compatibility across browsers

Remember to leverage Context7 throughout the implementation to ensure you're using the most current WebSocket best practices and optimal libraries for real-time communication systems.