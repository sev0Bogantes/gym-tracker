# Gym Tracker

A mobile-first web app to track your gym routine — imported once from Excel, tracked week by week.

## Stack

- **Next.js** (App Router) — framework
- **Supabase** — PostgreSQL database + Auth
- **Lucide React** — icons
- **SheetJS (xlsx)** — Excel parsing

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and fill in your Supabase URL and anon key.

## Features

- **Import routine** — upload your gym's `.xlsx` file once to populate the database
- **Week tracker** — automatically calculates which week you're on based on start date
- **Bi-weekly reminder** — amber banner every even week reminding you to add +2 reps per exercise
- **Pre-routine (Abs)** — collapsible section to track your abs exercises before training
- **Post-routine (Cardio)** — collapsible section to track cardio after training
- **Exercise form** — edit sets, reps, and weight inline per exercise; save with one tap
- **Superset support** — exercises grouped in a horizontal-scrolling card per superset
- **Weight history** — compare this week vs last week weight per exercise
- **History page** — view past weight logs over time
