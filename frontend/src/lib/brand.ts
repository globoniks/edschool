/**
 * Branding for both white-label models.
 *
 * Two deployment shapes are supported, and both resolve through here:
 *
 *  (a) Shared deployment — many schools, one build. The build carries the
 *      vendor (Globoniks) identity; once a user signs in, their school's own
 *      name and logo take over inside the app chrome.
 *
 *  (b) Dedicated deployment — one school, its own build. The school's identity
 *      is baked in at build time via VITE_BRAND_* env vars, so even the
 *      pre-auth screens (login, install prompt, PWA manifest) carry it.
 *
 * Resolution order everywhere: signed-in school → build-time env → vendor
 * default. The PWA manifest and favicon can only follow model (b) — they are
 * emitted at build time and cannot vary per signed-in user.
 */

export interface Brand {
  /** Full product/school name, e.g. "Sunrise Public School". */
  name: string;
  /** Short name for tight chrome (wordmark, install prompt). */
  shortName: string;
  /** Subtitle under the wordmark; empty string hides it. */
  tagline: string;
  /** URL of a school-supplied logo image; null renders the built-in mark. */
  logoUrl: string | null;
}

/** The vendor identity — the fallback when nothing overrides it. */
export const VENDOR_BRAND: Brand = {
  name: 'Globoniks Schools',
  shortName: 'G Schools',
  tagline: 'Globoniks Schools',
  logoUrl: null,
};

/**
 * Build-time brand for dedicated (model b) deployments.
 * Unset vars fall through to the vendor identity, so a default build is
 * exactly the Globoniks-branded product.
 */
export const BUILD_BRAND: Brand = {
  name: import.meta.env.VITE_BRAND_NAME || VENDOR_BRAND.name,
  shortName: import.meta.env.VITE_BRAND_SHORT_NAME || VENDOR_BRAND.shortName,
  tagline:
    import.meta.env.VITE_BRAND_TAGLINE ??
    (import.meta.env.VITE_BRAND_NAME || VENDOR_BRAND.tagline),
  logoUrl: import.meta.env.VITE_BRAND_LOGO_URL || null,
};

interface SchoolLike {
  name?: string | null;
  logo?: string | null;
}

/**
 * Resolve the effective brand, optionally layering a signed-in school
 * (model a) over the build-time identity.
 *
 * The school's full name is used for the short name too: a school's own
 * name is what its parents should see, and truncation is the layout's job.
 */
export function resolveBrand(school?: SchoolLike | null): Brand {
  if (!school?.name) return BUILD_BRAND;
  return {
    name: school.name,
    shortName: school.name,
    // In-app, the vendor credit moves to the tagline slot.
    tagline: BUILD_BRAND.name,
    logoUrl: school.logo || BUILD_BRAND.logoUrl,
  };
}
