#!/usr/bin/env node
/**
 * BigQuery Data Quality Validation Script
 * Validates BigQuery SQL files for quality and metadata
 */

const { validateBigQueryMetadata, applyTransformationValidator } = require('../lib/validation');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  include: ['**/*.sql', '**/*.bqsql'],
  exclude: ['node_modules/**', 'dist/**', '.next/**', 'migrations/**'],
  errors: [],
  filesChecked: 0
};

// SQL validation patterns
const SQL_PATTERNS = {
  createTable: /CREATE\s+TABLE/i,
  insert: /INSERT\s+INTO/i,
  update: /UPDATE\s+\w+/i,
  delete: /DELETE\s+FROM/i,
  select: /SELECT\s+/i,
  withClause: /WITH\s+\w+\s+AS/i,
  join: /\bJOIN\b/i,
  validate: /\.validate\(\)/i,
  comment: /--.*\n|/\*.*\*\//g,
  metadata: /OPTIONS\s*\(\s*\n?\s*.*/i
};

function validateSQLFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    CONFIG.filesChecked++;
    
    const analysis = {
      hasSelect: SQL_PATTERNS.select.test(content),
      hasFrom: SQL_PATTERNS.select.test(content),
      hasValidation: SQL_PATTERNS.validate.test(content),
      hasMetadata: SQL_PATTERNS.metadata.test(content),
      hasComments: SQL_PATTERNS.comment.test(content),
      hasJoins: SQL_PATTERNS.join.test(content),
      hasCTE: SQL_PATTERNS.withClause.test(content),
      lines: content.split('\n').length,
      statements: (content.match(/;/g) || []).length
    };
    
    // Check for validation function
    const hasValidation = applyTransformationValidator(content);
    
    // Check for metadata
    const hasMetadata = SQL_PATTERNS.metadata.test(content);
    
    // Check for comments
    const hasComments = SQL_PATTERNS.comment.test(content);
    
    // Validation rules
    const issues = [];
    
    if (!analysis.hasSelect && !analysis.hasCreateTable && !analysis.hasInsert && !analysis.hasUpdate && !analysis.hasDelete) {
      issues.push('No recognized SQL statement found');
    }
    
    if (!hasValidation) {
      issues.push('Missing .validate() function call');
    }
    
    if (!hasMetadata) {
      issues.push('Missing metadata (OPTIONS clause)');
    }
    
    if (!hasComments) {
      issues.push('Missing SQL comments for documentation');
    }
    
    // Check for SELECT without FROM (potential issue)
    if (analysis.hasSelect && !analysis.hasFrom && !analysis.hasCTE) {
      issues.push('SELECT statement without FROM clause or CTE');
    }
    
    if (issues.length > 0) {
      CONFIG.errors.push({
        file: filePath,
        analysis,
        issues
      });
    }
    
    return { analysis, issues };
    
  } catch (error) {
    CONFIG.errors.push({
      file: filePath,
      analysis: {},
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
  
  console.log(`Checking ${files.length} SQL files for BigQuery quality...`);
  
  files.forEach(file => validateSQLFile(file));
  
  console.log(`\n📊 Summary:`);
  console.log(`  Files checked: ${CONFIG.filesChecked}`);
  console.log(`  Issues found: ${CONFIG.errors.length}`);
  
  if (CONFIG.errors.length > 0) {
    console.error('\n❌ BigQuery Quality Issues Found:');
    CONFIG.errors.forEach(error => {
      console.error(`\n📄 ${error.file}:`);
      error.issues.forEach(issue => console.error(`  • ${issue}`));
    });
    process.exit(1);
  } else {
    console.log('\n✅ All SQL files pass BigQuery quality checks!');
    process.exit(0);
  }
}

main();