# Prompt 009: Authentication and Authorization Implementation

## Persona
You are a **Senior Security Engineer** with 10+ years of experience building enterprise-grade authentication and authorization systems. You specialize in JWT-based authentication, role-based access control (RBAC), API security, and OAuth 2.0 implementations. You have deep expertise in Node.js security patterns, token management, and enterprise security frameworks.

## Context
You are implementing the authentication and authorization system for the Interactive BDUF Orchestrator MCP Server. This system must support secure user authentication, role-based access control, API key management, and integration with the MCP protocol while maintaining enterprise security standards.

## Git Workflow
Before starting implementation, create a new feature branch:
```bash
git checkout -b feature/009-authentication-and-authorization
```

## Required Context from Context7
- JWT authentication best practices in Node.js applications
- Role-based access control (RBAC) implementation patterns
- OAuth 2.0 and OpenID Connect integration
- Enterprise API security and rate limiting strategies

## Implementation Requirements

### 1. JWT Authentication Service
Create comprehensive JWT-based authentication:

```typescript
export class AuthenticationService {
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private refreshTokenExpiresIn: string;
  private logger: Logger;
  private userRepository: IUserRepository;
  private tokenBlacklist: Set<string> = new Set();

  constructor(
    config: AuthConfig,
    userRepository: IUserRepository,
    logger: Logger
  ) {
    this.jwtSecret = config.jwtSecret;
    this.jwtExpiresIn = config.jwtExpiresIn;
    this.refreshTokenExpiresIn = config.refreshTokenExpiresIn;
    this.userRepository = userRepository;
    this.logger = logger;
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      if (!user.isActive) {
        throw new AuthenticationError('Account is disabled');
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new AuthenticationError('Account is temporarily locked');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        await this.handleFailedLogin(user.id);
        throw new AuthenticationError('Invalid credentials');
      }

      await this.handleSuccessfulLogin(user.id);
      
      const tokens = await this.generateTokens(user);
      
      this.logger.info('User authenticated successfully', { 
        userId: user.id, 
        email: user.email 
      });

      return {
        user: this.sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.parseExpiration(this.jwtExpiresIn)
      };
    } catch (error) {
      this.logger.error('Authentication failed', error as Error, { email });
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as JWTPayload;
      
      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      const tokens = await this.generateTokens(user);
      
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.parseExpiration(this.jwtExpiresIn)
      };
    } catch (error) {
      this.logger.error('Token refresh failed', error as Error);
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      if (this.tokenBlacklist.has(token)) {
        throw new AuthenticationError('Token has been revoked');
      }

      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      
      if (decoded.type !== 'access') {
        throw new AuthenticationError('Invalid token type');
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      return {
        isValid: true,
        user: this.sanitizeUser(user),
        permissions: user.permissions,
        role: user.role
      };
    } catch (error) {
      return {
        isValid: false,
        error: (error as Error).message
      };
    }
  }

  async revokeToken(token: string): Promise<void> {
    this.tokenBlacklist.add(token);
    this.logger.info('Token revoked');
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: this.refreshTokenExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  private async handleFailedLogin(userId: string): Promise<void> {
    await this.userRepository.incrementFailedLogins(userId);
  }

  private async handleSuccessfulLogin(userId: string): Promise<void> {
    await this.userRepository.resetFailedLogins(userId);
    await this.userRepository.updateLastLogin(userId);
  }
}
```

