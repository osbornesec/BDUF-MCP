# Prompt 010: Core MCP Tools Setup

## Persona
You are a **Senior MCP Tools Engineer** with 6+ years of experience building Model Context Protocol tools and integrations. You specialize in creating enterprise-grade MCP tool implementations that handle complex business workflows, real-time data processing, and seamless integration with AI agents. You have deep expertise in the MCP SDK, tool orchestration patterns, and distributed system integration.

## Context
You are implementing the core MCP tools for the Interactive BDUF Orchestrator. These tools will provide the primary interface for AI agents to interact with the BDUF methodology, project management workflows, and collaborative planning processes.

## Git Workflow
Before starting implementation, create a new feature branch:
```bash
git checkout -b feature/010-core-mcp-tools-setup
```

## Required Context from Context7
- Model Context Protocol tools best practices and design patterns
- Enterprise MCP tool implementation strategies
- Tool validation and error handling patterns
- MCP tool orchestration and chaining techniques

## Implementation Requirements

### 1. Project Management Tools
```typescript
export const projectManagementTools = [
  {
    name: "create_project",
    description: "Create a new BDUF project with comprehensive analysis workflows",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1, maxLength: 255 },
        description: { type: "string" },
        organizationId: { type: "string", format: "uuid" },
        complexity: { 
          type: "string", 
          enum: ["simple", "moderate", "complex", "very_complex"],
          default: "moderate"
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          default: "medium"
        },
        settings: { type: "object" }
      },
      required: ["name"]
    },
    handler: async (params) => {
      // Implementation with comprehensive validation and workflow setup
    }
  },
  
  {
    name: "get_project_status",
    description: "Get comprehensive project status including progress, metrics, and health indicators",
    inputSchema: {
      type: "object", 
      properties: {
        projectId: { type: "string", format: "uuid" },
        includeMetrics: { type: "boolean", default: true },
        includeTimeline: { type: "boolean", default: true }
      },
      required: ["projectId"]
    },
    handler: async (params) => {
      // Real-time status with analytics
    }
  }
];
```

### 2. BDUF Analysis Tools
```typescript
export const bdufAnalysisTools = [
  {
    name: "analyze_requirements",
    description: "Perform comprehensive requirements analysis using NLP and pattern recognition",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", format: "uuid" },
        requirementsText: { type: "string", minLength: 10 },
        analysisType: {
          type: "string",
          enum: ["basic", "detailed", "comprehensive"],
          default: "detailed"
        },
        includeGapAnalysis: { type: "boolean", default: true },
        includeStakeholderMapping: { type: "boolean", default: true }
      },
      required: ["projectId", "requirementsText"]
    },
    handler: async (params) => {
      // Advanced NLP processing with Context7 integration
    }
  },

  {
    name: "generate_architecture_options", 
    description: "Generate multiple architecture options based on requirements and constraints",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", format: "uuid" },
        requirements: { type: "array", items: { type: "string" } },
        constraints: { type: "array", items: { type: "string" } },
        preferences: { type: "object" }
      },
      required: ["projectId", "requirements"]
    },
    handler: async (params) => {
      // AI-powered architecture generation with multiple options
    }
  }
];
```

### 3. Collaboration Tools
```typescript
export const collaborationTools = [
  {
    name: "start_collaboration_session",
    description: "Initiate real-time collaboration session with stakeholders",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", format: "uuid" },
        sessionType: {
          type: "string",
          enum: ["requirements_review", "architecture_review", "planning", "retrospective"]
        },
        participants: { type: "array", items: { type: "string" } },
        duration: { type: "number", minimum: 15, maximum: 480 }
      },
      required: ["projectId", "sessionType"]
    },
    handler: async (params) => {
      // WebSocket-based collaboration with real-time updates
    }
  }
];
```

## File Structure
```
src/tools/
├── project/
│   ├── project-management.tools.ts
│   ├── project-analytics.tools.ts
│   └── index.ts
├── analysis/
│   ├── requirements-analysis.tools.ts
│   ├── architecture-generation.tools.ts
│   ├── risk-assessment.tools.ts
│   └── index.ts
├── collaboration/
│   ├── session-management.tools.ts
│   ├── approval-workflow.tools.ts
│   └── index.ts
├── utility/
│   ├── validation.tools.ts
│   ├── reporting.tools.ts
│   └── index.ts
└── index.ts
```

## Success Criteria
- [ ] Complete MCP tool implementation with comprehensive validation
- [ ] Integration with all BDUF analysis engines
- [ ] Real-time collaboration capabilities
- [ ] Error handling and recovery mechanisms
- [ ] Performance optimization for tool execution
- [ ] Comprehensive testing suite (>90% coverage)

## Quality Standards
- Follow MCP protocol specifications
- Implement proper input validation and sanitization
- Include comprehensive error handling
- Optimize for performance and scalability
- Ensure type safety throughout
- Include detailed logging and metrics

## Output Format
Implement the complete MCP tools setup with:
1. All project management tools with full CRUD operations
2. BDUF analysis tools with AI integration
3. Collaboration tools with real-time capabilities
4. Approval workflow tools with notification system
5. Utility tools for validation and reporting
6. Comprehensive test suite
7. Integration with tool registry system

Focus on creating production-ready MCP tools that provide seamless AI agent interaction with the BDUF orchestration system.