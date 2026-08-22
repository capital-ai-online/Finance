export const FINTECH_CORE_FIXED_POINT_MAX_SCALE = 18 as const;

const CANONICAL_INTEGER_PATTERN = /^-?(?:0|[1-9]\d*)$/;

/**
 * Canonical JSON-safe fixed-point representation for every FinTechCore financial quantity.
 * `atoms` is an integer encoded as a string and `scale` is the decimal scale.
 * This is the same representation introduced by FT-4 Paper Trading and is promoted here
 * as the single FinTechCore numeric contract rather than creating a competing format.
 */
export interface FinTechCoreFixedPoint {
  readonly atoms: string;
  readonly scale: number;
}

export interface FinTechCoreFixedPointValidationOptions {
  readonly allowZero?: boolean;
  readonly allowNegative?: boolean;
}

function powerOfTen(scale: number): bigint {
  return 10n ** BigInt(scale);
}

export function normalizeFinTechCoreFixedPoint(
  value: FinTechCoreFixedPoint,
  field = 'value',
  options: FinTechCoreFixedPointValidationOptions = {},
): FinTechCoreFixedPoint {
  if (!Number.isInteger(value.scale) || value.scale < 0 || value.scale > FINTECH_CORE_FIXED_POINT_MAX_SCALE) {
    throw new Error(
      `[FinTechCore][FixedPoint] ${field}.scale must be an integer between 0 and ${FINTECH_CORE_FIXED_POINT_MAX_SCALE}.`,
    );
  }
  if (!CANONICAL_INTEGER_PATTERN.test(value.atoms)) {
    throw new Error(`[FinTechCore][FixedPoint] ${field}.atoms must be a canonical integer string.`);
  }

  const atoms = BigInt(value.atoms);
  if (!options.allowNegative && atoms < 0n) {
    throw new Error(`[FinTechCore][FixedPoint] ${field} must not be negative.`);
  }
  if (!options.allowZero && atoms === 0n) {
    throw new Error(`[FinTechCore][FixedPoint] ${field} must be greater than zero.`);
  }

  return Object.freeze({ atoms: atoms.toString(), scale: value.scale });
}

export function compareFinTechCoreFixedPoint(
  left: FinTechCoreFixedPoint,
  right: FinTechCoreFixedPoint,
): -1 | 0 | 1 {
  const normalizedLeft = normalizeFinTechCoreFixedPoint(left, 'left', {
    allowNegative: true,
    allowZero: true,
  });
  const normalizedRight = normalizeFinTechCoreFixedPoint(right, 'right', {
    allowNegative: true,
    allowZero: true,
  });
  const targetScale = Math.max(normalizedLeft.scale, normalizedRight.scale);
  const leftAtoms = BigInt(normalizedLeft.atoms) * powerOfTen(targetScale - normalizedLeft.scale);
  const rightAtoms = BigInt(normalizedRight.atoms) * powerOfTen(targetScale - normalizedRight.scale);
  if (leftAtoms < rightAtoms) return -1;
  if (leftAtoms > rightAtoms) return 1;
  return 0;
}

export function finTechCoreFixedPointEquals(
  left: FinTechCoreFixedPoint,
  right: FinTechCoreFixedPoint,
): boolean {
  return compareFinTechCoreFixedPoint(left, right) === 0;
}

/**
 * Exact decimal serialization for PostgreSQL `numeric` RPC parameters. No JavaScript binary
 * floating point is introduced at the persistence boundary.
 */
export function finTechCoreFixedPointToDecimalString(value: FinTechCoreFixedPoint): string {
  const normalized = normalizeFinTechCoreFixedPoint(value, 'value', {
    allowNegative: true,
    allowZero: true,
  });
  const negative = normalized.atoms.startsWith('-');
  const digits = negative ? normalized.atoms.slice(1) : normalized.atoms;
  if (normalized.scale === 0) return `${negative ? '-' : ''}${digits}`;

  const padded = digits.padStart(normalized.scale + 1, '0');
  const splitAt = padded.length - normalized.scale;
  return `${negative ? '-' : ''}${padded.slice(0, splitAt)}.${padded.slice(splitAt)}`;
}
