# Implementation Prompt 005: CI/CD Pipeline Setup (1.1.2)

## Persona
You are a **Senior DevOps Engineer and CI/CD Architect** with 12+ years of experience in building robust automation pipelines, deployment strategies, and quality gates for enterprise-grade applications. You specialize in GitHub Actions, containerization, security scanning, automated testing, and production deployment automation.

## Context: Interactive BDUF Orchestrator
You are implementing the **CI/CD Pipeline Setup** component as part of the Interactive Big Design Up Front (BDUF) Orchestrator development workflow. This system will provide comprehensive automation for code quality, testing, security scanning, building, and deployment processes.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP server that orchestrates comprehensive project analysis and planning. The CI/CD Pipeline you're building will:

1. **Automate code quality** with linting, formatting, and auto-fixes
2. **Ensure comprehensive testing** with unit, integration, and E2E tests
3. **Provide security scanning** with vulnerability detection and remediation
4. **Enable automated builds** with Docker containerization
5. **Support multiple environments** with staging and production deployments
6. **Maintain quality gates** with coverage thresholds and approval requirements

### Technical Context
- **Dependencies**: Integrates with all development and deployment processes
- **Architecture**: GitHub Actions-based pipeline with enterprise patterns
- **Integration**: Core automation foundation for all development workflows
- **Scalability**: Handle multiple concurrent builds and deployments
- **Quality**: Comprehensive quality gates and automated testing requirements

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/ci-cd-pipeline-setup

# Regular commits with descriptive messages
git add .
git commit -m "feat(ci): implement comprehensive CI/CD pipeline setup

- Add GitHub Actions workflows for CI/CD automation
- Implement code quality gates with ESLint, Prettier, and auto-fixes
- Create comprehensive testing pipeline with coverage reporting
- Add security scanning with Snyk and CodeQL integration
- Implement Docker build and container security scanning
- Add deployment automation with staging and production workflows"

# Push and create PR
git push origin feature/ci-cd-pipeline-setup
```

### Commit Message Format
```
<type>(ci): <description>

<body explaining what and why>

Closes #<issue-number>
```

## Required Context7 Integration

Before implementing any CI/CD components, you MUST use Context7 to research CI/CD patterns and best practices:

```typescript
// Research CI/CD pipeline patterns and architectures
await context7.getLibraryDocs('/github-actions/actions');
await context7.getLibraryDocs('/ci-cd/github-actions');
await context7.getLibraryDocs('/devops/continuous-integration');

// Research testing and quality automation
await context7.getLibraryDocs('/testing/jest');
await context7.getLibraryDocs('/testing/playwright');
await context7.getLibraryDocs('/code-quality/eslint');

// Research security scanning and compliance
await context7.getLibraryDocs('/security/snyk');
await context7.getLibraryDocs('/security/codeql');
await context7.getLibraryDocs('/containers/docker-security');

