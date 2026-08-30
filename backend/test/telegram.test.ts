import { describe, expect, it, vi } from 'vitest';
import { createTelegramNotifier } from '../src/notifications/telegram.js';

describe('Telegram notifications', () => {
  it('sends useful feedback details without an email address', async () => {
    const fetch = vi.fn(
      async (..._args: Parameters<typeof globalThis.fetch>) =>
        new Response(JSON.stringify({ ok: true }))
    );
    const notifier = createTelegramNotifier({
      botToken: 'test-token-with-enough-characters',
      chatId: '123456789',
      fetch
    });

    await notifier.notifyFeedback({
      anonymousId: 'anonymous-1',
      projectId: 'project-123456789',
      feedbackType: 'conversion',
      sentiment: 'negative',
      reasons: ['pattern_quality'],
      message: 'The background has too many isolated stitches.',
      email: 'maker@example.com',
      followUpConsent: true
    });

    expect(fetch).toHaveBeenCalledOnce();
    const request = fetch.mock.calls[0];
    const body = JSON.parse(String(request?.[1]?.body)) as {
      chat_id: string;
      text: string;
    };

    expect(request?.[0]).toContain('/bottest-token-with-enough-characters/sendMessage');
    expect(body.chat_id).toBe('123456789');
    expect(body.text).toContain('New Needlepoint Maker feedback');
    expect(body.text).toContain('The background has too many isolated stitches.');
    expect(body.text).not.toContain('maker@example.com');
  });

  it('throws when Telegram rejects a message', async () => {
    const notifier = createTelegramNotifier({
      botToken: 'test-token-with-enough-characters',
      chatId: '123456789',
      fetch: vi.fn(
        async (..._args: Parameters<typeof globalThis.fetch>) =>
          new Response('', { status: 401 })
      )
    });

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
