#!/usr/bin/env node
/**
 * SQL Validation Script
 * Validates SQL files for transformation patterns
 */

const { applyTransformationValidator, validateSQLStructure } = require('../lib/validation');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  include: ['**/*.sql', '**/*.bqsql'],
  exclude: ['node_modules/**', 'dist/**', '.next/**', 'migrations/**'],
  errors: [],
  filesChecked: 0
};

function validateSQLFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    CONFIG.filesChecked++;
    
    const hasValidation = applyTransformationValidator(content);
    const sqlAnalysis = validateSQLStructure(content);
    
    const issues = [];
    
    if (!hasValidation) {
      issues.push('SQL missing required patterns (SELECT, FROM, WHERE, .validate())');
    }
    
    if (!sqlAnalysis.isValid) {
      issues.push('SQL structure invalid - missing essential clauses');
    }
    
    if (issues.length > 0) {
      CONFIG.errors.push({
        file: filePath,
        hasValidation,
        sqlAnalysis,
        issues
      });
    }
    
    return { hasValidation, sqlAnalysis, issues };
    
  } catch (error) {
    CONFIG.errors.push({
      file: filePath,
      hasValidation: false,
      sqlAnalysis: {},
      issues: [`Error reading file: ${error.message}`]
    });
  }
}

function getFiles(dir, patternArray) {
  let results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    const isExcluded = CONFIG.exclude.some(excludePattern => {
      const regex = new RegExp('^' + excludePattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
      return regex.test(fullPath);
    });
    
    if (isExcluded) continue;
    
    if (item.isDirectory()) {
      results = results.concat(getFiles(fullPath, patternArray));
    } else {
      const isIncluded = patternArray.some(pattern => {
        const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
        return regex.test(fullPath);
      });
      
      if (isIncluded) {
        results.push(fullPath);
      }
    }
  }
  
  return results;
}

function main() {
  const files = getFiles(process.cwd(), CONFIG.include);
  
  console.log(`Checking ${files.length} SQL files for transformation validation...`);
  
  files.forEach(file => validateSQLFile(file));
  
  console.log(`\n📊 Summary:`);
  console.log(`  Files checked: ${CONFIG.filesChecked}`);
  console.log(`  Issues found: ${CONFIG.errors.length}`);
  
  if (CONFIG.errors.length > 0) {
    console.error('\n❌ SQL Transformation Issues Found:');
    CONFIG.errors.forEach(error => {
      console.error(`\n📄 ${error.file}:`);
      error.issues.forEach(issue => console.error(`  • ${issue}`));
    });
    process.exit(1);
  } else {
    console.log('\n✅ All SQL files pass transformation validation!');
    process.exit(0);
  }
}

main();