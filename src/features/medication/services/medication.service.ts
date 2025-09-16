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

  getMedication = async (id: number): Promise<Medication | null> => {
    try {
      logger.debug(`Try to get medication by id: ${id}`);

      const medication = await this.medicationRepository.getMedicationById(id);

      if (medication) {
        logger.debug(`Medication found`, { id: medication.id, name: medication.name });
      } else {
        logger.debug(`Medication not found`, { id });
      }

      return medication;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Failed to get medication`, {
          id,
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error(`Failed to get medication`, {
          id,
          error: String(e),
        });
      }

      throw e;
    }
  };

  deleteMedication = async (id: number): Promise<Medication> => {
    try {
      logger.info(`Try to delete medication with id: ${id}`);

      const medication = await this.medicationRepository.deleteMedication(id);

      logger.debug(`Medication deleted`, { id: medication.id, name: medication.name });

      return medication;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Failed to delete medication`, {
          id,
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error(`Failed to delete medication`, {
          id,
          error: String(e),
        });
      }

      throw e;
    }
  };

  updateMedication = async (
    id: number,
    medicationData: Partial<MedicationDataType>
  ): Promise<Medication> => {
    try {
      logger.info(`Try to update medication with id: ${id}`, {
        updateData: {
          name: medicationData.name,
          expirationDate: medicationData.expirationDate
            ? formatDate(medicationData.expirationDate)
            : undefined,
          notes: medicationData.notes,
        },
      });

      const medication = await this.medicationRepository.updateMedication(id, medicationData);

      logger.debug(`Medication updated`, { id: medication.id, name: medication.name });

      return medication;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Failed to update medication`, {
          id,
          updateData: {
            name: medicationData.name,
            expirationDate: medicationData.expirationDate
              ? formatDate(medicationData.expirationDate)
              : undefined,
            notes: medicationData.notes,
          },
          error: e.message,
          stack: e.stack,
        });
      } else {
        logger.error(`Failed to update medication`, {
          id,
          error: String(e),
        });
      }

      throw e;
    }
  };
}
