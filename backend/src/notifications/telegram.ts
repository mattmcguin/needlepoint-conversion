import type { FeedbackRecord, IntentRecord } from '../db/client.js';

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';
const TELEGRAM_TIMEOUT_MS = 5_000;

export interface ProductNotifier {
  notifyFeedback(feedback: FeedbackRecord): Promise<void>;
  notifyIntent(intent: IntentRecord): Promise<void>;
}

interface TelegramNotifierOptions {
  botToken: string;
  chatId: string;
  fetch?: typeof globalThis.fetch;
}

function display(value: string | undefined, fallback = 'Not provided'): string {
  return value?.trim() || fallback;
}

function shortProjectId(projectId: string | undefined): string {
  return projectId ? projectId.slice(0, 12) : 'Not provided';
}

export function createTelegramNotifier(
  options: TelegramNotifierOptions
): ProductNotifier {
  const send = async (text: string): Promise<void> => {
    let response: Response;
    try {
      response = await (options.fetch ?? globalThis.fetch)(
        `${TELEGRAM_API_BASE_URL}/bot${options.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: options.chatId,
            text,
            disable_web_page_preview: true
          }),
          signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS)
        }
      );
    } catch (_error) {
      throw new Error('Telegram sendMessage request failed');
    }

    if (!response.ok) {
      throw new Error(`Telegram sendMessage failed with status ${response.status}`);
    }
  };

  return {
    async notifyFeedback(feedback): Promise<void> {
      await send(
        [
          'New Needlepoint Maker feedback',
          `Type: ${feedback.feedbackType}`,
          `Sentiment: ${display(feedback.sentiment)}`,
          `Reasons: ${feedback.reasons.length ? feedback.reasons.join(', ') : 'None selected'}`,
          `Message: ${display(feedback.message)}`,
          `Follow-up requested: ${feedback.followUpConsent ? 'Yes' : 'No'}`,
          `Project: ${shortProjectId(feedback.projectId)}`
        ].join('\n')
      );
    },

    async notifyIntent(intent): Promise<void> {
      await send(
        [
          'New Needlepoint Maker feature request',
          `Selection: ${intent.selectedOption}`,
          `Comment: ${display(intent.optionalComment)}`,
          `Project: ${shortProjectId(intent.projectId)}`
        ].join('\n')
      );
    }
  };
}
