# Implementation Prompt 028: Context Assembly Engine (4.1.2)

## Persona
You are a **Context Engineering Architect** with 15+ years of experience in building intelligent context management systems, knowledge graphs, and enterprise information integration platforms. You specialize in creating sophisticated context assembly systems that can dynamically gather, synthesize, and maintain comprehensive project context from diverse sources.

## Context: Interactive BDUF Orchestrator
You are implementing the **Context Assembly Engine** as part of the Interactive Big Design Up Front (BDUF) Orchestrator. This system enables comprehensive project analysis, architecture generation, and collaborative development workflows through AI-powered automation.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP (Model Context Protocol) server that orchestrates comprehensive project analysis and planning. The Context Assembly Engine you're building will be a critical component that:

1. **Dynamically assembles comprehensive context** from multiple sources and formats
2. **Maintains contextual relationships** between different types of information
3. **Provides intelligent context retrieval** based on current task requirements
4. **Synthesizes multi-modal context** from documents, code, conversations, and external sources
5. **Enables context-aware decision making** across all orchestration processes
6. **Manages context evolution** and maintains historical context versions

### Technical Context
- **Architecture**: TypeScript-based modular system with enterprise patterns
- **Integration**: Must integrate with Context7 MCP for documentation lookup
- **Scalability**: Handle complex context graphs with millions of nodes and relationships
- **Quality**: 95%+ test coverage, comprehensive error handling
- **Performance**: Sub-50ms context retrieval with intelligent caching and indexing

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/context-assembly-engine

# Regular commits with descriptive messages
git add .
git commit -m "feat(orchestration): implement context assembly engine

- Add dynamic context aggregation from multiple sources
- Implement intelligent context synthesis and relationships
- Create context-aware retrieval and caching systems
- Add multi-modal context integration capabilities
- Implement context evolution and versioning"

# Push and create PR
git push origin feature/context-assembly-engine
```

### Commit Message Format
```
<type>(orchestration): <description>

<body explaining what and why>

Closes #<issue-number>
```

## Required Context7 Integration

Before implementing any context assembly components, you MUST use Context7 to research current best practices:

```typescript
// Research knowledge graph and context management
await context7.getLibraryDocs('/neo4j/neo4j-driver');
await context7.getLibraryDocs('/rdfjs/rdfjs');
await context7.getLibraryDocs('/apache/jena');

// Research vector databases and semantic search
await context7.getLibraryDocs('/pinecone-io/pinecone-ts');
await context7.getLibraryDocs('/weaviate/weaviate-ts-client');
await context7.getLibraryDocs('/qdrant/qdrant-js');

// Research text processing and information extraction
await context7.getLibraryDocs('/huggingface/transformers');
await context7.getLibraryDocs('/langchain-ai/langchain');
```

## Implementation Requirements

### 1. Core Context Assembly Architecture

Create a comprehensive context assembly system:

```typescript
// src/core/orchestration/ContextAssemblyEngine.ts
export interface ContextAssemblyConfig {
  sources: {
    enableFileSystemScan: boolean;
    enableGitRepositoryAnalysis: boolean;
    enableDocumentProcessing: boolean;
    enableExternalAPIs: boolean;
    enableConversationHistory: boolean;
    enableKnowledgeBase: boolean;
  };
  processing: {
    enableSemanticAnalysis: boolean;
    enableEntityExtraction: boolean;
    enableRelationshipDetection: boolean;
    enableContextSynthesis: boolean;
    maxContextDepth: number;
    contextRelevanceThreshold: number;
  };
  storage: {
    vectorDatabase: VectorDatabaseConfig;
    graphDatabase: GraphDatabaseConfig;
    cacheConfiguration: CacheConfig;
    indexingStrategy: IndexingStrategy;
  };
  retrieval: {
    semanticSearchEnabled: boolean;
    hybridSearchEnabled: boolean;
    contextualRankingEnabled: boolean;
    maxRetrievalResults: number;
    relevanceThreshold: number;
  };
}

export interface ContextSource {
  id: string;
  type: ContextSourceType;
  name: string;
  description: string;
  configuration: SourceConfiguration;
  priority: number;
  trustScore: number;
  lastUpdated: Date;
  metadata: SourceMetadata;
}

export enum ContextSourceType {
  FILE_SYSTEM = 'file_system',
  GIT_REPOSITORY = 'git_repository',
  DOCUMENTATION = 'documentation',
  CODE_BASE = 'code_base',
  CONVERSATION = 'conversation',
  EXTERNAL_API = 'external_api',
  KNOWLEDGE_BASE = 'knowledge_base',
  REQUIREMENTS_DOCUMENT = 'requirements_document',
  ARCHITECTURE_DOCUMENT = 'architecture_document',
  USER_INPUT = 'user_input',
  COLLABORATION_SESSION = 'collaboration_session'
}

export interface ContextNode {
  id: string;
  type: ContextNodeType;
  content: ContextContent;
  metadata: ContextMetadata;
  relationships: ContextRelationship[];
  vector: number[];
  relevanceScore: number;
  trustScore: number;
  created: Date;
  lastAccessed: Date;
  accessCount: number;
}

