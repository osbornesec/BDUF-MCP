# Prompt 005: CI/CD Pipeline Setup Implementation

## Persona
You are a **Senior DevOps Engineer** with 10+ years of experience building enterprise-grade CI/CD pipelines. You specialize in GitHub Actions, automated testing, security scanning, and deployment automation for TypeScript/Node.js applications. You have deep expertise in container orchestration, quality gates, and production deployment strategies.

## Context
You are implementing the CI/CD pipeline for the Interactive BDUF Orchestrator MCP Server. This pipeline will automate testing, quality assurance, security scanning, and deployment processes to ensure high-quality, secure, and reliable software delivery.

## Git Workflow
Before starting implementation, create a new feature branch:
```bash
git checkout -b feature/005-ci-cd-pipeline-setup
```

## Required Context from Context7
- GitHub Actions best practices for TypeScript projects
- Enterprise CI/CD pipeline patterns
- Security scanning and vulnerability management in pipelines

## Implementation Requirements

### 1. Core GitHub Actions Workflows
Create comprehensive CI/CD workflows:

```yaml
# .github/workflows/ci.yml - Main CI Pipeline
name: Continuous Integration

on:
  push:
    branches: [ main, develop, 'feature/*' ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '20'
  CACHE_KEY_PREFIX: 'v1'

jobs:
  # Code Quality and Linting
  quality:
    name: Code Quality Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint:ci
      
      - name: Check Prettier formatting
        run: npm run format:check
      
      - name: TypeScript type checking
        run: npm run type-check
      
      - name: Check for unused dependencies
        run: npm run deps:check

  # Security Scanning
  security:
    name: Security Scanning
    runs-on: ubuntu-latest
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
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run CodeQL analysis
        uses: github/codeql-action/init@v2
        with:
          languages: typescript
      
      - name: Perform CodeQL analysis
        uses: github/codeql-action/analyze@v2

  # Unit and Integration Tests
  test:
    name: Test Suite
    runs-on: ubuntu-latest
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
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate:test
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: npm run test:integration -- --coverage
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/clover.xml
          fail_ci_if_error: true

  # Build and Docker
  build:
    name: Build and Package
    runs-on: ubuntu-latest
    needs: [quality, security, test]
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
      
      - name: Build application
        run: npm run build
      
      - name: Build Docker image
        run: docker build -t bduf-orchestrator:${{ github.sha }} .
      
      - name: Test Docker image
        run: |
          docker run --rm -d --name test-container bduf-orchestrator:${{ github.sha }}
          sleep 10
          docker exec test-container npm run health-check
          docker stop test-container
      
      - name: Save Docker image
        if: github.ref == 'refs/heads/main'
        run: |
          docker save bduf-orchestrator:${{ github.sha }} | gzip > bduf-orchestrator.tar.gz
      
      - name: Upload build artifacts
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v3
        with:
          name: docker-image
          path: bduf-orchestrator.tar.gz
          retention-days: 7
```

### 2. Deployment Workflows
Create deployment automation:

```yaml
# .github/workflows/deploy.yml - Deployment Pipeline
name: Deploy Application

on:
  workflow_run:
    workflows: ["Continuous Integration"]
    types:
      - completed
    branches: [main]
  
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
      version:
        description: 'Version to deploy (default: latest)'
        required: false
        default: 'latest'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success'
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: docker-image
          github-token: ${{ secrets.GITHUB_TOKEN }}
          workflow: ci.yml
      
      - name: Load Docker image
        run: docker load < bduf-orchestrator.tar.gz
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Tag and push image
        run: |
          docker tag bduf-orchestrator:${{ github.sha }} ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:staging
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:staging
      
      - name: Deploy to staging environment
        run: |
          # Deploy using your preferred method (kubectl, terraform, etc.)
          echo "Deploying to staging environment..."
          # kubectl apply -f k8s/staging/
      
      - name: Run smoke tests
        run: |
          # Run basic smoke tests against staging
          npm run test:smoke -- --baseUrl=https://staging.bduf-orchestrator.com
      
      - name: Notify deployment status
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'production'
    environment: production
    needs: [deploy-staging]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Require manual approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ github.TOKEN }}
          approvers: osbornesec,tech-leads
          minimum-approvals: 2
          issue-title: "Production Deployment Approval Required"
      
      - name: Deploy to production
        run: |
          echo "Deploying to production environment..."
          # Production deployment logic here
      
      - name: Run production health checks
        run: |
          npm run test:health -- --baseUrl=https://bduf-orchestrator.com
      
      - name: Create release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          draft: false
          prerelease: false
```

