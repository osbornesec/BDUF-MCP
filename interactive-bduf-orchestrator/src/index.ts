/**
 * Interactive BDUF Orchestrator MCP Server
 * Enterprise-grade AI-powered software development orchestration platform
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { ToolRegistry } from './server/tool-registry.js';
import { Logger } from './shared/logger.js';
import { loadConfig } from './shared/config.js';
import { initializeDatabase } from './infrastructure/database.js';
import { registerBDUFTools } from './tools/bduf/index.js';
import { registerAnalysisTools } from './tools/analysis/index.js';
import { registerCollaborationTools } from './tools/collaboration/index.js';
import { registerAITools } from './tools/ai/index.js';

class BDUFOrchestrator {
  private server: Server;
  private toolRegistry: ToolRegistry;
  private logger: Logger;
  private isInitialized = false;

  constructor() {
    this.logger = new Logger('BDUFOrchestrator');
    this.toolRegistry = new ToolRegistry();
    
    this.server = new Server(
      {
        name: 'interactive-bduf-orchestrator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.toolRegistry.listTools();
      
      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.toolRegistry.execute(name, args);
        
        if (!result.success) {
          throw new McpError(
            (result.error?.code as any) || ErrorCode.InternalError,
            result.error?.message || 'Tool execution failed'
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)
            }
          ]
        };
      } catch (error) {
        this.logger.error(`Tool execution failed: ${name}`, error as Error);
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing Interactive BDUF Orchestrator...');

      // Load configuration
      const config = await loadConfig();
      this.logger.info('Configuration loaded', {
        metadata: {
          environment: config.server.nodeEnv,
          port: config.server.port
        }
      });

      // Initialize database connection
      await initializeDatabase();
      this.logger.info('Database connection established');

      // Register all tool categories
      await this.registerTools();

      this.isInitialized = true;
      this.logger.info('Interactive BDUF Orchestrator initialized successfully', {
        metadata: {
          toolCount: this.toolRegistry.getToolNames().length
        }
      });

    } catch (error) {
      this.logger.error('Failed to initialize BDUF Orchestrator', error as Error);
      throw error;
    }
  }

  private async registerTools(): Promise<void> {
    this.logger.info('Registering MCP tools...');

    try {
      // Register BDUF methodology tools
      await registerBDUFTools(this.toolRegistry);
      this.logger.info('BDUF tools registered');

      // Register analysis tools
      await registerAnalysisTools(this.toolRegistry);
      this.logger.info('Analysis tools registered');

      // Register collaboration tools
      await registerCollaborationTools(this.toolRegistry);
      this.logger.info('Collaboration tools registered');

      // Register AI integration tools
      await registerAITools(this.toolRegistry);
      this.logger.info('AI tools registered');

      const toolNames = this.toolRegistry.getToolNames();
      this.logger.info(`All tools registered successfully: ${toolNames.join(', ')}`);

    } catch (error) {
      this.logger.error('Failed to register tools', error as Error);
      throw error;
    }
  }

  async start(): Promise<void> {
    await this.initialize();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.logger.info('Interactive BDUF Orchestrator MCP Server started');
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Interactive BDUF Orchestrator...');
    await this.server.close();
    this.logger.info('Interactive BDUF Orchestrator stopped');
  }
}

// Main execution
async function main(): Promise<void> {
  const orchestrator = new BDUFOrchestrator();

  // Graceful shutdown handling
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await orchestrator.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await orchestrator.stop();
    process.exit(0);
  });

  try {
    await orchestrator.start();
  } catch (error) {
    console.error('Failed to start Interactive BDUF Orchestrator:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (process.argv[1] && process.argv[1].endsWith('index.ts')) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { BDUFOrchestrator };