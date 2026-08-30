import type {
  AnalyticsEventRecord,
  FeedbackRecord,
  IntentRecord
} from '../db/client.js';

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';
const TELEGRAM_TIMEOUT_MS = 5_000;

export interface ProductNotifier {
  notifyFeedback(feedback: FeedbackRecord): Promise<void>;
  notifyIntent(intent: IntentRecord): Promise<void>;
  notifyAnalyticsEvent(event: AnalyticsEventRecord): Promise<void>;
}

interface TelegramNotifierOptions {
  botToken: string;
  chatId: string;
  notifyImageUploads: boolean;
  fetch?: typeof globalThis.fetch;
}

function display(value: string | undefined, fallback = 'Not provided'): string {
  return value?.trim() || fallback;
}

function shortProjectId(projectId: string | undefined): string {
  return projectId ? projectId.slice(0, 12) : 'Not provided';
}

const intentLabels: Record<string, string> = {
  printable_pdf: 'Printable PDF',
  thread_matching: 'Real thread colors',
  pattern_cleanup: 'Cleaner patterns',
  cloud_sync: 'Projects on every device',
  physical_canvas: 'A painted canvas',
  other: 'Something else',
  none: 'None of these'
};

const imageSizeLabels: Record<string, string> = {
  under_1: 'Under 1 megapixel',
  '1_to_5': '1 to 5 megapixels',
  '5_to_12': '5 to 12 megapixels',
  over_12: 'Over 12 megapixels'
};

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
          'Needlepoint Maker question answered',
          `Selection: ${intentLabels[intent.selectedOption] || intent.selectedOption}`,
          `Comment: ${display(intent.optionalComment)}`,
          `Project: ${shortProjectId(intent.projectId)}`
        ].join('\n')
      );
    },

    async notifyAnalyticsEvent(event): Promise<void> {
      if (event.eventName === 'image_selected') {
        if (!options.notifyImageUploads) return;
        const fileType = String(event.properties.fileType || 'unknown').toUpperCase();
        const sizeBucket = String(event.properties.megapixelsBucket || 'unknown');
        await send(
          [
            'Image selected in Needlepoint Maker',
            `Type: ${fileType}`,
            `Size: ${imageSizeLabels[sizeBucket] || sizeBucket}`,
            'Photo and filename remain private'
          ].join('\n')
        );
        return;
      }

      if (event.eventName === 'outcome_prompt_responded') {
        const response = event.properties.response === 'yes'
          ? 'Yes, ready to stitch'
          : 'Not ready yet';
        await send(
          [
            'Needlepoint Maker readiness question answered',
            `Response: ${response}`,
            `Project: ${shortProjectId(event.projectId)}`
          ].join('\n')
        );
      }
    }
  };
}
