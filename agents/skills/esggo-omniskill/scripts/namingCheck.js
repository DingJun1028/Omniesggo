#!/usr/bin/env node
/**
 * Naming Convention Validation Script
 * Validates naming conventions across the codebase
 */

const { validateNamingConvention } = require('../lib/validation');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  exclude: ['node_modules/**', 'dist/**', '.next/**'],
  errors: []
};

// Extract names from code (simplified approach)
function extractNames(content, fileType) {
  const names = {
    components: [],
    functions: [],
    variables: [],
    interfaces: [],
    types: []
  };
  
  // Component declarations (React components)
  const componentMatches = content.match(/(?:export\s+)?(?:default\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/g);
  if (componentMatches) {
    componentMatches.forEach(match => {
      const name = match.replace(/^(?:export\s+)?(?:default\s+)?(?:function|const)\s+/, '');
      if (name.match(/^[A-Z]/)) {
        names.components.push(name);
      }
    });
  }
  
  // Function declarations
  const functionMatches = content.match(/(?:export\s+)?(?:async\s+)?function\s+([a-z][a-zA-Z0-9]*)/g);
  if (functionMatches) {
    functionMatches.forEach(match => {
      const name = match.replace(/^(?:export\s+)?(?:async\s+)?function\s+/, '');
      names.functions.push(name);
    });
  }
  
  // Arrow functions / const functions
  const arrowFunctionMatches = content.match(/const\s+([a-z][a-zA-Z0-9]*)\s*=\s*(?:async\s+)?\(/g);
  if (arrowFunctionMatches) {
    arrowFunctionMatches.forEach(match => {
      const name = match.replace(/const\s+/, '').replace(/\s*=\s*(?:async\s+)?\(/, '');
      names.functions.push(name);
    });
  }
  
  // Variable declarations
  const variableMatches = content.match(/(?:const|let|var)\s+([a-z][a-zA-Z0-9]*)/g);
  if (variableMatches) {
    variableMatches.forEach(match => {
      const name = match.replace(/(?:const|let|var)\s+/, '');
      if (!names.functions.includes(name) && !names.components.includes(name)) {
        names.variables.push(name);
      }
    });
  }
  
  // Interface declarations
  const interfaceMatches = content.match(/interface\s+(I[A-Z][a-zA-Z0-9]*)/g);
  if (interfaceMatches) {
    interfaceMatches.forEach(match => {
      const name = match.replace(/interface\s+/, '');
      names.interfaces.push(name);
    });
  }
  
  // Type declarations
  const typeMatches = content.match(/type\s+([A-Z][a-zA-Z0-9]*)/g);
  if (typeMatches) {
    typeMatches.forEach(match => {
      const name = match.replace(/type\s+/, '');
      names.types.push(name);
    });
  }
  
  return names;
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

// Validate a single file
function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const names = extractNames(content, path.extname(filePath));
    
    let hasErrors = false;
    
    // Validate components
    names.components.forEach(name => {
      if (!validateNamingConvention(name, 'component')) {
        if (!CONFIG.errors.find(e => e.file === filePath && e.name === name)) {
          CONFIG.errors.push({
            file: filePath,
            name: name,
            type: 'component',
            expected: 'PascalCase',
            actual: name
          });
          hasErrors = true;
        }
      }
    });
    
    // Validate functions
    names.functions.forEach(name => {
      if (!validateNamingConvention(name, 'function')) {
        if (!CONFIG.errors.find(e => e.file === filePath && e.name === name)) {
          CONFIG.errors.push({
            file: filePath,
            name: name,
            type: 'function',
            expected: 'camelCase',
            actual: name
          });
          hasErrors = true;
        }
      }
    });
    
    // Validate variables
    names.variables.forEach(name => {
      if (!validateNamingConvention(name, 'variable')) {
        if (!CONFIG.errors.find(e => e.file === filePath && e.name === name)) {
          CONFIG.errors.push({
            file: filePath,
            name: name,
            type: 'variable',
            expected: 'camelCase',
            actual: name
          });
          hasErrors = true;
        }
      }
    });
    
    // Validate interfaces
    names.interfaces.forEach(name => {
      if (!validateNamingConvention(name, 'interface')) {
        if (!CONFIG.errors.find(e => e.file === filePath && e.name === name)) {
          CONFIG.errors.push({
            file: filePath,
            name: name,
            type: 'interface',
            expected: 'IPascalCase',
            actual: name
          });
          hasErrors = true;
        }
      }
    });
    
    // Validate types
    names.types.forEach(name => {
      if (!validateNamingConvention(name, 'type')) {
        if (!CONFIG.errors.find(e => e.file === filePath && e.name === name)) {
          CONFIG.errors.push({
            file: filePath,
            name: name,
            type: 'type',
            expected: 'PascalCase',
            actual: name
          });
          hasErrors = true;
        }
      }
    });
    
  } catch (error) {
    CONFIG.errors.push({
      file: filePath,
      name: 'N/A',
      type: 'error',
      expected: 'valid file',
      actual: `Error: ${error.message}`
    });
  }
}

function main() {
  const files = getFiles(process.cwd(), CONFIG.include);
  
  console.log(`Checking ${files.length} files for naming conventions...`);
  
  files.forEach(file => validateFile(file));
  
  if (CONFIG.errors.length > 0) {
    console.error('\n❌ Naming Convention Issues Found:');
    CONFIG.errors.forEach(error => {
      console.error(`\n📄 ${error.file}:`);
      console.error(`  • ${error.type}: "${error.actual}" should be ${error.expected}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All files pass naming convention checks!');
    process.exit(0);
  }
}

main();