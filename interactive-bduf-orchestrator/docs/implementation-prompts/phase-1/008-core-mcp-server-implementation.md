# Prompt 008: Core MCP Server Implementation

## Persona
You are a **Senior MCP Protocol Engineer** with 8+ years of experience building enterprise-grade Model Context Protocol servers. You specialize in creating scalable, type-safe MCP implementations that handle complex tool orchestration, session management, and real-time communication. You have deep expertise in the MCP SDK, WebSocket protocols, and distributed system architecture.

## Context
You are implementing the core MCP server framework for the Interactive BDUF Orchestrator. This server will handle all MCP protocol communications, tool execution orchestration, session lifecycle management, and integration with the BDUF analysis engines.

## Git Workflow
Before starting implementation, create a new feature branch:
```bash
git checkout -b feature/008-core-mcp-server-implementation
```

## Required Context from Context7
- Model Context Protocol TypeScript SDK latest features and patterns
- Enterprise MCP server architecture patterns
- WebSocket session management best practices
- MCP tool orchestration and execution patterns

## Implementation Requirements

### 1. Core MCP Server Class
Create the main MCP server implementation:

```typescript
export class BDUFOrchestrator extends McpServer {
  private toolRegistry: ToolRegistry;
  private sessionManager: SessionManager;
  private capabilityManager: CapabilityManager;
  private requestHandler: RequestHandler;
  private logger: Logger;
  private config: AppConfig;
  private metrics: MetricsCollector;

  constructor(
    config: AppConfig,
    toolRegistry: ToolRegistry,
    sessionManager: SessionManager,
    logger: Logger,
    metrics: MetricsCollector
  ) {
    super({
      name: "Interactive BDUF Orchestrator",
      version: "1.0.0",
      description: "AI-powered project analysis and orchestration with human oversight"
    });

    this.config = config;
    this.toolRegistry = toolRegistry;
    this.sessionManager = sessionManager;
    this.logger = logger;
    this.metrics = metrics;
    
    this.capabilityManager = new CapabilityManager(config);
    this.requestHandler = new RequestHandler(this, logger, metrics);
    
    this.initializeServer();
  }

  private initializeServer(): void {
    // Register core capabilities
    this.registerCapabilities();
    
    // Register all available tools
    this.registerTools();
    
    // Set up request handlers
    this.setupRequestHandlers();
    
    // Configure error handling
    this.setupErrorHandling();
    
    // Initialize session management
    this.setupSessionManagement();
    
    this.logger.info('BDUF Orchestrator MCP Server initialized');
  }

  private registerCapabilities(): void {
    this.capabilityManager.register({
      tools: {
        listChanged: true,
        progressReporting: true
      },
      resources: {
        listChanged: true,
        subscribe: true
      },
      prompts: {
        listChanged: true
      },
      logging: {
        level: "info"
      },
      sampling: {}
    });
  }

  private registerTools(): void {
    // Project management tools
    this.registerProjectTools();
    
    // Analysis tools
    this.registerAnalysisTools();
    
    // Collaboration tools
    this.registerCollaborationTools();
    
    // Approval workflow tools
    this.registerApprovalTools();
    
    // Utility tools
    this.registerUtilityTools();
  }

  private registerProjectTools(): void {
    // Create project tool
    this.tool(
      "create_project",
      {
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        organizationId: z.string().uuid().optional(),
        complexity: z.enum(['simple', 'moderate', 'complex', 'very_complex']).default('moderate'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        startDate: z.string().datetime().optional(),
        targetEndDate: z.string().datetime().optional(),
        budgetAllocated: z.number().positive().optional(),
        settings: z.record(z.any()).optional()
      },
      async (params) => {
        const startTime = Date.now();
        
        try {
          this.logger.info('Creating new project', { params });
          
          const project = await this.projectService.createProject({
            ...params,
            createdBy: this.getCurrentUserId()
          });
          
          this.metrics.increment('mcp_tool_executions_total', { tool: 'create_project', status: 'success' });
          this.metrics.observe('mcp_tool_duration_seconds', (Date.now() - startTime) / 1000, { tool: 'create_project' });
          
          return {
            content: [{
              type: "text",
              text: `Project "${project.name}" created successfully with ID: ${project.id}`
            }],
            metadata: {
              projectId: project.id,
              executionTime: Date.now() - startTime
            }
          };
        } catch (error) {
          this.logger.error('Error creating project', error as Error, { params });
          this.metrics.increment('mcp_tool_errors_total', { tool: 'create_project' });
          
          return {
            content: [{
              type: "text", 
              text: `Failed to create project: ${(error as Error).message}`
            }],
            isError: true,
            metadata: {
              error: (error as Error).message,
              executionTime: Date.now() - startTime
            }
          };
        }
      }
    );

    // Analyze project requirements
    this.tool(
      "analyze_project_requirements",
      {
        projectId: z.string().uuid(),
        requirementsText: z.string().min(10),
        analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
        includeGapAnalysis: z.boolean().default(true),
        includeConflictDetection: z.boolean().default(true)
      },
      async (params) => {
        const startTime = Date.now();
        
        try {
          this.logger.info('Analyzing project requirements', { 
            projectId: params.projectId,
            analysisDepth: params.analysisDepth 
          });
          
          // Use requirements analysis engine
          const analysis = await this.requirementsAnalysisEngine.analyze({
            projectId: params.projectId,
            text: params.requirementsText,
            options: {
              depth: params.analysisDepth,
              includeGapAnalysis: params.includeGapAnalysis,
              includeConflictDetection: params.includeConflictDetection
            }
          });
          
          this.metrics.increment('mcp_tool_executions_total', { tool: 'analyze_project_requirements', status: 'success' });
          this.metrics.observe('requirements_analysis_duration_seconds', analysis.processingTime / 1000);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify(analysis, null, 2)
            }],
            metadata: {
              analysisId: analysis.id,
              requirementsCount: analysis.requirements.length,
              gapsFound: analysis.gaps?.length || 0,
              conflictsFound: analysis.conflicts?.length || 0,
              executionTime: Date.now() - startTime
            }
          };
        } catch (error) {
          this.logger.error('Error analyzing requirements', error as Error, { params });
          this.metrics.increment('mcp_tool_errors_total', { tool: 'analyze_project_requirements' });
          
          return {
            content: [{
              type: "text",
              text: `Requirements analysis failed: ${(error as Error).message}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private registerAnalysisTools(): void {
    // Generate architecture options
    this.tool(
      "generate_architecture_options",
      {
        projectId: z.string().uuid(),
        requirements: z.array(z.string()).min(1),
        constraints: z.array(z.string()).optional(),
        technologyPreferences: z.array(z.string()).optional(),
        scalabilityRequirements: z.object({
          expectedUsers: z.number().positive().optional(),
          expectedLoad: z.string().optional(),
          geographicDistribution: z.string().optional()
        }).optional(),
        budgetConstraints: z.object({
          development: z.number().positive().optional(),
          infrastructure: z.number().positive().optional(),
          ongoing: z.number().positive().optional()
        }).optional()
      },
      async (params) => {
        const startTime = Date.now();
        
        try {
          this.logger.info('Generating architecture options', { 
            projectId: params.projectId,
            requirementsCount: params.requirements.length 
          });
          
          const options = await this.architectureEngine.generateOptions({
            projectId: params.projectId,
            requirements: params.requirements,
            constraints: params.constraints || [],
            preferences: {
              technologies: params.technologyPreferences || [],
              scalability: params.scalabilityRequirements,
              budget: params.budgetConstraints
            }
          });
          
          this.metrics.increment('mcp_tool_executions_total', { tool: 'generate_architecture_options', status: 'success' });
          this.metrics.observe('architecture_generation_duration_seconds', (Date.now() - startTime) / 1000);
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify(options, null, 2)
            }],
            metadata: {
              optionsGenerated: options.length,
              executionTime: Date.now() - startTime
            }
          };
        } catch (error) {
          this.logger.error('Error generating architecture options', error as Error, { params });
          this.metrics.increment('mcp_tool_errors_total', { tool: 'generate_architecture_options' });
          
          return {
            content: [{
              type: "text",
              text: `Architecture generation failed: ${(error as Error).message}`
            }],
            isError: true
          };
        }
      }
    );

    // Evaluate technologies using Context7 and Perplexity
    this.tool(
      "evaluate_technologies",
      {
        technologies: z.array(z.string()).min(1),
        evaluationCriteria: z.array(z.string()).optional(),
        projectContext: z.object({
          domain: z.string(),
          scale: z.string(),
          timeline: z.string(),
          teamExperience: z.string().optional()
        }),
        includeLatestTrends: z.boolean().default(true),
        includeDocumentation: z.boolean().default(true)
      },
      async (params) => {
        const startTime = Date.now();
        
        try {
          this.logger.info('Evaluating technologies', { 
            technologies: params.technologies,
            includeLatestTrends: params.includeLatestTrends 
          });
          
          const evaluation = await this.technologyEvaluationEngine.evaluate({
            technologies: params.technologies,
            criteria: params.evaluationCriteria || [
              'Community Support',
              'Documentation Quality', 
              'Performance',
              'Learning Curve',
              'Long-term Viability',
              'Security',
              'Ecosystem Maturity'
            ],
            context: params.projectContext,
            options: {
              includeLatestTrends: params.includeLatestTrends,
              includeDocumentation: params.includeDocumentation
            }
          });
          
          this.metrics.increment('mcp_tool_executions_total', { tool: 'evaluate_technologies', status: 'success' });
          
          return {
            content: [{
              type: "text",
              text: JSON.stringify(evaluation, null, 2)
            }],
            metadata: {
              technologiesEvaluated: evaluation.technologies.length,
              criteriaUsed: evaluation.criteria.length,
              executionTime: Date.now() - startTime
            }
          };
        } catch (error) {
          this.logger.error('Error evaluating technologies', error as Error, { params });
          this.metrics.increment('mcp_tool_errors_total', { tool: 'evaluate_technologies' });
          
          return {
            content: [{
              type: "text",
              text: `Technology evaluation failed: ${(error as Error).message}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private registerCollaborationTools(): void {
    // Start collaboration session
    this.tool(
      "start_collaboration_session",
      {
        projectId: z.string().uuid(),
        sessionType: z.enum(['requirements_review', 'architecture_review', 'planning', 'standup', 'retrospective', 'design_session']),
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        scheduledStart: z.string().datetime(),
        scheduledEnd: z.string().datetime(),
        participants: z.array(z.string().uuid()).optional(),
        facilitatorId: z.string().uuid().optional(),
        settings: z.object({
          isRecordingEnabled: z.boolean().default(false),
          maxParticipants: z.number().int().positive().default(20),
          requiresApproval: z.boolean().default(false)
        }).optional()
      },
      async (params) => {
        const startTime = Date.now();
        
        try {
          this.logger.info('Starting collaboration session', { 
            projectId: params.projectId,
            sessionType: params.sessionType 
          });
          
          const session = await this.collaborationEngine.startSession({
            projectId: params.projectId,
            type: params.sessionType,
            title: params.title,
            description: params.description,
            scheduledStart: new Date(params.scheduledStart),
            scheduledEnd: new Date(params.scheduledEnd),
            facilitatorId: params.facilitatorId || this.getCurrentUserId(),
            participants: params.participants || [],
            settings: params.settings || {}
          });
          
          this.metrics.increment('collaboration_sessions_total', { type: params.sessionType });
          
          return {
            content: [{
              type: "text",
              text: `Collaboration session "${session.title}" started successfully. Session ID: ${session.id}`
            }],
            metadata: {
              sessionId: session.id,
              sessionUrl: session.joinUrl,
              executionTime: Date.now() - startTime
            }
          };
        } catch (error) {
          this.logger.error('Error starting collaboration session', error as Error, { params });
          
          return {
            content: [{
              type: "text",
              text: `Failed to start collaboration session: ${(error as Error).message}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private setupRequestHandlers(): void {
    // Handle initialization requests
    this.setRequestHandler(InitializeRequestSchema, async (request) => {
      this.logger.info('MCP server initialization requested', { clientInfo: request.params.clientInfo });
      
      return {
        protocolVersion: "2025-03-26",
        capabilities: this.capabilityManager.getCapabilities(),
        serverInfo: {
          name: "Interactive BDUF Orchestrator",
          version: "1.0.0"
        }
      };
    });

    // Handle tool list requests
    this.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.toolRegistry.listTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));
      
      return { tools };
    });

    // Handle tool call requests with progress reporting
    this.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info('Tool execution requested', { toolName: name, hasArgs: !!args });
      
      try {
        // Create progress reporter if supported
        const progressReporter = extra?.progressReporter;
        if (progressReporter) {
          await progressReporter({
            progress: 0,
            total: 100
          });
        }
        
        const result = await this.toolRegistry.execute(name, args, {
          progressReporter,
          sessionId: this.sessionManager.getCurrentSessionId(),
          userId: this.getCurrentUserId()
        });
        
        if (progressReporter) {
          await progressReporter({
            progress: 100,
            total: 100
          });
        }
        
        return result;
      } catch (error) {
        this.logger.error('Tool execution failed', error as Error, { toolName: name });
        throw error;
      }
    });
  }

  private setupErrorHandling(): void {
    this.on('error', (error: Error) => {
      this.logger.error('MCP Server error', error);
      this.metrics.increment('mcp_server_errors_total', { 
        error_type: error.constructor.name 
      });
    });

    // Handle unhandled tool errors
    this.on('toolError', (toolName: string, error: Error) => {
      this.logger.error('Tool execution error', error, { toolName });
      this.metrics.increment('mcp_tool_errors_total', { tool: toolName });
    });
  }

  private setupSessionManagement(): void {
    this.sessionManager.on('sessionCreated', (sessionId: string) => {
      this.logger.info('New MCP session created', { sessionId });
      this.metrics.increment('mcp_sessions_total', { event: 'created' });
    });

    this.sessionManager.on('sessionEnded', (sessionId: string) => {
      this.logger.info('MCP session ended', { sessionId });
      this.metrics.increment('mcp_sessions_total', { event: 'ended' });
    });
  }

  async start(transport: ServerTransport): Promise<void> {
    try {
      await this.connect(transport);
      this.logger.info('BDUF Orchestrator MCP Server started successfully');
      this.metrics.increment('mcp_server_starts_total');
    } catch (error) {
      this.logger.error('Failed to start MCP server', error as Error);
      this.metrics.increment('mcp_server_start_failures_total');
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.close();
      this.logger.info('BDUF Orchestrator MCP Server stopped');
      this.metrics.increment('mcp_server_stops_total');
    } catch (error) {
      this.logger.error('Error stopping MCP server', error as Error);
      throw error;
    }
  }

  private getCurrentUserId(): string {
    return this.sessionManager.getCurrentUserId() || 'system';
  }
}
```

### 2. Session Management
```typescript
export class SessionManager extends EventEmitter {
  private activeSessions: Map<string, MCPSession> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private logger: Logger;
  private config: SessionConfig;

