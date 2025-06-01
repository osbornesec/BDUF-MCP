import { BaseEntity, Priority, Metadata, UUID } from './common';

export enum ProjectStatus {
  INITIATION = 'initiation',
  ANALYSIS = 'analysis',
  DESIGN = 'design',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export interface Project extends BaseEntity {
  name: string;
  description: string;
  status: ProjectStatus;
  requirements?: Requirements;
  architecture?: Architecture;
  tasks: Task[];
  timeline?: Timeline;
  stakeholders: Stakeholder[];
  metadata: ProjectMetadata;
  ownerId: UUID;
  organizationId?: UUID;
}

export interface ProjectMetadata extends Metadata {
  budget?: number;
  currency?: string;
  deadline?: Date;
  priority: Priority;
  confidentialityLevel: 'public' | 'internal' | 'confidential' | 'secret';
  complianceRequirements?: string[];
  businessValue?: string;
  successCriteria?: string[];
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface Stakeholder {
  id: UUID;
  userId?: UUID;
  role: StakeholderRole;
  name: string;
  email?: string;
  organization?: string;
  expertise: string[];
  influence: 'low' | 'medium' | 'high';
  interest: 'low' | 'medium' | 'high';
  communicationPreferences: CommunicationPreference[];
  timezone?: string;
  availability?: AvailabilityWindow[];
}

export enum StakeholderRole {
  SPONSOR = 'sponsor',
  PRODUCT_OWNER = 'product_owner',
  PROJECT_MANAGER = 'project_manager',
  ARCHITECT = 'architect',
  TECH_LEAD = 'tech_lead',
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  QA_ENGINEER = 'qa_engineer',
  BUSINESS_ANALYST = 'business_analyst',
  SUBJECT_MATTER_EXPERT = 'subject_matter_expert',
  END_USER = 'end_user',
  STAKEHOLDER = 'stakeholder'
}

export interface CommunicationPreference {
  channel: 'email' | 'slack' | 'teams' | 'phone' | 'in_person' | 'video_call';
  frequency: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'as_needed';
  priority: Priority;
}

export interface AvailabilityWindow {
  dayOfWeek: number; // 0-6, Sunday = 0
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  phases: Phase[];
  criticalPath?: CriticalPath;
}

export interface Milestone {
  id: UUID;
  name: string;
  description: string;
  date: Date;
  dependencies: UUID[];
  deliverables: string[];
  successCriteria: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'at_risk' | 'delayed';
}

export interface Phase {
  id: UUID;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  objectives: string[];
  deliverables: string[];
  resources: ResourceRequirement[];
  riskFactors: string[];
}

export interface ResourceRequirement {
  type: 'human' | 'infrastructure' | 'software' | 'hardware' | 'external_service';
  name: string;
  quantity: number;
  unit: string;
  duration?: number;
  cost?: number;
  currency?: string;
  criticality: Priority;
}

export interface CriticalPath {
  tasks: UUID[];
  totalDuration: number;
  slackTime: number;
  bottlenecks: Bottleneck[];
}

export interface Bottleneck {
  taskId: UUID;
  type: 'resource' | 'dependency' | 'skill' | 'external';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: string;
}

// Forward declarations for types defined in other files
export interface Requirements {
  // Will be defined in requirements.ts
  id: UUID;
}

export interface Architecture {
  // Will be defined in architecture.ts
  id: UUID;
}

export interface Task {
  // Will be defined in task.ts
  id: UUID;
}