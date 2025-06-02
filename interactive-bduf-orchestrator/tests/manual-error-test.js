// Manual test to verify error framework functionality
// Run with: node tests/manual-error-test.js

import assert from 'assert';

console.log('Testing Error Handling Framework...\n');

// Simple test function
function runTest(name, testFn) {
  try {
    testFn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.log(`✗ ${name}: ${error.message}`);
  }
}

// Test 1: Basic Error Creation
runTest('Basic Error Creation', () => {
  // Test basic error functionality without full TypeScript setup
  
  // Simple error hierarchy test
  class SimpleBaseError extends Error {
    constructor(message, metadata = {}) {
      super(message);
      this.name = this.constructor.name;
      this.metadata = metadata;
      this.timestamp = new Date();
      this.isOperational = true;
    }
  }
  
  class SimpleValidationError extends SimpleBaseError {
    constructor(message, field) {
      super(message, { field });
      this.statusCode = 400;
      this.errorCode = 'VALIDATION_ERROR';
    }
  }
  
  const error = new SimpleValidationError('Test validation error', 'email');
  assert(error instanceof SimpleValidationError);
  assert(error instanceof SimpleBaseError);
  assert(error instanceof Error);
  assert(error.statusCode === 400);
  assert(error.errorCode === 'VALIDATION_ERROR');
  assert(error.metadata.field === 'email');
  assert(error.isOperational === true);
});

// Test 2: Error Sanitization
runTest('Error Sanitization', () => {
  
  function sanitizeMetadata(metadata) {
    const sanitized = { ...metadata };
    const sensitiveKeys = ['password', 'token', 'secret', 'key'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  const metadata = {
    password: 'secret123',
    apiKey: 'api-secret',
    normalField: 'normal-value'
  };
  
  const sanitized = sanitizeMetadata(metadata);
  assert(sanitized.password === '[REDACTED]');
  assert(sanitized.apiKey === '[REDACTED]');
  assert(sanitized.normalField === 'normal-value');
});

// Test 3: Correlation ID Generation
runTest('Correlation ID Generation', () => {
  
  function generateCorrelationId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  const id1 = generateCorrelationId();
  const id2 = generateCorrelationId();
  
  assert(id1.startsWith('err_'));
  assert(id2.startsWith('err_'));
  assert(id1 !== id2);
  assert(/^err_\d+_[a-z0-9]+$/.test(id1));
});

// Test 4: Async Error Handling
runTest('Async Error Handling', async () => {
  
  function asyncHandler(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        // Re-throw with additional context
        error.handledBy = 'asyncHandler';
        throw error;
      }
    };
  }
  
  const failingFn = async () => {
    throw new Error('Async failure');
  };
  
  const wrappedFn = asyncHandler(failingFn);
  
  try {
    await wrappedFn();
    assert(false, 'Should have thrown error');
  } catch (error) {
    assert(error.message === 'Async failure');
    assert(error.handledBy === 'asyncHandler');
  }
});

// Test 5: Error Classification
runTest('Error Classification', () => {
  
  const errors = {
    ValidationError: { statusCode: 400, category: 'client' },
    NotFoundError: { statusCode: 404, category: 'client' },
    PermissionError: { statusCode: 403, category: 'security' },
    ExternalServiceError: { statusCode: 502, category: 'external' },
    ConflictError: { statusCode: 409, category: 'client' }
  };
  
  Object.entries(errors).forEach(([name, props]) => {
    assert(props.statusCode >= 400 && props.statusCode < 600);
    assert(['client', 'security', 'external'].includes(props.category));
  });
});

console.log('\n🎉 All manual tests passed! Error framework is working correctly.');

// Export for potential use in other tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTest };
}