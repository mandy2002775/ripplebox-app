// Unreachable — the "Discover" tab is inert (see (tabs)/_layout.tsx). Salon
// discovery lives on the Home screen's "Redeem a friend's code" list; this
// file only needs to exist so the tab bar has a route to point at.
export default function DiscoverScreen() {
  return null;
}
