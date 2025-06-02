# Implementation Prompt 002: Utility Functions Library (1.1.2)

## Persona
You are a **Senior TypeScript Utilities Architect and Performance Engineer** with 15+ years of experience building high-performance utility libraries for enterprise applications. You specialize in creating type-safe, performance-optimized utility functions that enhance developer productivity, ensure application reliability, and maintain excellent runtime performance. You have deep expertise in TypeScript advanced types, functional programming patterns, cryptography, data validation, and utility library design patterns.

## Context: Interactive BDUF Orchestrator
You are implementing the **Utility Functions Library** as a core infrastructure component of the Interactive Big Design Up Front (BDUF) Orchestrator. This library will provide essential utility functions used throughout the application for validation, data manipulation, cryptography, date/time operations, performance optimization, and developer productivity enhancements.

### System Overview
The Interactive BDUF Orchestrator is an enterprise-grade MCP server that orchestrates comprehensive project analysis and planning. The Utility Functions Library you're building will:

1. **Provide type-safe validation functions** for all data validation needs
2. **Enable secure cryptographic operations** with best-practice implementations
3. **Support data transformation** with performance-optimized functions
4. **Facilitate date/time operations** with timezone and format handling
5. **Enhance developer experience** with robust helper functions
6. **Ensure performance optimization** with memoization and caching utilities

### Technical Context
- **Dependencies**: Foundation component used throughout the entire application
- **Architecture**: Modular utility library with tree-shakable exports
- **Integration**: Core dependency for validation, security, and data operations
- **Scalability**: Handle high-volume operations with minimal performance impact
- **Quality**: 95%+ test coverage, comprehensive edge case testing and validation

## Git Workflow Instructions

### Branch Management
```bash
# Create feature branch
git checkout -b feature/utility-functions-library

# Regular commits with descriptive messages
git add .
git commit -m "feat(utils): implement comprehensive utility functions library

- Add type-safe validation utilities with schema support
- Implement secure cryptographic functions with proper key management
- Create performance-optimized data transformation utilities
- Add comprehensive date/time operations with timezone support
- Implement array and object manipulation utilities
- Add string processing functions with internationalization support"

# Push and create PR
git push origin feature/utility-functions-library
```

## Required Context7 Integration

Before implementing any utility functions, you MUST use Context7 to research utility patterns:

```typescript
// Research utility function patterns and best practices
await context7.getLibraryDocs('/typescript/utility-types');
await context7.getLibraryDocs('/functional-programming/lodash');
await context7.getLibraryDocs('/validation/joi');

// Research security and cryptography patterns
await context7.getLibraryDocs('/security/crypto');
await context7.getLibraryDocs('/security/bcrypt');
await context7.getLibraryDocs('/security/uuid');

// Research performance optimization patterns
await context7.getLibraryDocs('/performance/memoization');
await context7.getLibraryDocs('/performance/optimization');
await context7.getLibraryDocs('/testing/unit-testing');
```

## Implementation Requirements

### 1. Type-Safe Validation Utilities

```typescript
// src/shared/utils/validation.ts
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationSchema<T> {
  validate(data: unknown): ValidationResult<T>;
  optional(): ValidationSchema<T | undefined>;
  default(value: T): ValidationSchema<T>;
}

// Email validation with comprehensive checks
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  if (!emailRegex.test(email)) return false;
  
  // Check for valid domain length
  const domain = email.split('@')[1];
  return domain.length <= 253;
}

// URL validation with protocol and domain checks
export function isValidUrl(url: string, allowedProtocols: string[] = ['http', 'https']): boolean {
  try {
    const urlObj = new URL(url);
    return allowedProtocols.includes(urlObj.protocol.slice(0, -1));
  } catch {
    return false;
  }
}

// UUID validation with version support
export function isValidUUID(uuid: string, version?: 1 | 3 | 4 | 5): boolean {
  const versionRegexes = {
    1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    3: /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  };
  
  const generalRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (version) {
    return versionRegexes[version].test(uuid);
  }
  
  return generalRegex.test(uuid);
}

// Deep object validation with type guards
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

export function hasRequiredFields<T extends Record<string, unknown>>(
  obj: unknown,
  fields: (keyof T)[]
): obj is T {
  if (!isObject(obj)) return false;
  
  return fields.every(field => 
    obj.hasOwnProperty(field) && obj[field] !== undefined && obj[field] !== null
  );
}

// Schema validation with detailed error reporting
export function createSchema<T>(
  validator: (data: unknown) => data is T,
  errorMessage?: string
): ValidationSchema<T> {
  return {
    validate(data: unknown): ValidationResult<T> {
      if (validator(data)) {
        return {
          isValid: true,
          data,
          errors: [],
          warnings: []
        };
      }
      
      return {
        isValid: false,
        errors: [new ValidationError(errorMessage || 'Validation failed')],
        warnings: []
      };
    },
    
    optional(): ValidationSchema<T | undefined> {
      return createSchema<T | undefined>(
        (data): data is T | undefined => data === undefined || validator(data)
      );
    },
    
    default(defaultValue: T): ValidationSchema<T> {
      return createSchema<T>(
        (data): data is T => data === undefined || validator(data)
      );
    }
  };
}
```

### 2. Cryptography and Security Utilities

