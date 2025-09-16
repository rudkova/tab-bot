import { type Medication } from '@prisma/client';
import type { MedicationDataType } from './medicationDataType.ts';

export interface IMedicationService {
  createMedication(userId: number, medicationData: MedicationDataType): Promise<Medication>;
  getMedication(id: number): Promise<Medication | null>;
  deleteMedication(id: number): Promise<Medication>;
  updateMedication(id: number, medicationData: Partial<MedicationDataType>): Promise<Medication>;
}