export enum ContextNodeType {
  CONCEPT = 'concept',
  ENTITY = 'entity',
  REQUIREMENT = 'requirement',
  ARCHITECTURE_COMPONENT = 'architecture_component',
  CODE_SNIPPET = 'code_snippet',
  DOCUMENTATION = 'documentation',
  CONVERSATION_THREAD = 'conversation_thread',
  DECISION = 'decision',
  CONSTRAINT = 'constraint',
  ASSUMPTION = 'assumption',
  RISK = 'risk',
  STAKEHOLDER = 'stakeholder'
}

export interface ContextContent {
  text: string;
  summary: string;
  keywords: string[];
  entities: ExtractedEntity[];
  topics: Topic[];
  sentiment: SentimentAnalysis;
  language: string;
  format: ContentFormat;
  source: ContextSource;
  originalLocation: string;
}

export interface ContextRelationship {
  id: string;
  type: RelationshipType;
  sourceNodeId: string;
  targetNodeId: string;
  strength: number;
  confidence: number;
  properties: RelationshipProperties;
  created: Date;
  lastValidated: Date;
}

export enum RelationshipType {
  CONTAINS = 'contains',
  DEPENDS_ON = 'depends_on',
  IMPLEMENTS = 'implements',
  RELATES_TO = 'relates_to',
  CONFLICTS_WITH = 'conflicts_with',
  SUPPORTS = 'supports',
  DERIVED_FROM = 'derived_from',
  REFERENCES = 'references',
  EQUIVALENT_TO = 'equivalent_to',
  PART_OF = 'part_of',
  INFLUENCES = 'influences',
  CONSTRAINS = 'constrains'
}

export interface AssembledContext {
  id: string;
  query: ContextQuery;
  nodes: ContextNode[];
  relationships: ContextRelationship[];
  summary: ContextSummary;
  relevanceMap: Map<string, number>;
  confidence: number;
  completeness: number;
  freshness: Date;
  sources: ContextSource[];
  assemblyMetrics: AssemblyMetrics;
  created: Date;
}

export interface ContextQuery {
  id: string;
  text: string;
  intent: QueryIntent;
  domain: QueryDomain;
  scope: QueryScope;
  filters: ContextFilter[];
  parameters: QueryParameters;
  requiredTypes: ContextNodeType[];
  maxResults: number;
  timeRange?: TimeRange;
}

export enum QueryIntent {
  UNDERSTAND = 'understand',
  ANALYZE = 'analyze',
  COMPARE = 'compare',
  DESIGN = 'design',
  IMPLEMENT = 'implement',
  EVALUATE = 'evaluate',
  PLAN = 'plan',
  TROUBLESHOOT = 'troubleshoot'
}

export enum QueryDomain {
  REQUIREMENTS = 'requirements',
  ARCHITECTURE = 'architecture',
  IMPLEMENTATION = 'implementation',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  CROSS_FUNCTIONAL = 'cross_functional'
}

export class ContextAssemblyEngine {
  private contextGraph: ContextGraph;
  private vectorStore: VectorStore;
  private sourceAdapters: Map<ContextSourceType, SourceAdapter>;
  private contentProcessors: Map<ContentFormat, ContentProcessor>;
  private relationshipDetector: RelationshipDetector;
  private contextSynthesizer: ContextSynthesizer;
  private relevanceRanker: RelevanceRanker;
  private contextCache: ContextCache;
  private assemblyMetrics: AssemblyMetricsTracker;

  constructor(
    private config: ContextAssemblyConfig,
    private logger: Logger,
    private context7Client: Context7Client,
    private nlpEngine: NLPEngine
  ) {
    this.contextGraph = new ContextGraph(config.storage.graphDatabase, logger);
    this.vectorStore = new VectorStore(config.storage.vectorDatabase, logger);
    this.sourceAdapters = new Map();
    this.contentProcessors = new Map();
    this.setupSourceAdapters();
    this.setupContentProcessors();
    this.relationshipDetector = new RelationshipDetector(config, logger, nlpEngine);
    this.contextSynthesizer = new ContextSynthesizer(config, logger);
    this.relevanceRanker = new RelevanceRanker(config, logger);
    this.contextCache = new ContextCache(config.storage.cacheConfiguration);
    this.assemblyMetrics = new AssemblyMetricsTracker(logger);
  }

