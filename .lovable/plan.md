Edit `src/components/app-shell.tsx` to clean up the authenticated header:

1. Remove the top-nav "Profile" icon item from `navItems` while keeping the circular profile avatar dropdown at the far right.
2. Remove the bottom border line (`border-b border-border/60`) from the header wrapper.
3. Keep the AI Teacher nav item and all other navigation unchanged.

This is a single-file UI-only change. No backend or other route changes are needed.