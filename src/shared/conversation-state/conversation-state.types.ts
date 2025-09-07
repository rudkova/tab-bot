export enum ConversationState {
  IDLE = 'IDLE',
  WAITING_FOR_MEDICATION_NAME = 'WAITING_FOR_MEDICATION_NAME',
  WAITING_FOR_EXPIRATION_DATE = 'WAITING_FOR_EXPIRATION_DATE',
  WAITING_FOR_NOTES = 'WAITING_FOR_NOTES',
}

export interface ConversationData {
  state: ConversationState;
  timestamp: number; // todo implement setting TS
  medicationName?: string;
  expirationDate?: Date;
  notes?: string;
}
