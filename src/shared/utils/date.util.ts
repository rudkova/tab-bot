import { parse, isValid, format } from 'date-fns';
import { config } from '../../configs/config.ts';

/**
 * Parses a date string using the configured format
 * @param dateStr - Date string to parse
 * @param dateFormat - Format of date. default is ${config.app.dateFormat}
 * @returns Parsed Date object or null if invalid
 * @example
 * parseDate('2024-12-31') // Returns Date object
 * parseDate('invalid') // Returns null
 */
const parseDate = (dateStr: string, dateFormat = config.app.dateFormat): Date | null => {
  const parsedDate = parse(dateStr, dateFormat, new Date());

  if (!isValid(parsedDate) || format(parsedDate, dateFormat) !== dateStr) {
    return null;
  }

  return parsedDate;
};

export { parseDate };
