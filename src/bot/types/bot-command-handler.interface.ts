import type { BotContext, TextMessage } from './context.type.ts';

export interface BotCommandHandler<C extends BotContext> {
  handle(ctx: C): Promise<TextMessage>;
}
