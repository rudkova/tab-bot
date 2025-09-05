import type { MakeOptional } from '../types/utils.types.ts';
import type { ConversationData } from './conversation-state.types.ts';
import type { IConversationStateStoreService } from './conversation-state.store.interface.ts';
import type { IConversationStateService } from './conversation-state.service.interface.ts';

export class ConversationStateService implements IConversationStateService {
  constructor(private readonly store: IConversationStateStoreService) {}

  setConversationState(
    chatId: number,
    data: MakeOptional<ConversationData, 'timestamp'>
  ): Promise<void> {
    return this.store.set(chatId, data);
  }

  getConversationState(chatId: number): Promise<ConversationData | undefined> {
    return this.store.get(chatId);
  }

  clearConversationState(chatId: number): Promise<void> {
    return this.store.clear(chatId);
  }
}
