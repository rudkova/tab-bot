import { parse, isValid, format, addMonths, isBefore } from 'date-fns';
import { config } from '../../configs/config.ts';

const parseDate = (
  dateStr: string
): {
  parsedDate?: Date;
  errorMessage?: string;
} => {
  const parsedDate = parse(dateStr, config.app.dateFormat, new Date());

  if (!isValid(parsedDate) || format(parsedDate, config.app.dateFormat) !== dateStr) {
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
    parsedDate,
  };
};

export { parseDate };
