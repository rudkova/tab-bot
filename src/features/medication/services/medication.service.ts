import logger from '../../../shared/logger/logger.ts';
import type { Medication } from '@prisma/client';
import { MedicationRepository } from '../repositories/medication.repository.ts';
import type { MedicationDataType } from '../types/medicationDataType.ts';
import { formatDate } from '../../../shared/utils/date.util.ts';
import type { IMedicationService } from '../types/medication.service.interface.ts';

export class MedicationService implements IMedicationService {
  constructor(private readonly medicationRepository: MedicationRepository) {}

  /**
   * Create a new medication for a user
   * @param userId The ID of the user
   * @param medicationData
   * @returns The created medication
   */
  createMedication = async (
    userId: number,
    medicationData: MedicationDataType
  ): Promise<Medication> => {
    const { name, expirationDate, notes } = medicationData;

    try {
      logger.info('Try to create medication.', {
        medicationData: { name, expirationDate: formatDate(expirationDate), notes },
      });

      const medication = await this.medicationRepository.createMedication(
        userId,
        name,
        expirationDate,
        notes
      );

      logger.debug(`Medication is created`, {
        id: medication.id,
      });

      return medication;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Failed to create medication.`, {
          medicationData: {
            name,
            expirationDate: formatDate(expirationDate),
            notes,
          },
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error(`Failed to create medication.`, {
          medicationData: {
            name,
            expirationDate: formatDate(expirationDate),
            notes,
          },
          error: String(e),
        });
      }

      throw e;
    }
  };
}
