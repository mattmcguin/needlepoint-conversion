import type {
  AnalyticsEventRecord,
  FeedbackRecord,
  IntentRecord,
  VisitorActivity
} from '../db/client.js';

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';
const TELEGRAM_TIMEOUT_MS = 5_000;

export const TELEGRAM_SIGNAL_EVENTS = [
  'conversion_completed',
  'export_clicked',
  'progress_marked',
  'outcome_prompt_responded'
] as const;

export type TelegramSignalEvent = (typeof TELEGRAM_SIGNAL_EVENTS)[number];

export interface ProductNotifier {
  notifyFeedback(feedback: FeedbackRecord, activity?: VisitorActivity): Promise<void>;
  notifyIntent(intent: IntentRecord, activity?: VisitorActivity): Promise<void>;
  notifyAnalyticsEvent(event: AnalyticsEventRecord, activity?: VisitorActivity): Promise<void>;
}

interface TelegramNotifierOptions {
  botToken: string;
  chatId: string;
  fetch?: typeof globalThis.fetch;
}

const intentLabels: Record<string, string> = {
  printable_pdf: 'a printable PDF',
  thread_matching: 'real thread colors',
  pattern_cleanup: 'cleaner patterns',
  cloud_sync: 'projects on every device',
  physical_canvas: 'a painted canvas',
  other: 'something else',
  none: 'none of these'
};

const sentimentLabels: Record<string, string> = {
  positive: 'Good',
  neutral: 'Okay',
  negative: 'Frustrating'
};

const feedbackTypeLabels: Record<string, string> = {
  general: 'feedback',
  conversion: 'conversion feedback',
  export: 'export feedback',
  progress: 'progress feedback'
};

const reasonLabels: Record<string, string> = {
  hard_to_use: 'hard to use',
  pattern_quality: 'pattern quality',
  missing_export: 'missing export',
  missing_thread_colors: 'missing thread colors',
  progress_tracking: 'progress tracking',
  other: 'other'
};

const exportLabels: Record<string, string> = {
  grid_csv: 'grid CSV',
  legend_csv: 'color legend CSV',
  preview_png: 'preview image',
  grid_png: 'grid image'
};

const progressLabels: Record<string, string> = {
  under_1: 'under 1%',
  '1_to_24': '1–24%',
  '25_to_49': '25–49%',
  '50_to_74': '50–74%',
  '75_to_99': '75–99%',
  '100': '100%'
};

const durationLabels: Record<string, string> = {
  under_1s: 'under 1s',
  '1_to_3s': '1–3s',
  '3_to_10s': '3–10s',
  over_10s: 'over 10s'
};

function compact(parts: Array<string | undefined | false>): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join('\n');
}

function visitorCode(anonymousId: string): string {
  return anonymousId.slice(0, 8);
}

export function formatVisitorContext(
  anonymousId: string,
  activity?: VisitorActivity
): string {
  const parts = [`visitor ${visitorCode(anonymousId)}`];
  if (!activity || activity.sessions <= 1) {
    parts.push('first session');
  } else {
    parts.push('returning');
  }
  if (activity) {
    if (activity.conversions === 1) parts.push('first conversion');
    else if (activity.conversions > 1) parts.push(`${activity.conversions} conversions`);
    if (activity.exports === 1) parts.push('1 export');
    else if (activity.exports > 1) parts.push(`${activity.exports} exports`);
    if (activity.progressMarks > 0) parts.push('used stitch tracking');
  }
  return parts.join(' · ');
}

function quoted(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? `"${trimmed}"` : undefined;
}

function conversionSummary(properties: Record<string, unknown>): string | undefined {
  const mesh = typeof properties.mesh === 'number' ? `${properties.mesh} mesh` : undefined;
  const width = typeof properties.widthStitches === 'number' ? properties.widthStitches : undefined;
  const height = typeof properties.heightStitches === 'number' ? properties.heightStitches : undefined;
  const size = width && height ? `${width}×${height} stitches` : undefined;
  const colors =
    typeof properties.colorCount === 'number' ? `${properties.colorCount} colors` : undefined;
  const duration = durationLabels[String(properties.durationBucket || '')];
  const spec = [mesh, size, colors, duration].filter(Boolean).join(' · ');
  return spec || undefined;
}

function feedbackHeadline(feedback: FeedbackRecord): string {
  const sentiment = feedback.sentiment ? sentimentLabels[feedback.sentiment] : undefined;
  const type = feedbackTypeLabels[feedback.feedbackType] || 'feedback';
  return sentiment ? `${sentiment} ${type}` : type.charAt(0).toUpperCase() + type.slice(1);
}

function formatFeedback(feedback: FeedbackRecord, activity?: VisitorActivity): string {
  const reasons = feedback.reasons
    .map((reason) => reasonLabels[reason] || reason)
    .filter(Boolean);
  return compact([
    feedbackHeadline(feedback),
    quoted(feedback.message),
    reasons.length ? `They mentioned ${reasons.join(', ')}.` : undefined,
    feedback.followUpConsent ? 'They asked for a follow-up.' : undefined,
    formatVisitorContext(feedback.anonymousId, activity)
  ]);
}

function formatIntent(intent: IntentRecord, activity?: VisitorActivity): string {
  const choice = intentLabels[intent.selectedOption] || intent.selectedOption;
  return compact([
    `They want ${choice} next.`,
    quoted(intent.optionalComment),
    formatVisitorContext(intent.anonymousId, activity)
  ]);
}

function formatSignal(event: AnalyticsEventRecord, activity?: VisitorActivity): string | undefined {
  if (event.eventName === 'conversion_completed') {
    return compact([
      event.properties.isEdit ? 'Updated a pattern' : 'Converted a pattern',
      conversionSummary(event.properties),
      formatVisitorContext(event.anonymousId, activity)
    ]);
  }

  if (event.eventName === 'export_clicked') {
    const exportType = exportLabels[String(event.properties.exportType || '')] || 'a file';
    return compact([
      `Exported the ${exportType}`,
      formatVisitorContext(event.anonymousId, activity)
    ]);
  }

  if (event.eventName === 'progress_marked') {
    const bucket = progressLabels[String(event.properties.completedPercentBucket || '')];
    return compact([
      bucket ? `Marked stitch progress at ${bucket}` : 'Marked stitch progress',
      formatVisitorContext(event.anonymousId, activity)
    ]);
  }

  if (event.eventName === 'outcome_prompt_responded') {
    const ready = event.properties.response === 'yes';
    return compact([
      ready
        ? 'After exporting they said they are ready to stitch.'
        : 'After exporting they said it is not quite ready.',
      formatVisitorContext(event.anonymousId, activity)
    ]);
  }

  return undefined;
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
    async notifyFeedback(feedback, activity): Promise<void> {
      await send(formatFeedback(feedback, activity));
    },

    async notifyIntent(intent, activity): Promise<void> {
      await send(formatIntent(intent, activity));
    },

    async notifyAnalyticsEvent(event, activity): Promise<void> {
      const text = formatSignal(event, activity);
      if (!text) return;
      await send(text);
    }
  };
}