  async assembleContext(query: ContextQuery): Promise<AssembledContext> {
    try {
      const assemblyId = generateAssemblyId();
      const startTime = Date.now();

      this.logger.info('Starting context assembly', {
        assemblyId,
        query: query.text,
        intent: query.intent,
        domain: query.domain
      });

      // Check cache first
      const cachedContext = await this.contextCache.get(query);
      if (cachedContext && this.isCacheValid(cachedContext, query)) {
        this.logger.info('Returning cached context', { assemblyId, cacheHit: true });
        return cachedContext;
      }

      // Start assembly metrics tracking
      this.assemblyMetrics.startAssembly(assemblyId, query);

      // Phase 1: Source Discovery and Content Retrieval
      const sourceContent = await this.discoverAndRetrieveContent(query);

      // Phase 2: Content Processing and Entity Extraction
      const processedNodes = await this.processContentToNodes(sourceContent, query);

      // Phase 3: Relationship Detection and Graph Building
      const relationships = await this.detectRelationships(processedNodes, query);

      // Phase 4: Context Synthesis and Relevance Ranking
      const synthesizedContext = await this.synthesizeContext(
        processedNodes,
        relationships,
        query
      );

      // Phase 5: Context Ranking and Filtering
      const rankedContext = await this.rankAndFilterContext(synthesizedContext, query);

      // Phase 6: Context Summary Generation
      const contextSummary = await this.generateContextSummary(rankedContext, query);

      // Create assembled context
      const assembledContext: AssembledContext = {
        id: assemblyId,
        query,
        nodes: rankedContext.nodes,
        relationships: rankedContext.relationships,
        summary: contextSummary,
        relevanceMap: rankedContext.relevanceMap,
        confidence: this.calculateContextConfidence(rankedContext),
        completeness: this.calculateContextCompleteness(rankedContext, query),
        freshness: new Date(),
        sources: sourceContent.map(sc => sc.source),
        assemblyMetrics: {
          totalNodes: rankedContext.nodes.length,
          totalRelationships: rankedContext.relationships.length,
          processingTime: Date.now() - startTime,
          sourceCount: new Set(rankedContext.nodes.map(n => n.content.source.id)).size,
          avgRelevanceScore: this.calculateAverageRelevance(rankedContext.nodes)
        },
        created: new Date()
      };

      // Cache the assembled context
      await this.contextCache.set(query, assembledContext);

      // Update context graph
      await this.updateContextGraph(assembledContext);

      // Complete metrics tracking
      this.assemblyMetrics.completeAssembly(assemblyId, assembledContext);

      this.logger.info('Context assembly completed', {
        assemblyId,
        nodesCount: assembledContext.nodes.length,
        relationshipsCount: assembledContext.relationships.length,
        confidence: assembledContext.confidence,
        processingTime: assembledContext.assemblyMetrics.processingTime
      });

      return assembledContext;

    } catch (error) {
      this.logger.error('Failed to assemble context', { error, query });
      throw new ContextAssemblyError('Failed to assemble context', error);
    }
  }

  async enrichContext(
    existingContext: AssembledContext,
    enrichmentQuery: ContextEnrichmentQuery
  ): Promise<AssembledContext> {
    try {
      this.logger.info('Starting context enrichment', {
        contextId: existingContext.id,
        enrichmentType: enrichmentQuery.type
      });

      // Identify enrichment opportunities
      const enrichmentOpportunities = await this.identifyEnrichmentOpportunities(
        existingContext,
        enrichmentQuery
      );

      // Gather additional context based on opportunities
      const additionalContent = await this.gatherAdditionalContext(
        enrichmentOpportunities,
        enrichmentQuery
      );

      // Process additional content
      const additionalNodes = await this.processContentToNodes(additionalContent, {
        ...existingContext.query,
        text: enrichmentQuery.query,
        intent: enrichmentQuery.intent || existingContext.query.intent
      });

      // Detect new relationships
      const newRelationships = await this.detectRelationships(
        [...existingContext.nodes, ...additionalNodes],
        existingContext.query
      );

      // Merge and synthesize contexts
      const enrichedContext = await this.mergeContexts(
        existingContext,
        {
          nodes: additionalNodes,
          relationships: newRelationships.filter(r => 
            !existingContext.relationships.some(er => er.id === r.id)
          )
        },
        enrichmentQuery
      );

      this.logger.info('Context enrichment completed', {
        contextId: existingContext.id,
        additionalNodes: additionalNodes.length,
        newRelationships: newRelationships.length,
        enrichedConfidence: enrichedContext.confidence
      });

      return enrichedContext;

    } catch (error) {
      this.logger.error('Failed to enrich context', { 
        error, 
        contextId: existingContext.id 
      });
      throw error;
    }
  }

  async updateContextFromSource(
    sourceId: string,
    updateType: ContextUpdateType
  ): Promise<ContextUpdateResult> {
    try {
      this.logger.info('Starting context update from source', {
        sourceId,
        updateType
      });

      // Get source adapter
      const source = await this.getContextSource(sourceId);
      if (!source) {
        throw new Error(`Context source not found: ${sourceId}`);
      }

      const adapter = this.sourceAdapters.get(source.type);
      if (!adapter) {
        throw new Error(`No adapter found for source type: ${source.type}`);
      }

      // Detect changes in source
      const changes = await adapter.detectChanges(source, updateType);

      if (changes.length === 0) {
        this.logger.info('No changes detected in source', { sourceId });
        return {
          sourceId,
          updateType,
          changesDetected: 0,
          nodesUpdated: 0,
          relationshipsUpdated: 0,
          processed: true
        };
      }

      // Process changes and update context graph
      const updateResults = await this.processSourceChanges(source, changes);

      // Invalidate affected cached contexts
      await this.invalidateAffectedCache(source, changes);

      // Update source metadata
      await this.updateSourceMetadata(source, updateResults);

      this.logger.info('Context update from source completed', {
        sourceId,
        changesDetected: changes.length,
        nodesUpdated: updateResults.nodesUpdated,
        relationshipsUpdated: updateResults.relationshipsUpdated
      });

      return {
        sourceId,
        updateType,
        changesDetected: changes.length,
        nodesUpdated: updateResults.nodesUpdated,
        relationshipsUpdated: updateResults.relationshipsUpdated,
        processed: true
      };

    } catch (error) {
      this.logger.error('Failed to update context from source', { error, sourceId });
      throw error;
    }
  }

