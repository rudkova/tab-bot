import logger from '../../../shared/logger/logger.ts';
import { addMonths, isBefore } from 'date-fns';
import { config } from '../../../configs/config.ts';
import { parseDate } from '../../../shared/utils/date.util.ts';
import type { MedicationDataType } from '../types/medicationDataType.ts';

export class MedicationValidator {
  validateMedicationData = (
    name: string | undefined,
    expirationDate: Date | undefined,
    notes: string | undefined
  ): MedicationDataType => {
    if (name === undefined) {
      logger.error(`Failed to validate medication data. Name is undefined`);
      throw new Error('medicationName is required in conversation');
    }
    if (expirationDate === undefined) {
      logger.error(`Failed to validate medication data. expirationDate is undefined`);
      throw new Error('expirationDate is required in conversation');
    }
    if (notes === undefined) {
      logger.error(`Failed to validate medication data. Notes is undefined`);
      throw new Error('notes is required in conversation');
    }

    return {
      name,
      expirationDate,
      notes,
    };
  };

  validateExpirationDate = (
    dateStr: string
  ): {
    date?: Date;
    errorMessage?: string;
  } => {
    const parsedDate = parseDate(dateStr);

    if (parsedDate === null) {
      return {
        errorMessage: `Invalid date format. Please enter the date in ${config.app.dateFormat.toUpperCase()} format:`,
      };
    }

    const twoMonthsFromNow = addMonths(new Date(), 2);
    if (isBefore(parsedDate, twoMonthsFromNow)) {
      return {
        errorMessage: `Date must be at least two months from today. Please enter the date in ${config.app.dateFormat.toUpperCase()} format:`,
      };
    }

    return {
      date: parsedDate,
    };
  };
}
