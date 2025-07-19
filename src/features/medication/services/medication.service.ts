import type { Medication } from '@prisma/client';
import { MedicationRepository } from '../repositories/medication.repository.ts';
import type { MedicationType } from '../types/medication.type.ts';

export class MedicationService {
  constructor(
    private readonly medicationRepository: MedicationRepository = new MedicationRepository()
  ) {}
  /**
   * Create a new medication for a user
   * @param userId The ID of the user
   * @param name The name of the medication
   * @param expirationDate The expiration date of the medication
   * @param notes Optional notes about the medication
   * @returns The created medication
   */
  createMedication = async (
    userId: number,
    { name, expirationDate, notes }: MedicationType
  ): Promise<Medication> => {
    return this.medicationRepository.createMedication(userId, name, expirationDate, notes);
  };

  validateMedicationData = (
    name: string | undefined,
    expirationDate: Date | undefined,
    notes: string | undefined
  ): MedicationType => {
    if (name === undefined) {
      throw new Error('medicationName is required in conversation');
    }
    if (expirationDate === undefined) {
      throw new Error('expirationDate is required in conversation');
    }
    if (notes === undefined) {
      throw new Error('notes is required in conversation');
    }

    return {
      name,
      expirationDate,
      notes,
    };
  };
}
