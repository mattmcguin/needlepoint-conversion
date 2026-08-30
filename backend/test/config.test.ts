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
      LOG_LEVEL: 'silent'
    });

    expect(config.port).toBe(4321);
    expect(config.dataRetentionDays).toBe(90);
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
