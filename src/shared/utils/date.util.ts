import { parse, isValid, format, startOfDay, endOfDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { config } from '../../configs/config.ts';

/**
 * Parses a date string using the configured format
 *
 * @param dateStr - Date string to parse
 * @param dateFormat - Format of date. default is ${config.app.dateFormat}
 * @param timeZone - Format of date. default is ${config.app.defaultTZ}
 * @returns Parsed Date object or null if invalid
 * @example
 * parseDate('2024-12-31') // Returns Date object
 * parseDate('invalid') // Returns null
 */
const parseDate = (
  dateStr: string,
  dateFormat = config.app.dateFormat,
  timeZone = config.app.defaultTZ
): Date | null => {
  const parsedDate = parse(dateStr, dateFormat, new Date());

  if (!isValid(parsedDate) || format(parsedDate, dateFormat) !== dateStr) {
    return null;
  }

  return fromZonedTime(parsedDate, timeZone);
};

const getStartOfDay = (timeZone = 'UTC') => fromZonedTime(startOfDay(new Date()), timeZone);
const getEndOfDay = (timeZone = 'UTC') => fromZonedTime(endOfDay(new Date()), timeZone);

export { parseDate, getStartOfDay, getEndOfDay };
