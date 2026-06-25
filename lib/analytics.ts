// Plausible custom event helpers — call these from client components.
// init() is handled by components/Analytics.tsx in the root layout.
import { track as plausibleTrack } from "@plausible-analytics/tracker";

export const track = {
  reportCompleted: (plan: string) =>
    plausibleTrack("Report Completed", { props: { plan } }),
  upgradeCTAClicked: (from: string) =>
    plausibleTrack("Upgrade CTA Clicked", { props: { from } }),
  guestReportStarted: () =>
    plausibleTrack("Guest Report Started", {}),
  checkoutStarted: (plan: string) =>
    plausibleTrack("Checkout Started", { props: { plan } }),
};
