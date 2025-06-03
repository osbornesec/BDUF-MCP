import { describe, it, expect } from '@jest/globals';
import { ValidationError } from '../../../../src/shared/errors/validation-error.js';

describe('ValidationError', () => {
  describe('constructor', () => {
    it('should create validation error with basic properties', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.category).toBe('client');
      expect(error.severity).toEqual({
        level: 'medium',
        impact: 'user',
        recovery: 'manual'
      });
    });

    it('should include field, value, and constraints', () => {
      const error = new ValidationError(
        'Invalid email format',
        'email',
        'invalid-email',
        ['format:email']
      );
      
      expect(error.field).toBe('email');
      expect(error.value).toBe('invalid-email');
      expect(error.constraints).toEqual(['format:email']);
      expect(error.metadata).toEqual(expect.objectContaining({
        field: 'email',
        value: 'invalid-email',
        constraints: ['format:email'],
        operation: 'validation'
      }));
    });

    it('should sanitize object values', () => {
      const objectValue = { sensitive: 'data' };
      const error = new ValidationError(
        'Invalid object',
        'data',
        objectValue,
        ['type:string']
      );
      
      expect(error.metadata.value).toBe('[OBJECT]');
    });
  });

  describe('static factory methods', () => {
    describe('forField', () => {
      it('should create field validation error', () => {
        const error = ValidationError.forField('username', 'ab', 'minimum length 3');
        
        expect(error.message).toBe("Validation failed for field 'username': minimum length 3");
        expect(error.field).toBe('username');
        expect(error.value).toBe('ab');
        expect(error.constraints).toEqual(['minimum length 3']);
      });
    });

    describe('forSchema', () => {
      it('should create schema validation error', () => {
        const errors = {
          email: ['required', 'format:email'],
          age: ['minimum:18']
        };
        const error = ValidationError.forSchema(errors);
        
        expect(error.message).toBe('Schema validation failed: 3 errors across 2 fields');
        expect(error.constraints).toEqual(['required', 'format:email', 'minimum:18']);
        expect(error.metadata.validationErrors).toEqual(errors);
      });
    });

    describe('forMissingField', () => {
      it('should create missing field error', () => {
        const error = ValidationError.forMissingField('email');
        
        expect(error.message).toBe("Required field 'email' is missing");
        expect(error.field).toBe('email');
        expect(error.constraints).toEqual(['required']);
      });
    });

    describe('forInvalidType', () => {
      it('should create invalid type error', () => {
        const error = ValidationError.forInvalidType('age', 'number', 'string');
        
        expect(error.message).toBe("Field 'age' expected type 'number' but received 'string'");
        expect(error.field).toBe('age');
        expect(error.value).toBe('string');
        expect(error.constraints).toEqual(['type:number']);
      });
    });

    describe('forInvalidFormat', () => {
      it('should create invalid format error', () => {
        const error = ValidationError.forInvalidFormat('date', 'ISO8601', '2023-13-01');
        
        expect(error.message).toBe("Field 'date' has invalid format. Expected: ISO8601");
        expect(error.field).toBe('date');
        expect(error.value).toBe('2023-13-01');
        expect(error.constraints).toEqual(['format:ISO8601']);
      });
    });

    describe('forOutOfRange', () => {
      it('should create out of range error with min and max', () => {
        const error = ValidationError.forOutOfRange('score', 150, 0, 100);
        
        expect(error.message).toBe("Field 'score' is out of valid range (0-100)");
        expect(error.field).toBe('score');
        expect(error.value).toBe(150);
        expect(error.constraints).toEqual(['range:0-100']);
      });

      it('should create minimum value error', () => {
        const error = ValidationError.forOutOfRange('age', 10, 18);
        
        expect(error.message).toBe("Field 'age' is out of valid range (minimum: 18)");
        expect(error.constraints).toEqual(['min:18']);
      });

      it('should create maximum value error', () => {
        const error = ValidationError.forOutOfRange('length', 200, undefined, 100);
        
        expect(error.message).toBe("Field 'length' is out of valid range (maximum: 100)");
        expect(error.constraints).toEqual(['max:100']);
      });

      it('should create generic range error', () => {
        const error = ValidationError.forOutOfRange('value', 'invalid');
        
        expect(error.message).toBe("Field 'value' is out of valid range");
        expect(error.constraints).toEqual(['range']);
      });
    });
  });

  describe('inheritance', () => {
    it('should be instance of BaseError', () => {
      const error = new ValidationError('Test');
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});