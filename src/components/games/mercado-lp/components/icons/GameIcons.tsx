import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

// Level icons - Modern pixel-art style
export const SwapperIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M7 10L3 14L7 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 14H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 6L21 10L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 10H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ProviderIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 13H21" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 8V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V8" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="17" r="2" fill="currentColor"/>
  </svg>
);

export const FarmerIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M12 3V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 8C12 8 8 10 8 14C8 18 12 21 12 21C12 21 16 18 16 14C16 10 12 8 12 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M9 6L12 8L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AuctioneerIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M14.5 3L20 8.5L10.5 18H5V12.5L14.5 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 6L18 12" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// UI icons
export const TargetIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
  </svg>
);

export const LightbulbIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 17H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 3C8.68629 3 6 5.68629 6 9C6 11.2208 7.2066 13.1599 9 14.1973V17H15V14.1973C16.7934 13.1599 18 11.2208 18 9C18 5.68629 15.3137 3 12 3Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 3V1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 4.22L3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19.78 4.22L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const GraduationCapIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M12 4L2 9L12 14L22 9L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M6 11.5V17C6 17 8 20 12 20C16 20 18 17 18 17V11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 9V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ChartIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 14L11 10L15 14L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const WalletIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 14H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 6V5C6 3.89543 6.89543 3 8 3H16C17.1046 3 18 3.89543 18 5V6" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const CoinsIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <ellipse cx="9" cy="9" rx="7" ry="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 9C16 11.2091 12.866 13 9 13C5.13401 13 2 11.2091 2 9" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 9V15C2 17.2091 5.13401 19 9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="15" cy="15" rx="7" ry="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 15V19C22 21.2091 18.866 23 15 23C11.134 23 8 21.2091 8 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const FireIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M12 22C16.4183 22 20 18.4183 20 14C20 9.58172 16 6 12 2C12 6 9 8 8 10C7 12 8 14 8 14C8 14 6 13 6 10C4 12 4 14 4 14C4 18.4183 7.58172 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 22C14.2091 22 16 19.9853 16 17.5C16 15.0147 14 13 12 11C12 13 11 14 10 15C9 16 10 17 10 17C10 17 9 16.5 9 15C8 16 8 17 8 17.5C8 19.9853 9.79086 22 12 22Z" fill="currentColor"/>
  </svg>
);

export const TrophyIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 17V21" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 4H17V10C17 12.7614 14.7614 15 12 15C9.23858 15 7 12.7614 7 10V4Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 7H4C4 9.20914 5.79086 11 8 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 7H20C20 9.20914 18.2091 11 16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 4H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const BadgeIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M12 2L14.4 6.8L19.6 7.6L15.8 11.2L16.8 16.4L12 14L7.2 16.4L8.2 11.2L4.4 7.6L9.6 6.8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M8 16V22L12 20L16 22V16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

export const ScaleIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M12 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 7L12 5L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 7L5 15H1L3 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M21 7L23 15H19L21 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <rect x="10" y="19" width="4" height="2" fill="currentColor"/>
  </svg>
);

export const DropIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M12 3C12 3 6 10 6 14C6 17.3137 8.68629 20 12 20C15.3137 20 18 17.3137 18 14C18 10 12 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M9 14C9 12 10 10 12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SproutIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M12 21V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 12C12 12 8 10 8 6C12 6 14 8 14 8C14 8 16 6 20 6C20 10 16 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const BasketIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M5 10L7 20H17L19 10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 10L10 4H14L15 10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M10 14V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 14V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const BoltIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

export const BoxIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M21 8L12 13L3 8L12 3L21 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M3 8V16L12 21L21 16V8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 13V21" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const XpIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

export const CheckCircleIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PendingIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const QuestionIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9C15 10.6569 13.6569 12 12 12V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="18" r="1" fill="currentColor"/>
  </svg>
);

export const BookIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M4 19V5C4 3.89543 4.89543 3 6 3H20V17H6C4.89543 17 4 17.8954 4 19Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M4 19C4 17.8954 4.89543 17 6 17H20V21H6C4.89543 21 4 20.1046 4 19Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 7H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 11H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CelebrationIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <path d="M4 21L6 11L14 8L17 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 16L6 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="15" cy="15" r="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="20" cy="12" r="1" fill="currentColor"/>
    <circle cx="17" cy="19" r="1" fill="currentColor"/>
    <circle cx="21" cy="17" r="1" fill="currentColor"/>
  </svg>
);

export const GiftIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-current', className)}>
    <rect x="3" y="10" width="18" height="11" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 10V21" stroke="currentColor" strokeWidth="2"/>
    <rect x="5" y="6" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V3C12 3 9 3 9 5C9 6 10 6 12 6" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 6V3C12 3 15 3 15 5C15 6 14 6 12 6" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// Price impact indicators
export const PriceGoodIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-emerald-500', className)}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PriceNeutralIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-yellow-500', className)}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const PriceWarningIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-orange-500', className)}>
    <path d="M12 3L22 20H2L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 10V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1" fill="currentColor"/>
  </svg>
);

export const PriceDangerIcon = ({ className, size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn('text-red-500', className)}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 8L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 8L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Impact dots
export const ImpactDot = ({ level, className }: { level: 'low' | 'medium' | 'high'; className?: string }) => {
  const colors = {
    low: 'bg-emerald-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
  };

  return (
    <span className={cn('inline-block w-2 h-2 rounded-full', colors[level], className)} />
  );
};