  constructor(logger: Logger, config: SessionConfig) {
    super();
    this.logger = logger;
    this.config = config;
  }

  createSession(transport: ServerTransport, clientInfo?: ClientInfo): MCPSession {
    const sessionId = this.generateSessionId();
    const session = new MCPSession(sessionId, transport, clientInfo, this.logger);
    
    this.activeSessions.set(sessionId, session);
    this.setupSessionTimeout(sessionId);
    
    session.on('ended', () => this.endSession(sessionId));
    session.on('activity', () => this.refreshSessionTimeout(sessionId));
    
    this.emit('sessionCreated', sessionId);
    return session;
  }

  endSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.end();
      this.activeSessions.delete(sessionId);
      this.clearSessionTimeout(sessionId);
      this.emit('sessionEnded', sessionId);
    }
  }

  getSession(sessionId: string): MCPSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getActiveSessions(): MCPSession[] {
    return Array.from(this.activeSessions.values());
  }

  getCurrentSessionId(): string | undefined {
    // Implementation would track current context
    return Array.from(this.activeSessions.keys())[0];
  }

  getCurrentUserId(): string | undefined {
    const sessionId = this.getCurrentSessionId();
    if (sessionId) {
      const session = this.getSession(sessionId);
      return session?.getUserId();
    }
    return undefined;
  }

  private generateSessionId(): string {
    return `mcp_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private setupSessionTimeout(sessionId: string): void {
    const timeout = setTimeout(() => {
      this.logger.warn('Session timeout', { sessionId });
      this.endSession(sessionId);
    }, this.config.sessionTimeoutMs);
    
    this.sessionTimeouts.set(sessionId, timeout);
  }

  private refreshSessionTimeout(sessionId: string): void {
    this.clearSessionTimeout(sessionId);
    this.setupSessionTimeout(sessionId);
  }

  private clearSessionTimeout(sessionId: string): void {
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }
}

export class MCPSession extends EventEmitter {
  public readonly id: string;
  public readonly createdAt: Date;
  private transport: ServerTransport;
  private clientInfo?: ClientInfo;
  private userId?: string;
  private lastActivity: Date;
  private isActive: boolean = true;
  private logger: Logger;

  constructor(
    id: string,
    transport: ServerTransport,
    clientInfo: ClientInfo | undefined,
    logger: Logger
  ) {
    super();
    this.id = id;
    this.transport = transport;
    this.clientInfo = clientInfo;
    this.logger = logger;
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  setUserId(userId: string): void {
    this.userId = userId;
    this.emit('userIdentified', userId);
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  updateActivity(): void {
    this.lastActivity = new Date();
    this.emit('activity');
  }

  end(): void {
    if (this.isActive) {
      this.isActive = false;
      this.emit('ended');
    }
  }

  isSessionActive(): boolean {
    return this.isActive;
  }

  getSessionInfo(): SessionInfo {
    return {
      id: this.id,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      clientInfo: this.clientInfo,
      userId: this.userId,
      isActive: this.isActive
    };
  }
}
```

### 3. Capability Management
```typescript
export class CapabilityManager {
  private capabilities: ServerCapabilities;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.capabilities = this.initializeCapabilities();
  }

  private initializeCapabilities(): ServerCapabilities {
    return {
      tools: {
        listChanged: true,
        progressReporting: true
      },
      resources: {
        listChanged: true,
        subscribe: true
      },
      prompts: {
        listChanged: true
      },
      logging: {
        level: this.config.logging.level as any
      },
      sampling: {}
    };
  }

  register(capabilities: Partial<ServerCapabilities>): void {
    this.capabilities = {
      ...this.capabilities,
      ...capabilities
    };
  }

  getCapabilities(): ServerCapabilities {
    return this.capabilities;
  }

  hasCapability(capability: string): boolean {
    return Object.keys(this.capabilities).includes(capability);
  }
}
```

## File Structure
```
src/server/
├── core/
│   ├── bduf-orchestrator.ts        # Main MCP server class
│   ├── session-manager.ts          # Session lifecycle management
│   ├── capability-manager.ts       # Capability registration
│   ├── request-handler.ts          # Request/response handling
│   └── index.ts                    # Core exports
├── tools/
│   ├── project-tools.ts            # Project management tools
│   ├── analysis-tools.ts           # BDUF analysis tools
│   ├── collaboration-tools.ts      # Collaboration tools
│   ├── approval-tools.ts           # Approval workflow tools
│   ├── utility-tools.ts            # Utility tools
│   └── index.ts                    # Tool exports
├── transports/
│   ├── stdio-transport.ts          # Standard I/O transport
│   ├── websocket-transport.ts      # WebSocket transport
│   ├── http-transport.ts           # HTTP transport
│   └── index.ts                    # Transport exports
├── middleware/
│   ├── authentication.ts           # Auth middleware
│   ├── rate-limiting.ts            # Rate limiting
│   ├── logging.ts                  # Request logging
│   ├── metrics.ts                  # Metrics collection
│   └── index.ts                    # Middleware exports
└── index.ts                        # Server exports
```

## Success Criteria
- [ ] Complete MCP server implementation with all protocol features
- [ ] Session management with proper lifecycle handling
- [ ] Tool orchestration with progress reporting
- [ ] Error handling and recovery mechanisms
- [ ] Performance monitoring and metrics collection
- [ ] Protocol compliance validation
- [ ] Integration with all analysis engines
- [ ] Comprehensive unit and integration tests (>90% coverage)

## Quality Standards
- Follow MCP protocol specifications exactly
- Implement proper error handling with meaningful messages
- Use TypeScript strict mode throughout
- Include comprehensive logging for debugging
- Optimize for performance and scalability
- Ensure thread-safe operations
- Implement proper resource cleanup

## Output Format
Implement the complete MCP server framework with:
1. Main MCP server class with full protocol support
2. Session management system with lifecycle handling
3. Capability management and discovery
4. Request/response handling pipeline
5. Tool orchestration and execution
6. Transport layer abstraction
7. Middleware integration points
8. Comprehensive test suite

Focus on creating a production-ready MCP server that serves as the backbone for the entire BDUF orchestration system.