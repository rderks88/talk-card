# TalkCard

**Know someone in one page.**

TalkCard helps families and caregivers create a warm, one-page conversation card
about someone living with dementia or Alzheimer's. Answer a few simple questions —
partner, children, work, hobbies, what they enjoy, what to avoid — add a photo,
then download or print a high-resolution card.

Care staff, family, and visitors can use it to start meaningful conversations and
see the person, not the illness.

Built as a single static site — vanilla HTML/CSS/JS, no build step, no backend.
Multilingual (Dutch, English, German, French), works offline, and keeps all data
local in the browser.

> Inspired by the classic *"About … in brief"* sheet — a central photo surrounded
> by speech-bubble cards (visitors, partner, hobbies, work, education, and so on).

## What it does

1. **Four languages** — Dutch, English, German, French. Switchable top-right; the
   choice is remembered and the default follows the browser's language. Both the
   wizard and the headings on the card are translated.
2. **Step-by-step wizard** — collects name, date of birth, partner, children,
   siblings, visitors, what the person enjoys, hobbies, highlights, what matters /
   what to avoid, work, education, and where they live.
3. **Skippable steps** — every question has a **Skip** button. Skipped or empty
   fields simply don't appear on the card (no empty bubble).
4. **Your own topics** — a final step lets you add custom question/answer pairs
   (own heading + text) that show up as extra bubbles.
5. **Drag to reorder** — drag the cards directly on the poster into the order you
   want; the layout rebalances live. Works with mouse and touch.
6. **Photo upload** — click or drag. The photo is downscaled and stored locally in
   the browser. No photo? The card shows the person's initials.
7. **Date picker** — the birth date uses a native calendar and is shown as a
   localized long date (e.g. *8 juli 1953* / *8 July 1953* / *8. Juli 1953*).
8. **High-resolution output** — the preview is scaled to fit, but you download a
   **2160 px-wide** PNG (2× the design), sharper than most screens. **Print**
   renders that same image to fit **one A4 page** — so no cards are ever sliced,
   and colors print even with "background graphics" off.
9. **Clean white background** with warm accents: tidy on screen and toner-friendly.
10. **QR code (bottom-right)** — currently points to `https://www.google.com`.
    Change it to the tool's hosted URL later (see below).

Answers are saved automatically on the device (`localStorage`), so you can pause
the wizard and continue later.

## Files

| File | Contents |
|---|---|
| `index.html` | Page + all CSS (inline, so the PNG export always keeps the styles). |
| `app.js` | Wizard, photo upload, card building, QR generation, PNG/print export, homepage examples. Pure vanilla JS. |
| `qrcode.js` | Self-contained QR generator (qrcode-generator, MIT). No internet needed. |
| `favicon.svg` / `favicon.ico` / `favicon-*.png` / `apple-touch-icon.png` | Site icon (orange rounded square + white heart), matching the header logo. |
| `example-1.jpg` … `example-3.jpg` | Photos for the three scattered example cards on the homepage. **AI-generated faces of non-existent people** (StyleGAN via thispersondoesnotexist) — no real person is depicted. |
| `PROMPT-redesign.md` | A ready-made prompt to redesign the card in Claude's design mode. |

No build step, no frameworks, no external requests at runtime.

## Run locally

Open `index.html` directly in a browser, or start a tiny server:

```bash
python3 -m http.server 8137
# then open http://localhost:8137/index.html
```

## Hosting

Drop the files on any static host (GitHub Pages, Netlify, Cloudflare Pages, S3, or
just a folder on a web server). Nothing else is required.

## Change the QR code target

Open `app.js` and edit this line near the top:

```js
var QR_TARGET = "https://www.google.com";
```

Set it to the final URL where TalkCard is hosted. The QR code is regenerated each
time the card is shown.

## Customize text & languages

- The order and type of the wizard steps live in `STEP_DEFS` in `app.js`.
- All text (UI **and** the card headings) lives per language in the `I18N` object
  in `app.js`. Under `I18N.<lang>.steps.<field>` you'll find `q` (question),
  `hint`, `placeholder`, `example`, and `title` (the bubble heading).
- The default order of the bubbles on the card is `BUBBLE_ORDER`.
- To add a language: add a block to `I18N`, add its code to `LANGS`, and add an
  `<option>` to the language selector in `index.html`.

## A better card design

Want the card to look even nicer? `PROMPT-redesign.md` contains a ready-made prompt
to hand to Claude (design mode). It bakes in the technical constraints (fixed
1080px width, PNG export via SVG `foreignObject`, system fonts and data-URL images
only, variable bubble count, multilingual headings). The class names stay the same,
so a new design drops straight into `index.html`.

## Credits & license

- QR generation: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
  by Kazuhiko Arase (MIT).
