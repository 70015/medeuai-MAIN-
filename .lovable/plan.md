## Why it feels slow

I audited the app and found the four things making it feel like a government portal:

1. **Client-side data waterfalls.** No route uses a TanStack `loader`. Every page mounts, *then* fires `useEffect`/`useQuery` to talk to the backend. The user stares at a spinner while the browser does: render → mount → auth check → fetch → render again.
2. **Page-transition animation on every navigation.** `PageTransition` runs a 500 ms fade+slide on every route change (`src/components/page-transition.tsx`). Even after the data is ready, the page is still visually "arriving" for half a second.
3. **No preloading on links.** TanStack Router can prefetch route code + data on link hover/intent, but it isn't configured, so each click pays the full network round-trip.
4. **Heavy first paint.** `src/routes/index.tsx` is 329 lines with all sections rendered eagerly, and `__root.tsx` ships Toaster + Sonner + full header on every route.

## What I'll change (frontend/perf only, no feature changes)

### 1. Fetch data in loaders, not `useEffect`
For each authenticated page (`dashboard`, `tests.index`, `tests.$slug`, `leaderboard`, `profile`, `results.$attemptId`, `attempt.$attemptId`, admin pages), move the initial Supabase reads into the route `loader` using `context.queryClient.ensureQueryData(...)` and read them in the component with `useSuspenseQuery`. This is the canonical TanStack pattern and removes the mount-then-fetch waterfall.

### 2. Enable router-level preloading
In `src/router.tsx`, set:
```
defaultPreload: 'intent',
defaultPreloadStaleTime: 0,
```
So hovering/touching a link warms the route bundle + query cache before the click.

### 3. Make the page transition cheap
Shorten `PageTransition` from `duration-500 slide-in-from-bottom-2` to `duration-150 fade-in` (or gate behind `motion-reduce`). Keeps the polish, removes the perceived lag. No layout shift.

### 4. Trim first paint
- Lazy-render below-the-fold sections of `src/routes/index.tsx` (features/testimonials/FAQ) with `React.lazy` + `Suspense`, keeping only hero + CTA in the critical path.
- Split large admin routes with `.lazy.tsx` where they aren't already.

### 5. Query client defaults
In `src/router.tsx` (or wherever `QueryClient` is created), set:
```
defaultOptions: { queries: { staleTime: 60_000, gcTime: 5*60_000, refetchOnWindowFocus: false } }
```
So re-visiting a page is instant instead of re-fetching.

### 6. Verify
After changes I'll run Playwright against `localhost:8080`, capture:
- Time-to-interactive on `/` and `/dashboard`
- Network waterfall (fetch count, parallelism)
- Console for errors
and screenshot before/after.

## Out of scope

- No UI redesign, no copy changes, no auth/business-logic changes.
- No backend/RLS/index changes yet — I'll only touch DB if the Playwright pass shows a specific query is the bottleneck (then I'd add an index in a follow-up).

Approve this and I'll implement it in one pass.