import type {
  ConversationData,
  ConversationStateStoreInterface,
} from './conversation-state-store.interface.ts';
import type { MakeOptional } from '../types/utils.types.ts';

export class InMemoryConversationStateStore implements ConversationStateStoreInterface {
  private conversations = new Map<bigint, ConversationData>();

  async get(chatId: bigint) {
    return this.conversations.get(chatId);
  }

  async set(chatId: bigint, data: MakeOptional<ConversationData, 'timestamp'>) {
    this.conversations.set(chatId, {
      state: data.state,
      medicationName: data.medicationName,
      expirationDate: data.expirationDate,
      notes: data.notes,
      timestamp: Date.now(),
    });
  }

  async clear(chatId: bigint) {
    this.conversations.delete(chatId);
  }
}
