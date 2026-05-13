# Gym Tracker App - AI Agent Prompt

## Objective
Build a high-performance, mobile-optimized web application to digitize and track gym routines currently shared via Excel files. The user needs to import their routine once and then interactively track their progress, specifically focusing on how many weeks they've been on a routine and logging the weight used for each exercise.

## Critical Problem Statement
The user receives an Excel file from their gym. Instead of looking at a spreadsheet on their phone, they want a modern UI that:
1. Parses the Excel data into a structured database.
2. Shows a "Current Routine" dashboard.
3. Allows "Logging" a workout session where they can see what they did last time and update the weight for today.
4. Counts the weeks since the routine started.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS (Premium Dark Mode aesthetic)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Excel Parsing**: `xlsx` (SheetJS)
- **Icons**: Lucide React
- **UI Components**: Shadcn UI

## Feature Roadmap

### Phase 1: Data Ingestion & Setup
- Implement a routine upload feature. The app should accept an `.xlsx` file.
- **Mapping**: Map Excel columns (Exercise Name, Sets, Reps, Initial Weight) to the database.
- Initialize a "Routine" record with a start date.

### Phase 2: Tracker Dashboard
- Display the current week of the routine (calculated from start date).
- List exercises grouped by day (e.g., Day 1: Chest/Triceps).
- Visual progress indicators (e.g., "Week 4 of 8").

### Phase 3: Workout Execution (Mobile UI)
- "Start Workout" button for the day.
- For each exercise:
    - Display Sets/Reps.
    - Input field for "Weight Used".
    - "Set Complete" checkmark.
    - Automatic history logging (save the weight used today to compare next week).

### Phase 4: History & Modification
- A view to see the history of weights for a specific exercise.
- Ability to modify the "target weight" for the next week.

## Design Inspiration
- **Aesthetic**: Premium fitness apps like "Hevy" or "Strong".
- **Theme**: Deep charcoal/black background with vibrant accents (e.g., Electric Blue or Neon Green).
- **Interactions**: Smooth transitions between exercises, tactile feedback for completions.

## Instructions for the Agent
1. **Scaffold the App**: Use Next.js with Tailwind.
2. **Database Design**: Create `routines`, `exercises`, and `weight_logs` tables in Supabase.
3. **Excel Parser**: Create a utility to parse the uploaded file and populate the `exercises` table.
4. **Week Logic**: Implement a helper to calculate `current_week = floor((today - routine_start_date) / 7) + 1`.
5. **Mobile Polish**: Ensure the UI is 100% usable with one hand on a mobile device.
