# Article CMS improvements (minimal scope)

Only the article editor and public article pages change. No redesign, no auth changes, no SEO/sitemap/robots changes.

## 1. Comfortable long-article editing
- Toolbar stays pinned at the top of the editor while you scroll through content.
- Content area gets its own scroll with a sensible max height (roughly 65% of screen), so the page itself doesn't need scrolling to reach formatting tools.
- All existing tools (H1-H3, bold, italic, lists, quote, link, image, table, undo/redo) stay exactly where they are.

## 2. Real image workflow
- Clicking the image button opens a small dialog with two tabs: Upload and Media library.
- Upload sends the file to a new public `article-media` storage bucket (admin-only writes, public reads) — needed because existing buckets are private and would not display on public pages.
- Media library lists previously uploaded article images for reuse.
- Alt text and optional caption fields; the image is inserted into the article (caption rendered as a figure caption).
- No URL pasting required (a URL field stays available as a fallback).

## 3. Easier links
- Clicking the link button opens a dialog with:
  - a search box listing published articles and the main site pages (home, about, articles, privacy policy) for internal links;
  - a field for any external URL.
- Internal links insert as site-relative paths so they always match the live domain; external links open in a new tab.
- Public page rendering of links stays as-is (already styled).

## 4. Article-to-product CTAs on public pages
- Article pages get a slim header with the MedEu.Ai logo, a "Login" link and a "Try MedEuAi" button, both pointing at the existing auth/app flow (no new login).
- Breadcrumbs (Home / Articles / title) with existing markup style.
- One mid-article CTA strip and one end-of-article CTA, plus a compact footer CTA. No per-paragraph buttons.

## 5. Admin-editable CTA blocks inside articles
- A "CTA block" button in the editor toolbar inserts an editable block with heading, description, button text, button destination, and a visible/hidden toggle.
- Blocks are stored inside the article content itself (no new table), so multiple blocks per article work and can be edited or removed later from the editor.
- Public pages render visible blocks with brand styling; hidden ones are skipped.

## 6. Verification
- Load the existing published article and confirm images, links, CTAs, breadcrumbs, header buttons, related articles and mobile layout all work.

## Technical notes
- Edits: `src/components/admin/rich-text-editor.tsx` (sticky toolbar, scroll area, image/link/CTA dialogs), a new small `image-picker`/`link-picker`/CTA node module under `src/components/admin/`, `src/routes/articles.$slug.tsx` and `src/routes/articles.index.tsx` (header CTA, breadcrumbs, CTA rendering), `src/styles.css` (figure/caption + CTA block styles).
- One migration: create public `article-media` bucket with admin-insert and public-select policies.
- CTA blocks use a TipTap custom node serialising to a `div[data-cta]` element, rendered by the existing `dangerouslySetInnerHTML` article body — no schema or SEO field changes.
- Related articles: a short "More articles" list from the existing published-articles query (same category first) if not already present.
