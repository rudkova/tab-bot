import type { ConversationData } from './conversation-state.types.ts';
import type { MakeOptional } from '../types/utils.types.ts';
import type { IConversationStateStoreService } from './conversation-state.store.interface.ts';

export class InMemoryConversationStateStoreService implements IConversationStateStoreService {
  private conversations = new Map<number, ConversationData>();

  async get(chatId: number) {
    return this.conversations.get(chatId);
  }

  async set(chatId: number, data: MakeOptional<ConversationData, 'timestamp'>) {
    this.conversations.set(chatId, {
      state: data.state,
      medicationName: data.medicationName,
      expirationDate: data.expirationDate,
      notes: data.notes,
      timestamp: Date.now(),
    });
  }

  async clear(chatId: number) {
    this.conversations.delete(chatId);
  }
}
