# Portfolio site — project guide

Jermaine Dennis's engineering portfolio. Started as a redesign of a bare-template
Wix site (`jermainedennis.wixsite.com/software-engineering`); rebuilt as a
standalone, hand-coded static site so it's real, free-hosted, and fully editable.

- **Live:** https://jdshaolinstar.github.io/engineering-portfolio/
- **Repo:** https://github.com/jdshaolinstar/engineering-portfolio (public)
- **Local dev:** `python -m http.server 8642` from this `site/` directory, then
  open `http://localhost:8642/index.html`. No build step — plain HTML/CSS/JS.

## Structure

```
site/
  index.html          all page content/markup
  styles.css           design tokens + all styling
  script.js             lightbox, nav toggle, scroll reveal, hero parallax
  pilot.js               opt-in "fly the page" easter egg (see below)
  assets/
    *.png/*.jpg           real project screenshots pulled from the old Wix site
    resumes/
      jermaine-dennis-ai-engineer.pdf   PRIMARY — linked from nav + contact
      jermaine-dennis-fullstack.pdf     unlisted — direct-link only, for
                                          generalist-SWE outreach
```

Deploy = push to `main`. GitHub Pages serves the repo root directly, no CI/build.

## Design system

- **Palette:** near-black ink (`--ink #0b0d10`) + warm paper text (`--paper
  #ecebe4`) + a depth-sensor-inspired cyan/amber duotone (`--cyan #4de1ee`,
  `--amber #f2a65a`) — chosen because the subject's real work is spatial/depth
  video (2.5D conversion, point clouds), not a generic AI-portfolio accent.
- **Type:** Space Grotesk (display/headings), IBM Plex Sans (body), IBM Plex
  Mono (tags, eyebrows, nav labels, captions).
- **Signature element:** hero has a CSS perspective grid floor + scattered
  point-cloud dots that parallax on mouse move — nods to the depth-mapping /
  spatial-video theme.

## Content notes (why things are the way they are)

- Content is pulled from the **real** old Wix site: 14 projects, 20 real video
  assets (2 native Wix clips, 16 YouTube, 2 Vimeo) plus 3 real screenshots.
  Nothing is placeholder/invented — verify against the live Wix site or resumes
  before adding new project copy.
- Videos load lazily in a full lightbox modal (`#lightbox` in index.html,
  logic in `script.js`) — not inline in the small card, since that was
  reported as unusable ("thumbnails too small").
- **Résumé:** two versions exist. `ai-engineer.pdf` is the public default
  (linked from nav/footer/contact) per Jermaine's explicit choice — it matches
  the site's "XR & AI Software Engineer" framing. `fullstack.pdf` is kept
  unlisted for when he wants to send the broader generalist pitch directly.
- **About section** — real bio arc, corrected once already: BFA Illustration
  (University of the Arts, Philadelphia) → Gnomon + early Hollywood work (LA)
  → nine years in Tokyo (VR/CG/anime projects), of which two and a half years
  specifically were at Square Enix (Final Fantasy, Kingdom Hearts, did the
  FFVII Remake key art) → Thor: Love and Thunder lighting at Method Studios →
  pulled into software full time. Don't compress "nine years in Tokyo" back
  down to "at Square Enix" — that was the original mistake.
- Explicitly **left out**: GDC 2026 Event Finder traction numbers (800+ views,
  10+ conversations, 97/100 QR-scan conversion) — Jermaine's call, felt the
  scale could read as small to some viewers. Don't re-add without asking.
- Social links: the old Wix site had dead placeholder icons (`facebook.com/wix`
  etc., never customized). Real links now: LinkedIn
  (`linkedin.com/in/jermaine-dennis-813212a/`) in nav + footer, and the two
  live Yakimo products linked directly from the Yakimo AI Agents card:
  `yakimo.co/superjay` (his own agent) and `yakimo.co/remi` (photoreal agent).
- Style rule from Jermaine: avoid em dashes in body copy (reads as AI-written).
  Watch for this in future edits — grep for `—` before finishing a copy pass.

## Pilot mode (`pilot.js`)

