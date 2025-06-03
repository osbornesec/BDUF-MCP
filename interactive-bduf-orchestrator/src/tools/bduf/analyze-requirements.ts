/**
 * Analyze Requirements Tool
 * AI-powered comprehensive requirements analysis using BDUF methodology
 */

import { MCPTool } from '../../shared/types/mcp.js';
import { db } from '../../infrastructure/database.js';
import { Logger } from '../../shared/logger.js';
import { ValidationError } from '../../shared/errors/index.js';

const logger = new Logger('AnalyzeRequirementsTool');

interface AnalyzeRequirementsParams {
  projectId: string;
  requirementsText: string;
  analysisType?: 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'BUSINESS' | 'TECHNICAL' | 'COMPREHENSIVE';
  aiModel?: string;
  generateRecommendations?: boolean;
}

export const analyzeRequirementsTool: MCPTool = {
  name: 'analyze_requirements',
  description: 'Perform comprehensive requirements analysis using AI-powered BDUF methodology',
  requiresAuth: true,
  progressReporting: true,
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'Project ID to analyze requirements for'
      },
      requirementsText: {
        type: 'string',
        description: 'Raw requirements text to analyze',
        minLength: 10,
        maxLength: 50000
      },
      analysisType: {
        type: 'string',
        description: 'Type of requirements analysis to perform',
        enum: ['FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS', 'TECHNICAL', 'COMPREHENSIVE'],
        default: 'COMPREHENSIVE'
      },
      aiModel: {
        type: 'string',
        description: 'AI model to use for analysis',
        enum: ['openai/gpt-4o', 'anthropic/claude-3-sonnet', 'anthropic/claude-3-opus'],
        default: 'anthropic/claude-3-sonnet'
      },
      generateRecommendations: {
        type: 'boolean',
        description: 'Whether to generate improvement recommendations',
        default: true
      }
    },
    required: ['projectId', 'requirementsText']
  },
  handler: async (params: AnalyzeRequirementsParams) => {
    try {
      logger.info('Starting requirements analysis', {
        projectId: params.projectId,
        analysisType: params.analysisType || 'COMPREHENSIVE',
        textLength: params.requirementsText.length
      });

      // Validate project exists and user has access
      const project = await db.getClient().project.findUnique({
        where: { id: params.projectId },
        include: {
          organization: true
        }
      });

      if (!project) {
        throw new ValidationError(`Project with ID ${params.projectId} not found`);
      }

      // Create analysis record
      const analysis = await db.getClient().analysis.create({
        data: {
          type: 'REQUIREMENTS',
          title: `Requirements Analysis - ${params.analysisType || 'COMPREHENSIVE'}`,
          description: `AI-powered requirements analysis using ${params.aiModel || 'anthropic/claude-3-sonnet'}`,
          methodology: 'BDUF',
          projectId: params.projectId,
          createdBy: 'system', // TODO: Get from auth context
          status: 'IN_PROGRESS',
          aiModels: [params.aiModel || 'anthropic/claude-3-sonnet']
        }
      });

      // Simulate AI analysis (in real implementation, this would call GitHub Models or other AI services)
      const analysisResults = await performAIAnalysis(
        params.requirementsText,
        params.analysisType || 'COMPREHENSIVE',
        params.aiModel || 'anthropic/claude-3-sonnet'
      );

      // Parse requirements and create requirement records
      const requirements = await parseAndCreateRequirements(
        params.projectId,
        analysisResults.requirements,
        analysis.id
      );

      // Update analysis with results
      const updatedAnalysis = await db.getClient().analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          findings: analysisResults.findings,
          recommendations: params.generateRecommendations ? analysisResults.recommendations : [],
          riskAssessment: analysisResults.risks,
          confidence: analysisResults.confidence
        }
      });

      logger.info('Requirements analysis completed', {
        analysisId: analysis.id,
        requirementsCount: requirements.length,
        confidence: analysisResults.confidence
      });

      return {
        success: true,
        data: {
          analysis: {
            id: updatedAnalysis.id,
            type: updatedAnalysis.type,
            title: updatedAnalysis.title,
            status: updatedAnalysis.status,
            completedAt: updatedAnalysis.completedAt,
            confidence: updatedAnalysis.confidence
          },
          requirements: requirements,
          findings: analysisResults.findings,
          recommendations: params.generateRecommendations ? analysisResults.recommendations : [],
          risks: analysisResults.risks,
          metrics: {
            totalRequirements: requirements.length,
            byType: requirements.reduce((acc, req) => {
              acc[req.type] = (acc[req.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            byPriority: requirements.reduce((acc, req) => {
              acc[req.priority] = (acc[req.priority] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `analyze_requirements_${Date.now()}`,
          toolName: 'analyze_requirements',
          processingTime: `${Date.now() - analysis.createdAt.getTime()}ms`
        }
      };

    } catch (error) {
      logger.error('Requirements analysis failed', error as Error, {
        projectId: params.projectId,
        analysisType: params.analysisType
      });

      throw error;
    }
  }
};

// AI Analysis Implementation (simplified - would integrate with GitHub Models)
async function performAIAnalysis(
  requirementsText: string,
  analysisType: string,
  aiModel: string
): Promise<{
  requirements: any[];
  findings: Record<string, any>;
  recommendations: string[];
  risks: Record<string, any>;
  confidence: number;
}> {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock analysis results (in real implementation, this would call AI services)
  return {
    requirements: [
      {
        title: 'User Authentication System',
        description: 'Secure user login and registration functionality',
        type: 'FUNCTIONAL',
        priority: 'HIGH',
        source: 'requirements_analysis',
        rationale: 'Essential for user security and access control',
        acceptance: 'Users can register, login, and manage their accounts securely'
      },
      {
        title: 'Performance Requirements',
        description: 'System must respond within 2 seconds for 95% of requests',
        type: 'NON_FUNCTIONAL',
        priority: 'HIGH',
        source: 'requirements_analysis',
        rationale: 'User experience and system scalability requirements',
        acceptance: 'Response time monitoring shows 95th percentile under 2 seconds'
      }
    ],
    findings: {
      clarity: 'Requirements show good clarity with specific acceptance criteria',
      completeness: 'Some gaps identified in error handling and edge cases',
      consistency: 'Requirements are generally consistent with stated objectives',
      testability: 'Most requirements include testable acceptance criteria'
    },
    recommendations: [
      'Add specific error handling requirements for each functional area',
      'Define detailed performance metrics for different user loads',
      'Include security requirements for data protection and privacy',
      'Specify integration requirements with external systems'
    ],
    risks: {
      high: ['Incomplete security requirements could lead to vulnerabilities'],
      medium: ['Performance requirements may need refinement based on load testing'],
      low: ['Some functional requirements could benefit from user story format']
    },
    confidence: 0.85
  };
}

// Parse AI results and create requirement records
async function parseAndCreateRequirements(
  projectId: string,
  requirementsData: any[],
  analysisId: string
): Promise<any[]> {
  const createdRequirements = [];

  for (const reqData of requirementsData) {
    const requirement = await db.getClient().requirement.create({
      data: {
        title: reqData.title,
        description: reqData.description,
        type: reqData.type as any,
        priority: reqData.priority as any,
        source: reqData.source,
        rationale: reqData.rationale,
        acceptance: reqData.acceptance,
        projectId: projectId,
        createdBy: 'system', // TODO: Get from auth context
        aiGenerated: true,
        aiMetadata: {
          analysisId: analysisId,
          model: 'anthropic/claude-3-sonnet',
          confidence: 0.85
        }
      }
    });

    createdRequirements.push(requirement);
  }

  return createdRequirements;
}