// Unreachable — the client "Rewards" tab is inert (see (tabs)/_layout.tsx).
// A client's rewards already show on the Home screen's "My rewards"
// section; this file only needs to exist so the tab bar has a route to
// point at. Named distinctly from (tabs)/rewards.tsx, which is the salon's
// real rewards-management screen.
export default function ClientRewardsScreen() {
  return null;
}
