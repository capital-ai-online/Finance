/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawMaterialInput } from '../types/rawMaterials';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingFields: string[];
  validatedData: RawMaterialInput;
}

/**
 * Validates incoming raw material data.
 * Checks for bounds (0 to 100) and catalogs missing fields to assist the Scoring Engine.
 */
export function validateRawMaterialInput(input: any): ValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = [];
  const validatedData: RawMaterialInput = {
    name: typeof input?.name === 'string' ? input.name.trim() : 'Unknown Material'
  };

  if (!input?.name) {
    errors.push('The "name" field of the raw material is required.');
  }

  const numericFields: (keyof Omit<RawMaterialInput, 'name' | 'category_main'>)[] = [
    'market_liquidity', 'volatility', 'trading_volume',
    'ore_grade', 'tonnage', 'tonnage_reserve', 'substitution_potential', 'recyclability',
    'processing_complexity', 'infrastructure_availability', 'extraction_costs',
    'geopolitical_risk', 'supply_chain_risk', 'regulatory_risk', 'esg_risk', 'producer_concentration',
    'military_importance', 'industrial_importance'
  ];

  for (const field of numericFields) {
    const val = input?.[field];
    if (val === undefined || val === null || val === '') {
      missingFields.push(field);
    } else {
      const num = Number(val);
      if (isNaN(num)) {
        errors.push(`Field "${field}" must be a numeric value.`);
      } else if (num < 0 || num > 100) {
        errors.push(`Field "${field}" must be between 0 and 100.`);
      } else {
        (validatedData as any)[field] = num;
      }
    }
  }

  if (input?.category_main) {
    const allowed = ['Metal', 'Energy', 'Agriculture', 'Industrial', 'Recycling', 'Unknown'];
    if (allowed.includes(input.category_main)) {
      validatedData.category_main = input.category_main;
    } else {
      errors.push(`Invalid category_main "${input.category_main}". Allowed values: ${allowed.join(', ')}`);
    }
  } else {
    missingFields.push('category_main');
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingFields,
    validatedData
  };
}
