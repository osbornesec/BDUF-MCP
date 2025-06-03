/**
 * BDUF (Big Design Up Front) Tools Registration
 * Tools for comprehensive project analysis and design methodology
 */

import { ToolRegistry } from '../../server/tool-registry.js';
import { createProjectTool } from './create-project.js';
import { analyzeRequirementsTool } from './analyze-requirements.js';
import { generateArchitectureTool } from './generate-architecture.js';
import { assessRiskTool } from './assess-risk.js';
import { validateComplianceTool } from './validate-compliance.js';
import { trackProgressTool } from './track-progress.js';

export async function registerBDUFTools(registry: ToolRegistry): Promise<void> {
  // Project Management Tools
  registry.register(createProjectTool);
  registry.register(trackProgressTool);

  // BDUF Analysis Tools
  registry.register(analyzeRequirementsTool);
  registry.register(generateArchitectureTool);
  registry.register(assessRiskTool);
  registry.register(validateComplianceTool);
}