### 2. Role-Based Access Control (RBAC)
```typescript
export class AuthorizationService {
  private rolePermissions: Map<UserRole, Permission[]>;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.rolePermissions = this.initializeRolePermissions();
  }

  private initializeRolePermissions(): Map<UserRole, Permission[]> {
    const permissions = new Map<UserRole, Permission[]>();
    
    permissions.set(UserRole.ADMIN, [
      Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.DELETE,
      Permission.APPROVE, Permission.EXECUTE, Permission.MANAGE_USERS,
      Permission.MANAGE_PROJECTS, Permission.MANAGE_SYSTEM
    ]);
    
    permissions.set(UserRole.PROJECT_MANAGER, [
      Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.DELETE,
      Permission.APPROVE, Permission.MANAGE_PROJECTS
    ]);
    
    permissions.set(UserRole.ARCHITECT, [
      Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.APPROVE
    ]);
    
    permissions.set(UserRole.TECH_LEAD, [
      Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.EXECUTE
    ]);
    
    permissions.set(UserRole.DEVELOPER, [
      Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.EXECUTE
    ]);
    
    permissions.set(UserRole.DESIGNER, [
      Permission.CREATE, Permission.READ, Permission.UPDATE
    ]);
    
    permissions.set(UserRole.QA_ENGINEER, [
      Permission.READ, Permission.UPDATE, Permission.EXECUTE
    ]);
    
    permissions.set(UserRole.BUSINESS_ANALYST, [
      Permission.CREATE, Permission.READ, Permission.UPDATE
    ]);
    
    permissions.set(UserRole.STAKEHOLDER, [
      Permission.READ, Permission.APPROVE
    ]);
    
    permissions.set(UserRole.VIEWER, [
      Permission.READ
    ]);

    return permissions;
  }

  hasPermission(
    userRole: UserRole, 
    requiredPermission: Permission,
    customPermissions?: Permission[]
  ): boolean {
    // Check custom permissions first
    if (customPermissions && customPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check role-based permissions
    const rolePerms = this.rolePermissions.get(userRole);
    return rolePerms ? rolePerms.includes(requiredPermission) : false;
  }

  canAccessResource(
    user: AuthenticatedUser,
    resource: Resource,
    action: Permission
  ): boolean {
    // Check basic permission
    if (!this.hasPermission(user.role, action, user.customPermissions)) {
      return false;
    }

    // Check resource-specific access
    return this.checkResourceAccess(user, resource, action);
  }

  private checkResourceAccess(
    user: AuthenticatedUser,
    resource: Resource,
    action: Permission
  ): boolean {
    switch (resource.type) {
      case 'project':
        return this.checkProjectAccess(user, resource, action);
      case 'task':
        return this.checkTaskAccess(user, resource, action);
      case 'requirement':
        return this.checkRequirementAccess(user, resource, action);
      case 'collaboration_session':
        return this.checkCollaborationAccess(user, resource, action);
      default:
        return false;
    }
  }

  private checkProjectAccess(
    user: AuthenticatedUser,
    resource: Resource,
    action: Permission
  ): boolean {
    // Admin and project managers can access all projects
    if ([UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role)) {
      return true;
    }

    // Check if user is a team member of the project
    return resource.teamMembers?.includes(user.id) || false;
  }

  private checkTaskAccess(
    user: AuthenticatedUser,
    resource: Resource,
    action: Permission
  ): boolean {
    // Users can always read tasks they're assigned to
    if (action === Permission.READ && resource.assignedTo === user.id) {
      return true;
    }

    // Check project-level access
    return this.checkProjectAccess(user, resource, action);
  }
}
```

### 3. API Key Management
```typescript
export class ApiKeyService {
  private userRepository: IUserRepository;
  private logger: Logger;
  private keyPrefix = 'bduf_';
  private keyLength = 32;

  constructor(userRepository: IUserRepository, logger: Logger) {
    this.userRepository = userRepository;
    this.logger = logger;
  }

  async generateApiKey(userId: string): Promise<ApiKeyResult> {
    try {
      const apiKey = this.generateRandomKey();
      const hashedKey = await this.hashApiKey(apiKey);
      
      await this.userRepository.setApiKey(userId, hashedKey);
      
      this.logger.info('API key generated', { userId });
      
      return {
        apiKey: `${this.keyPrefix}${apiKey}`,
        keyId: hashedKey.substring(0, 8),
        createdAt: new Date()
      };
    } catch (error) {
      this.logger.error('Error generating API key', error as Error, { userId });
      throw new Error('Failed to generate API key');
    }
  }

  async validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      if (!apiKey.startsWith(this.keyPrefix)) {
        return { isValid: false, error: 'Invalid API key format' };
      }

      const key = apiKey.replace(this.keyPrefix, '');
      const hashedKey = await this.hashApiKey(key);
      
      const user = await this.userRepository.findByApiKeyHash(hashedKey);
      if (!user || !user.isActive) {
        return { isValid: false, error: 'Invalid or inactive API key' };
      }

      await this.userRepository.updateApiKeyLastUsed(user.id);
      
      return {
        isValid: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }
      };
    } catch (error) {
      this.logger.error('Error validating API key', error as Error);
      return { isValid: false, error: 'API key validation failed' };
    }
  }

  async revokeApiKey(userId: string): Promise<void> {
    try {
      await this.userRepository.clearApiKey(userId);
      this.logger.info('API key revoked', { userId });
    } catch (error) {
      this.logger.error('Error revoking API key', error as Error, { userId });
      throw new Error('Failed to revoke API key');
    }
  }

  private generateRandomKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  private async hashApiKey(key: string): Promise<string> {
    return await bcrypt.hash(key, 12);
  }
}
```

