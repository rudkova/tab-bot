import { addMonths, isBefore } from 'date-fns';
import { config } from '../../../configs/config.ts';
import { parseDate } from '../../../shared/utils/date.util.ts';

export class MedicationValidator {
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
