# Hack-Flow Admin CMS

The frontend administrative portal for the Hack-Flow platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_URL` to your backend API URL (default: `http://localhost:3000/api`).

3. Start development server:
   ```bash
   npm run dev
   ```

## Build for Production

```bash
npm run build
```
This generates the `dist/` directory, which is configured to be served as static files by the Fastify backend at the `/admin/` prefix.

## Routes Overview

- `/` (Redirects to `/dashboard`)
- `/dashboard` — Platform overview, analytics, and activity feed.
- `/hackathons` — List and manage all hackathons.
- `/hackathons/new` — Create a new hackathon.
- `/hackathons/:id` — Detailed hackathon view.
- `/hackathons/:id/edit` — Edit hackathon settings.
- `/teams` — List and manage teams (approvals, disqualifications).
- `/teams/:id` — Detailed team view and management.
- `/users` — User directory and role management.
- `/users/:id` — Detailed user profile.
- `/judging` & `/judging/:hackathonId` — Manage judging criteria, view project scores, conflicts, and the leaderboard.
- `/mentorship` & `/mentorship/:hackathonId` — Manage mentors and their slot availabilities.
