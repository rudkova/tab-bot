import type { Context, NarrowedContext } from 'telegraf';
import type { Update } from 'telegraf/typings/core/types/typegram';
import type * as tg from 'telegraf/types';

export type TextMessage = tg.Message.TextMessage;

export interface BotContext extends Context<Update> {
  match?: RegExpMatchArray;
}

export type TextMessageContext = NarrowedContext<BotContext, Update.MessageUpdate<TextMessage>>;

export type ActionContext = NarrowedContext<BotContext, Update.CallbackQueryUpdate> & {
  match: RegExpMatchArray;
};