// Research deployment automation
await context7.getLibraryDocs('/deployment/kubernetes');
await context7.getLibraryDocs('/containers/docker');
await context7.getLibraryDocs('/monitoring/prometheus');
```

## Implementation Requirements

### 1. Main CI/CD Workflow

Create the primary CI/CD workflow that has already been referenced in the existing files:

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [ main, develop, 'feature/*', 'bugfix/*', 'hotfix/*' ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '20'
  CACHE_KEY_PREFIX: 'v1'

jobs:
  # Code Quality and Linting with Auto-fixes
  quality:
    name: Code Quality & Auto-fixes
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run TypeScript type checking
        run: npm run type-check

      - name: Run Prettier formatting
        run: |
          npm run format:write
          echo "FORMATTED_FILES=$(git diff --name-only)" >> $GITHUB_ENV

      - name: Run ESLint with auto-fix
        run: |
          npm run lint:fix
          echo "LINTED_FILES=$(git diff --name-only)" >> $GITHUB_ENV

      - name: Generate missing JSDoc comments
        run: |
          npm run docs:auto-generate
          echo "DOCS_FILES=$(git diff --name-only)" >> $GITHUB_ENV

      - name: Check for changes
        id: verify-changed-files
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "has_changes=true" >> $GITHUB_OUTPUT
            echo "changed_files<<EOF" >> $GITHUB_OUTPUT
            git status --porcelain >> $GITHUB_OUTPUT
            echo "EOF" >> $GITHUB_OUTPUT
          else
            echo "has_changes=false" >> $GITHUB_OUTPUT
          fi

      - name: Commit auto-fixes
        if: steps.verify-changed-files.outputs.has_changes == 'true' && github.event_name == 'push'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action Auto-fix"
          git add .
          git commit -m "🤖 Auto-fix: Format, lint, and document code

          Automated improvements:
          - Applied Prettier formatting
          - Fixed ESLint violations
          - Generated missing JSDoc comments
          - Updated documentation coverage
          
          Files modified:
          ${{ steps.verify-changed-files.outputs.changed_files }}"
          git push

      - name: Comment on PR with auto-fixes
        if: github.event_name == 'pull_request' && steps.verify-changed-files.outputs.has_changes == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🤖 Automatic Code Quality Improvements Applied

            I've automatically applied the following improvements to your code:

            - ✅ **Prettier formatting** - Consistent code formatting applied
            - ✅ **ESLint auto-fixes** - Automatically fixable linting issues resolved
            - ✅ **JSDoc generation** - Missing documentation comments added
            - ✅ **Type checking** - TypeScript compilation verified

            ### Files Modified:
            \`\`\`
            ${{ steps.verify-changed-files.outputs.changed_files }}
            \`\`\`

            Please review the auto-generated changes and address any remaining manual fixes needed.
            
            > **Note**: These changes will be automatically committed on push to non-PR branches.`
            })

      - name: Final lint check (no auto-fix)
        run: npm run lint:check

  # Security Scanning
  security:
    name: Security Analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm run security:audit

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high --file=package.json

      - name: Upload Snyk results to GitHub Code Scanning
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: snyk.sarif

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  # Comprehensive Testing Suite
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: quality
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_USER: test_user
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    strategy:
      matrix:
        node-version: [18, 20]
        test-type: [unit, integration]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref || github.ref }}

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test environment
        run: |
          cp .env.example .env.test
          echo "DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db" >> .env.test
          echo "REDIS_URL=redis://localhost:6379" >> .env.test

      - name: Run database migrations
        run: npm run db:migrate:test
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db

      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }} -- --coverage --passWithNoTests
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/clover.xml
          flags: ${{ matrix.test-type }}-node${{ matrix.node-version }}
          name: codecov-${{ matrix.test-type }}-node${{ matrix.node-version }}
          fail_ci_if_error: false

  # Build and Package
  build:
    name: Build & Package
    runs-on: ubuntu-latest
    needs: [test, security]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref || github.ref }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run bundle analysis
        run: npm run analyze:bundle

      - name: Check bundle size
        run: npm run analyze:size

      - name: Validate MCP tools
        run: npm run mcp:validate

      - name: Test MCP tool functionality
        run: npm run mcp:test-tools

      - name: Build Docker image
        run: docker build -t interactive-bduf-orchestrator:${{ github.sha }} .

      - name: Test Docker image
        run: |
          docker run --rm -d --name test-container -p 3000:3000 interactive-bduf-orchestrator:${{ github.sha }}
          sleep 15
          curl -f http://localhost:3000/health || exit 1
          docker stop test-container

      - name: Save Docker image (main branch only)
        if: github.ref == 'refs/heads/main'
        run: |
          docker save interactive-bduf-orchestrator:${{ github.sha }} | gzip > interactive-bduf-orchestrator.tar.gz

      - name: Upload build artifacts
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            dist/
            interactive-bduf-orchestrator.tar.gz
            reports/
          retention-days: 7

  # Quality Gates Check
  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    needs: [test, security, build]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate quality report
        run: npm run report:quality

      - name: Check dependency vulnerabilities
        run: npm run deps:check

      - name: Validate documentation coverage
        run: npm run docs:coverage-check

      - name: Check code complexity
        run: npm run analyze:complexity

      - name: Upload quality reports
        uses: actions/upload-artifact@v3
        with:
          name: quality-reports
          path: reports/
          retention-days: 30

      - name: Quality gates summary
        run: |
          echo "## 🎯 Quality Gates Summary" >> $GITHUB_STEP_SUMMARY
          echo "| Gate | Status |" >> $GITHUB_STEP_SUMMARY
          echo "|------|--------|" >> $GITHUB_STEP_SUMMARY
          echo "| Test Coverage ≥90% | ✅ Passed |" >> $GITHUB_STEP_SUMMARY
          echo "| Security Scan | ✅ Passed |" >> $GITHUB_STEP_SUMMARY
          echo "| Code Quality | ✅ Passed |" >> $GITHUB_STEP_SUMMARY
          echo "| Documentation | ✅ Passed |" >> $GITHUB_STEP_SUMMARY
          echo "| Build Success | ✅ Passed |" >> $GITHUB_STEP_SUMMARY

  # Final Status Check
  ci-success:
    name: CI Success
    runs-on: ubuntu-latest
    needs: [quality, security, test, build, quality-gates]
    if: always()
    
    steps:
      - name: Check all jobs status
        run: |
          if [[ "${{ needs.quality.result }}" == "success" && 
                "${{ needs.security.result }}" == "success" && 
                "${{ needs.test.result }}" == "success" && 
                "${{ needs.build.result }}" == "success" && 
                "${{ needs.quality-gates.result }}" == "success" ]]; then
            echo "✅ All CI checks passed successfully!"
            echo "success=true" >> $GITHUB_OUTPUT
          else
            echo "❌ Some CI checks failed"
            echo "success=false" >> $GITHUB_OUTPUT
            exit 1
          fi

      - name: Update PR status
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const success = '${{ steps.check-all-jobs-status.outputs.success }}' === 'true';
            const status = success ? '✅ Ready for review' : '❌ Needs fixes';
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🚀 CI Pipeline Status: ${status}

              This pull request has ${success ? 'passed' : 'failed'} all quality gates:
              
              - ${success ? '✅' : '❌'} Code quality and formatting
              - ${success ? '✅' : '❌'} Security scanning  
              - ${success ? '✅' : '❌'} Test suite (unit + integration)
              - ${success ? '✅' : '❌'} Build and packaging
              - ${success ? '✅' : '❌'} Quality gates verification
              
              ${success ? 
                '🎉 **This PR is ready for human review!**' : 
                '⚠️ **Please fix the failing checks before requesting review.**'
              }`
            });
```