### 4. Authentication Middleware
```typescript
export class AuthenticationMiddleware {
  constructor(
    private authService: AuthenticationService,
    private authzService: AuthorizationService,
    private apiKeyService: ApiKeyService,
    private logger: Logger
  ) {}

  authenticate() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          throw new AuthenticationError('No authorization header provided');
        }

        const [type, token] = authHeader.split(' ');
        
        let user: AuthenticatedUser;
        
        if (type === 'Bearer') {
          const result = await this.authService.validateToken(token);
          if (!result.isValid) {
            throw new AuthenticationError(result.error || 'Invalid token');
          }
          user = result.user!;
        } else if (type === 'ApiKey') {
          const result = await this.apiKeyService.validateApiKey(token);
          if (!result.isValid) {
            throw new AuthenticationError(result.error || 'Invalid API key');
          }
          user = result.user!;
        } else {
          throw new AuthenticationError('Unsupported authentication type');
        }

        req.user = user;
        next();
      } catch (error) {
        this.logger.warn('Authentication failed', { 
          error: (error as Error).message,
          path: req.path 
        });
        
        res.status(401).json({
          error: 'Authentication failed',
          message: (error as Error).message
        });
      }
    };
  }

  requirePermission(permission: Permission) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!this.authzService.hasPermission(req.user.role, permission, req.user.customPermissions)) {
        this.logger.warn('Authorization failed', {
          userId: req.user.id,
          requiredPermission: permission,
          userRole: req.user.role
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: permission
        });
      }

      next();
    };
  }

  requireResourceAccess(getResource: (req: Request) => Promise<Resource>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      try {
        const resource = await getResource(req);
        const action = this.mapHttpMethodToPermission(req.method);
        
        if (!this.authzService.canAccessResource(req.user, resource, action)) {
          this.logger.warn('Resource access denied', {
            userId: req.user.id,
            resourceType: resource.type,
            resourceId: resource.id,
            action
          });
          
          return res.status(403).json({
            error: 'Access denied',
            resource: resource.type
          });
        }

        req.resource = resource;
        next();
      } catch (error) {
        this.logger.error('Error checking resource access', error as Error);
        res.status(500).json({ error: 'Authorization check failed' });
      }
    };
  }

  private mapHttpMethodToPermission(method: string): Permission {
    switch (method.toUpperCase()) {
      case 'GET': return Permission.READ;
      case 'POST': return Permission.CREATE;
      case 'PUT':
      case 'PATCH': return Permission.UPDATE;
      case 'DELETE': return Permission.DELETE;
      default: return Permission.READ;
    }
  }
}
```

## File Structure
```
src/auth/
├── services/
│   ├── authentication.service.ts   # JWT authentication
│   ├── authorization.service.ts    # RBAC implementation
│   ├── api-key.service.ts          # API key management
│   └── index.ts                    # Service exports
├── middleware/
│   ├── authentication.middleware.ts # Auth middleware
│   ├── rate-limiting.middleware.ts  # Rate limiting
│   └── index.ts                     # Middleware exports
├── strategies/
│   ├── jwt.strategy.ts             # JWT strategy
│   ├── api-key.strategy.ts         # API key strategy
│   └── index.ts                    # Strategy exports
├── guards/
│   ├── roles.guard.ts              # Role-based guards
│   ├── permissions.guard.ts        # Permission guards
│   └── index.ts                    # Guard exports
├── types/
│   ├── auth.types.ts               # Authentication types
│   ├── permission.types.ts         # Permission types
│   └── index.ts                    # Type exports
└── index.ts                        # Auth module exports
```

## Success Criteria
- [ ] Complete JWT-based authentication system
- [ ] Role-based access control with granular permissions
- [ ] API key management for service-to-service authentication
- [ ] Integration with MCP server authentication
- [ ] Rate limiting and abuse prevention
- [ ] Audit logging for all authentication events
- [ ] Password security and account lockout mechanisms
- [ ] Comprehensive unit tests (>95% coverage)

## Quality Standards
- Use industry-standard security practices
- Implement proper password hashing with bcrypt
- Use secure JWT implementation with proper secret management
- Include comprehensive audit logging
- Implement rate limiting to prevent abuse
- Follow OWASP security guidelines
- Use TypeScript strict mode throughout

## Output Format
Implement the complete authentication and authorization system with:
1. JWT authentication service with token management
2. Role-based access control system
3. API key management for service authentication
4. Authentication middleware for Express integration
5. Resource-level authorization checks
6. Security audit logging and monitoring
7. Comprehensive test suite with security testing

Focus on creating a secure, enterprise-grade authentication system that integrates seamlessly with the MCP server while maintaining the highest security standards.