```typescript
// src/shared/utils/crypto.ts
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface HashOptions {
  algorithm?: 'sha256' | 'sha512' | 'blake2b';
  encoding?: 'hex' | 'base64';
  salt?: string;
}

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag?: string;
}

// Secure hashing with salt support
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password must be a non-empty string');
  }
  
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// Secure random generation
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateSecureId(prefix?: string): string {
  const id = crypto.randomBytes(16).toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}

// Data hashing utilities
export function hashData(data: string | Buffer, options: HashOptions = {}): string {
  const {
    algorithm = 'sha256',
    encoding = 'hex',
    salt
  } = options;
  
  const hash = crypto.createHash(algorithm);
  
  if (salt) {
    hash.update(salt);
  }
  
  hash.update(data);
  return hash.digest(encoding);
}

// Symmetric encryption utilities
export function encrypt(data: string, key: string): EncryptionResult {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('interactive-bduf-orchestrator'));
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decrypt(encryptionResult: EncryptionResult, key: string): string {
  const algorithm = 'aes-256-gcm';
  const iv = Buffer.from(encryptionResult.iv, 'hex');
  const tag = Buffer.from(encryptionResult.tag!, 'hex');
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from('interactive-bduf-orchestrator'));
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptionResult.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 3. Date and Time Utilities

```typescript
// src/shared/utils/date-time.ts
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface FormatOptions {
  locale?: string;
  timezone?: string;
  includeTime?: boolean;
  format?: 'short' | 'medium' | 'long' | 'full';
}

// Date creation and parsing
export function createDate(input?: string | number | Date): Date {
  if (!input) return new Date();
  
  const date = new Date(input);
  
  if (isNaN(date.getTime())) {
    throw new ValidationError(`Invalid date input: ${input}`);
  }
  
  return date;
}

export function parseISO(isoString: string): Date {
  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ISO date string: ${isoString}`);
  }
  
  return date;
}

// Date comparison utilities
export function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}

export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Date arithmetic
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function getDaysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay);
}

// Formatting utilities
export function formatDate(date: Date, options: FormatOptions = {}): string {
  const {
    locale = 'en-US',
    timezone = 'UTC',
    includeTime = false,
    format = 'medium'
  } = options;
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    dateStyle: format
  };
  
  if (includeTime) {
    formatOptions.timeStyle = format;
  }
  
  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

export function formatRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const diffMs = baseDate.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (Math.abs(diffSeconds) < 60) return 'just now';
  if (Math.abs(diffMinutes) < 60) return `${Math.abs(diffMinutes)} minutes ${diffMinutes > 0 ? 'ago' : 'from now'}`;
  if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)} hours ${diffHours > 0 ? 'ago' : 'from now'}`;
  if (Math.abs(diffDays) < 30) return `${Math.abs(diffDays)} days ${diffDays > 0 ? 'ago' : 'from now'}`;
  
  return formatDate(date);
}
```

### 4. Array and Object Utilities

```typescript
// src/shared/utils/array-utils.ts
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new ValidationError('Chunk size must be positive');
  
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

// src/shared/utils/object-utils.ts
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export function merge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  const result = deepClone(target);
  
  for (const source of sources) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const value = source[key];
        if (isObject(value) && isObject(result[key])) {
          result[key] = merge(result[key] as Record<string, unknown>, value as Record<string, unknown>) as T[Extract<keyof T, string>];
        } else {
          result[key] = value as T[Extract<keyof T, string>];
        }
      }
    }
  }
  
  return result;
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
```

### 5. Performance and Memoization Utilities

```typescript
// src/shared/utils/performance.ts
export interface MemoizeOptions {
  maxSize?: number;
  ttl?: number;
  keyGenerator?: (...args: any[]) => string;
}

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoizeOptions = {}
): T {
  const {
    maxSize = 100,
    ttl = 5 * 60 * 1000, // 5 minutes
    keyGenerator = (...args) => JSON.stringify(args)
  } = options;
  
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args);
    const now = Date.now();
    
    // Check if cached result exists and is still valid
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.value;
    }
    
    // Compute new result
    const result = fn(...args);
    
    // Store in cache
    cache.set(key, { value: result, timestamp: now });
    
    // Cleanup old entries if cache is too large
    if (cache.size > maxSize) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 10% of entries
      const toRemove = Math.floor(maxSize * 0.1);
      for (let i = 0; i < toRemove; i++) {
        cache.delete(entries[i][0]);
      }
    }
    
    return result;
  }) as T;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | undefined;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): T {
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      return fn(...args);
    }
  }) as T;
}
```

## Success Criteria

### Functional Requirements
1. **Comprehensive Validation**: Type-safe validation for all common data types
2. **Secure Cryptography**: Production-ready encryption and hashing functions
3. **Date/Time Management**: Full timezone and locale support with formatting
4. **Data Manipulation**: Performance-optimized array and object utilities
5. **Performance Tools**: Memoization, debouncing, and throttling utilities
6. **Type Safety**: 100% TypeScript coverage with proper type guards

### Technical Requirements
1. **High Performance**: Sub-microsecond execution for simple operations
2. **Memory Efficiency**: Minimal memory allocation and garbage collection
3. **Tree Shaking**: Modular exports for optimal bundle sizes
4. **Browser Compatibility**: Works in Node.js and modern browsers
5. **Async Support**: Proper async/await patterns throughout

### Quality Standards
1. **Testing**: 95%+ code coverage with comprehensive edge case testing
2. **Documentation**: Complete JSDoc for all public functions
3. **Security**: Secure-by-default implementations with proper key management
4. **Maintainability**: Clean, functional programming patterns
5. **Extensibility**: Easy to extend with new utility functions

Remember that this utility library is used throughout the entire application and must provide excellent performance, security, and developer experience while maintaining enterprise-grade reliability.