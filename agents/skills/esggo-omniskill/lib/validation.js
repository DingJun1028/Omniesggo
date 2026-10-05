/**
 * ESG GO Omniskill - MECE Validation Functions
 * 
 * This module implements Mutually Exclusive, Collectively Exhaustive (MECE)
 * validation functions for the ESG GO platform.
 */

class ESGGOBestPractices {
  // ===== 1. Type Safety Layer =====
  static enforceTypeSafety(data) {
    if (data === undefined || data === null) {
      throw new Error('Type validation failed: data is null or undefined');
    }
    return true;
  }

  static createStrictInterface() {
    return (data) => {
      if (!this.enforceTypeSafety(data)) {
        throw new Error('類型驗證失敗');
      }
      return data;
    };
  }

  static validateInterface(name, expectedType, value) {
    const actualType = typeof value;
    if (actualType !== expectedType) {
      throw new Error(`Type mismatch for '${name}': expected ${expectedType}, got ${actualType}`);
    }
    return true;
  }

  // ===== 2. Naming Convention Layer =====
  static validateNamingConvention(name, type = 'variable') {
    const patterns = {
      component: /^[A-Z][a-zA-Z0-9]*$/,
      function: /^[a-z][a-zA-Z0-9]*$/,
      variable: /^[a-z][a-zA-Z0-9]*$/,
      interface: /^I[A-Z][a-zA-Z0-9]*$/,
      type: /^[A-Z][a-zA-Z0-9]*$/,
      file: /^[a-z][a-zA-Z0-9]*\.[jt]sx?$/,
      path: /^[a-z][a-zA-Z0-9-]*\/[a-zA-Z0-9-]+\.(ts|tsx|js|jsx)$/
    };
    
    const pattern = patterns[type];
    if (!pattern) {
      throw new Error(`Unknown naming convention type: ${type}`);
    }
    
    return pattern.test(name);
  }

  static generateValidName(desiredName, type) {
    // Convert to valid naming convention
    switch (type) {
      case 'component':
        return desiredName.charAt(0).toUpperCase() + desiredName.slice(1);
      case 'function':
      case 'variable':
        return desiredName.charAt(0).toLowerCase() + desiredName.slice(1);
      default:
        return desiredName;
    }
  }

  // ===== 3. Data Quality Layer =====
  static validateBigQueryMetadata(record) {
    if (!record || typeof record !== 'object') {
      return false;
    }
    
    const requiredFields = ['created_at', 'updated_at', 'source_system'];
    return requiredFields.every(field => record.hasOwnProperty(field));
  }

  static validateRecordCompleteness(record) {
    const requiredFields = ['id', 'created_at', 'updated_at'];
    const missingFields = requiredFields.filter(field => !record[field]);
    
    if (missingFields.length > 0) {
      console.warn(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    return true;
  }

  // ===== 4. Transformation Validation Layer =====
  static applyTransformationValidator(sql) {
    if (typeof sql !== 'string') {
      throw new Error('SQL must be a string');
    }
    
    const validationPatterns = [
      /SELECT/i,
      /FROM/i,
      /WHERE/i,
      /\.validate\(\)/i,
      /CHECK/i
    ];
    
    return validationPatterns.every(pattern => pattern.test(sql));
  }

  static validateSQLStructure(sql) {
    const hasSelect = /SELECT\s+/i.test(sql);
    const hasFrom = /FROM\s+/i.test(sql);
    const hasValidation = /\.validate\(\)/i.test(sql);
    
    return {
      hasSelect,
      hasFrom,
      hasValidation,
      isValid: hasSelect && hasFrom && hasValidation
    };
  }

  // ===== 5. UI/UX Design Layer =====
  static validateStitchDesign(designFile) {
    if (typeof designFile !== 'string' && typeof designFile !== 'object') {
      return false;
    }
    
    const design = typeof designFile === 'string' 
      ? JSON.parse(designFile) 
      : designFile;
    
    const requiredTokens = ['color-primary', 'spacing-grid', 'font-family'];
    return requiredTokens.every(token => {
      if (token.includes('-')) {
        const [category, value] = token.split('-');
        return design[category] && design[category][value];
      }
      return design[token] !== undefined;
    });
  }

  static validateComponentStructure(component) {
    const requiredProps = ['type', 'props'];
    const requiredEvents = ['onClick', 'onChange'];
    
    return {
      hasRequiredProps: requiredProps.every(prop => component.hasOwnProperty(prop)),
      hasRequiredEvents: requiredEvents.every(event => 
        component.props && component.props.hasOwnProperty(event)
      )
    };
  }
}

module.exports = ESGGOBestPractices;