import type { Medication, PrismaClient } from '@prisma/client';
import type { MedicationType } from '../types/medication.type.ts';

export class MedicationRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

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
    name: string,
    expirationDate: Date,
    notes: string
  ): Promise<Medication> => {
    return this.prismaClient.medication.create({
      data: {
        userId,
        name,
        expirationDate,
        notes,
      },
    });
  };

  deleteMedication = async (id: number): Promise<Medication> => {
    return this.prismaClient.medication.delete({
      where: {
        id,
      },
    });
  };

  updateMedication = async (
    id: number,
    { name, expirationDate, notes }: Partial<MedicationType>
  ): Promise<Medication> => {
    return await this.prismaClient.medication.update({
      where: {
        id,
      },
      data: {
        name,
        expirationDate,
        notes,
      },
    });
  };
}
