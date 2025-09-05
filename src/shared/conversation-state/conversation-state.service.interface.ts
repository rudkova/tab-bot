import type { ConversationData } from './conversation-state.types.ts';
import type { MakeOptional } from '../types/utils.types.ts';

export interface IConversationStateService {
  getConversationState(chatId: number): Promise<ConversationData | undefined>;
  setConversationState(
    chatId: number,
    data: MakeOptional<ConversationData, 'timestamp'>
  ): Promise<void>;
  clearConversationState(chatId: number): Promise<void>;
}
