import type { ExpirationDateValidationResult } from './expirationDateValidationResult.type.ts';
import type { MedicationValidationResultType } from './medicationValidationResult.type.ts';

export interface IMedicationValidator {
  validateMedicationData(
    name: string | undefined,
    expirationDate: Date | undefined,
    notes: string | undefined
  ): MedicationValidationResultType;
  validateExpirationDate(expirationDate: string): ExpirationDateValidationResult;
}
