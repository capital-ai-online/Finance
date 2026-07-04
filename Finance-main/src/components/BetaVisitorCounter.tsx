/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Beta-phase visitor counter widget, shown top-right. Real count from
 * /api/visitor-count (page_views table) — never a fabricated number. If
 * tracking isn't available (Supabase not configured), the widget hides
 * itself rather than showing a fake or zero-looking number.
 */

import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

function getAnonSessionId(): string {
  const key = 'capital_ai_anon_session';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function BetaVisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const anonId = getAnonSessionId();
    fetch('/api/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonId }),
    }).catch(() => {});

    const loadCount = () => {
      fetch('/api/visitor-count')
        .then(res => res.json())
        .then(data => {
          if (data.available && typeof data.count === 'number') {
            setCount(data.count);
            setVisible(true);
          } else {
            setVisible(false);
          }
        })
        .catch(() => setVisible(false));
    };

    loadCount();
    const interval = setInterval(loadCount, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!visible || count === null) return null;

  return (
    <div className="fixed top-3 right-3 z-40 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md text-[10px] font-mono text-white/70 shadow-lg">
      <Users size={12} className="text-emerald-400" />
      <span>{count} Besucher heute · Beta</span>
    </div>
  );
}
