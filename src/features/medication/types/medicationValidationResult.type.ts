import type { MedicationDataType } from './medicationDataType.ts';

export type MedicationValidationResultType =
  | { isValid: true; medicationData: MedicationDataType }
  | { isValid: false; error: string };
