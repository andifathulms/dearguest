# Vowvella: logo and brand kit (prompt for Claude Design)

Paste everything below the line into Claude Design. When the files come back, put the exported
SVG/PNG files in `assets/brand/` and ask Claude Code to "wire in the Vowvella logo": it replaces the
text wordmark in `SiteChrome.jsx`, adds the favicon, app icons and web manifest, and updates the
invitation watermark and the social preview.

---

Design the logo and a small brand kit for **Vowvella**, an Indonesian digital wedding invitation
platform.

## The brand

- **Name:** Vowvella (always this spelling: capital V, the rest lowercase, one word; never "VowVella" or "Vow Vella").
- **Tagline (Indonesian, exact text):** "Untuk hari yang hanya satu" ("for the day that happens only once").
- **What it is:** couples build a wedding invitation website from hand-painted themes and send each
  guest a personal link on WhatsApp ("Kepada Yth. Budi Santoso"). Guests open it on their phones,
  see the couple's story, the venue, and reply with their attendance (RSVP) and wishes.
- **The themes:** hand-painted artwork inspired by the whole archipelago: Javanese carved wood and
  batik, Minang songket and gonjong roofs, Bugis, Batak ulos, Balinese frangipani, Sundanese
  mega mendung, plus modern florals, sage and wisteria. The brand must sit next to all of them
  without belonging to any one region or religion.
- **Audience:** Indonesian couples aged 22–35, mostly on phones, who want something that feels
  premium and personal, not a cheap template.
- **Personality:** quiet, elegant, warm, crafted. A gallery for painted art, not a party. Think of
  a fine stationery studio, not a tech startup.
- **About the name:** an invented word. "Vow" is the promise a couple makes; "-vella" gives it a soft,
  Italian, almost-a-name feel (like *bella*, *novella*). Say it "vow-VEL-la". The tagline carries the
  idea of a single, once-in-a-lifetime day. Use these as quiet hints, never as a literal claim.

## The existing visual system (keep it)

The marketing site and the couple's dashboard already use these; the logo must belong with them.

| Token | Hex | Role |
|---|---|---|
| Malam (night) | `#17111A` | Dark stage behind the painted covers |
| Malam 2 | `#251C28` | Raised surfaces on dark |
| Porcelain | `#FBF9F6` | Light reading background |
| Paper | `#F2EDE6` | Light secondary surface |
| Ink | `#221A1F` | Text on light |
| On-malam | `#F3ECE6` | Text on dark |
| Prada (gold leaf) | `#D2AE62` | Accent: a thin line, never a large fill |
| Prada deep | `#8E6A2C` | Gold on light backgrounds |

Fonts: **Instrument Serif** (display, regular and italic) and **Plus Jakarta Sans** (UI). The
logotype may use one of these or a custom-drawn wordmark, but it must feel at home beside them.

## What to design

### 1. Explore three directions first
Show each one in the primary lockup, on dark (Malam) and on light (Porcelain), and at 16 px:

- **A. Wax seal:** a small round seal with a V monogram, the way a paper invitation is closed. It
  says "invitation" without saying "wedding".
- **B. The double V:** the two Vs in Vowvella (the V of "vow" and the v of "vella") drawn as one mark: two strokes that meet,
  like two people, two ribbons or two folds of an envelope meeting at one point. Paired with the wordmark.
- **C. Pure wordmark:** "Vowvella" drawn as an elegant custom logotype, with one crafted detail (a
  ligature, a gold dot, a stroke that reads as a ribbon or a thread), plus a V monogram cut from it.

### 2. Then the final logo set (for the chosen direction)
- Primary horizontal lockup: mark + wordmark.
- Wordmark only.
- Stacked lockup with the tagline under it.
- Monogram/symbol alone (the V or the mark), designed to work in a circle and a rounded square.
- Colour versions: gold on Malam, ink on Porcelain, single-colour gold, single-colour ink, white.
- Clear-space rule and minimum size.

### 3. Small sizes and icons
- Favicon at 16 × 16 and 32 × 32 (simplified if needed; it must still read).
- App icon 180 × 180 (Apple touch) and 512 × 512 (web manifest, with a maskable safe zone).
- Instagram/TikTok profile picture (circle crop, 320 × 320).
- **Invitation watermark:** the small footer line "Dibuat dengan Vowvella" shown at the bottom of
  free-plan invitations. It sits on top of many different painted themes (dark and light), at
  about 12–13 px text height, so it must stay legible and quiet over both.

### 4. Brand kit
- Palette sheet (the table above) and type sheet.
- Instagram feed post template (1080 × 1350) and story template (1080 × 1920) for showing a new
  theme: a space for a painted cover image, the theme name, and the logo.
- Instagram highlight covers (Tema, Harga, Testimoni, Cara Pesan, FAQ).
- A link-preview card (1200 × 630) for the home page: logo, tagline, and space for a strip of
  painted covers behind a soft band.
- An email header (600 px wide) for account emails.

## Rules
- No people, faces, hands or silhouettes.
- No religious symbols, and nothing tied to one ethnic group or region.
- Avoid wedding clip-art clichés: interlocking rings, doves, hearts, bells, cupids.
- Gold is a thin line or a small detail, never a big flat block.
- Everything vector (SVG), with flat colours so it prints and embosses well; no gradients or
  shadows inside the logo itself.
- The name must be readable at 16 px and from a quick glance on a phone.
- Spell everything exactly: "Vowvella", "Untuk hari yang hanya satu", "Dibuat dengan Vowvella".

## Deliver
- A presentation page showing the three directions, then the final set on dark and light.
- SVG files for every logo version and icon; PNG exports for the icons at their sizes.
