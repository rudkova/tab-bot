import type { MakeOptional } from '../types/utils.types.ts';
import type {
  ConversationData,
  ConversationStateStoreInterface,
} from './conversation-state-store.interface.ts';

export class ConversationStateService {
  constructor(private readonly store: ConversationStateStoreInterface) {}

  setConversationState(
    chatId: bigint,
    data: MakeOptional<ConversationData, 'timestamp'>
  ): Promise<void> {
    return this.store.set(chatId, data);
  }

  getConversationState(chatId: bigint): Promise<ConversationData | undefined> {
    return this.store.get(chatId);
  }

  clearConversationState(chatId: bigint): Promise<void> {
    return this.store.clear(chatId);
  }
}
