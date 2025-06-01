#!/usr/bin/env node

/**
 * Auto-generate JSDoc comments for TypeScript functions that don't have documentation
 * This script analyzes TypeScript files and adds missing JSDoc comments based on function signatures
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  sourceDir: join(__dirname, '..', 'src'),
  excludeDirs: ['node_modules', 'dist', 'build', 'coverage', 'tests'],
  fileExtensions: ['.ts'],
  skipFiles: ['.d.ts', '.test.ts', '.spec.ts'],
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

/**
 * Main function to generate JSDoc comments
 */
async function main() {
  console.log('🔍 Scanning for TypeScript files without JSDoc comments...');
  
  const files = getAllTypeScriptFiles(CONFIG.sourceDir);
  let totalFunctions = 0;
  let documentedFunctions = 0;
  let addedComments = 0;

  for (const file of files) {
    const result = await processFile(file);
    totalFunctions += result.totalFunctions;
    documentedFunctions += result.documentedFunctions;
    addedComments += result.addedComments;
  }

  console.log('\n📊 Summary:');
  console.log(`  Total functions found: ${totalFunctions}`);
  console.log(`  Already documented: ${documentedFunctions}`);
  console.log(`  JSDoc comments added: ${addedComments}`);
  
  const coverage = totalFunctions > 0 ? ((documentedFunctions + addedComments) / totalFunctions * 100).toFixed(1) : 100;
  console.log(`  Documentation coverage: ${coverage}%`);

  if (CONFIG.dryRun) {
    console.log('\n⚠️  Dry run mode - no files were modified');
  }
}

/**
 * Get all TypeScript files recursively from a directory
 * @param {string} dir - Directory to scan
 * @returns {string[]} Array of file paths
 */
function getAllTypeScriptFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(item) && !item.startsWith('.')) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = extname(item);
        const shouldSkip = CONFIG.skipFiles.some(skipPattern => item.includes(skipPattern));
        
        if (CONFIG.fileExtensions.includes(ext) && !shouldSkip) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

/**
 * Process a single TypeScript file to add missing JSDoc comments
 * @param {string} filePath - Path to the file to process
 * @returns {Promise<{totalFunctions: number, documentedFunctions: number, addedComments: number}>}
 */
async function processFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const functions = extractFunctions(content);
  let addedComments = 0;
  let modifiedContent = content;

  if (CONFIG.verbose) {
    console.log(`\n📄 Processing: ${filePath}`);
    console.log(`   Found ${functions.length} functions`);
  }

  for (const func of functions) {
    if (!func.hasJSDoc) {
      const jsDoc = generateJSDocComment(func);
      modifiedContent = insertJSDocComment(modifiedContent, func, jsDoc);
      addedComments++;
      
      if (CONFIG.verbose) {
        console.log(`   ✅ Added JSDoc for: ${func.name}`);
      }
    }
  }

  if (addedComments > 0 && !CONFIG.dryRun) {
    writeFileSync(filePath, modifiedContent, 'utf-8');
    console.log(`✨ Added ${addedComments} JSDoc comments to ${filePath}`);
  }

  return {
    totalFunctions: functions.length,
    documentedFunctions: functions.filter(f => f.hasJSDoc).length,
    addedComments
  };
}

/**
 * Extract function definitions from TypeScript content
 * @param {string} content - File content
 * @returns {Array} Array of function objects
 */
function extractFunctions(content) {
  const functions = [];
  const lines = content.split('\n');
  
  // Regex patterns for different function types
  const patterns = [
    // Regular functions: function name() {}
    /^\s*(export\s+)?(async\s+)?function\s+(\w+)\s*\(/,
    // Arrow functions: const name = () => {}
    /^\s*(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/,
    // Method definitions: methodName() {}
    /^\s*(public\s+|private\s+|protected\s+)?(async\s+)?(\w+)\s*\([^)]*\)\s*[:{}]/,
    // Class methods: async methodName() {}
    /^\s*(public\s+|private\s+|protected\s+)?(static\s+)?(async\s+)?(\w+)\s*\(/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const functionName = match[3] || match[2] || match[4];
        
        // Skip constructors and getters/setters
        if (functionName === 'constructor' || line.includes('get ') || line.includes('set ')) {
          continue;
        }

        // Check if there's already JSDoc comment above
        const hasJSDoc = hasExistingJSDoc(lines, i);
        
        functions.push({
          name: functionName,
          lineNumber: i,
          line: line.trim(),
          hasJSDoc,
          parameters: extractParameters(line),
          isAsync: line.includes('async'),
          isExported: line.includes('export'),
          accessibility: extractAccessibility(line)
        });
        break;
      }
    }
  }

  return functions;
}

/**
 * Check if a function already has JSDoc documentation
 * @param {string[]} lines - File lines
 * @param {number} functionLineIndex - Index of the function line
 * @returns {boolean} True if JSDoc exists
 */
