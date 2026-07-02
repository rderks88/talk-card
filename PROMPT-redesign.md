# Prompt — redesign the "praatkaart" end sheet

Copy everything in the box below into Claude (the design / artifact mode, e.g.
claude.ai). It asks for a single self-contained HTML mockup of **only the end
sheet**, built within the exact technical limits of this tool, so the result can
be ported straight back into the app.

---

```
You are designing ONE printable "poster" for a tool that helps families of
people with dementia/Alzheimer's. The poster is a "conversation card": a central
photo of the person, surrounded by short labelled cards (speech bubbles) with
facts that help a carer or visitor start a warm, meaningful conversation —
e.g. PARTNER, CHILDREN, VISITORS, HOBBIES, WORK, WHAT I ENJOY, WHAT I DISLIKE,
WHERE I LIVE. Tone: warm, calm, dignified, easy to read for older eyes. Think a
beautifully laid-out one-page "about me" poster, not a clinical form.

GOAL
Give me a much better-looking version of this poster than my current one (which
is plain white rounded cards with an orange border around a central photo).
You have full creative freedom on layout, typography scale, colour, texture,
card shapes, how the photo is framed, how the title/QR sit — as long as you stay
inside the HARD CONSTRAINTS below. The card must look great whether it has 4
bubbles or 18, and whether or not a photo is present.

DELIVERABLE
A single self-contained .html file (HTML + one <style> block, no JS needed for
layout) that renders the poster at a FIXED design width of 1080px (portrait,
height grows with content, min-height ~1180px). Fill it with realistic sample
data so I can see it. Include, in the same file, THREE stacked example posters so
I can judge robustness:
  1. Full: ~13 bubbles + a photo.
  2. Sparse: only 4 bubbles + an initials placeholder instead of a photo.
  3. Stress: a few bubbles with long text and long ALL-CAPS headings.
Briefly label which CSS class does what at the top in a comment.

HARD CONSTRAINTS (these come from how the app exports the poster — do not break
them or the export silently fails):
1. The poster is later rasterised to PNG at 2× by serialising its DOM into an
   SVG <foreignObject> and drawing that onto a <canvas>. Therefore:
   - SYSTEM FONTS ONLY. No web fonts, no @font-face, no Google Fonts, no <link>.
     Use a system stack like: -apple-system, "Segoe UI", Roboto, Helvetica,
     Arial, sans-serif. You may vary weight/size/letter-spacing freely.
   - NO external resources of any kind. No url(https://…) anywhere — not for
     images, fonts, masks or backgrounds. Any external URL taints the canvas and
     the download breaks. Backgrounds must be CSS gradients / solid colours /
     inline SVG data-URIs only.
   - The photo and the QR are supplied as data: URLs in <img> tags. Assume they
     already exist; just style their containers.
   - Avoid effects that don't survive foreignObject rendering: backdrop-filter,
     mix-blend-mode, CSS filter on big areas, position:fixed/sticky, CSS masks
     from external files, and JS-driven canvas/SVG. Safe to use: flexbox, CSS
     grid, border-radius, box-shadow, linear/radial-gradient, ::before/::after,
     transform on inner elements, inline <svg> shapes, emoji.
2. Single root element <div class="sheet"> with width:1080px. All styling must
   live in one <style> block (it gets inlined). No inline style="" attributes
   carrying layout (the app re-creates the DOM).
3. DYNAMIC, UNKNOWN CONTENT. The number of bubbles ranges 0–20+. Each bubble has
   an OPTIONAL short uppercase heading and a body of 1–6 lines of arbitrary
   length. Custom user-added bubbles may have NO heading. The layout must stay
   balanced and never overlap the title, photo, footer or QR for any count. Do
   NOT hand-place bubbles with absolute coordinates that assume a fixed number —
   use a flow/grid/column system that adapts. A two-column-around-centre layout
   is fine, but masonry, radial, or other ideas are welcome if they degrade
   gracefully.
4. MULTILINGUAL TEXT (NL/EN/DE/FR) is injected at runtime. Headings can be long
   German compounds and accented (e.g. "WAT IK BELANGRIJK VIND", "CE QUI COMPTE
   POUR MOI", "GESCHWISTER"). Use overflow-wrap/word-break so nothing clips.
5. Must contain, and keep visually distinct: a TITLE line (pattern
   "ABOUT {name} in brief"), the PERSON's name (large) + a date/subtitle, the
   central PHOTO (square-ish, object-fit:cover) OR an initials placeholder, the
   BUBBLE cards, a small FOOTER note (bottom-left), and a QR code with a tiny
   caption (bottom-right). An optional page number is fine.
6. Readability first: this is for older readers and carers. Body text no smaller
   than ~16px at the 1080px design size; strong contrast; generous spacing.
   It should also print well on A4 portrait.

PRESERVE A STABLE DOM CONTRACT so I can wire data in. Keep these class names (you
may add wrapper elements/classes around them, just tell me):
  .sheet                      (root, 1080px)
  .sheet__title               (the "ABOUT … in brief" line)
  .sheet__pageno              (optional page number)
  .person__name               (large name)
  .person__date               (date / subtitle, may be absent)
  .person__photo              (the <img>; cover-fit)
  .person__photo--placeholder (a <div> with initials when there is no photo)
  .bubble                     (one card)
  .bubble__title              (uppercase heading; may be empty/absent)
  .bubble__body               (the text; may contain <br>)
  .sheet__foot                (footer note, bottom-left)
  .sheet__qr  + img + .cap    (QR block, bottom-right)
If you prefer different names, that's OK — but then give me a short mapping table.

OUTPUT
Return the full .html in one code block, then 3–4 sentences on the design choices
(palette, type, layout system) and any class-name changes I should know about.
```

---

## How to use the result
1. Open the returned `.html` to review the look; iterate with Claude as needed.
2. When you like it, copy its `<style>` rules into the `<style id="appcss">` block
   in `index.html` (replacing the `.sheet…`, `.bubble…`, `.person__…` rules).
3. If the designer renamed classes or added wrappers, tell me the mapping and
   I'll update `buildSheet()` in `app.js` to match — the export and QR keep
   working as long as the constraints above were respected.