  async searchContext(
    searchQuery: ContextSearchQuery
  ): Promise<ContextSearchResult> {
    try {
      // Parse and understand search query
      const parsedQuery = await this.parseSearchQuery(searchQuery);

      // Perform vector-based semantic search
      const vectorResults = await this.performVectorSearch(parsedQuery);

      // Perform graph-based traversal search
      const graphResults = await this.performGraphSearch(parsedQuery);

      // Combine and rank results
      const combinedResults = await this.combineSearchResults(
        vectorResults,
        graphResults,
        parsedQuery
      );

      // Generate search result summary
      const resultSummary = await this.generateSearchSummary(
        combinedResults,
        parsedQuery
      );

      return {
        query: searchQuery,
        results: combinedResults,
        summary: resultSummary,
        totalResults: combinedResults.length,
        searchMetrics: {
          vectorResults: vectorResults.length,
          graphResults: graphResults.length,
          combinedResults: combinedResults.length,
          searchTime: Date.now() - Date.now()
        }
      };

    } catch (error) {
      this.logger.error('Failed to search context', { error, searchQuery });
      throw error;
    }
  }

  async getContextEvolution(
    contextId: string,
    timeRange?: TimeRange
  ): Promise<ContextEvolution> {
    try {
      // Retrieve context versions
      const versions = await this.contextGraph.getContextVersions(contextId, timeRange);

      // Analyze evolution patterns
      const evolutionPattern = await this.analyzeEvolutionPattern(versions);

      // Calculate evolution metrics
      const metrics = await this.calculateEvolutionMetrics(versions);

      return {
        contextId,
        versions,
        evolutionPattern,
        metrics,
        timeRange: timeRange || {
          start: versions[0]?.created || new Date(),
          end: versions[versions.length - 1]?.created || new Date()
        }
      };

    } catch (error) {
      this.logger.error('Failed to get context evolution', { error, contextId });
      throw error;
    }
  }

  // Private implementation methods
  private async discoverAndRetrieveContent(query: ContextQuery): Promise<SourceContent[]> {
    const sourceContent: SourceContent[] = [];

    // Get relevant sources based on query
    const relevantSources = await this.identifyRelevantSources(query);

    for (const source of relevantSources) {
      try {
        const adapter = this.sourceAdapters.get(source.type);
        if (!adapter) {
          this.logger.warn('No adapter found for source type', { 
            sourceType: source.type,
            sourceId: source.id 
          });
          continue;
        }

        const content = await adapter.retrieveContent(source, query);
        sourceContent.push(...content);

      } catch (error) {
        this.logger.error('Failed to retrieve content from source', {
          error,
          sourceId: source.id,
          sourceType: source.type
        });
        // Continue with other sources
      }
    }

    return sourceContent;
  }

  private async processContentToNodes(
    sourceContent: SourceContent[],
    query: ContextQuery
  ): Promise<ContextNode[]> {
    const nodes: ContextNode[] = [];

    for (const content of sourceContent) {
      try {
        const processor = this.contentProcessors.get(content.format);
        if (!processor) {
          this.logger.warn('No processor found for content format', { 
            format: content.format 
          });
          continue;
        }

        const processedNodes = await processor.processContent(content, query);
        
        // Add vector embeddings
        for (const node of processedNodes) {
          node.vector = await this.generateEmbedding(node.content.text);
        }

        nodes.push(...processedNodes);

      } catch (error) {
        this.logger.error('Failed to process content to nodes', { error, content });
        // Continue with other content
      }
    }

    return nodes;
  }

  private async detectRelationships(
    nodes: ContextNode[],
    query: ContextQuery
  ): Promise<ContextRelationship[]> {
    return await this.relationshipDetector.detectRelationships(nodes, query);
  }

  private async synthesizeContext(
    nodes: ContextNode[],
    relationships: ContextRelationship[],
    query: ContextQuery
  ): Promise<SynthesizedContext> {
    return await this.contextSynthesizer.synthesize(nodes, relationships, query);
  }

  private async rankAndFilterContext(
    synthesizedContext: SynthesizedContext,
    query: ContextQuery
  ): Promise<RankedContext> {
    return await this.relevanceRanker.rankAndFilter(synthesizedContext, query);
  }

  private async generateContextSummary(
    rankedContext: RankedContext,
    query: ContextQuery
  ): Promise<ContextSummary> {
    // Use Context7 to research summary generation best practices
    await this.context7Client.getLibraryDocs('/openai/openai', {
      topic: 'text summarization'
    });

    // Generate comprehensive context summary
    const keyPoints = this.extractKeyPoints(rankedContext.nodes);
    const mainConcepts = this.identifyMainConcepts(rankedContext.nodes);
    const criticalRelationships = this.identifyCriticalRelationships(rankedContext.relationships);

    return {
      overview: await this.generateOverviewSummary(rankedContext, query),
      keyPoints,
      mainConcepts,
      criticalRelationships,
      insights: await this.generateContextInsights(rankedContext),
      gaps: await this.identifyContextGaps(rankedContext, query),
      recommendations: await this.generateContextRecommendations(rankedContext, query)
    };
  }

