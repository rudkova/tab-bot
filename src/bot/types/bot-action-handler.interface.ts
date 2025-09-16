import type { BotContext } from './context.type.ts';

export interface BotActionHandler<C extends BotContext> {
  handle(ctx: C): Promise<void>;
}
