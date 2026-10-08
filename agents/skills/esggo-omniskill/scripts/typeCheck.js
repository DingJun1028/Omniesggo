#!/usr/bin/env node
/**
 * Type Safety Validation Script
 * Validates type safety across the codebase
 */

const { enforceTypeSafety } = require('../lib/validation');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  exclude: ['node_modules/**', 'dist/**', '.next/**'],
  errors: []
};

// Find all files to check
function getFiles(dir, patternArray) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    // Check if should be excluded
    const isExcluded = CONFIG.exclude.some(excludePattern => {
      const regex = new RegExp('^' + escapeRegExp(excludePattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')) + '$');
      return regex.test(fullPath);
    });
    
    if (isExcluded) continue;
    
    if (item.isDirectory()) {
      results = results.concat(getFiles(fullPath, patternArray));
    } else {
      const isIncluded = patternArray.some(pattern => {
        const regex = new RegExp('^' + escapeRegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')) + '$');
        return regex.test(fullPath);
      });
      
      if (isIncluded) {
        results.push(fullPath);
      }
    }
  }
  
  return results;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Validate a single file
function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic type safety checks
    const issues = [];
    
    // Check for 'any' type usage
    const anyMatches = content.match(/\bany\b/g);
    if (anyMatches) {
      issues.push(`Found ${anyMatches.length} usage(s) of 'any' type`);
    }
    
    // Check for missing return types in functions (simple check)
    const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*{/g);
    if (functionMatches) {
      // In a real implementation, we would parse the AST
      // This is a simplified check
      issues.push(`Found ${functionMatches.length} function(s) - check return types`);
    }
    
    // Check for proper type annotations (basic)
    const paramMatches = content.match(/:\s*\w+\s*[,=)]/g);
    // This is just illustrative
    
    if (issues.length > 0) {
      CONFIG.errors.push({
        file: filePath,
        issues: issues
      });
    }
  } catch (error) {
    CONFIG.errors.push({
      file: filePath,
      issues: [`Error reading file: ${error.message}`]
    });
  }
}

// Main execution
function main() {
  const files = getFiles(process.cwd(), CONFIG.include);
  
  console.log(`Checking ${files.length} files for type safety...`);
  
  files.forEach(file => validateFile(file));
  
  if (CONFIG.errors.length > 0) {
    console.error('\n❌ Type Safety Issues Found:');
    CONFIG.errors.forEach(error => {
      console.error(`\n📄 ${error.file}:`);
      error.issues.forEach(issue => console.error(`  • ${issue}`));
    });
    process.exit(1);
  } else {
    console.log('\n✅ All files pass type safety checks!');
    process.exit(0);
  }
}

main();