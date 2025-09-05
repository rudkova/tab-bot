import type { MakeOptional } from '../types/utils.types.ts';
import type { ConversationData } from './conversation-state.types.ts';

export interface IConversationStateStoreService {
  get(chatId: number): Promise<ConversationData | undefined>;
  set(chatId: number, data: MakeOptional<ConversationData, 'timestamp'>): Promise<void>;
  clear(chatId: number): Promise<void>;
}