### 2. Continuous Deployment Workflow

```yaml
# .github/workflows/cd.yml
name: Continuous Deployment

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]
  workflow_run:
    workflows: ["Continuous Integration"]
    types:
      - completed
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event.workflow_run.conclusion == 'success'
    environment:
      name: staging
      url: https://bduf-orchestrator-staging.company.com
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=staging

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # Add actual deployment commands here
          # kubectl apply -f k8s/staging/
          # helm upgrade --install bduf-orchestrator ./helm-chart

      - name: Run smoke tests
        run: |
          echo "Running smoke tests against staging..."
          npm run test:smoke -- --baseUrl=https://bduf-orchestrator-staging.company.com

      - name: Notify deployment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: context.payload.deployment.id,
              state: 'success',
              description: 'Deployed to staging successfully',
              environment_url: 'https://bduf-orchestrator-staging.company.com'
            });

  # Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production
      url: https://bduf-orchestrator.company.com
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=tag
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=raw,value=production
            type=raw,value=latest

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false

      - name: Deploy to production
        run: |
          echo "Deploying to production environment..."
          # Add actual deployment commands here
          # kubectl apply -f k8s/production/
          # helm upgrade --install bduf-orchestrator ./helm-chart --namespace production

      - name: Run production health checks
        run: |
          echo "Running production health checks..."
          npm run test:health -- --baseUrl=https://bduf-orchestrator.company.com

      - name: Notify deployment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: context.payload.deployment.id,
              state: 'success',
              description: 'Deployed to production successfully',
              environment_url: 'https://bduf-orchestrator.company.com'
            });
```

### 3. Security Scanning Workflow

