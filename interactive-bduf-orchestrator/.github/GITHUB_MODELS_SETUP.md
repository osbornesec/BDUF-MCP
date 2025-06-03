# GitHub Models Setup and Usage Guide

## 🚀 Quick Setup

### 1. Enable GitHub Models

**Repository Level:**
1. Go to your repository Settings
2. Navigate to "Models" in the left sidebar
3. Click "Enable GitHub Models"
4. Select allowed models for your repository

**Organization Level (if applicable):**
1. Go to Organization Settings
2. Navigate to "Models" section
3. Enable GitHub Models for the organization
4. Configure allowed models and permissions

### 2. Install CLI Extension

```bash
# Install the GitHub CLI Models extension
gh extension install github/gh-models

# Verify installation
gh models --help
```

### 3. Configure Copilot Multi-Model (Optional)

If you have GitHub Copilot:
1. Ensure you have Copilot Pro or Business
2. Enable Copilot Extensions in your organization
3. Install the GitHub Models Copilot extension
4. Access via `@models` in Copilot Chat

## 🎯 Usage Examples

### BDUF Analysis Workflows

#### Requirements Analysis
```bash
# Analyze project requirements
cat project-requirements.md | gh models run --file .github/prompts/bduf-analysis/requirements-analysis.prompt.yml --variable project_description=-

# Interactive analysis
gh models run anthropic/claude-3-sonnet "Analyze these requirements for completeness and identify gaps: $(cat requirements.txt)"
```

#### Architecture Generation
```bash
# Generate architecture options
gh models run --file .github/prompts/bduf-analysis/architecture-generation.prompt.yml \
  --variable requirements="$(cat analyzed-requirements.md)" \
  --variable constraints="Enterprise scale, multi-tenant, real-time collaboration"
```

#### Risk Assessment
```bash
# Comprehensive risk analysis
gh models run --file .github/prompts/bduf-analysis/risk-assessment.prompt.yml \
  --variable project_scope="$(cat project-scope.md)" \
  --variable timeline="16-week development cycle"
```

### Development Workflow Integration

#### Code Review via CLI
```bash
# Security review of current changes
git diff | gh models run --file .github/prompts/code-review/security-review.prompt.yml --variable code_diff=-

# Architecture compliance check
git diff HEAD~1 HEAD | gh models run --file .github/prompts/code-review/architecture-compliance.prompt.yml --variable code_diff=-
```

#### Documentation Generation
```bash
# Update API documentation
find src -name "*.ts" -path "*/routes/*" -exec cat {} \; | \
gh models run --file .github/prompts/documentation/api-doc-generation.prompt.yml --variable typescript_code=-
```

#### Interactive Model Comparison
```bash
# Compare responses from different models
echo "Explain the MCP (Model Context Protocol) architecture" | gh models run openai/gpt-4
echo "Explain the MCP (Model Context Protocol) architecture" | gh models run anthropic/claude-3-sonnet

# Save responses for comparison
gh models run openai/gpt-4 "Analyze this code for performance issues" < complex-function.ts > gpt4-analysis.md
gh models run anthropic/claude-3-sonnet "Analyze this code for performance issues" < complex-function.ts > claude-analysis.md
```

### Advanced Workflows

#### Batch Processing
```bash
# Process multiple files
for file in src/tools/*.ts; do
  echo "Processing $file..."
  gh models run --file .github/prompts/code-review/security-review.prompt.yml \
    --variable code_diff="$(cat $file)" > "reviews/$(basename $file .ts)-review.md"
done
```

#### Integration with Other Tools
```bash
# Combine with git hooks
#!/bin/bash
# pre-commit hook
git diff --cached | gh models run --file .github/prompts/code-review/security-review.prompt.yml --variable code_diff=- > .git/ai-review.md
if grep -q "Critical\|High" .git/ai-review.md; then
  echo "AI detected security issues. Review .git/ai-review.md"
  exit 1
fi
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Set GitHub token with models permissions
export GITHUB_TOKEN="your-token-with-models-read-permission"

# Optional: Configure default model
export GITHUB_MODELS_DEFAULT="anthropic/claude-3-sonnet"
```

