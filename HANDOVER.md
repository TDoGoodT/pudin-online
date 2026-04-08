# pudin.online — Design Handover for Alex

Hey Alex — this doc covers everything done on pudin.online so far. Pick up from here.

---

## Project Overview

**pudin. by ziv bachar** — home patisserie shop, Hebrew-only, mobile-first.  
**Live:** https://pudin-online.onrender.com  
**Repo:** https://github.com/TDoGoodT/pudin-online  
**Local:** `~/pudin.online/public/`  
**Deploy:** git push → Render auto-deploys in ~1-2 min (service ID: srv-d7aksrp4tr6s73cf442g)

Dev server:
```bash
cd ~/pudin.online
python3 -m http.server 8765 --bind 0.0.0.0
```

---

## What Was Built

### Stack
- Pure static: `index.html` + `style.css` + `app.js` — no framework, no build step
- RTL layout (`dir="rtl"`, `text-align: right`)
- Google Fonts (loaded via CDN)

### Features Implemented
- Sticky header with logo + cart icon (item count badge)
- Hero section with Hebrew tagline
- Full product catalog organized by category (expandable cards)
- Quantity selector per product
- Add to cart / remove from cart
- Floating cart drawer (slides in from right) with order summary
- WhatsApp checkout — cart contents formatted as a message, opens WhatsApp to Ziv's number (054-4878282)
- Image placeholders (emoji) — no real product photos yet

### Product Catalog
| Category | Products |
|----------|----------|
| טירמיסו | אישי ₪45, גדול ₪80 |
| עוגות שמרים | קינמון ₪55, שוקולד ₪60, שוקולד כפול ₪65 |
| עוגיות ומתוקים | אלפחורס ₪50, רוגלך נוטלה קינדר ₪60, רוגלך נוטלה ₪55, כדורי שוקולד ₪40 |
| ג׳חנון קפוא | יחידה ₪9, 10 יחידות ₪80 |

Order info in cart footer: 3 days notice, pickup from רמת הכובש / בת חפר / פתח תקווה, delivery available.

---

## Design System

### Colors
```css
--cream:      #F5F3ED   /* background */
--charcoal:   #1b1c18   /* primary text */
--muted:      #5f5e5e   /* secondary text */
--gold:       #C9A96E   /* accent, CTAs */
--gold-dark:  #a07c44   /* hover states */
--gold-faded: rgba(201,169,110,0.45)
--gold-line:  rgba(201,169,110,0.2)  /* dividers */
```

### Typography
- **Logo:** `Playfair Display` italic bold — artisanal signature feel
- **Headings / Hebrew text:** `Noto Serif Hebrew` — high-contrast serif, reads well in Hebrew
- **Body / labels / buttons:** `Assistant` weight 300 — clean, modern, great Hebrew support

### Design Rules
- No borders on cards — use background tone shifts for depth
- Generous whitespace — breathing room is the luxury signal
- No pure black — use `#1b1c18`
- Header: glassmorphism (cream at 92% opacity, blur 14px)
- Buttons: `border-radius: 4px` — sharp-ish corners, not fully rounded
- Cart drawer slides in from right (RTL-appropriate)
- Gold underline on category titles — the one strong brand element

---

## Git History

```
97a9ce0  clean hero — single title only, bigger category with gold underline, remove section header  ← CURRENT HEAD
0bcd579  v2: Stitch redesign — Playfair logo, gold dividers, SVG chevrons, single-line hero, editorial quote
6dfaa63  Move site files to public/ dir
59a16eb  Initial site — pudin. by ziv bachar
```

The v2 commit (0bcd579) was a heavier Stitch-influenced redesign. It was reverted back to 97a9ce0 because it was over-designed — too many decorative elements. Current state is the cleaner version.

---

## What's Still Missing / Next Steps

These are the open items — prioritize with Snir:

1. **Product photos** — image placeholders are emoji right now. Real photos from Ziv would transform the page. The card layout (`card-image` div) is already set up for them — just swap the placeholder with an `<img>`.

2. **Stitch project** — a Stitch project was created (ID: `1225561620613983584`) with an initial mobile screen generated. Use it for further design iteration. Load the `google-stitch` skill for workflow details.

3. **Footer** — there's no footer. Consider adding contact info, pickup locations, and social links at the bottom.

4. **Cart persistence** — cart state is lost on page refresh. Could add `localStorage` persistence (small JS change).

5. **Out-of-stock / seasonal items** — no mechanism to disable products. Could add a `data-sold-out` attribute pattern.

6. **Ordering instructions UX** — the "3 days advance notice" info is only visible once you open the cart. Consider surfacing it earlier (below hero or in product cards).

7. **Mobile polish** — the layout is RTL-responsive but hasn't been carefully tested on small screens (320px). Worth a pass.

---

## Stitch Design Context

The original Stitch design session generated a system called **"Artisanal Crème"** with these tokens (some were adopted, some weren't):

- Stitch called the logo font `NOTO_SERIF` — we went with `Playfair Display` italic instead, which felt more signature-like
- Stitch recommended `WORK_SANS` for body — we went with `Assistant` for better Hebrew rendering
- Color palette matched almost exactly what Stitch proposed

When using Stitch for iteration, frame prompts around the existing palette and RTL constraints. The `pudin-site-design` skill has the full workflow.

---

## Deployment

```bash
# Make changes in ~/pudin.online/public/
git add -A
git commit -m "design: what you changed"
git push
# Render picks it up in ~1-2 min at https://pudin-online.onrender.com
```

Render API key is in your `RENDER_API_KEY` env var if you need it for the Render MCP/API.

---

*Written by Hermes (main agent) — April 2026*
