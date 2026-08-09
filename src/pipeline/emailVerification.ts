// ============================================================
// Email Verification — Stage 4
// Independently verifies a discovered email address
// ============================================================

import { EmailResult, EmailStatus, EmailVerificationDetails } from '@/types';
import { verifyEmailWithHunter } from '@/providers/hunter';
import { verifyEmailViaSmtp } from '@/lib/smtpVerifier';
import { validateEmailSyntax } from '@/lib/validation';
import { logger } from '@/lib/logger';

export interface EmailVerificationResult {
  email: EmailResult;
  upgraded: boolean; // True if status was upgraded after verification
}

/**
 * Verify an email address and upgrade its status if verification passes.
 * Uses Hunter API if available, or falls back to in-house direct SMTP verification.
 */
export async function verifyEmail(
  emailResult: EmailResult,
  requestId?: string
): Promise<EmailVerificationResult> {
  const { address } = emailResult;
  const start = Date.now();

  // Step 1: Syntax check (always free)
  const syntaxValid = validateEmailSyntax(address);
  if (!syntaxValid) {
    logger.warn('email_verification_invalid_syntax', {
      operation: 'email_verification',
      request_id: requestId,
      status: 'error',
    });
    return {
      email: {
        ...emailResult,
        status: 'invalid',
        verification: { syntaxValid: false },
      },
      upgraded: false,
    };
  }

  // Step 2: Verification (Hunter API or In-House SMTP Probe)
  let verificationDetails: EmailVerificationDetails = { syntaxValid: true };
  let newStatus: EmailStatus = emailResult.status;
  let upgraded = false;

  try {
    const hunterVerification = await verifyEmailWithHunter(address);

    if (hunterVerification) {
      verificationDetails = {
        syntaxValid: true,
        domainExists: hunterVerification.details.mxValid,
        mxValid: hunterVerification.details.mxValid,
        disposable: hunterVerification.details.disposable,
        roleBased: false,
        catchAll: hunterVerification.details.catchAll,
        providerVerified: true,
        mailboxStatus: hunterVerification.details.mailboxStatus as
          | 'valid'
          | 'invalid'
          | 'unknown'
          | 'catch_all'
          | undefined,
      };

      if (
        hunterVerification.valid &&
        !hunterVerification.details.disposable &&
        !hunterVerification.details.catchAll
      ) {
        if (emailResult.status !== 'verified') {
          newStatus = 'verified';
          upgraded = true;
        }
      } else if (hunterVerification.details.catchAll) {
        newStatus = 'catch_all';
      } else if (!hunterVerification.valid) {
        newStatus = 'invalid';
      }
    } else {
      // In-House Direct SMTP Probe Fallback
      const smtpRes = await verifyEmailViaSmtp(address);
      verificationDetails = {
        syntaxValid: true,
        domainExists: smtpRes.statusCode !== null,
        mxValid: smtpRes.mxServer !== null,
        catchAll: smtpRes.isCatchAll,
        providerVerified: true,
        mailboxStatus: smtpRes.smtpValid ? 'valid' : 'unknown',
      };

      if (smtpRes.smtpValid && !smtpRes.isCatchAll) {
        newStatus = 'verified';
        upgraded = true;
      } else if (smtpRes.isCatchAll) {
        newStatus = 'catch_all';
      }
    }
  } catch (err) {
    logger.warn('email_verification_error', {
      operation: 'email_verification',
      request_id: requestId,
      error_type: err instanceof Error ? err.constructor.name : 'unknown',
    });
    verificationDetails = { syntaxValid: true };
  }

  const duration = Date.now() - start;
  logger.info('email_verification_complete', {
    operation: 'email_verification',
    request_id: requestId,
    duration_ms: duration,
    status: 'success',
  });

  return {
    email: {
      ...emailResult,
      status: newStatus,
      verification: verificationDetails,
    },
    upgraded,
  };
}