### 3. Quality Gates and Automation
Implement automated quality checks:

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  # Branch protection and naming
  branch-validation:
    name: Branch Validation
    runs-on: ubuntu-latest
    steps:
      - name: Validate branch naming
        run: |
          if [[ "${{ github.head_ref }}" =~ ^(feature|bugfix|hotfix|release)/.+ ]]; then
            echo "✅ Branch name follows convention"
          else
            echo "❌ Branch name must follow pattern: feature/*, bugfix/*, hotfix/*, or release/*"
            exit 1
          fi
      
      - name: Check for breaking changes
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Conventional commits check
        uses: webiny/action-conventional-commits@v1.1.0

  # Code coverage gates
  coverage-gate:
    name: Coverage Gate
    runs-on: ubuntu-latest
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
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Coverage gate check
        run: |
          COVERAGE=$(npm run coverage:check --silent)
          if (( $(echo "$COVERAGE < 90.0" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below 90% threshold"
            exit 1
          else
            echo "✅ Coverage $COVERAGE% meets threshold"
          fi

  # Performance benchmarks
  performance-gate:
    name: Performance Gate
    runs-on: ubuntu-latest
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
      
      - name: Run performance benchmarks
        run: npm run test:performance
      
      - name: Performance regression check
        run: |
          # Compare against baseline performance metrics
          npm run performance:compare-baseline

  # Dependency validation
  dependency-gate:
    name: Dependency Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Check for high-risk dependencies
        run: |
          # Check for dependencies with known vulnerabilities
          npm audit --audit-level=high
      
      - name: License compliance check
        uses: fossa-contrib/fossa-action@v2
        with:
          api-key: ${{ secrets.FOSSA_API_KEY }}
      
      - name: Bundle size check
        run: |
          npm run build
          npm run bundle:analyze
          # Fail if bundle size increases by more than 10%
```

### 4. Release Automation
Automate release processes:

```yaml
# .github/workflows/release.yml
name: Release Management

on:
  push:
    tags:
      - 'v*'
  
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  create-release:
    name: Create Release
    runs-on: ubuntu-latest
    outputs:
      release_version: ${{ steps.version.outputs.version }}
      release_notes: ${{ steps.notes.outputs.notes }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate version
        id: version
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            NEW_VERSION=$(npm version ${{ github.event.inputs.release_type }} --no-git-tag-version)
            echo "version=${NEW_VERSION}" >> $GITHUB_OUTPUT
          else
            VERSION=${GITHUB_REF#refs/tags/}
            echo "version=${VERSION}" >> $GITHUB_OUTPUT
          fi
      
      - name: Generate release notes
        id: notes
        run: |
          # Generate changelog using conventional commits
          npm run changelog:generate
          NOTES=$(cat CHANGELOG.md | head -n 50)
          echo "notes<<EOF" >> $GITHUB_OUTPUT
          echo "$NOTES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
      
      - name: Create GitHub release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.version.outputs.version }}
          release_name: Release ${{ steps.version.outputs.version }}
          body: ${{ steps.notes.outputs.notes }}
          draft: false
          prerelease: false

  publish-packages:
    name: Publish Packages
    runs-on: ubuntu-latest
    needs: [create-release]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build packages
        run: npm run build
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Publish Docker image
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ needs.create-release.outputs.release_version }} .
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ needs.create-release.outputs.release_version }}
          docker tag ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ needs.create-release.outputs.release_version }} ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
```

### 5. Monitoring and Maintenance
Automate maintenance tasks:

```yaml
# .github/workflows/maintenance.yml
name: Maintenance Tasks

on:
  schedule:
    # Run dependency updates weekly
    - cron: '0 2 * * 1'
    # Run security scans daily
    - cron: '0 6 * * *'
  
  workflow_dispatch:

jobs:
  dependency-updates:
    name: Dependency Updates
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' && github.event.schedule == '0 2 * * 1'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Update dependencies
        run: |
          npm update
          npm audit fix --force
      
      - name: Run tests
        run: npm test
      
      - name: Create pull request
        uses: peter-evans/create-pull-request@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update dependencies'
          title: 'Automated Dependency Updates'
          body: |
            Automated dependency updates for the week.
            
            Please review the changes and ensure all tests pass.
          branch: maintenance/dependency-updates

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' && github.event.schedule == '0 6 * * *'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Notify security team
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          channel: '#security'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
          text: 'Security vulnerabilities detected in BDUF Orchestrator'
```

## File Structure
```
.github/
├── workflows/
│   ├── ci.yml                 # Main CI pipeline
│   ├── deploy.yml            # Deployment automation
│   ├── quality-gates.yml     # Quality gate enforcement
│   ├── release.yml           # Release management
│   ├── maintenance.yml       # Maintenance automation
│   └── pull-request.yml      # PR-specific checks
├── PULL_REQUEST_TEMPLATE.md  # PR template
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── security_report.md
└── dependabot.yml           # Dependabot configuration
```

## Success Criteria
- [ ] Complete CI/CD pipeline with all quality gates
- [ ] Automated testing with >90% coverage requirement
- [ ] Security scanning and vulnerability detection
- [ ] Automated dependency updates and maintenance
- [ ] Production deployment with manual approval gates
- [ ] Performance regression testing
- [ ] Automated release management
- [ ] Monitoring and alerting for pipeline failures

## Quality Standards
- All pipelines fail fast on quality gate violations
- Parallel execution where possible for speed
- Comprehensive logging and artifact retention
- Security-first approach with multiple scanning tools
- Automated rollback capabilities for failed deployments
- Clear approval processes for production changes

## Output Format
Implement the complete CI/CD pipeline with:
1. All GitHub Actions workflow files
2. Quality gate enforcement mechanisms
3. Security scanning and compliance checks
4. Automated deployment processes
5. Release management automation
6. Maintenance and monitoring workflows
7. Documentation for pipeline usage and troubleshooting

Focus on creating a production-ready CI/CD system that ensures high-quality, secure, and reliable software delivery.