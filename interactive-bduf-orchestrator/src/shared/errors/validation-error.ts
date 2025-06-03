import { BaseError, ErrorMetadata, ErrorSeverityLevel } from './base-error.js';

export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';
  readonly category = 'client';
  readonly severity: ErrorSeverityLevel = {
    level: 'medium',
    impact: 'user',
    recovery: 'manual'
  };

  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    public readonly constraints?: string[],
    metadata: ErrorMetadata = {}
  ) {
    super(message, {
      ...metadata,
      field,
      value: typeof value === 'object' ? '[OBJECT]' : value,
      constraints,
      operation: 'validation'
    });
  }

  static forField(field: string, value: unknown, constraint: string): ValidationError {
    return new ValidationError(
      `Validation failed for field '${field}': ${constraint}`,
      field,
      value,
      [constraint]
    );
  }

  static forSchema(errors: Record<string, string[]>): ValidationError {
    const fieldCount = Object.keys(errors).length;
    const totalErrors = Object.values(errors).flat().length;
    
    return new ValidationError(
      `Schema validation failed: ${totalErrors} errors across ${fieldCount} fields`,
      undefined,
      undefined,
      Object.values(errors).flat(),
      { validationErrors: errors }
    );
  }

  static forMissingField(field: string): ValidationError {
    return new ValidationError(
      `Required field '${field}' is missing`,
      field,
      undefined,
      ['required']
    );
  }

  static forInvalidType(field: string, expected: string, actual: string): ValidationError {
    return new ValidationError(
      `Field '${field}' expected type '${expected}' but received '${actual}'`,
      field,
      actual,
      [`type:${expected}`]
    );
  }

  static forInvalidFormat(field: string, format: string, value: unknown): ValidationError {
    return new ValidationError(
      `Field '${field}' has invalid format. Expected: ${format}`,
      field,
      value,
      [`format:${format}`]
    );
  }

  static forOutOfRange(field: string, value: unknown, min?: number, max?: number): ValidationError {
    let constraint = 'range';
    let message = `Field '${field}' is out of valid range`;
    
    if (min !== undefined && max !== undefined) {
      constraint = `range:${min}-${max}`;
      message += ` (${min}-${max})`;
    } else if (min !== undefined) {
      constraint = `min:${min}`;
      message += ` (minimum: ${min})`;
    } else if (max !== undefined) {
      constraint = `max:${max}`;
      message += ` (maximum: ${max})`;
    }
    
    return new ValidationError(message, field, value, [constraint]);
  }
}