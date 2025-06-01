# Context7 Integration for MCP Servers

## Overview

Context7 is a specialized library and server system designed to provide large language models (LLMs) and AI coding assistants with up-to-date, version-specific documentation and code examples directly from authoritative sources. It integrates seamlessly with the Model Context Protocol (MCP) to eliminate issues with outdated documentation, hallucinated APIs, and version mismatches in AI-generated code.

## Purpose and Use Cases

### Primary Goals
- **Up-to-date Context**: Ensures AI tools work with current, accurate, version-specific library documentation
- **Reduces LLM Hallucination**: Minimizes risk of hallucinated or deprecated APIs in generated code
- **Improves Productivity**: Integrates directly into editors and code assistants (Cursor, VS Code)
- **Dynamic Documentation**: Real-time fetching of docs to keep pace with fast-evolving libraries

### Common Use Cases
- Code generation with accurate API usage
- Debugging with current documentation
- Code review with version-specific best practices
- Learning new libraries with up-to-date examples

## Key Features

### On-demand Documentation Access
- Fetches code examples and API docs as needed
- No manual browsing required
- Contextual retrieval based on current task

### Version Awareness
- Supplies documentation for specific library versions
- Matches project dependencies automatically
- Prevents version mismatch issues

### Simple Integration
- Activated using the phrase `use context7` in prompts
- No manual tool invocation required for most users
- Seamless integration with existing workflows

### MCP Server Support
- Built specifically for Model Context Protocol interface
- Compatible with coding AI and editors
- Standardized tool interface

### Wide Editor Support
Available in:
- Cursor
- VS Code
- Raycast
- Claude Desktop
- Amazon Bedrock
- Other MCP-compatible clients

## API and Tooling

Context7 exposes two main MCP tools that are typically invoked automatically:

### resolve-library-id

**Purpose**: Resolves a general library/package name to a Context7-compatible internal ID

**Parameters**:
- `libraryName` (string, required): Library name to search for (e.g., "nextjs", "react", "requests")

**Example**:
```json
{
  "tool": "resolve-library-id",
  "arguments": {
    "libraryName": "nextjs"
  }
}
```

### get-library-docs

**Purpose**: Fetches documentation/examples for the resolved library

**Parameters**:
- `context7CompatibleLibraryID` (string, required): ID from `resolve-library-id`
- `topic` (string, optional): Specific topic to focus on (e.g., 'hooks', 'routing')
- `tokens` (integer, optional, default 5000): Maximum tokens of documentation to retrieve

**Example**:
```json
{
  "tool": "get-library-docs",
  "arguments": {
    "context7CompatibleLibraryID": "/vercel/next.js/v14.3.0",
    "topic": "authentication",
    "tokens": 10000
  }
}
```

## Typical Workflow

1. **Prompt Formulation**
   - User writes prompt about library or programming task
   - Appends `use context7` to activate Context7

2. **Library ID Resolution**
   - `resolve-library-id` converts mentioned library to canonical ID
   - Handles variations in naming and finds exact matches

3. **Documentation Retrieval**
   - `get-library-docs` fetches relevant, version-specific documentation
   - Can be narrowed to specific topics and token limits

4. **LLM Response**
   - Client combines fetched documentation with original prompt
   - Sends enriched context to LLM for accurate, up-to-date response

## Implementation Examples

### Basic Usage in Code Editor

**User Input**:
```
How do I add authentication in Next.js 14? use context7
```

**Behind the Scenes**:
1. Client recognizes `use context7` trigger
2. Resolves "nextjs" to internal ID `/vercel/next.js/v14.3.0`
3. Fetches authentication documentation for Next.js 14
4. Documentation automatically added to LLM context
5. Response includes accurate, version-specific authentication code

### Advanced Usage with Topic Focus

**User Input**:
```
Create a script to upload a file to S3 using boto3. use context7
```

**Process**:
1. Resolves "boto3" to Context7 library ID
2. Fetches S3-specific documentation and examples
3. Returns current boto3 S3 upload patterns and best practices

### MCP Server Implementation Pattern

```python
def handle_mcp_prompt(prompt):
    if "use context7" in prompt:
        # Extract library name from prompt
        library_name = extract_library_from_prompt(prompt)
        
        # Resolve to Context7 ID
        library_id = context7.resolve_library_id(library_name)
        
        # Get relevant documentation
        topic = extract_topic_from_prompt(prompt)
        docs = context7.get_library_docs(
            library_id, 
            topic=topic,
            tokens=10000
        )
        
        # Combine original prompt with documentation
        return combine_prompt_and_docs(prompt, docs)
    else:
        return prompt
```

## Installation & Integration

### Client Setup
1. Install Context7 MCP plugin/extension for your tool
2. Configure MCP server connection
3. Ensure API access is properly configured

### Configuration Example (Claude Desktop)
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Usage
Simply include `use context7` in any prompt to activate documentation retrieval:
```
How do I configure routing in React Router v6? use context7
```

## Best Practices

### Prompt Design
- Be specific about library versions when known
- Include relevant context about your project setup
- Use clear, focused questions for better documentation matching

### Error Handling
- Handle cases where libraries aren't found in Context7
- Provide fallback behavior for unsupported libraries
- Log usage for monitoring and improvement

### Performance Optimization
- Cache frequently accessed documentation
- Use appropriate token limits to balance context and performance
- Consider topic specificity to reduce irrelevant content

### Security Considerations
- Secure API key management
- Monitor usage to prevent abuse
- Validate library IDs to prevent injection attacks

## Integration Benefits

### For Developers
- Always current documentation
- Reduced context switching
- Version-specific accuracy
- Faster development cycles

### For AI Assistants
- Reduced hallucination
- Improved code quality
- Better error handling
- More accurate suggestions

### For Organizations
- Consistent coding practices
- Reduced debugging time
- Better onboarding experience
- Standardized documentation access

## Summary

Context7 represents a significant advancement in AI-assisted development by ensuring that LLM-based code suggestions are grounded in current, authoritative documentation. Its seamless MCP integration makes it an essential tool for modern development workflows where accuracy and up-to-date information are critical.