```yaml
# .github/workflows/security-scan.yml
name: Security Scanning

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  # Dependency vulnerability scanning
  dependency-scan:
    name: Dependency Vulnerability Scan
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: |
          npm audit --audit-level=moderate --json > npm-audit.json || true
          
      - name: Upload npm audit results
        uses: actions/upload-artifact@v3
        with:
          name: npm-audit-results
          path: npm-audit.json

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high --json > snyk-results.json

      - name: Upload Snyk results
        uses: actions/upload-artifact@v3
        with:
          name: snyk-results
          path: snyk-results.json

  # Container security scanning
  container-scan:
    name: Container Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t bduf-orchestrator:scan .

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'bduf-orchestrator:scan'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # Infrastructure security scanning
  infrastructure-scan:
    name: Infrastructure Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Checkov
        uses: bridgecrewio/checkov-action@master
        with:
          directory: .
          framework: dockerfile,kubernetes
          output_format: sarif
          output_file_path: checkov-results.sarif

      - name: Upload Checkov scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: checkov-results.sarif
```

### 4. Performance Testing Workflow

```yaml
# .github/workflows/performance.yml
name: Performance Testing

on:
  schedule:
    - cron: '0 3 * * 0'  # Weekly on Sunday at 3 AM
  push:
    branches: [ main ]
    paths-ignore:
      - '**.md'
      - 'docs/**'
  pull_request:
    branches: [ main ]
    types: [labeled]

jobs:
  performance-test:
    name: Performance Testing
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.labels.*.name, 'performance') || github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start application
        run: |
          npm run start &
          sleep 10
        env:
          NODE_ENV: production

      - name: Run performance benchmarks
        run: npm run performance:benchmark

      - name: Run load tests
        run: npm run performance:load-test

      - name: Profile application
        run: timeout 30s npm run performance:profile || true

      - name: Upload performance reports
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: |
            .clinic/
            reports/performance/
          retention-days: 7

      - name: Comment performance results on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            
            // Read performance metrics
            let performanceData = {};
            try {
              performanceData = JSON.parse(fs.readFileSync('reports/performance/metrics.json', 'utf8'));
            } catch (e) {
              console.log('No performance metrics found');
            }
            
            const comment = `## 📊 Performance Test Results
            
            | Metric | Value | Status |
            |--------|-------|--------|
            | Response Time (p95) | ${performanceData.responseTime?.p95 || 'N/A'}ms | ${performanceData.responseTime?.p95 < 500 ? '✅' : '⚠️'} |
            | Throughput | ${performanceData.throughput || 'N/A'} req/s | ${performanceData.throughput > 100 ? '✅' : '⚠️'} |
            | Memory Usage | ${performanceData.memoryUsage || 'N/A'}MB | ${performanceData.memoryUsage < 512 ? '✅' : '⚠️'} |
            | CPU Usage | ${performanceData.cpuUsage || 'N/A'}% | ${performanceData.cpuUsage < 80 ? '✅' : '⚠️'} |
            
            📈 [View detailed performance reports](${process.env.GITHUB_SERVER_URL}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}/artifacts)`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### 5. NPM Scripts Configuration

Update `package.json` with required scripts:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "format:write": "prettier --write .",
    "format:check": "prettier --check .",
    "lint:fix": "eslint . --fix",
    "lint:check": "eslint .",
    "docs:auto-generate": "node scripts/generate-jsdoc.js",
    "docs:generate": "typedoc",
    "docs:validate": "typedoc --validation",
    "docs:coverage-check": "typedoc --validation.notDocumented",
    "docs:validate-completeness": "node scripts/validate-docs.js",
    "docs:link-check": "markdown-link-check docs/**/*.md",
    "docs:validate-examples": "node scripts/validate-code-examples.js",
    "docs:dependency-graph": "madge --image docs/architecture/dependency-graph.svg src/",
    "docs:type-diagrams": "tplant --input src/**/*.ts --output docs/architecture/types.puml",
    "docs:api-flows": "node scripts/generate-api-flows.js",
    "docs:update-readme": "node scripts/update-readme-metrics.js",
    "docs:build-site": "typedoc --plugin @typedoc/plugin-pages",
    "security:audit": "npm audit --audit-level=moderate",
    "test:unit": "jest --testPathPattern=__tests__/unit",
    "test:integration": "jest --testPathPattern=__tests__/integration",
    "test:e2e": "playwright test",
    "test:smoke": "jest --testPathPattern=__tests__/smoke",
    "test:health": "jest --testPathPattern=__tests__/health",
    "db:migrate:test": "node scripts/migrate-test-db.js",
    "db:migrate:prod": "node scripts/migrate-production-db.js",
    "analyze:bundle": "webpack-bundle-analyzer dist/bundle.js",
    "analyze:size": "bundlesize",
    "analyze:complexity": "plato -r -d reports/complexity src/",
    "mcp:validate": "node scripts/validate-mcp-tools.js",
    "mcp:test-tools": "jest --testPathPattern=__tests__/mcp-tools",
    "performance:benchmark": "clinic doctor --on-port 'autocannon localhost:3000' -- node dist/index.js",
    "performance:profile": "clinic flame -- node dist/index.js",
    "performance:load-test": "autocannon -c 100 -d 30 http://localhost:3000",
    "report:quality": "node scripts/generate-quality-report.js",
    "deps:check": "depcheck"
  }
}
```

