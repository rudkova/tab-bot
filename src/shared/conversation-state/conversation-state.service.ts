import type { MakeOptional } from '../types/utils.types.ts';
import type {
  ConversationData,
  ConversationStateStoreInterface,
} from './conversation-state-store.interface.ts';
import { InMemoryConversationStateStore } from './in-memory-conversation-state-store.service.ts';

export class ConversationStateService {
  constructor(
    private readonly store: ConversationStateStoreInterface = new InMemoryConversationStateStore()
  ) {}

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
