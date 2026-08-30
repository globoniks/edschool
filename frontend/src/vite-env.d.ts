/// <reference types="vite/client" />


interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_MAPS_KEY?: string;
  /** White-label (dedicated build): full brand name. */
  readonly VITE_BRAND_NAME?: string;
  /** White-label: short name for tight chrome and the PWA manifest. */
  readonly VITE_BRAND_SHORT_NAME?: string;
  /** White-label: subtitle under the wordmark; empty string hides it. */
  readonly VITE_BRAND_TAGLINE?: string;
  /** White-label: URL of the brand logo image; unset uses the built-in mark. */
  readonly VITE_BRAND_LOGO_URL?: string;
  /** White-label: PWA theme colour (build-time only). */
  readonly VITE_BRAND_THEME_COLOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
