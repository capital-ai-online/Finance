import express from 'express';
import { rateLimitMiddleware } from '../../src/platform/Security/safeIo';
import { PasswordSecurityError } from '../../src/lib/passwordSecurity';
import {
  ServerPasswordSecurityError,
  assertServerPasswordSafe,
} from '../security/passwordSecurity';

export const passwordSecurityRouter = express.Router();

passwordSecurityRouter.use(
  rateLimitMiddleware({
    name: 'password-security',
    maxRequests: 12,
    windowMs: 60_000,
  }),
);

passwordSecurityRouter.post('/password-security/check', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const password = req.body?.password;
  if (typeof password !== 'string' || password.length === 0 || password.length > 1_024) {
    return res.status(400).json({ error: 'Ungültige Passwort-Prüfanfrage.' });
  }

  try {
    await assertServerPasswordSafe(password);
    return res.status(204).end();
  } catch (error) {
    if (error instanceof PasswordSecurityError) {
      return res.status(422).json({ error: error.message });
    }
    if (error instanceof ServerPasswordSecurityError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(503).json({
      error: 'Die Prüfung auf kompromittierte Passwörter ist derzeit nicht verfügbar.',
    });
  }
});
