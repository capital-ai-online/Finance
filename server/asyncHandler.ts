// Compliance-Review Punkt 1 — Express 4 (im Einsatz: ^4.21.2) ruft bei einem async
// Route-Handler, der eine Exception wirft/eine Promise ablehnt, NICHT automatisch
// next(err) auf (das ist erst ab Express 5 Standardverhalten). Ohne diesen Wrapper
// bleibt der Request in solchen Fällen hängen (Client-Timeout) und die Rejection wird
// unbehandelt - genau das Risiko aus Abschnitt 3.2.1 des Compliance-Reviews.
//
// Verwendung: router.post('/x', asyncHandler(async (req, res) => { ... }))

import type { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
