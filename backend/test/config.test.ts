import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('normalizes origins and numeric values', () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      PORT: '4321',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/needlepoint',
      APP_ORIGINS: 'https://needlepointmaker.com, http://localhost:8000',
      DATA_RETENTION_DAYS: '90',
      TELEGRAM_BOT_TOKEN: 'test-token-with-enough-characters',
      TELEGRAM_CHAT_ID: '123456789',
      TELEGRAM_NOTIFY_IMAGE_UPLOADS: 'false',
      LOG_LEVEL: 'silent'
    });

    expect(config.port).toBe(4321);
    expect(config.dataRetentionDays).toBe(90);
    expect(config.telegramBotToken).toBe('test-token-with-enough-characters');
    expect(config.telegramChatId).toBe('123456789');
    expect(config.telegramNotifyImageUploads).toBe(false);
    expect(config.appOrigins).toEqual([
      'https://needlepointmaker.com',
      'http://localhost:8000'
    ]);
  });

  it('fails when required values are missing', () => {
    expect(() => loadConfig({ NODE_ENV: 'test' })).toThrow(
      'Invalid backend configuration'
    );
  });
});
