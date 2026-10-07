# MedicalUI

**CareOps** is a home-health scheduling dashboard built with Next.js, shadcn/ui and Motion. It shows one agency's day at a glance: every caregiver's visits on a live timeline, open shifts that need coverage, caregivers close to overtime, and AI Copilot suggestions you can preview and apply.

The data is mock data for a single day (Juniper Home Health, Wednesday, Sep 30), held in a client-side store, so every interaction works without a backend.

## Features

- **Day timeline.** Caregiver rows from 7 AM to 7 PM with done, in-progress, scheduled and needs-attention visits, a "now" marker, and hover cards with visit details. A legend lets you spotlight one status.
- **Open shifts.** Fill a shift from the card or straight from the timeline. The visit glides from the Open shifts row into the caregiver's row.
- **AI Copilot.** "Optimize" previews suggested changes on the board. Review them in a side sheet, then accept or dismiss each one, or accept all. Reassigned visits animate to their new row and the overtime card updates.
- **Overtime watch.** Weekly-hours bars that fill and drain as the schedule changes.
- **Week view, caregiver filters, a ⌘K command palette, notifications, and a collapsible sidebar** that becomes a sheet on mobile.
- **Motion throughout.** Staggered entrances, shared-layout transitions, springy micro-interactions, and count-ups. All of it respects `prefers-reduced-motion`.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) and React 19
- [Tailwind CSS v4](https://tailwindcss.com) with theme tokens in `app/globals.css`
- [shadcn/ui](https://ui.shadcn.com) (Radix base, Maia style) with [Hugeicons](https://hugeicons.com)
- [Motion](https://motion.dev) for animation, [Sonner](https://sonner.emilkowal.ski) for toasts

## Getting started

You need Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Start the dev server                           |
| `npm run build`     | Production build                               |
| `npm run start`     | Serve the production build                     |
| `npm run lint`      | ESLint                                         |
| `npm run typecheck` | TypeScript, no emit                            |
| `npm run avatars`   | Regenerate the illustrated avatars in `public/avatars` |

## Project layout

```
app/                      page, layout, global styles and theme tokens
components/dashboard/     dashboard regions: sidebar, top bar, schedule, cards, suggestions sheet
  schedule-store.tsx      client store (useSchedule) for visits, open shifts, suggestions, filters
components/ui/            shadcn/ui primitives
lib/schedule-data.ts      mock agency data
lib/schedule-time.ts      time formatting and timeline positioning helpers
scripts/                  avatar generator
.claude/skills/           agent skills used to build this (shadcn, Vercel React best practices, …)
```

## Credits

- Avatars: [DiceBear](https://www.dicebear.com) "Notionists" by Zoish, licensed CC0 1.0.
- Typeface: Google Sans, via `next/font`.