  private setupSourceAdapters(): void {
    // File system adapter
    this.sourceAdapters.set(ContextSourceType.FILE_SYSTEM, 
      new FileSystemSourceAdapter(this.config, this.logger)
    );

    // Git repository adapter
    this.sourceAdapters.set(ContextSourceType.GIT_REPOSITORY,
      new GitRepositorySourceAdapter(this.config, this.logger)
    );

    // Documentation adapter
    this.sourceAdapters.set(ContextSourceType.DOCUMENTATION,
      new DocumentationSourceAdapter(this.config, this.logger)
    );

    // Code base adapter
    this.sourceAdapters.set(ContextSourceType.CODE_BASE,
      new CodeBaseSourceAdapter(this.config, this.logger)
    );

    // Conversation adapter
    this.sourceAdapters.set(ContextSourceType.CONVERSATION,
      new ConversationSourceAdapter(this.config, this.logger)
    );

    // External API adapter
    this.sourceAdapters.set(ContextSourceType.EXTERNAL_API,
      new ExternalAPISourceAdapter(this.config, this.logger)
    );

    // Knowledge base adapter
    this.sourceAdapters.set(ContextSourceType.KNOWLEDGE_BASE,
      new KnowledgeBaseSourceAdapter(this.config, this.logger, this.context7Client)
    );
  }

  private setupContentProcessors(): void {
    // Text processor
    this.contentProcessors.set(ContentFormat.TEXT,
      new TextContentProcessor(this.config, this.logger, this.nlpEngine)
    );

    // Markdown processor
    this.contentProcessors.set(ContentFormat.MARKDOWN,
      new MarkdownContentProcessor(this.config, this.logger, this.nlpEngine)
    );

    // JSON processor
    this.contentProcessors.set(ContentFormat.JSON,
      new JSONContentProcessor(this.config, this.logger)
    );

    // Code processor
    this.contentProcessors.set(ContentFormat.CODE,
      new CodeContentProcessor(this.config, this.logger, this.nlpEngine)
    );

    // PDF processor
    this.contentProcessors.set(ContentFormat.PDF,
      new PDFContentProcessor(this.config, this.logger, this.nlpEngine)
    );

    // HTML processor
    this.contentProcessors.set(ContentFormat.HTML,
      new HTMLContentProcessor(this.config, this.logger, this.nlpEngine)
    );
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Use a high-quality embedding model for semantic similarity
    return await this.nlpEngine.generateEmbedding(text);
  }