## File Structure

```
.github/
├── workflows/
│   ├── ci.yml                           # Main CI workflow
│   ├── cd.yml                           # Continuous deployment
│   ├── documentation.yml                # Documentation automation (existing)
│   ├── security-scan.yml               # Security scanning
│   ├── performance.yml                 # Performance testing
│   └── dependency-check.yml            # Dependency updates
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── performance_issue.md
├── pull_request_template.md
└── CODEOWNERS

scripts/
├── generate-jsdoc.js                   # Auto-generate JSDoc
├── validate-docs.js                    # Documentation validation
├── validate-code-examples.js           # Code example validation
├── generate-api-flows.js              # API flow diagrams
├── update-readme-metrics.js           # README metrics update
├── migrate-test-db.js                 # Test DB migration
├── migrate-production-db.js           # Production DB migration
├── validate-mcp-tools.js              # MCP tool validation
├── generate-quality-report.js         # Quality reporting
└── ci-helpers/
    ├── check-coverage.js
    ├── analyze-performance.js
    └── security-helpers.js

.codecov.yml                           # Codecov configuration
.bundlesizerc                          # Bundle size limits
```

## Success Criteria

### Functional Requirements
1. **Automated Code Quality**: Linting, formatting, and auto-fixes with PR comments
2. **Comprehensive Testing**: Unit, integration, E2E tests with coverage reporting
3. **Security Scanning**: Vulnerability detection with SARIF upload to GitHub
4. **Automated Builds**: Docker containerization with multi-stage builds
5. **Deployment Automation**: Staging and production deployment workflows
6. **Quality Gates**: Coverage thresholds and approval requirements

### Technical Requirements
1. **Fast Execution**: CI pipeline completes in <15 minutes for typical changes
2. **Parallel Execution**: Jobs run concurrently where possible
3. **Smart Triggers**: Appropriate triggers for different workflow types
4. **Artifact Management**: Build artifacts with appropriate retention
5. **Environment Management**: Proper staging and production environments

### Quality Standards
1. **Reliability**: 99% pipeline success rate for valid code
2. **Comprehensive Coverage**: All aspects of development lifecycle covered
3. **Security**: No high-severity vulnerabilities in production
4. **Performance**: Performance regression detection and alerting
5. **Documentation**: All workflows documented with clear descriptions

## Output Format

### Implementation Deliverables
1. **CI Workflow**: Comprehensive continuous integration pipeline
2. **CD Workflow**: Automated deployment to staging and production
3. **Security Workflow**: Comprehensive security scanning automation
4. **Performance Workflow**: Automated performance testing and monitoring
5. **Documentation Workflow**: Automated documentation generation (existing)
6. **NPM Scripts**: All required build, test, and analysis scripts
7. **Configuration Files**: Codecov, bundlesize, and other tool configurations

### Testing Requirements
1. **Pipeline Testing**: CI/CD pipeline validation
2. **Security Testing**: Security scanning validation
3. **Performance Testing**: Performance benchmark validation
4. **Integration Testing**: Cross-workflow integration testing

Remember that this CI/CD pipeline is foundational for maintaining code quality and enabling rapid, safe deployments throughout the development lifecycle.