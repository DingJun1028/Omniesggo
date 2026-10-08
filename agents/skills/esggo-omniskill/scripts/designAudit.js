#!/usr/bin/env node
/**
 * Design Token Audit Script
 * Validates design tokens against Google Stitch standards
 */

const { validateStitchDesign, validateComponentStructure } = require('../lib/validation');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  include: ['**/*.json'],
  exclude: ['node_modules/**', 'dist/**', '.next/**'],
  errors: [],
  filesChecked: 0
};

function validateDesignFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    CONFIG.filesChecked++;
    
    let design;
    try {
      design = JSON.parse(content);
    } catch (parseError) {
      CONFIG.errors.push({
        file: filePath,
        issues: [`Invalid JSON: ${parseError.message}`]
      });
      return;
    }
    
    const isValid = validateStitchDesign(design);
    
    if (!isValid) {
      CONFIG.errors.push({
        file: filePath,
        issues: ['Missing required design tokens: color-primary, spacing-grid, fontFamily']
      });
    }
    
  } catch (error) {
    CONFIG.errors.push({
      file: filePath,
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
  
  console.log(`Checking ${files.length} design files for token validation...`);
  
  files.forEach(file => validateDesignFile(file));
  
  console.log(`\n📊 Summary:`);
  console.log(`  Files checked: ${CONFIG.filesChecked}`);
  console.log(`  Issues found: ${CONFIG.errors.length}`);
  
  if (CONFIG.errors.length > 0) {
    console.error('\n❌ Design Token Issues Found:');
    CONFIG.errors.forEach(error => {
      console.error(`\n📄 ${error.file}:`);
      error.issues.forEach(issue => console.error(`  • ${issue}`));
    });
    process.exit(1);
  } else {
    console.log('\n✅ All design files pass token validation!');
    process.exit(0);
  }
}

main();