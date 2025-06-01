// Common types used throughout the application

export type UUID = string;

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum Status {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export interface Timestamp {
  createdAt: Date;
  updatedAt: Date;
}

export interface OptionalTimestamp {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Metadata {
  [key: string]: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

export interface SearchParams {
  query: string;
  filters?: FilterParams;
  pagination?: PaginationParams;
}

export type EntityId = UUID;

export interface BaseEntity extends Timestamp {
  id: EntityId;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: Date;
  isDeleted: boolean;
}

export interface TaggedEntity {
  tags: string[];
}

export interface VersionedEntity {
  version: string;
  versionHistory: VersionHistory[];
}

export interface VersionHistory {
  version: string;
  changes: string;
  changedBy: EntityId;
  changedAt: Date;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorInfo {
  code: string;
  message: string;
  details?: Metadata;
  severity: ErrorSeverity;
  timestamp: Date;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  metadata?: Metadata;
}

export interface ErrorResponse {
  success: false;
  error: ErrorInfo;
  requestId?: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export interface AsyncOperation {
  operationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  result?: unknown;
  error?: ErrorInfo;
  startedAt: Date;
  completedAt?: Date;
}

export interface ConfigValue {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: unknown;
  description?: string;
}

export interface Feature {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: Metadata;
}