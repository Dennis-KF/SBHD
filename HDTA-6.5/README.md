# Human Design Transit Analyzer - Model HDTA 6.5.1

Static web app for GitHub Pages folder `HDTA-6.5` (`https://sbhd.net/HDTA-6.5/index.html`).

Build: **202611151735**. Up to six members at a time (Input 1 required; Inputs 2–6 optional). Official members come from `members.js`, which you maintain with the private Member Manager. If `members.js` is missing, the original six are used as a fallback. The Transit-6 folder (Model HDTA 6.4.18) is unchanged.

A small muted label beside each loaded member shows female or male when that can be read from the chart file or a clearly gendered first name. Tap it only if you need to change it. If a name is not clearly gendered, the label is a faint dash and answers use the first name only (no pronouns).

## Files to upload to the HDTA-6.5 folder

| File | Role |
| --- | --- |
| `index.html` | App shell. Open this. |
| `members.js` | Official member roster. Replace this file when the Member Manager saves a new one. |
| `app.js` | UI: six input grids, dates/times, pair selector, share/print, question box. |
| `analyzer.js` | Chart + transit engine, Not-Self / Between Members (brief form when more than three members). |
| `data.js` | Gate / line / center / channel meanings and fallback samples. |
| `astronomy.browser.min.js` | Offline ephemeris. |
| `manifest.webmanifest` | Add-to-Home-Screen metadata (name: HDTA 6.5). |
| `netlify.toml` | Optional Netlify hint. |
| `INSTALL.txt` | Install notes, including how to use the Member Manager. |
| `README.md` | This file. |

Keep these files together in the `HDTA-6.5` folder (same directory). Cache-bust query strings (`?v=202611151735`) are already on the script tags.

Do **not** upload `HDTA-Member-Manager-6.5.1.html` to GitHub. That file stays on your computer (or a private drive). See `INSTALL.txt` for how to add, remove, and reorder official members and how to turn off Browse later.

## Usage notes

- Official roster buttons come from `members.js`. Visitors can still upload their own charts into the six inputs, and they can keep up to six personal quick-load charts in their own browser (`localStorage` key `ta_user_quick_slots_v1_hdta65`, separate from Transit-6). Official members cannot be removed from the public page.
- Inputs 4–6 sit in a collapsible “Inputs 4–6 (optional)” section, which stays compact on iPhone / iPad.
- Reports use first names only and cover every selected member.
- Between Members includes a pair selector (all pairs checked by default). With more than three members, each selected pair uses a shorter per-day form.
- Start and end times apply to Date Range queries.
- A “Time / Transit Based” checkbox sits just above the calendar and is checked by default (transits included). Uncheck it for a natal-only reading of the selected charts and their interactions, with no transit activity, timeline, or positions table; date and time controls are then greyed out.
- The question box posts to the existing `transit-question` endpoint. Do not change Vercel CORS; `https://sbhd.net` is already allowed.
- The first press of Run stays at the beginning of the report. After a setting that affects the result is changed, ASK is pressed, and then Run is pressed, the page returns to ASK.
- The question box and “Plain-language story: how everyone interacts” always stay visible. “Ask a question about Advantages and Difficulties” only changes what the answer emphasizes.
