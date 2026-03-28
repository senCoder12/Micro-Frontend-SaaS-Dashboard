/**
 * Minimal inline SVG icons for the navigation sidebar.
 * Kept here (co-located) until we have enough icons to warrant
 * a proper icon library (e.g. lucide-react in a later step).
 *
 * Each icon accepts standard SVG props so callers can set
 * size, color, aria-label, etc.
 */
import React from 'react';

type IconProps = React.SVGAttributes<SVGElement> & {
  size?: number;
};

const defaultProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const DashboardIcon: React.FC<IconProps> = ({ size = 18, ...rest }) => (
  <svg {...defaultProps(size)} {...rest}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const AnalyticsIcon: React.FC<IconProps> = ({ size = 18, ...rest }) => (
  <svg {...defaultProps(size)} {...rest}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

export const WorkflowIcon: React.FC<IconProps> = ({ size = 18, ...rest }) => (
  <svg {...defaultProps(size)} {...rest}>
    <circle cx="12" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M12 7v4M5 17V13a7 7 0 0 1 7-7" />
    <path d="M19 17V13a7 7 0 0 0-7-7" />
  </svg>
);

export const BellIcon: React.FC<IconProps> = ({ size = 18, ...rest }) => (
  <svg {...defaultProps(size)} {...rest}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 18, ...rest }) => (
  <svg {...defaultProps(size)} {...rest}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 14, ...rest }) => (
  <svg {...defaultProps(size)} {...rest}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
