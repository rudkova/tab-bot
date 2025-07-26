import type { MakeOptional } from '../types/utils.types.ts';

export enum ConversationState {
  IDLE = 'IDLE',
  WAITING_FOR_MEDICATION_NAME = 'WAITING_FOR_MEDICATION_NAME',
  WAITING_FOR_EXPIRATION_DATE = 'WAITING_FOR_EXPIRATION_DATE',
  WAITING_FOR_NOTES = 'WAITING_FOR_NOTES',
}

export interface ConversationData {
  state: ConversationState;
  medicationName?: string;
  expirationDate?: Date;
  notes?: string;
  timestamp: number;
}

export interface ConversationStateStoreInterface {
  get(chatId: number): Promise<ConversationData | undefined>;
  set(chatId: number, data: MakeOptional<ConversationData, 'timestamp'>): Promise<void>;
  clear(chatId: number): Promise<void>;
}
