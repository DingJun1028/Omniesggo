// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// src/lib/omni-component/rules.ts
/**
 * Validation Rules for OmniComponent
 * Provides data validation utilities for ESG data integrity
 */

export interface ValidationRule {
  name: string;
  description: string;
  validate: (value: unknown) => boolean;
  message?: (value: unknown) => string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Common validation rules for ESG metrics
 */
export const ESG_VALIDATION_RULES: Record<string, ValidationRule> = {
  percentage: {
    name: 'percentage',
    description: 'Value must be between 0 and 100',
    validate: (value: number) => typeof value === 'number' && value >= 0 && value <= 100,
    message: (value: number) => `Value ${value}% is outside valid range (0-100%)`,
  },
  currency: {
    name: 'currency',
    description: 'Value must be a valid currency amount',
    validate: (value: number) => typeof value === 'number' && !isNaN(value) && isFinite(value),
    message: (value: number) => `Invalid currency value: ${value}`,
  },
  year: {
    name: 'year',
    description: 'Value must be a valid year (1900-2100)',
    validate: (value: number) => Number.isInteger(value) && value >= 1900 && value <= 2100,
    message: (value: number) => `Invalid year: ${value}`,
  },
  score: {
    name: 'score',
    description: 'Value must be a valid ESG score (0-100)',
    validate: (value: number) => typeof value === 'number' && value >= 0 && value <= 100,
    message: (value: number) => `Score ${value} is outside valid range (0-100)`,
  },
  date: {
    name: 'date',
    description: 'Value must be a valid date string',
    validate: (value: string) => !isNaN(Date.parse(value)),
    message: (value: string) => `Invalid date: ${value}`,
  },
  required: {
    name: 'required',
    description: 'Value cannot be null or undefined',
    validate: (value: unknown) => value !== null && value !== undefined && value !== '',
    message: () => 'This field is required',
  },
  email: {
    name: 'email',
    description: 'Value must be a valid email address',
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: (value: string) => `Invalid email: ${value}`,
  },
  url: {
    name: 'url',
    description: 'Value must be a valid URL',
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: (value: string) => `Invalid URL: ${value}`,
  },
};

/**
 * Validate a value against one or more rules
 * @param value The value to validate
 * @param rules Array of rule names or full rule objects
 * @returns Validation result
 */
export function validate(
  value: unknown,
  rules: string[] | ValidationRule[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rulesArray = Array.isArray(rules) ? rules : [];

  for (const rule of rulesArray) {
    const ruleObj = typeof rule === 'string' ? ESG_VALIDATION_RULES[rule] : rule;
    
    if (!ruleObj) {
      continue;
    }

    if (!ruleObj.validate(value)) {
      const message = ruleObj.message ? ruleObj.message(value) : `Validation failed: ${ruleObj.name}`;
      errors.push(message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate ESG metric data
 * @param data The ESG metric data to validate
 * @returns Validation result
 */
export function validateESGMetric(data: {
  value: number;
  year: number;
  metricType: string;
  companyId?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate value
  if (data.value < 0) {
    errors.push('ESG metric values cannot be negative');
  }

  // Validate year
  if (data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push(`Year ${data.year} is outside valid range`);
  }

  // Validate metric type
  const validTypes = ['environmental', 'social', 'governance', 'carbon', 'water', 'waste', 'diversity'];
  if (!validTypes.includes(data.metricType)) {
    errors.push(`Invalid metric type: ${data.metricType}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate company data
 * @param data Company data to validate
 * @returns Validation result
 */
export function validateCompanyData(data: {
  name: string;
  country?: string;
  industry?: string;
  employees?: number;
  revenue?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Name is required
  if (!data.name || data.name.trim() === '') {
    errors.push('Company name is required');
  }

  // Employees must be positive if provided
  if (data.employees !== undefined && data.employees < 0) {
    errors.push('Employee count cannot be negative');
  }

  // Revenue must be non-negative if provided
  if (data.revenue !== undefined && data.revenue < 0) {
    errors.push('Revenue cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate indicator data
 * @param data Indicator data to validate
 * @returns Validation result
 */
export function validateIndicator(data: {
  name: string;
  category: string;
  unit?: string;
  description?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Name is required
  if (!data.name || data.name.trim() === '') {
    errors.push('Indicator name is required');
  }

  // Category is required
  const validCategories = ['environmental', 'social', 'governance', 'economic'];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.push(`Invalid category: ${data.category}. Must be one of: ${validCategories.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a composite validator
 * @param validators Array of validator functions
 * @returns Composite validator function
 */
export function createCompositeValidator(
  validators: Array<(value: unknown) => ValidationResult>
): (value: unknown) => ValidationResult {
  return (value: unknown): ValidationResult => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    };
  };
}