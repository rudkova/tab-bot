import type { Medication, User } from '@prisma/client';

export const DEFAULT_TEST_FAKE_TOKEN = 'test-fake-token';

// User defaults
export const DEFAULT_TEST_USER_ID = 1;
export const DEFAULT_TEST_CHAT_ID = 123;
export const DEFAULT_TEST_TELEGRAM_ID = 1n;
export const DEFAULT_TEST_USERNAME = 'test-username';
export const DEFAULT_TEST_FIRST_NAME = 'test-firstName';
export const DEFAULT_TEST_TIMEZONE = 'test-tz';
export const DEFAULT_TEST_USER_CREATED_AT = new Date();
export const DEFAULT_TEST_USER_UPDATED_AT = null;

// Medication defaults
export const DEFAULT_TEST_MEDICATION_ID = 1;
export const DEFAULT_TEST_MEDICATION_NAME = 'med-name-test';
export const DEFAULT_TEST_EXPIRATION_DATE_STRING = '3030-01-01';
export const DEFAULT_TEST_EXPIRATION_DATE = new Date(DEFAULT_TEST_EXPIRATION_DATE_STRING);
export const DEFAULT_TEST_NOTES = 'notes-test';
export const DEFAULT_TEST_MEDICATION_CREATED_AT = new Date();
export const DEFAULT_TEST_MEDICATION_UPDATED_AT = null;

export const generateUser = (
  id: number = DEFAULT_TEST_USER_ID,
  chatId = BigInt(DEFAULT_TEST_CHAT_ID),
  telegramId: bigint = DEFAULT_TEST_TELEGRAM_ID,
  username: string = DEFAULT_TEST_USERNAME,
  firstName: string = DEFAULT_TEST_FIRST_NAME,
  timezone: string = DEFAULT_TEST_TIMEZONE,
  createdAt: Date = DEFAULT_TEST_USER_CREATED_AT,
  updatedAt: Date | null = DEFAULT_TEST_USER_UPDATED_AT
): User => ({
  id,
  telegramId,
  chatId,
  username,
  firstName,
  timezone,
  createdAt,
  updatedAt,
});

export const generateMedication = (
  medicationId: number = DEFAULT_TEST_MEDICATION_ID,
  userId: number = DEFAULT_TEST_USER_ID,
  name: string = DEFAULT_TEST_MEDICATION_NAME,
  expirationDate: Date = DEFAULT_TEST_EXPIRATION_DATE,
  notes: string = DEFAULT_TEST_NOTES,
  createdAt: Date = DEFAULT_TEST_MEDICATION_CREATED_AT,
  updatedAt: Date | null = DEFAULT_TEST_MEDICATION_UPDATED_AT
): Medication => ({
  id: medicationId,
  userId,
  name,
  expirationDate,
  notes,
  createdAt,
  updatedAt,
});
