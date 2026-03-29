/**
 * Tests for the email service
 * Resend SDK is mocked — no real emails are sent.
 */
import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSend = jest.fn<(...args: any[]) => Promise<{ id: string }>>().mockResolvedValue({ id: 'email-id-123' });

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

process.env.RESEND_API_KEY = 're_test_key';
process.env.FRONTEND_URL   = 'http://localhost:5173';
process.env.EMAIL_FROM     = 'test@example.com';

import { sendWelcomeEmail, sendUpgradeConfirmationEmail } from '../src/services/email';

beforeEach(() => mockSend.mockClear());

describe('sendWelcomeEmail', () => {
  it('sends an email with the correct recipient', async () => {
    await sendWelcomeEmail('user@example.com');
    expect(mockSend).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args: any = (mockSend.mock.calls[0] as any[])[0];
    expect(args.to).toBe('user@example.com');
    expect(args.subject).toMatch(/willkommen/i);
    expect(args.html).toMatch(/localhost:5173/);
  });
});

describe('sendUpgradeConfirmationEmail', () => {
  it('mentions the plan name in the email for pro', async () => {
    await sendUpgradeConfirmationEmail('pro@example.com', 'pro');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args: any = (mockSend.mock.calls[0] as any[])[0];
    expect(args.to).toBe('pro@example.com');
    expect(args.html).toMatch(/Pro/);
  });

  it('works for business plan', async () => {
    await sendUpgradeConfirmationEmail('biz@example.com', 'business');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args: any = (mockSend.mock.calls[0] as any[])[0];
    expect(args.html).toMatch(/Business/);
  });

  it('does nothing when RESEND_API_KEY is unset', async () => {
    const key = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    await jest.isolateModulesAsync(async () => {
      const mod = await import('../src/services/email') as typeof import('../src/services/email');
      await mod.sendWelcomeEmail('nobody@example.com');
    });
    expect(mockSend).not.toHaveBeenCalled();
    process.env.RESEND_API_KEY = key;
  });
});
