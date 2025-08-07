import { addMonths, isBefore } from 'date-fns';
import { config } from '../../../configs/config.ts';
import { parseDate } from '../../../shared/utils/date.util.ts';
import type { MedicationValidationResultType } from '../types/medicationValidationResult.type.ts';
import type { ExpirationDateValidationResult } from '../types/expirationDateValidationResult.type.ts';

export class MedicationValidator {
  validateMedicationData = (
    name: string | undefined,
    expirationDate: Date | undefined,
    notes: string | undefined
  ): MedicationValidationResultType => {
    if (name === undefined) {
      return {
        isValid: false,
        error: 'Failed to validate medication data. Name should not be empty',
      };
    }
    if (expirationDate === undefined) {
      return {
        isValid: false,
        error: 'Failed to validate medication data. Expiration Date should not be empty',
      };
    }
    if (notes === undefined) {
      return {
        isValid: false,
        error: 'Failed to validate medication data. Notes should not be empty',
      };
    }

    return {
      isValid: true,
      medicationData: { name, expirationDate, notes },
    };
  };

  validateExpirationDate = (dateStr: string): ExpirationDateValidationResult => {
    const parsedDate = parseDate(dateStr);

    if (parsedDate === null) {
      return {
        isValid: false,
        error: `Invalid date format. Please enter the date in ${config.app.dateFormat.toUpperCase()} format:`,
      };
    }

    const twoMonthsFromNow = addMonths(new Date(), 2);
    if (isBefore(parsedDate, twoMonthsFromNow)) {
      return {
        isValid: false,
        error: `Date must be at least two months from today. Please enter the date in ${config.app.dateFormat.toUpperCase()} format:`,
      };
    }

    return {
      isValid: true,
      date: parsedDate,
    };
  };
}
