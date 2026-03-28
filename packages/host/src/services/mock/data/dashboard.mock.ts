/**
 * Dashboard mock data generators.
 *
 * WHY functions (not static objects):
 *   Static objects return the exact same data on every call — the UI
 *   never appears to "fetch" anything new. Functions with slight random
 *   variation simulate a live server: each refresh returns believably
 *   different numbers, exercising the loading states we built in Step 3.
 *
 * These are ONLY imported by the mock adapter. Service layer code
 * never touches this file — so in production the entire mock/data/
 * folder is tree-shaken away.
 */
import type { DashboardStats, StatChanges, ActivityItem } from '@/store/slices/dashboardSlice';

/** Deterministic random float in [min, max] seeded by a jitter factor */
function jitter(base: number, pct: number): number {
  const delta = base * (pct / 100);
  return Math.round((base + (Math.random() * 2 - 1) * delta) * 100) / 100;
}

// ── Stats ──────────────────────────────────────────────────────────────────

export function generateStats(): DashboardStats {
  return {
    revenue:        jitter(48_200, 5),
    users:          Math.round(jitter(3_842, 3)),
    sessions:       Math.round(jitter(12_431, 4)),
    conversionRate: jitter(4.8, 8),
  };
}

export function generateStatChanges(): StatChanges {
  return {
    revenue:        jitter(12.5, 20),
    users:          jitter(8.3, 15),
    sessions:       jitter(-2.1, 30),
    conversionRate: jitter(0.4, 50),
  };
}

// ── Activity ───────────────────────────────────────────────────────────────

const ACTIVITY_TEMPLATES: Array<{ message: string; type: ActivityItem['type'] }> = [
  { message: 'New user signup — alex@startup.io',      type: 'signup'  },
  { message: 'Payment received — $299 / Pro plan',     type: 'payment' },
  { message: 'New user signup — chen@enterprise.com',  type: 'signup'  },
  { message: 'Payment received — $49 / Starter plan',  type: 'payment' },
  { message: 'API rate limit warning — /v1/export',    type: 'alert'   },
  { message: 'Deployment completed — v2.4.2',          type: 'info'    },
  { message: 'New user signup — priya@scale.co',       type: 'signup'  },
  { message: 'Payment received — $599 / Enterprise',   type: 'payment' },
  { message: 'SSL certificate renewed — acme.io',      type: 'info'    },
  { message: 'New user signup — marcus@growth.dev',    type: 'signup'  },
  { message: 'High memory usage — worker-3 (89%)',     type: 'alert'   },
  { message: 'Payment received — $29 / Basic plan',    type: 'payment' },
];

function formatRelativeTime(msAgo: number): string {
  const minutes = Math.round(msAgo / 60_000);
  if (minutes < 1)  return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function generateActivityFeed(count = 8): ActivityItem[] {
  const now = Date.now();

  // Shuffle templates and take `count` items
  const shuffled = [...ACTIVITY_TEMPLATES].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count).map((tpl, i) => {
    const msecsAgo = (i + 1) * jitter(4 * 60_000, 30); // space them ~4min apart ±30%
    return {
      id:        `act_${now}_${i}`,
      message:   tpl.message,
      type:      tpl.type,
      timestamp: now - msecsAgo,
      time:      formatRelativeTime(msecsAgo),
    };
  });
}