  private calculateContextConfidence(rankedContext: RankedContext): number {
    const scores = rankedContext.nodes.map(n => n.relevanceScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const scoreVariance = this.calculateVariance(scores);
    
    // Confidence based on average relevance and consistency
    return Math.min(avgScore * (1 - scoreVariance / 100), 1.0);
  }

  private calculateContextCompleteness(
    rankedContext: RankedContext,
    query: ContextQuery
  ): number {
    // Calculate completeness based on query requirements coverage
    const requiredTypes = new Set(query.requiredTypes);
    const availableTypes = new Set(rankedContext.nodes.map(n => n.type));
    
    const typeCoverage = query.requiredTypes.length > 0 ? 
      Array.from(requiredTypes).filter(type => availableTypes.has(type)).length / requiredTypes.size :
      1.0;

    // Factor in relationship completeness
    const expectedRelationships = this.estimateExpectedRelationships(rankedContext.nodes);
    const actualRelationships = rankedContext.relationships.length;
    const relationshipCompleteness = Math.min(actualRelationships / expectedRelationships, 1.0);

    return (typeCoverage + relationshipCompleteness) / 2;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private estimateExpectedRelationships(nodes: ContextNode[]): number {
    // Heuristic: expect roughly 2-3 relationships per node on average
    return nodes.length * 2.5;
  }

  private isCacheValid(cachedContext: AssembledContext, query: ContextQuery): boolean {
    const cacheAge = Date.now() - cachedContext.created.getTime();
    const maxCacheAge = this.config.storage.cacheConfiguration.maxAge;
    
    return cacheAge < maxCacheAge && 
           this.queriesMatch(cachedContext.query, query);
  }

  private queriesMatch(query1: ContextQuery, query2: ContextQuery): boolean {
    return query1.text === query2.text &&
           query1.intent === query2.intent &&
           query1.domain === query2.domain &&
           query1.scope === query2.scope;
  }
}
```

### 2. Context Graph Management

```typescript
// src/core/orchestration/ContextGraph.ts
export class ContextGraph {
  private graph: Graph;
  private nodeIndex: Map<string, ContextNode>;
  private relationshipIndex: Map<string, ContextRelationship>;

  constructor(
    private config: GraphDatabaseConfig,
    private logger: Logger
  ) {
    this.graph = new Graph(config);
    this.nodeIndex = new Map();
    this.relationshipIndex = new Map();
  }

  async addNode(node: ContextNode): Promise<void> {
    try {
      await this.graph.addNode(node.id, {
        type: node.type,
        content: node.content,
        metadata: node.metadata,
        vector: node.vector,
        relevanceScore: node.relevanceScore,
        trustScore: node.trustScore,
        created: node.created
      });

      this.nodeIndex.set(node.id, node);

      this.logger.debug('Context node added to graph', {
        nodeId: node.id,
        type: node.type
      });

    } catch (error) {
      this.logger.error('Failed to add node to context graph', { error, nodeId: node.id });
      throw error;
    }
  }

  async addRelationship(relationship: ContextRelationship): Promise<void> {
    try {
      await this.graph.addEdge(
        relationship.sourceNodeId,
        relationship.targetNodeId,
        {
          id: relationship.id,
          type: relationship.type,
          strength: relationship.strength,
          confidence: relationship.confidence,
          properties: relationship.properties,
          created: relationship.created
        }
      );

      this.relationshipIndex.set(relationship.id, relationship);

      this.logger.debug('Context relationship added to graph', {
        relationshipId: relationship.id,
        type: relationship.type,
        sourceNodeId: relationship.sourceNodeId,
        targetNodeId: relationship.targetNodeId
      });

    } catch (error) {
      this.logger.error('Failed to add relationship to context graph', { 
        error, 
        relationshipId: relationship.id 
      });
      throw error;
    }
  }

  async findRelatedNodes(
    nodeId: string,
    relationshipTypes: RelationshipType[],
    maxDepth: number = 2
  ): Promise<ContextNode[]> {
    try {
      const relatedNodeIds = await this.graph.traverseNodes(
        nodeId,
        relationshipTypes,
        maxDepth
      );

      const relatedNodes = relatedNodeIds
        .map(id => this.nodeIndex.get(id))
        .filter(node => node !== undefined) as ContextNode[];

      return relatedNodes;

    } catch (error) {
      this.logger.error('Failed to find related nodes', { error, nodeId });
      throw error;
    }
  }

  async findShortestPath(
    sourceNodeId: string,
    targetNodeId: string,
    relationshipTypes?: RelationshipType[]
  ): Promise<ContextPath | null> {
    try {
      const path = await this.graph.findShortestPath(
        sourceNodeId,
        targetNodeId,
        relationshipTypes
      );

      if (!path) {
        return null;
      }

      const contextPath: ContextPath = {
        nodes: path.nodes.map(nodeId => this.nodeIndex.get(nodeId)!),
        relationships: path.edges.map(edgeId => this.relationshipIndex.get(edgeId)!),
        length: path.length,
        strength: this.calculatePathStrength(path),
        confidence: this.calculatePathConfidence(path)
      };

      return contextPath;

    } catch (error) {
      this.logger.error('Failed to find shortest path', { 
        error, 
        sourceNodeId, 
        targetNodeId 
      });
      throw error;
    }
  }

  async getNeighborhood(
    nodeId: string,
    radius: number = 1
  ): Promise<ContextNeighborhood> {
    try {
      const neighborhood = await this.graph.getNeighborhood(nodeId, radius);

      return {
        centerNode: this.nodeIndex.get(nodeId)!,
        nodes: neighborhood.nodes.map(id => this.nodeIndex.get(id)!),
        relationships: neighborhood.edges.map(id => this.relationshipIndex.get(id)!),
        radius,
        density: this.calculateNeighborhoodDensity(neighborhood)
      };

    } catch (error) {
      this.logger.error('Failed to get neighborhood', { error, nodeId });
      throw error;
    }
  }

  private calculatePathStrength(path: GraphPath): number {
    // Calculate average relationship strength along the path
    const relationships = path.edges.map(id => this.relationshipIndex.get(id)!);
    const totalStrength = relationships.reduce((sum, rel) => sum + rel.strength, 0);
    return totalStrength / relationships.length;
  }

  private calculatePathConfidence(path: GraphPath): number {
    // Calculate minimum confidence along the path
    const relationships = path.edges.map(id => this.relationshipIndex.get(id)!);
    return Math.min(...relationships.map(rel => rel.confidence));
  }

  private calculateNeighborhoodDensity(neighborhood: GraphNeighborhood): number {
    const nodeCount = neighborhood.nodes.length;
    const edgeCount = neighborhood.edges.length;
    const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
    
    return maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
  }
}
```

### 3. Relationship Detection System

```typescript
// src/core/orchestration/RelationshipDetector.ts
export class RelationshipDetector {
  private detectionStrategies: Map<RelationshipType, DetectionStrategy>;

  constructor(
    private config: ContextAssemblyConfig,
    private logger: Logger,
    private nlpEngine: NLPEngine
  ) {
    this.detectionStrategies = new Map();
    this.setupDetectionStrategies();
  }

  async detectRelationships(
    nodes: ContextNode[],
    query: ContextQuery
  ): Promise<ContextRelationship[]> {
    try {
      const relationships: ContextRelationship[] = [];

      // Pairwise relationship detection
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];

          const detectedRelationships = await this.detectPairwiseRelationships(
            nodeA,
            nodeB,
            query
          );

          relationships.push(...detectedRelationships);
        }
      }

      // Group-based relationship detection
      const groupRelationships = await this.detectGroupRelationships(nodes, query);
      relationships.push(...groupRelationships);

      // Filter and validate relationships
      const validatedRelationships = await this.validateRelationships(relationships);

      return validatedRelationships;

    } catch (error) {
      this.logger.error('Failed to detect relationships', { error });
      throw error;
    }
  }

  private async detectPairwiseRelationships(
    nodeA: ContextNode,
    nodeB: ContextNode,
    query: ContextQuery
  ): Promise<ContextRelationship[]> {
    const relationships: ContextRelationship[] = [];

    // Semantic similarity detection
    const semanticSimilarity = await this.calculateSemanticSimilarity(nodeA, nodeB);
    if (semanticSimilarity > this.config.processing.contextRelevanceThreshold) {
      relationships.push(this.createRelationship(
        nodeA.id,
        nodeB.id,
        RelationshipType.RELATES_TO,
        semanticSimilarity,
        semanticSimilarity
      ));
    }

    // Entity-based relationship detection
    const entityRelationships = await this.detectEntityRelationships(nodeA, nodeB);
    relationships.push(...entityRelationships);

    // Content-based relationship detection
    const contentRelationships = await this.detectContentRelationships(nodeA, nodeB);
    relationships.push(...contentRelationships);

    // Context-specific relationship detection
    const contextSpecificRelationships = await this.detectContextSpecificRelationships(
      nodeA,
      nodeB,
      query
    );
    relationships.push(...contextSpecificRelationships);

    return relationships;
  }

  private async calculateSemanticSimilarity(
    nodeA: ContextNode,
    nodeB: ContextNode
  ): Promise<number> {
    // Calculate cosine similarity between vector embeddings
    const vectorA = nodeA.vector;
    const vectorB = nodeB.vector;

    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  private async detectEntityRelationships(
    nodeA: ContextNode,
    nodeB: ContextNode
  ): Promise<ContextRelationship[]> {
    const relationships: ContextRelationship[] = [];

    // Find common entities
    const entitiesA = new Set(nodeA.content.entities.map(e => e.name.toLowerCase()));
    const entitiesB = new Set(nodeB.content.entities.map(e => e.name.toLowerCase()));
    
    const commonEntities = Array.from(entitiesA).filter(entity => entitiesB.has(entity));

    if (commonEntities.length > 0) {
      const strength = commonEntities.length / Math.max(entitiesA.size, entitiesB.size);
      const confidence = Math.min(strength * 2, 1.0);

      relationships.push(this.createRelationship(
        nodeA.id,
        nodeB.id,
        RelationshipType.RELATES_TO,
        strength,
        confidence,
        { commonEntities, entityCount: commonEntities.length }
      ));
    }

    return relationships;
  }

  private createRelationship(
    sourceNodeId: string,
    targetNodeId: string,
    type: RelationshipType,
    strength: number,
    confidence: number,
    properties: RelationshipProperties = {}
  ): ContextRelationship {
    return {
      id: generateRelationshipId(),
      type,
      sourceNodeId,
      targetNodeId,
      strength,
      confidence,
      properties,
      created: new Date(),
      lastValidated: new Date()
    };
  }

  private setupDetectionStrategies(): void {
    // Dependency detection strategy
    this.detectionStrategies.set(RelationshipType.DEPENDS_ON,
      new DependencyDetectionStrategy(this.config, this.logger, this.nlpEngine)
    );

    // Implementation detection strategy
    this.detectionStrategies.set(RelationshipType.IMPLEMENTS,
      new ImplementationDetectionStrategy(this.config, this.logger, this.nlpEngine)
    );

    // Containment detection strategy
    this.detectionStrategies.set(RelationshipType.CONTAINS,
      new ContainmentDetectionStrategy(this.config, this.logger, this.nlpEngine)
    );

    // Reference detection strategy
    this.detectionStrategies.set(RelationshipType.REFERENCES,
      new ReferenceDetectionStrategy(this.config, this.logger, this.nlpEngine)
    );
  }
}
```

## File Structure

```
src/core/orchestration/
├── index.ts                              # Main exports
├── ContextAssemblyEngine.ts              # Core context assembly engine
├── ContextGraph.ts                       # Context graph management
├── RelationshipDetector.ts               # Relationship detection system
├── ContextSynthesizer.ts                 # Context synthesis engine
├── RelevanceRanker.ts                    # Context relevance ranking
├── types/
│   ├── index.ts
│   ├── context.ts                        # Context type definitions
│   ├── assembly.ts                       # Assembly type definitions
│   ├── sources.ts                        # Source type definitions
│   ├── relationships.ts                  # Relationship type definitions
│   └── search.ts                         # Search type definitions
├── sources/
│   ├── index.ts
│   ├── SourceAdapter.ts                  # Base source adapter
│   ├── FileSystemSourceAdapter.ts        # File system source adapter
│   ├── GitRepositorySourceAdapter.ts     # Git repository source adapter
│   ├── DocumentationSourceAdapter.ts     # Documentation source adapter
│   ├── CodeBaseSourceAdapter.ts          # Code base source adapter
│   ├── ConversationSourceAdapter.ts      # Conversation source adapter
│   ├── ExternalAPISourceAdapter.ts       # External API source adapter
│   └── KnowledgeBaseSourceAdapter.ts     # Knowledge base source adapter
├── processing/
│   ├── index.ts
│   ├── ContentProcessor.ts               # Base content processor
│   ├── TextContentProcessor.ts           # Text content processor
│   ├── MarkdownContentProcessor.ts       # Markdown content processor
│   ├── JSONContentProcessor.ts           # JSON content processor
│   ├── CodeContentProcessor.ts           # Code content processor
│   ├── PDFContentProcessor.ts            # PDF content processor
│   └── HTMLContentProcessor.ts           # HTML content processor
├── detection/
│   ├── index.ts
│   ├── DetectionStrategy.ts              # Base detection strategy
│   ├── DependencyDetectionStrategy.ts    # Dependency detection
│   ├── ImplementationDetectionStrategy.ts # Implementation detection
│   ├── ContainmentDetectionStrategy.ts   # Containment detection
│   ├── ReferenceDetectionStrategy.ts     # Reference detection
│   └── SemanticDetectionStrategy.ts      # Semantic detection
├── storage/
│   ├── index.ts
│   ├── VectorStore.ts                    # Vector database interface
│   ├── GraphDatabase.ts                  # Graph database interface
│   ├── ContextCache.ts                   # Context caching system
│   └── IndexManager.ts                   # Index management
├── search/
│   ├── index.ts
│   ├── SemanticSearch.ts                 # Semantic search implementation
│   ├── GraphSearch.ts                    # Graph search implementation
│   ├── HybridSearch.ts                   # Hybrid search implementation
│   └── SearchResultRanker.ts             # Search result ranking
├── synthesis/
│   ├── index.ts
│   ├── ContextSynthesizer.ts             # Context synthesis engine
│   ├── SummaryGenerator.ts               # Context summary generation
│   ├── InsightExtractor.ts               # Insight extraction
│   └── GapAnalyzer.ts                    # Context gap analysis
├── metrics/
│   ├── index.ts
│   ├── AssemblyMetricsTracker.ts         # Assembly metrics tracking
│   ├── PerformanceMonitor.ts             # Performance monitoring
│   └── QualityMetrics.ts                 # Quality metrics calculation
├── utils/
│   ├── index.ts
│   ├── ContextUtils.ts                   # Context utilities
│   ├── GraphUtils.ts                     # Graph utilities
│   ├── VectorUtils.ts                    # Vector utilities
│   └── ValidationUtils.ts                # Validation utilities
└── __tests__/
    ├── unit/
    │   ├── ContextAssemblyEngine.test.ts
    │   ├── ContextGraph.test.ts
    │   ├── RelationshipDetector.test.ts
    │   └── ContextSynthesizer.test.ts
    ├── integration/
    │   ├── context-assembly-integration.test.ts
    │   ├── source-adapter-integration.test.ts
    │   └── search-integration.test.ts
    ├── performance/
    │   ├── large-context-assembly.test.ts
    │   ├── search-performance.test.ts
    │   └── scalability.test.ts
    └── fixtures/
        ├── test-contexts.json
        ├── test-sources.json
        ├── test-content.json
        └── test-relationships.json
