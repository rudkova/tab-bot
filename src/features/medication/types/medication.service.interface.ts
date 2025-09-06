import { type Medication } from '@prisma/client';
import type { MedicationDataType } from './medicationDataType.ts';

export interface IMedicationService {
  createMedication(userId: number, medicationData: MedicationDataType): Promise<Medication>;
}
