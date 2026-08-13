/**
 * How this instance is deployed, as distinct from how people sign in.
 *
 * These were the same flag until now. `NEXT_PUBLIC_AUTH_MODE=local` means
 * "email and password rather than Firebase", but it was also read as
 * "self-hosted" - so a managed deployment using local accounts announced
 * itself as "🏠 Self-hosted mode" and redirected past its own landing page.
 * They are orthogonal: a Vercel deployment can use local accounts, and a
 * self-hosted one can use Firebase.
 */

export type DeploymentMode = "cloud" | "selfHosted";

/**
 * Defaults to self-hosted, because that is the deployment that cannot easily
 * set an environment variable - `install.sh` writes a .env by hand, whereas a
 * managed platform has a settings page.
 */
export function getDeploymentMode(): DeploymentMode {
  return process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "cloud"
    ? "cloud"
    : "selfHosted";
}

/** A short label for the sign-in and sign-up screens. */
export function getDeploymentLabel(): string {
  return getDeploymentMode() === "cloud"
    ? "☁️ Hosted on Vercel"
    : "🏠 Self-hosted";
}

/**
 * Whether the marketing landing page is worth showing.
 *
 * `NEXT_PUBLIC_SHOW_LANDING_PAGE` decides it when set - the variable existed
 * and was documented but nothing read it, so setting it did nothing. Otherwise
 * a hosted deployment shows the page and a self-hosted one goes straight to
 * sign-in, since the people reaching a private instance have already been sold.
 */
export function shouldShowLandingPage(): boolean {
  const configured = process.env.NEXT_PUBLIC_SHOW_LANDING_PAGE;
  if (configured === "true") return true;
  if (configured === "false") return false;

  return getDeploymentMode() === "cloud";
}
