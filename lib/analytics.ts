// Plausible Analytics — custom event tracking helpers.
// The tracking script is loaded in app/layout.tsx.
// Call these from client components at key conversion moments.

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export function trackEvent(event: string, props?: Record<string, string | number>) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(event, props ? { props } : undefined);
  }
}

// Named goal events matching the Plausible dashboard goals
export const track = {
  reportCompleted: (plan: string) => trackEvent("Report Completed", { plan }),
  upgradeCTAClicked: (from: string) => trackEvent("Upgrade CTA Clicked", { from }),
  guestReportStarted: () => trackEvent("Guest Report Started"),
  checkoutStarted: (plan: string) => trackEvent("Checkout Started", { plan }),
};