function hasExistingJSDoc(lines, functionLineIndex) {
  // Look backwards from function line to find JSDoc
  for (let i = functionLineIndex - 1; i >= 0; i--) {
    const line = lines[i].trim();
    
    if (line === '*/') {
      // Found end of JSDoc, look for start
      for (let j = i - 1; j >= 0; j--) {
        if (lines[j].trim().startsWith('/**')) {
          return true;
        }
      }
    }
    
    // Stop if we hit another function or significant code
    if (line && !line.startsWith('//') && !line.startsWith('*') && line !== '') {
      break;
    }
  }
  
  return false;
}

/**
 * Extract function parameters from function signature
 * @param {string} line - Function line
 * @returns {Array} Array of parameter objects
 */
function extractParameters(line) {
  const params = [];
  const paramMatch = line.match(/\(([^)]*)\)/);
  
  if (paramMatch && paramMatch[1].trim()) {
    const paramString = paramMatch[1];
    const paramList = paramString.split(',').map(p => p.trim());
    
    for (const param of paramList) {
      if (param) {
        const [name, type] = param.split(':').map(p => p.trim());
        params.push({
          name: name.replace(/[?=].*$/, ''), // Remove optional/default markers
          type: type || 'unknown',
          optional: param.includes('?') || param.includes('=')
        });
      }
    }
  }
  
  return params;
}

/**
 * Extract accessibility modifier from function line
 * @param {string} line - Function line
 * @returns {string} Accessibility level
 */
function extractAccessibility(line) {
  if (line.includes('private')) return 'private';
  if (line.includes('protected')) return 'protected';
  return 'public';
}

/**
 * Generate JSDoc comment for a function
 * @param {Object} func - Function object
 * @returns {string} JSDoc comment
 */
function generateJSDocComment(func) {
  const lines = [];
  
  lines.push('/**');
  
  // Generate description based on function name
  const description = generateDescription(func.name);
  lines.push(` * ${description}`);
  
  // Add blank line if there are parameters or return type
  if (func.parameters.length > 0 || func.isAsync) {
    lines.push(' *');
  }
  
  // Add parameter documentation
  for (const param of func.parameters) {
    const optional = param.optional ? ' [optional]' : '';
    lines.push(` * @param {${param.type}} ${param.name}${optional} - Description for ${param.name}`);
  }
  
  // Add return type documentation
  if (func.isAsync) {
    lines.push(' * @returns {Promise<void>} Promise that resolves when operation completes');
  } else if (!func.line.includes('void')) {
    lines.push(' * @returns {unknown} Return value description');
  }
  
  // Add additional tags for special cases
  if (func.isExported) {
    lines.push(' * @public');
  }
  
  if (func.accessibility === 'private') {
    lines.push(' * @private');
  } else if (func.accessibility === 'protected') {
    lines.push(' * @protected');
  }
  
  lines.push(' */');
  
  return lines.join('\n');
}

/**
 * Generate a description based on function name
 * @param {string} functionName - Name of the function
 * @returns {string} Generated description
 */
function generateDescription(functionName) {
  // Convert camelCase to words
  const words = functionName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  
  // Common patterns
  if (functionName.startsWith('get')) {
    return `Gets ${words.substring(4)}`;
  } else if (functionName.startsWith('set')) {
    return `Sets ${words.substring(4)}`;
  } else if (functionName.startsWith('create')) {
    return `Creates ${words.substring(7)}`;
  } else if (functionName.startsWith('delete')) {
    return `Deletes ${words.substring(7)}`;
  } else if (functionName.startsWith('update')) {
    return `Updates ${words.substring(7)}`;
  } else if (functionName.startsWith('validate')) {
    return `Validates ${words.substring(9)}`;
  } else if (functionName.startsWith('process')) {
    return `Processes ${words.substring(8)}`;
  } else if (functionName.startsWith('handle')) {
    return `Handles ${words.substring(7)}`;
  } else if (functionName.startsWith('is')) {
    return `Checks if ${words.substring(3)}`;
  } else if (functionName.startsWith('has')) {
    return `Checks if has ${words.substring(4)}`;
  } else if (functionName.startsWith('can')) {
    return `Checks if can ${words.substring(4)}`;
  } else {
    return `${words.charAt(0).toUpperCase() + words.slice(1)} function`;
  }
}

/**
 * Insert JSDoc comment above a function
 * @param {string} content - File content
 * @param {Object} func - Function object
 * @param {string} jsDoc - JSDoc comment to insert
 * @returns {string} Modified content
 */
function insertJSDocComment(content, func, jsDoc) {
  const lines = content.split('\n');
  const functionLine = func.lineNumber;
  
  // Find the appropriate insertion point (account for decorators, etc.)
  let insertLine = functionLine;
  
  // Look backwards to find where to insert (skip decorators, existing comments)
  for (let i = functionLine - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('@') || line.startsWith('//') || line === '') {
      continue;
    }
    insertLine = i + 1;
    break;
  }
  
  // Insert JSDoc with proper indentation
  const indentation = lines[functionLine].match(/^\s*/)[0];
  const indentedJSDoc = jsDoc.split('\n').map(line => 
    line === '/**' || line === ' */' ? indentation + line : indentation + line
  ).join('\n');
  
  lines.splice(insertLine, 0, indentedJSDoc);
  
  return lines.join('\n');
}

// Run the script
main().catch(console.error);