**Auto-starts on desktop** (`min-width: 900px`, `pointer: fine`, `hover: hover`
— same check gates the toggle button's visibility). This was a deliberate
scope change from the original "opt-in only" design (see git history) — made
explicitly at Jermaine's request after he'd tried the opt-in version and
wanted it as the default entry experience. Still fully skipped under
`prefers-reduced-motion` (module no-ops entirely if set), and never disables
normal scrolling/clicking — everything still works with the mouse/scroll
wheel exactly as if pilot mode didn't exist.

- Toggle button bottom-right: "🚀 Fly the page" / "🛬 Land" → click to
  manually stop or relaunch (auto-start only fires once, at page load).
- **W A S D** — fly a small canvas-drawn ship around; A/D and W/S apply
  spring/friction physics (`ACCEL`/`FRICTION`/`MAX_SPEED` constants). Ship
  rotates to face its direction of travel (`atan2` + smoothed turn).
- Holding **W/S** also calls `window.scrollBy({ top, behavior: 'instant' })`
  to drive the page. **Important:** must stay `behavior: 'instant'` — the site
  has `scroll-behavior: smooth` globally on `<html>` for anchor nav links, and
  a plain `scrollBy(0, n)` inherits that, causing competing eased-scroll calls
  every animation frame (this was a real bug: made flight feel ~20x slower
  than intended). If `SCROLL_SPEED` ever needs retuning again, remember the
  perceived speed is now the *true* speed — no hidden damping.
- Flying over any `.media` element (video/image card) or `.project__link`
  (the "Try SuperJay" / "See Remi" / 3D Cloud links) adds `.is-buzzed`, drawn
  as a cyan glow via CSS.
- **Space / Enter**: if a target is currently buzzed (direct overlap), clicks
  it immediately (opens the lightbox, or follows the link). Otherwise fires a
  small glowing orb from the ship's nose in its current facing direction —
  the orb travels each frame and checks point-containment against every
  `.media`/`.project__link` rect; on any hit it clicks that target and clears
  **all** in-flight orbs (so a volley can't double-open something, e.g. spawn
  two new tabs off the same link). Orbs expire after `ORB_MAX_AGE` frames or
  once off-screen.
- **Esc** or clicking the toggle again exits cleanly: removes listeners,
  clears `.is-buzzed`, hides canvas, restores button label/state.
- **Hint text** ("W A S D to fly...") does not fade on a timer - it stays
  visible until the player has accumulated `HINT_DISMISS_MS` (10s) of real
  time actually holding W/A/S/D, tracked via per-frame delta time
  (`performance.now()` diff each `update()` call), not wall-clock time since
  load. If they never touch the controls, it just stays up. Once dismissed
  (`hintDismissed = true`), it won't reappear even across a manual
  stop/restart via the toggle in the same page session.
- Ship handling speed: `ACCEL`/`MAX_SPEED` were halved once already (0.7->0.35,
  9->4.5) per feedback that default felt too fast to control precisely.
- Pauses (ship freezes, no scroll) while the video lightbox is open
  (`body.lightbox-open` check), so it doesn't fight with video playback.
- `SCROLL_SPEED` has been tuned twice already based on real hands-on feedback
  (not synthetic testing — synthetic `dispatchEvent` key-hold tests in an
  unfocused/automated browser window are unreliable for this, since
  `requestAnimationFrame` gets throttled without real OS focus; trust a human
  actually pressing keys over automated timing measurements). Current value:
  `9`. If it still feels off, that's the constant to adjust — round-trip with
  Jermaine testing on localhost before committing.
- **Watch out for this class of bug again:** don't build a "does this match
  X.is-buzzed OR Y.is-buzzed" check as a template string over a comma
  selector, e.g. `` `${'.media, .project__link'}.is-buzzed` ``. That produces
  `.media, .project__link.is-buzzed` — `.is-buzzed` only binds to the last
  clause, so `.media` alone (unconditional) matches instantly. This exact bug
  shipped once already (`activateBuzzed()`/`clearBuzzed()` used
  `` `${TARGET_SELECTOR}.is-buzzed` ``, so Space always "hit" the first video
  on the page regardless of ship position). Fix was a separate
  `BUZZED_SELECTOR` constant with `.is-buzzed` written explicitly on each
  clause. If adding more target types later, extend `BUZZED_SELECTOR`
  the same explicit way — don't reintroduce the templated-comma-selector
  shortcut.

## Known-good workflow for changes

1. Edit files directly (no build step).
2. Serve locally (`python -m http.server 8642` from `site/`) so changes are
   visible immediately at `localhost:8642` — no restart needed per edit.
3. `git add -A && git commit -m "..." && git push` from `site/` — pushes
   straight to `main`, GitHub Pages redeploys automatically in under a minute.
4. Git identity is already configured (`jdshaolinstar` /
   `jermainedennis@live.com`), remote `origin` already points at the GitHub
   repo — no auth setup needed.

## Open items / ideas not yet done

- Pilot-mode speed/feel may still need another tuning pass.
- No custom domain set up (currently on the free `github.io` subdomain) —
  purely optional, only if Jermaine wants one later.
- Sax/flute/jazz piano aside was added to About per Jermaine's request as a
  small personal touch — low priority either way, already resolved.
