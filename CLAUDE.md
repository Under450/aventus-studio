# Aventus Studio — Claude Code Instructions

## READ THIS BEFORE TOUCHING ANYTHING

### What this app is
A social media content creation and scheduling tool for Aventus creator management agency.

### Current design — DO NOT REVERT
The UI design agreed with the client uses:
- Warm off-white background (#faf8f5) — NOT pure white
- Warm sidebar (#f7f5f1) with light border (#e0ddd8)
- Lime green accent (#c9f264) for primary buttons and active indicators
- Black (#0f0f0d) for active nav items, ink text
- Geist for body text, Instrument Serif for headings
- Month calendar as the homepage (full grid, Mon–Sun, week numbers on left)
- Click a day → opens day editor panel
- Click W## → opens weekly generation wizard
- Right panel with Daily/Weekly toggle and platform checkboxes
- NO dark navy (#0d1117) — that was removed
- NO amber (#f0a500) — that was removed

### DO NOT
- Revert to any previous design — the Queue page layout is scrapped
- Re-introduce Postiz or any Postiz integration — it is removed intentionally
- Rename the sidebar nav items back to old names
- Call the company/creator selector "Workspace" — it is "Add Company/Creator"
- Generate images for all posts at once — images are generated per post on demand only
- Change the image generator away from FLUX Dev (FAL.ai)

### Image generation
- Provider: FAL.ai FLUX Dev
- Images are generated ONE AT A TIME per post when the user clicks "Generate image" in the day view
- NEVER trigger bulk image generation for a whole week automatically

### AI pipeline for post generation
Brief → Gemma 4 (prompt enhancement) → Claude (copy writing) → FLUX Dev (image)

### Terminology
- "Add Company/Creator" — not "Add Workspace"
- "COMPANIES / CREATORS" — sidebar section heading
- "Weekly generation" — not "batch generation"

### Before declaring any task complete
- Check the app still loads at localhost:3000
- Check the calendar homepage is visible, not the Queue page
- Check no Postiz references exist: `grep -r "postiz" src/`
- Check no "workspace" UI strings exist: `grep -r "Workspace" src/`
