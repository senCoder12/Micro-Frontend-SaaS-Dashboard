import type { DashboardStats, StatChanges, ActivityItem } from '@/store/slices/dashboardSlice';

function jitter(base: number, pct: number): number {
  const delta = base * (pct / 100);
  return Math.round((base + (Math.random() * 2 - 1) * delta) * 100) / 100;
}

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

const ACTIVITY_TEMPLATES: Array<{ message: string; type: ActivityItem['type'] }> = [
  { message: 'New user signup — alex@startup.io',      type: 'signup'  },
  { message: 'Payment received — $299 / Pro plan',     type: 'payment' },
  { message: 'New user signup — chen@enterprise.com',  type: 'signup'  },
  { message: 'Payment received — $49 / Starter plan',  type: 'payment' },
  { message: 'API rate limit warning — /v1/export',    type: 'alert'   },
  { message: 'Deployment completed — v2.4.2',          type: 'info'    },
  { message: 'New user signup — priya@scale.co',       type: 'signup'  },
  { message: 'Payment received — $599 / Enterprise',   type: 'payment' },
];

function formatRelativeTime(msAgo: number): string {
  const minutes = Math.round(msAgo / 60_000);
  if (minutes < 1)  return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export function generateActivityFeed(count = 8): ActivityItem[] {
  const now     = Date.now();
  const shuffled = [...ACTIVITY_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((tpl, i) => {
    const msecsAgo = (i + 1) * jitter(4 * 60_000, 30);
    return {
      id:        `act_${now}_${i}`,
      message:   tpl.message,
      type:      tpl.type,
      timestamp: now - msecsAgo,
      time:      formatRelativeTime(msecsAgo),
    };
  });
}
