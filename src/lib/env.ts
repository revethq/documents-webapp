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
 * Get a runtime environment value.
 * Returns empty string if running on server or value is not set.
 */
export function getEnv<K extends keyof RuntimeEnv>(key: K): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.__ENV__?.[key] ?? '';
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
