import type { Context, NarrowedContext } from 'telegraf';
import type { Message, Update } from 'telegraf/typings/core/types/typegram';

export type TextMessageContext = NarrowedContext<
  Context<Update>,
  Update.MessageUpdate<Message.TextMessage>
>;

export type ActionContext = NarrowedContext<Context, Update.CallbackQueryUpdate> & {
  match: RegExpMatchArray;
};
