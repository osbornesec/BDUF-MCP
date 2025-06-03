/**
 * Create Project Tool
 * Creates a new BDUF project with comprehensive initial setup
 */

import { MCPTool } from '../../shared/types/mcp.js';
import { db } from '../../infrastructure/database.js';
import { Logger } from '../../shared/logger.js';
import { ValidationError } from '../../shared/errors/index.js';

const logger = new Logger('CreateProjectTool');

interface CreateProjectParams {
  name: string;
  description?: string;
  organizationId: string;
  methodology?: string;
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedHours?: number;
  deadline?: string;
  tags?: string[];
  settings?: Record<string, any>;
}

export const createProjectTool: MCPTool = {
  name: 'create_project',
  description: 'Create a new BDUF project with comprehensive initial setup and methodology configuration',
  requiresAuth: true,
  progressReporting: true,
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Project name',
        minLength: 3,
        maxLength: 100
      },
      description: {
        type: 'string',
        description: 'Project description',
        maxLength: 1000
      },
      organizationId: {
        type: 'string',
        description: 'Organization ID for multi-tenant support'
      },
      methodology: {
        type: 'string',
        description: 'Development methodology',
        enum: ['BDUF', 'AGILE', 'WATERFALL', 'HYBRID'],
        default: 'BDUF'
      },
      complexity: {
        type: 'string',
        description: 'Project complexity level',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
        default: 'MEDIUM'
      },
      priority: {
        type: 'string',
        description: 'Project priority',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
      },
      estimatedHours: {
        type: 'number',
        description: 'Estimated project hours',
        minimum: 1,
        maximum: 100000
      },
      deadline: {
        type: 'string',
        description: 'Project deadline in ISO 8601 format',
        pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?$'
      },
      tags: {
        type: 'array',
        description: 'Project tags for categorization',
        items: {
          type: 'string',
          minLength: 1,
          maxLength: 50
        },
        maxItems: 20
      },
      settings: {
        type: 'object',
        description: 'Additional project settings and configuration'
      }
    },
    required: ['name', 'organizationId']
  },
  handler: async (params: CreateProjectParams) => {
    try {
      logger.info('Creating new BDUF project', {
        projectName: params.name,
        organizationId: params.organizationId,
        methodology: params.methodology || 'BDUF'
      });

      // Validate organization exists
      const organization = await db.getClient().organization.findUnique({
        where: { id: params.organizationId }
      });

      if (!organization) {
        throw new ValidationError(`Organization with ID ${params.organizationId} not found`);
      }

      if (organization.status !== 'ACTIVE') {
        throw new ValidationError(`Organization ${organization.name} is not active`);
      }

      // Generate unique slug
      const baseSlug = params.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      let slug = baseSlug;
      let counter = 1;

      // Ensure slug uniqueness within organization
      while (await db.getClient().project.findUnique({
        where: {
          organizationId_slug: {
            organizationId: params.organizationId,
            slug: slug
          }
        }
      })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create project with transaction
      const project = await db.withTransaction(async (prisma) => {
        // Create the project
        const newProject = await prisma.project.create({
          data: {
            name: params.name,
            description: params.description || null,
            slug: slug,
            organizationId: params.organizationId,
            createdById: 'system', // TODO: Get from auth context
            methodology: params.methodology || 'BDUF',
            complexity: params.complexity || 'MEDIUM',
            priority: params.priority || 'MEDIUM',
            estimatedHours: params.estimatedHours,
            deadline: params.deadline ? new Date(params.deadline) : null,
            tags: params.tags || [],
            settings: params.settings || {},
            phase: 'REQUIREMENTS',
            status: 'PLANNING'
          },
          include: {
            organization: {
              select: {
                name: true,
                slug: true,
                plan: true
              }
            }
          }
        });

        // Create initial project member (creator as owner)
        await prisma.projectMember.create({
          data: {
            projectId: newProject.id,
            userId: 'system', // TODO: Get from auth context
            role: 'OWNER',
            permissions: ['READ', 'WRITE', 'DELETE', 'MANAGE_MEMBERS', 'MANAGE_SETTINGS']
          }
        });

        // Create initial analysis records for BDUF methodology
        if (params.methodology === 'BDUF' || !params.methodology) {
          const analysisTypes = [
            'REQUIREMENTS',
            'ARCHITECTURE', 
            'RISK',
            'COMPLIANCE'
          ] as const;

          for (const type of analysisTypes) {
            await prisma.analysis.create({
              data: {
                type: type,
                title: `Initial ${type.toLowerCase()} analysis`,
                description: `Comprehensive ${type.toLowerCase()} analysis for ${params.name}`,
                methodology: 'BDUF',
                projectId: newProject.id,
                createdBy: 'system', // TODO: Get from auth context
                status: 'PENDING'
              }
            });
          }
        }

        return newProject;
      });

      logger.info('Project created successfully', {
        metadata: {
          projectId: project.id,
          projectName: project.name,
          slug: project.slug,
          organizationName: (project as any).organization.name
        }
      });

      return {
        success: true,
        data: {
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            slug: project.slug,
            status: project.status,
            phase: project.phase,
            methodology: project.methodology,
            complexity: project.complexity,
            priority: project.priority,
            estimatedHours: project.estimatedHours,
            deadline: project.deadline,
            tags: project.tags,
            createdAt: project.createdAt,
            organization: (project as any).organization
          },
          nextSteps: [
            'Define and analyze project requirements',
            'Generate architecture options',
            'Conduct risk assessment',
            'Validate compliance requirements',
            'Set up collaboration sessions'
          ]
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `create_project_${Date.now()}`,
          toolName: 'create_project'
        }
      };

    } catch (error) {
      logger.error('Failed to create project', error as Error, {
        metadata: {
          projectName: params.name,
          organizationId: params.organizationId
        }
      });

      throw error;
    }
  }
};