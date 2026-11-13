# Human Design Transit Analyzer — Transit-6

Static web app for GitHub Pages folder `Transit-6` (`https://sbhd.net/Transit-6/index.html`).

Build: **202611122000**. Up to six members (Input 1 required; Inputs 2–6 optional). Forked from Transit Analyzer build 202611121715; this folder is independent of `/Transits/` and `/Transit-Test/`.

## Files

| File | Role |
| --- | --- |
| `index.html` | App shell. Open this. |
| `app.js` | UI: six input grids, dates/times, pair selector, share/print, question box. |
| `analyzer.js` | Chart + transit engine, Not-Self / Between Members (brief form when more than three members). |
| `data.js` | Gate / line / center / channel meanings and built-in samples. |
| `astronomy.browser.min.js` | Offline ephemeris. |
| `manifest.webmanifest` | Add-to-Home-Screen metadata (name: Transit-6). |
| `netlify.toml` | Optional Netlify hint. |
| `INSTALL.txt` | Install notes for iPhone / iPad and Windows. |
| `README.md` | This file. |

Keep these files together in the `Transit-6` folder (same directory). Cache-bust query strings (`?v=202611122000`) are already on the script tags.

## Usage notes

- Each input uses the same 12-slot quick-load grid (Dennis, Eike, Judy, Carolyn, Milena, Teresa are built in and cannot be removed). Saved `.docx` charts occupy slots 7–12 and persist in `localStorage` (shared key with the original analyzer).
- Inputs 4–6 sit in a collapsible “Inputs 4–6 (optional)” section, which stays compact on iPhone / iPad.
- Reports use first names only and cover every selected member.
- Between Members includes a pair selector (all pairs checked by default). With more than three members, each selected pair uses a shorter per-day form.
- Start and end times apply to Date Range queries. Defaults, Full/Brief exclusion, refine controls at the bottom, share/print, the error banner, and GoatCounter (real page path, no override) are unchanged.
- The question box posts to the existing `transit-question` endpoint. Do not change Vercel CORS; `https://sbhd.net` is already allowed.
