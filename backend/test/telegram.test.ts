import { describe, expect, it, vi } from 'vitest';
import { createTelegramNotifier, formatVisitorContext } from '../src/notifications/telegram.js';

function notifierWithFetch(fetch: typeof globalThis.fetch) {
  return createTelegramNotifier({
    botToken: 'test-token-with-enough-characters',
    chatId: '123456789',
    fetch
  });
}

async function sentText(
  run: (notifier: ReturnType<typeof createTelegramNotifier>) => Promise<void>
): Promise<string> {
  const fetch = vi.fn(
    async (..._args: Parameters<typeof globalThis.fetch>) =>
      new Response(JSON.stringify({ ok: true }))
  );
  await run(notifierWithFetch(fetch));
  const body = JSON.parse(String(fetch.mock.calls[0]?.[1]?.body)) as { text: string };
  return body.text;
}

describe('Telegram notifications', () => {
  it('formats returning visitor context without identifying the person', () => {
    expect(
      formatVisitorContext('7f3a2c1b-aaaa-bbbb-cccc-dddddddddddd', {
        conversions: 3,
        exports: 2,
        progressMarks: 1,
        sessions: 2
      })
    ).toBe('visitor 7f3a2c1b · returning · 3 conversions · 2 exports · used stitch tracking');
  });

  it('sends written feedback first and never includes the email address', async () => {
    const text = await sentText((notifier) =>
      notifier.notifyFeedback(
        {
          anonymousId: 'anonymous-1',
          projectId: 'project-123456789',
          feedbackType: 'conversion',
          sentiment: 'negative',
          reasons: ['pattern_quality'],
          message: 'The background has too many isolated stitches.',
          email: 'maker@example.com',
          followUpConsent: true
        },
        { conversions: 2, exports: 1, progressMarks: 0, sessions: 1 }
      )
    );

    expect(text).toContain('Frustrating conversion feedback');
    expect(text).toContain('The background has too many isolated stitches.');
    expect(text).toContain('They mentioned pattern quality.');
    expect(text).toContain('They asked for a follow-up.');
    expect(text).toContain('visitor anonymou · first session · 2 conversions · 1 export');
    expect(text).not.toContain('maker@example.com');
    expect(text).not.toContain('Photo and filename remain private');
  });

  it('notes a printable PDF waitlist without including the email', async () => {
    const text = await sentText((notifier) =>
      notifier.notifyIntent({
        anonymousId: 'anonymous-1',
        promptKey: 'post_conversion_features',
        selectedOption: 'printable_pdf',
        email: 'maker@example.com'
      })
    );

    expect(text).toContain('They want a printable PDF next.');
    expect(text).toContain('They asked to be notified about it.');
    expect(text).not.toContain('maker@example.com');
  });

  it('sends a feature vote as a sentence', async () => {
    const text = await sentText((notifier) =>
      notifier.notifyIntent({
        anonymousId: 'anonymous-1',
        promptKey: 'post_conversion_features',
        selectedOption: 'other',
        optionalComment: 'A custom thread palette'
      })
    );

    expect(text).toContain('They want something else next.');
    expect(text).toContain('A custom thread palette');
    expect(text).toContain('visitor anonymou · first session');
  });

  it('notifies on a completed conversion with pattern details', async () => {
    const text = await sentText((notifier) =>
      notifier.notifyAnalyticsEvent(
        {
          eventId: 'event-1',
          anonymousId: 'visitor-99',
          sessionId: 'session-1',
          eventName: 'conversion_completed',
          path: '/',
          properties: {
            mesh: 18,
            widthStitches: 72,
            heightStitches: 72,
            maxColors: 32,
            unitMode: 'inches',
            isEdit: false,
            colorCount: 24,
            durationBucket: '1_to_3s'
          },
          occurredAt: new Date()
        },
        { conversions: 1, exports: 0, progressMarks: 0, sessions: 1 }
      )
    );

    expect(text).toContain('Converted a pattern');
    expect(text).toContain('18 mesh · 72×72 stitches · 24 colors · 1–3s');
    expect(text).toContain('visitor visitor- · first session · first conversion');
  });

  it('notifies on export and stitch-progress signals', async () => {
    const exportText = await sentText((notifier) =>
      notifier.notifyAnalyticsEvent({
        eventId: 'event-2',
        anonymousId: 'visitor-99',
        sessionId: 'session-1',
        eventName: 'export_clicked',
        path: '/',
        properties: { exportType: 'grid_png' },
        occurredAt: new Date()
      })
    );
    const progressText = await sentText((notifier) =>
      notifier.notifyAnalyticsEvent({
        eventId: 'event-3',
        anonymousId: 'visitor-99',
        sessionId: 'session-1',
        eventName: 'progress_marked',
        path: '/',
        properties: { completedPercentBucket: '50_to_74' },
        occurredAt: new Date()
      })
    );

    expect(exportText).toContain('Exported the grid image');
    expect(progressText).toContain('Marked stitch progress at 50–74%');
  });

  it('includes a readiness blocker without extra identifiers', async () => {
    const text = await sentText((notifier) =>
      notifier.notifyAnalyticsEvent({
        eventId: 'event-4',
        anonymousId: 'visitor-99',
        sessionId: 'session-1',
        eventName: 'outcome_prompt_responded',
        path: '/',
        properties: {
          promptKey: 'post_export_ready',
          response: 'not_yet',
          reason: 'hard_to_print'
        },
        occurredAt: new Date()
      })
    );

    expect(text).toContain('not quite ready');
    expect(text).toContain('hard to print');
  });

  it('does not send image-selection alerts', async () => {
    const fetch = vi.fn(
      async (..._args: Parameters<typeof globalThis.fetch>) =>
        new Response(JSON.stringify({ ok: true }))
    );
    const notifier = notifierWithFetch(fetch);

    await notifier.notifyAnalyticsEvent({
      eventId: 'event-1',
      anonymousId: 'anonymous-1',
      sessionId: 'session-1',
      eventName: 'image_selected',
      path: '/',
      properties: {
        fileType: 'jpeg',
        megapixelsBucket: '1_to_5'
      },
      occurredAt: new Date()
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws when Telegram rejects a message', async () => {
    const notifier = notifierWithFetch(
      vi.fn(
        async (..._args: Parameters<typeof globalThis.fetch>) =>
          new Response('', { status: 401 })
      )
    );

    await expect(
      notifier.notifyIntent({
        anonymousId: 'anonymous-1',
        promptKey: 'post_conversion_features',
        selectedOption: 'other',
        optionalComment: 'A custom thread palette'
      })
    ).rejects.toThrow('Telegram sendMessage failed with status 401');
  });
});
