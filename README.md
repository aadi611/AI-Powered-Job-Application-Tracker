# AI-Powered Job Application Tracker

A Flask web app for tracking job applications, with OpenAI doing the boring parts: parsing job posts, drafting follow-up emails and cover letters, and spotting patterns in your applications.

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python, Flask, Flask-SQLAlchemy |
| Database | SQLite |
| AI | OpenAI API (GPT) |
| Frontend | HTML/CSS/JS (vanilla), Chart.js |
| Config | python-dotenv |

## Features

- **Track applications** — add, edit, delete, filter by status/date, search by company or position
- **Dashboard** — charts showing application status breakdown
- **AI job parser** — paste a job post, get company/role/location/salary/requirements auto-filled into the form
- **AI follow-up emails** — generates a follow-up draft based on how long it's been since you applied
- **AI cover letters** — generates a cover letter from your profile + a saved application
- **AI insights** — surfaces patterns across your applications (best sources, response rates, etc.)
- **CSV export** — download all applications as a report

Not implemented yet (see [Next Steps](#next-steps)): real Gmail import, real login/auth — those routes currently render static pages or return placeholder data.

## How to Run

```bash
git clone https://github.com/aadi611/AI-Powered-Job-Application-Tracker.git
cd AI-Powered-Job-Application-Tracker

python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file (copy `.env.example`) and set your key:

```
OPENAI_API_KEY=sk-your-key-here
FLASK_SECRET_KEY=any-random-string
FLASK_ENV=development
```

Get a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

```bash
python app.py
```

Open `http://localhost:5000`. The AI features work only if `OPENAI_API_KEY` is set — without it, the rest of the app (tracking, dashboard, CSV export) still works.

## Next Steps

Ideas to make this genuinely more useful, roughly in order of impact:

1. **Real Gmail integration** — `/api/sync-gmail` currently just inserts a dummy row. Wiring up the actual Gmail API to auto-detect application confirmation emails would remove most manual data entry.
2. **Real authentication** — `/login` renders a page but doesn't check credentials or scope data to a user. Needed before this could support more than one person's data.
3. **Reminders** — a scheduled job (there's already a `daily_sync.py` stub) that nudges you to follow up on applications past the AI-recommended window.
4. **Richer reports** — swap the CSV export for a multi-sheet Excel report (funnel by source, timeline, response rates).
5. **One-click capture** — a browser extension or bookmarklet that sends the current job posting straight to the AI parser instead of copy-pasting.
6. **Tests/CI** — `test_*.py` files exist but aren't wired into CI; add a GitHub Actions workflow to run them on push.
7. **Deployment guide** — Dockerfile + instructions for running this somewhere persistent (Render, Fly.io, etc.) instead of only `localhost`.
