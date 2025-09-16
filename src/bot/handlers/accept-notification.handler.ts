import type { ActionContext } from '../types/context.type.ts';
import logger from '../../shared/logger/logger.ts';
import type { BotService } from '../bot.service.ts';
import type { BotActionHandler } from '../types/bot-action-handler.interface.ts';
import type { IMedicationService } from '../../features/medication/types/medication.service.interface.ts';
import { logError } from '../../shared/utils/error-logger.util.ts';

export class AcceptNotificationHandler implements BotActionHandler<ActionContext> {
  constructor(
    private readonly botService: BotService,
    private readonly medicationService: IMedicationService
  ) {}

  async handle(ctx: ActionContext): Promise<void> {
    if (!ctx.match) {
      throw new Error('Something went wrong. Please try again later.');
    }

    const medicationId = parseInt(ctx.match[1]);
    const timestamp = ctx.match[2];

    logger.debug('Processing accept notification', { medicationId, timestamp });

    const result = await this.handleAcceptNotification(medicationId);

    if (result.success && result.medication) {
      try {
        await ctx.editMessageText(
          `✅ No more notifications will be sent for ${result.medication.name}`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        // todo think msg
        logError('Failed to edit message text', e);

        // todo throw error
      }

      try {
        await ctx.answerCbQuery('Medication removed successfully');
      } catch (e) {
        // todo think msg
        logError('Failed to answer callback query', e);
      }
    } else {
      await ctx.answerCbQuery('Error processing your request');
    }
  }

  // todo rename. choose place of the method. or remove the method
  private async handleAcceptNotification(medicationId: number) {
    const medication = await this.medicationService.getMedication(medicationId);

    if (!medication) {
      return {
        success: false,
      };
    }

    console.log(`handleAcceptNotification for ${medicationId}`);
    // todo remove notification and medication
    return {
      success: true,
      medication: {
        name: medication.name,
      },
    };
  }
}
