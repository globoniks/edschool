import { useId } from 'react';
import { clsx } from 'clsx';
import { useBrand } from '../hooks/useBrand';
import { VENDOR_BRAND, type Brand } from '../lib/brand';

/**
 * Globoniks Schools brand mark — the "G" globe.
 *
 * Rendered inline (rather than <img src="/logo.svg">) so it stays crisp at every
 * size, needs no extra request, and can never flash in late. The source of truth
 * for the artwork is `public/brand/logo.svg`; keep the two in sync and re-run
 * `node generate-icons.js` after any change so the favicon and PWA icons follow.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      className={clsx('shrink-0', className)}
      role="img"
      aria-label="Globoniks Schools"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A237E" />
          <stop offset=".55" stopColor="#000666" />
          <stop offset="1" stopColor="#00042E" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />
      <ellipse
        cx="32"
        cy="32"
        rx="6.6"
        ry="16"
        fill="none"
        stroke="#fff"
        strokeOpacity=".38"
        strokeWidth="2.4"
      />
      <path
        d="M47.03 26.53A16 16 0 1 0 45.11 41.18V32.6H35.2"
        fill="none"
        stroke="#fff"
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="49.6" cy="19.4" r="3.4" fill="#8C9EFF" />
    </svg>
  );
}

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  /** `mark` is the tile alone; `compact` adds the wordmark; `stacked` adds a subtitle under it. */
  variant?: 'mark' | 'compact' | 'stacked';
  size?: LogoSize;
  /** Subtitle for the `stacked` variant; defaults to the brand tagline. */
  subtitle?: string;
  /**
   * Pin the vendor identity regardless of who is signed in — for surfaces that
   * are Globoniks' own (the public landing page), not the school's.
   */
  vendor?: boolean;
  className?: string;
}

/**
 * The mark for the current brand: the school's uploaded logo when one exists,
 * the built-in G globe otherwise. School logos are arbitrary images, so they
 * get contained in the same rounded square footprint as the globe.
 */
function BrandMark({ brand, className }: { brand: Brand; className?: string }) {
  if (!brand.logoUrl) return <LogoMark className={className} />;
  return (
    <img
      src={brand.logoUrl}
      alt={brand.name}
      className={clsx('shrink-0 rounded-xl object-contain', className)}
    />
  );
}

const markSize: Record<LogoSize, string> = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
};

const wordSize: Record<LogoSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

export default function Logo({
  variant = 'compact',
  size = 'md',
  subtitle,
  vendor = false,
  className,
}: LogoProps) {
  const viewerBrand = useBrand();
  const brand = vendor ? VENDOR_BRAND : viewerBrand;

  if (variant === 'mark') {
    return <BrandMark brand={brand} className={clsx(markSize[size], className)} />;
  }

  return (
    <span className={clsx('flex items-center gap-2.5', className)}>
      <BrandMark brand={brand} className={markSize[size]} />
      <span className="flex flex-col leading-tight min-w-0">
        <span
          className={clsx(
            'font-headline font-extrabold tracking-tight text-brand-900 truncate',
            wordSize[size]
          )}
        >
          {brand.shortName}
        </span>
        {variant === 'stacked' && (subtitle ?? brand.tagline) && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 truncate">
            {subtitle ?? brand.tagline}
          </span>
        )}
      </span>
    </span>
  );
}
