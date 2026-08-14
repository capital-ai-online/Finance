-- Owner-Folgeanfrage 2026-08-14: das verpflichtende Onboarding (siehe
-- 20260814153000/154500) waere wirkungslos, wenn ein Konto seinen einzigen Faktor direkt danach
-- wieder entfernen koennte, ohne dass die App das verhindert. profiles.onboarding_required
-- eignet sich dafuer NICHT als Signal, da es beim Abschluss des Onboardings bewusst auf false
-- zurueckgesetzt wird (einmaliger Gate-Zustand, kein Dauer-Flag).
--
-- mfa_required_account ist daher ein separates, dauerhaftes Flag: wird beim erfolgreichen
-- Abschluss von POST /api/auth/mfa/enrollment-complete auf true gesetzt (server/stepUp.ts) und
-- bleibt dann bestehen - "einmal verpflichtet, bleibt verpflichtet, mindestens einen Faktor zu
-- behalten". Bestandskonten (zum Migrationszeitpunkt bereits vorhanden) werden NICHT rueckwirkend
-- gebunden.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_required_account boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET mfa_required_account = false;
