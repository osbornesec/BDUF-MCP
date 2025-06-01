# Perplexity AI Integration with MCP Servers

## Overview

Integrating Perplexity AI into Model Context Protocol (MCP) servers enables powerful web search and research capabilities within AI-powered applications. This integration provides AI assistants with access to up-to-date information from the web, enhancing context-aware reasoning and enabling real-time research capabilities.

## Implementation Patterns

### Available MCP Servers
- **perplexity-ask**: Open-source MCP server connector from ppl-ai
- **perplexity-mcp**: Alternative implementation by jsonallen
- Both serve as middleware between MCP clients and Perplexity API

### Architecture Pattern
```
MCP Client → MCP Server → Perplexity API → Web Search Results → Structured Response
```

### Deployment Options
1. **Standalone Process**: Run as Node.js application or Docker container
2. **Client Integration**: Register in client configuration (e.g., `claude_desktop_config.json`)
3. **Environment Configuration**: Pass API keys and settings via environment variables

## API Usage

### Primary Function: perplexity_search_web

**Purpose**: Enable web searching through Perplexity AI with time-filtered results

**Required Parameters**:
- `query` (string): Search terms or research question

**Optional Parameters**:
- `recency` (string): Time filtering for search results
  - Accepted values: `day`, `week`, `month`, `year`
  - Default: `month`

**Example Request**:
```json
{
  "tool": "perplexity_search_web",
  "arguments": {
    "query": "Latest developments in AI regulation",
    "recency": "week"
  }
}
```

**Response Format**:
- Structured list of search results
- Source citations with URLs
- Summarized content relevant to query
- Metadata about search recency and relevance

### Advanced Usage Patterns

#### Research with Source Citations
```json
{
  "tool": "perplexity_search_web",
  "arguments": {
    "query": "Best practices for microservices architecture 2024",
    "recency": "month"
  }
}
```

#### Time-Sensitive Queries
```json
{
  "tool": "perplexity_search_web",
  "arguments": {
    "query": "Current stock market trends",
    "recency": "day"
  }
}
```

## Authentication

### API Key Requirements
- Valid Perplexity API key (Sonar API key)
- Obtained through Perplexity/Sonar developer dashboard
- Required for all API calls

### Security Best Practices
1. **Environment Variables**: Store API keys as environment variables
2. **No Hardcoding**: Never hardcode keys in configuration files
3. **Secure Storage**: Use secure secret management systems
4. **Key Rotation**: Implement regular API key rotation
5. **Access Control**: Limit key access to necessary services only

### Configuration Examples

#### Environment Variable Setup
```bash
export PERPLEXITY_API_KEY="your_sonar_api_key_here"
```

#### Docker Configuration
```dockerfile
ENV PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}
```

## Implementation Examples

### Basic MCP Server Setup

#### 1. Clone and Install
```bash
git clone git@github.com:ppl-ai/modelcontextprotocol.git
cd modelcontextprotocol/perplexity-ask
npm install
```

#### 2. Configure Environment
```bash
export PERPLEXITY_API_KEY="your_api_key_here"
```

#### 3. Client Configuration (Claude Desktop)
```json
{
  "mcpServers": {
    "perplexity-ask": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", 
        "-e", "PERPLEXITY_API_KEY", 
        "mcp/perplexity-ask"
      ],
      "env": {
        "PERPLEXITY_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### Custom MCP Server Implementation

```javascript
// Basic MCP server with Perplexity integration
const { MCPServer } = require('@modelcontextprotocol/sdk');
const axios = require('axios');

