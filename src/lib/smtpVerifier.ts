// ============================================================
// In-House Direct SMTP Mailbox & Catch-All Verifier Module
// Communicates directly with target domain MX server over TCP Socket
// ============================================================

import { Socket } from 'node:net';
import { logger } from '@/lib/logger';
import { resolveDomainMx } from './dnsResolver';

export interface SmtpVerificationResult {
  email: string;
  smtpValid: boolean;
  isCatchAll: boolean;
  statusCode: number | null;
  responseMessage: string | null;
  mxServer: string | null;
  reason?: string;
}

const DEFAULT_TIMEOUT = 1500; // 1.5 seconds max per socket command (Vercel-safe)
const SENDER_EMAIL = 'verify@leadresolve.com';
const SENDER_DOMAIN = 'leadresolve.com';

/**
 * Verify an email address directly against the domain's MX server via SMTP RCPT TO protocol.
 * Also tests catch-all behavior using a randomized non-existent mailbox.
 */
export async function verifyEmailViaSmtp(
  email: string,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<SmtpVerificationResult> {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) {
    return {
      email,
      smtpValid: false,
      isCatchAll: false,
      statusCode: null,
      responseMessage: null,
      mxServer: null,
      reason: 'Invalid email syntax',
    };
  }

  const [, domain] = parts;

  // 1. Resolve MX server
  const mxRes = await resolveDomainMx(domain);
  if (!mxRes.hasMx || !mxRes.primaryMx) {
    return {
      email,
      smtpValid: false,
      isCatchAll: false,
      statusCode: null,
      responseMessage: null,
      mxServer: null,
      reason: 'Domain has no active MX records',
    };
  }

  const mxHost = mxRes.primaryMx;

  // 2. Perform direct SMTP check
  try {
    const rcptResult = await checkSmtpMailbox(mxHost, email, timeoutMs);

    // If mailbox exists (250 OK), check if domain is catch-all by testing a random address
    let isCatchAll = false;
    if (rcptResult.success) {
      const randomLocal = `chk_${Math.random().toString(36).substring(2, 10)}`;
      const randomEmail = `${randomLocal}@${domain}`;
      const catchAllCheck = await checkSmtpMailbox(mxHost, randomEmail, Math.min(timeoutMs, 3000));
      if (catchAllCheck.success) {
        isCatchAll = true;
      }
    }

    return {
      email,
      smtpValid: rcptResult.success,
      isCatchAll,
      statusCode: rcptResult.code,
      responseMessage: rcptResult.message,
      mxServer: mxHost,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SMTP Connection error';
    return {
      email,
      smtpValid: false,
      isCatchAll: false,
      statusCode: null,
      responseMessage: null,
      mxServer: mxHost,
      reason: msg,
    };
  }
}

interface SocketResponse {
  success: boolean;
  code: number | null;
  message: string | null;
}

/**
 * Execute low-level TCP Socket SMTP handshake sequence to check RCPT TO
 */
function checkSmtpMailbox(
  host: string,
  recipientEmail: string,
  timeout: number
): Promise<SocketResponse> {
  return new Promise((resolve) => {
    const socket = new Socket();
    let stage: 'CONNECT' | 'HELO' | 'MAIL_FROM' | 'RCPT_TO' | 'QUIT' = 'CONNECT';
    let responseCode: number | null = null;
    let responseMsg: string | null = null;
    let resolved = false;

    const finish = (success: boolean, code: number | null = null, msg: string | null = null) => {
      if (resolved) return;
      resolved = true;
      try {
        if (!socket.destroyed) {
          socket.write('QUIT\r\n');
          socket.destroy();
        }
      } catch {
        // ignore socket cleanup errors
      }
      resolve({ success, code: code ?? responseCode, message: msg ?? responseMsg });
    };

    socket.setTimeout(timeout);

    socket.on('timeout', () => {
      finish(false, 408, 'SMTP connection timeout');
    });

    socket.on('error', (err) => {
      finish(false, null, err.message);
    });

    socket.on('data', (data) => {
      const responseStr = data.toString('utf8');
      const match = responseStr.match(/^(\d{3})\s*(.*)/);
      
      if (!match) return;

      const code = parseInt(match[1], 10);
      const msg = match[2] ?? responseStr;
      responseCode = code;
      responseMsg = msg;

      switch (stage) {
        case 'CONNECT':
          if (code === 220) {
            stage = 'HELO';
            socket.write(`EHLO ${SENDER_DOMAIN}\r\n`);
          } else {
            finish(false, code, msg);
          }
          break;

        case 'HELO':
          if (code === 250 || code === 220) {
            stage = 'MAIL_FROM';
            socket.write(`MAIL FROM:<${SENDER_EMAIL}>\r\n`);
          } else {
            finish(false, code, msg);
          }
          break;

        case 'MAIL_FROM':
          if (code === 250) {
            stage = 'RCPT_TO';
            socket.write(`RCPT TO:<${recipientEmail}>\r\n`);
          } else {
            finish(false, code, msg);
          }
          break;

        case 'RCPT_TO':
          if (code === 250) {
            finish(true, code, msg);
          } else {
            // 550, 551, 552, 553, 554 mean address invalid / rejected
            finish(false, code, msg);
          }
          break;

        default:
          finish(false, code, msg);
      }
    });

    // Connect to port 25 (Standard SMTP)
    socket.connect(25, host);
  });
}
