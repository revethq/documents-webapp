/**
 * Runtime environment configuration.
 *
 * Values are injected at container startup via __config.js,
 * allowing the same Docker image to be used across environments.
 *
 * SECURITY: All values here are PUBLIC and visible to end users.
 * Never add secrets, API keys, or sensitive data.
 */

export interface RuntimeEnv {
  API_URL: string;
  OIDC_AUTHORIZATION_SERVER_URI: string;
  OIDC_CLIENT_ID: string;
  OIDC_REDIRECT_URI: string;
  OIDC_SCOPE: string;
}

declare global {
  interface Window {
    __ENV__?: RuntimeEnv;
  }
}

/**
 * Build-time fallback values from NEXT_PUBLIC_* env vars.
 * Next.js requires literal `process.env.NEXT_PUBLIC_X` references
 * to inline them at compile time — dynamic lookups don't work.
 *
 * In production, __config.js is injected by the container entrypoint.
 * In local dev, values fall back to NEXT_PUBLIC_* from .env.local.
 */
const BUILD_TIME_ENV: RuntimeEnv = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  OIDC_AUTHORIZATION_SERVER_URI: process.env.NEXT_PUBLIC_OIDC_AUTHORIZATION_SERVER_URI ?? '',
  OIDC_CLIENT_ID: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ?? '',
  OIDC_REDIRECT_URI: process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI ?? '',
  OIDC_SCOPE: process.env.NEXT_PUBLIC_OIDC_SCOPE ?? '',
};

/**
 * Get a runtime environment value.
 *
 * Priority: window.__ENV__ (runtime injection) > NEXT_PUBLIC_* (build-time)
 */
export function getEnv<K extends keyof RuntimeEnv>(key: K): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.__ENV__?.[key] || BUILD_TIME_ENV[key] || '';
}

/**
 * Get all runtime environment values.
 * Returns undefined if running on server.
 */
export function getAllEnv(): RuntimeEnv | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.__ENV__;
}
