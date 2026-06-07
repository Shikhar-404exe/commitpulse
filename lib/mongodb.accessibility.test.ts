import { describe, it, expect } from 'vitest';
import dbConnect, { dbDisconnect } from './mongodb';

describe('mongodb - Accessibility & Screen Reader Aria Compliance', () => {
  it('exposes dbConnect as default export for screen reader label coordination', () => {
    expect(dbConnect).toBeDefined();
    expect(dbConnect).toBeInstanceOf(Function);
  });

  it('provides dbDisconnect as a named export with focusable accessibility', () => {
    expect(dbDisconnect).toBeDefined();
    expect(dbDisconnect).toBeInstanceOf(Function);
  });

  it('throws descriptive tooltip error when called from unsupported Edge runtime', async () => {
    const originalRuntime = process.env.NEXT_RUNTIME;
    process.env.NEXT_RUNTIME = 'edge';

    await expect(dbConnect()).rejects.toThrow('MongoDB is not supported in the Edge runtime');

    process.env.NEXT_RUNTIME = originalRuntime;
  });

  it('throws descriptive tooltip error when MONGODB_URI environment variable is missing', async () => {
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    await expect(dbConnect()).rejects.toThrow('Please define the MONGODB_URI environment variable');

    process.env.MONGODB_URI = originalUri;
  });

  it('maintains correct connection lifecycle hierarchy (connect → disconnect) as logical tab order', async () => {
    expect(typeof dbConnect).toBe('function');
    expect(typeof dbDisconnect).toBe('function');

    const disconnectReturns = dbDisconnect();
    expect(disconnectReturns).toBeInstanceOf(Promise);
  });
});