```

## Success Criteria

### Functional Requirements
1. **Dynamic Context Assembly**: Intelligently gather and assemble context from diverse sources
2. **Intelligent Synthesis**: Synthesize multi-modal context with semantic understanding
3. **Relationship Detection**: Automatically detect and maintain contextual relationships
4. **Context Evolution**: Track and manage context changes over time
5. **Semantic Search**: Provide powerful semantic search across assembled context
6. **Real-time Updates**: Support real-time context updates from dynamic sources
7. **Scalability**: Handle complex context graphs with millions of nodes

### Technical Requirements
1. **Performance**: Sub-50ms context retrieval with intelligent caching
2. **Accuracy**: 95%+ accuracy in relationship detection and context synthesis
3. **Reliability**: 99.9% availability with robust error handling
4. **Scalability**: Linear scaling with context complexity
5. **Testing**: 95%+ code coverage with comprehensive test scenarios
6. **Documentation**: Complete API documentation and integration guides
7. **Monitoring**: Real-time monitoring of context assembly performance

### Quality Standards
1. **Relevance**: High precision in context relevance ranking
2. **Completeness**: Comprehensive context coverage for queries
3. **Consistency**: Consistent context quality across different domains
4. **Maintainability**: Clean, extensible architecture for context sources
5. **Usability**: Intuitive APIs for context assembly and retrieval

## Output Format

### Implementation Deliverables
1. **Core Engine**: Complete context assembly engine with all capabilities
2. **Source Adapters**: Comprehensive source adapters for major content types
3. **Processing Pipeline**: Content processing and relationship detection systems
4. **Storage Systems**: Vector and graph database integration
5. **Search Engine**: Semantic and hybrid search capabilities
6. **Unit Tests**: Comprehensive test suite with 95%+ coverage
7. **Integration Tests**: End-to-end context assembly testing

### Documentation Requirements
1. **Architecture Documentation**: System design and component interactions
2. **API Reference**: Complete context assembly engine API documentation
3. **Source Adapter Guide**: Creating custom source adapters
4. **Processing Guide**: Content processing and relationship detection
5. **Performance Guide**: Context assembly optimization and scaling

### Testing Requirements
1. **Unit Tests**: Test individual components and algorithms
2. **Integration Tests**: Test context assembly workflows
3. **Performance Tests**: Measure context assembly speed and accuracy
4. **Scalability Tests**: Verify behavior with large context graphs
5. **Source Tests**: Test various content sources and formats
6. **Search Tests**: Validate search accuracy and performance

Remember to leverage Context7 throughout the implementation to ensure you're using the most current context management best practices and optimal algorithms for enterprise context assembly systems.