class PerplexityMCPServer extends MCPServer {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.baseURL = 'https://api.perplexity.ai';
  }

  async initialize() {
    // Register available tools
    this.registerTool('perplexity_search_web', {
      description: 'Search the web using Perplexity AI',
      parameters: {
        query: { type: 'string', required: true },
        recency: { 
          type: 'string', 
          enum: ['day', 'week', 'month', 'year'],
          default: 'month'
        }
      }
    });
  }

  async handleToolCall(toolName, parameters) {
    if (toolName === 'perplexity_search_web') {
      return await this.searchWeb(parameters.query, parameters.recency);
    }
    throw new Error(`Unknown tool: ${toolName}`);
  }

  async searchWeb(query, recency = 'month') {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: `Search for: ${query}. Focus on results from the last ${recency}.`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        results: response.data.choices[0].message.content,
        sources: response.data.citations || [],
        recency: recency,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Perplexity API error: ${error.message}`);
    }
  }
}
```

## Best Practices for Building MCP Servers with Perplexity

### 1. MCP Compliance
- Implement endpoints according to MCP specification
- Use standardized payload structures
- Support proper capability negotiation
- Handle version compatibility

### 2. Parameter Validation
```javascript
function validateSearchParameters(query, recency) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query parameter is required and must be a string');
  }
  
  const validRecency = ['day', 'week', 'month', 'year'];
  if (recency && !validRecency.includes(recency)) {
    throw new Error(`Invalid recency. Must be one of: ${validRecency.join(', ')}`);
  }
  
  return { query: query.trim(), recency: recency || 'month' };
}
```

### 3. Error Handling
```javascript
async function handlePerplexityRequest(query, recency) {
  try {
    const { query: validQuery, recency: validRecency } = validateSearchParameters(query, recency);
    
    const result = await perplexityAPI.search(validQuery, validRecency);
    return { success: true, data: result };
    
  } catch (error) {
    if (error.response?.status === 401) {
      return { success: false, error: 'Invalid API key' };
    } else if (error.response?.status === 429) {
      return { success: false, error: 'Rate limit exceeded' };
    } else {
      return { success: false, error: 'Search service unavailable' };
    }
  }
}
```

### 4. Security Considerations
- **API Key Protection**: Never log or expose API keys
- **Input Sanitization**: Validate and sanitize search queries
- **Rate Limiting**: Implement client-side rate limiting
- **Audit Logging**: Log usage without exposing sensitive data

### 5. Performance Optimization
- **Response Caching**: Cache frequently requested searches
- **Connection Pooling**: Reuse HTTP connections to Perplexity API
- **Timeout Management**: Set appropriate timeouts for API calls
- **Result Pagination**: Handle large result sets efficiently

### 6. Monitoring and Observability
```javascript
const metrics = {
  searchRequests: 0,
  successfulSearches: 0,
  failedSearches: 0,
  averageResponseTime: 0
};

function logSearchMetrics(query, duration, success) {
  metrics.searchRequests++;
  if (success) {
    metrics.successfulSearches++;
  } else {
    metrics.failedSearches++;
  }
  
  // Update average response time
  metrics.averageResponseTime = 
    (metrics.averageResponseTime * (metrics.searchRequests - 1) + duration) / 
    metrics.searchRequests;
  
  console.log(`Search completed: query="${query.substring(0, 50)}", duration=${duration}ms, success=${success}`);
}
```

### 7. Documentation and Testing
- **API Documentation**: Document all endpoints and parameters
- **Usage Examples**: Provide clear usage examples
- **Integration Tests**: Test with real Perplexity API calls
- **Error Scenario Testing**: Test various error conditions

## Integration Benefits

### For AI Applications
- **Real-time Information**: Access to current web content
- **Source Attribution**: Credible sources with citations
- **Time-filtered Results**: Relevant temporal context
- **Research Capabilities**: Deep research functionality

### For Users
- **Current Information**: Up-to-date answers to queries
- **Comprehensive Results**: Multiple perspectives and sources
- **Time Awareness**: Recent vs. historical information
- **Reliable Sources**: Authoritative content prioritization

### For Developers
- **Easy Integration**: Standard MCP interface
- **Flexible Configuration**: Customizable search parameters
- **Robust Error Handling**: Graceful failure management
- **Scalable Architecture**: Support for high-volume usage

## Summary

| Aspect | Details |
|--------|---------|
| **Implementation** | Use open-source MCP server connectors, configure via environment/client configs |
| **API Usage** | `perplexity_search_web` tool with `query` (required) and `recency` (optional) |
| **Authentication** | Sonar/Perplexity API key via environment variables |
| **Best Practices** | MCP compliance, secure key management, parameter validation, error handling |
| **Benefits** | Real-time web search, source citations, time-filtered results, research capabilities |

By following these patterns and practices, MCP servers leveraging Perplexity's research capabilities can offer up-to-date, contextually relevant information efficiently and securely within the broader MCP ecosystem.