### Prompt Customization
```bash
# Create custom prompt for your specific use case
cat > .github/prompts/custom/my-analysis.prompt.yml << 'EOF'
name: "Custom Analysis"
model: "anthropic/claude-3-sonnet"
system: |
  You are a specialist in [your domain].
  Analyze the provided input and generate [specific output].
variables:
  - name: "input_data"
    type: "string"
temperature: 0.3
max_tokens: 2000
EOF

# Use your custom prompt
gh models run --file .github/prompts/custom/my-analysis.prompt.yml --variable input_data="your data"
```

## 📊 Monitoring and Optimization

### Usage Tracking
```bash
# Check your usage and limits
gh api /user/models/usage

# Monitor costs and rate limits in GitHub settings
```

### Performance Optimization
```bash
# Test prompt performance
time gh models run openai/gpt-4 "Your prompt here"

# Compare model costs and speed
for model in "openai/gpt-4" "anthropic/claude-3-sonnet" "openai/gpt-3.5-turbo"; do
  echo "Testing $model..."
  time gh models run $model "Explain TypeScript generics" > /dev/null
done
```

### Evaluation Workflows
```bash
# Create evaluation dataset
cat > eval-dataset.json << 'EOF'
[
  {
    "input": "Analyze this function for security issues",
    "expected_output": "Should identify SQL injection vulnerability",
    "test_code": "function query(userInput) { return db.query('SELECT * FROM users WHERE id = ' + userInput); }"
  }
]
EOF

# Run evaluation (manual for now, GitHub Models evaluation API coming)
```

## 🛡️ Security Best Practices

### Data Handling
- **Never include** sensitive data (API keys, passwords, personal information) in prompts
- **Review outputs** before committing, especially for security-related analysis
- **Use GitHub's secure routing** - data stays within GitHub/Azure environment
- **Enable audit logging** for all model usage

### Access Control
```bash
# Verify permissions
gh api /repos/OWNER/REPO/permissions --jq '.models'

# Check organization policies
gh api /orgs/ORG/models/settings
```

### Prompt Security
- **Validate inputs** before passing to models
- **Sanitize outputs** before using in automated processes
- **Version control** all prompts for audit trails
- **Review prompt changes** via pull requests

## 🚨 Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Error: GitHub Models not enabled
# Solution: Enable in repository/organization settings

# Error: Insufficient permissions
# Solution: Ensure GITHUB_TOKEN has 'models: read' permission
```

#### Rate Limiting
```bash
# Error: Rate limit exceeded
# Solution: Wait for rate limit reset or upgrade to Azure OpenAI

# Check current limits
gh api /rate_limit --jq '.resources.models'
```

#### Model Availability
```bash
# List available models
gh models list

# Check model status
gh api /models/anthropic/claude-3-sonnet/status
```

### Debugging Workflows
```bash
# Enable debug mode
export GITHUB_ACTIONS_STEP_DEBUG=true

# Test prompt files locally
gh models run --file .github/prompts/test.prompt.yml --variable test_var="debug"

# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('.github/prompts/test.prompt.yml'))"
```

## 📚 Additional Resources

- [GitHub Models Documentation](https://docs.github.com/en/models)
- [GitHub Models CLI Extension](https://github.com/github/gh-models)
- [Model Selection Guide](https://docs.github.com/en/models/choosing-models)
- [Prompt Engineering Best Practices](https://docs.github.com/en/models/optimizing-prompts)

## 🤝 Team Collaboration

### Sharing Prompts
- Store all prompts in `.github/prompts/` directory
- Use descriptive names and comprehensive documentation
- Include examples and expected outputs
- Review prompt changes via pull requests

### Model Selection Guidelines
- Use **Claude Sonnet** for detailed analysis and large context
- Use **GPT-4** for precise code generation and structured output  
- Use **GPT-3.5 Turbo** for cost-effective simple tasks
- Test multiple models for critical workflows

### Feedback and Improvement
- Collect feedback on AI-generated outputs
- Track which models perform best for specific tasks
- Iterate on prompts based on results
- Share successful patterns with the team

---

*This setup enables our Interactive BDUF Orchestrator project to leverage cutting-edge AI development tools while building an AI-powered platform ourselves - a perfect synergy for accelerated development and improved code quality.*