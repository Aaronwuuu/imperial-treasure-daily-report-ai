# Imperial Treasure Restaurant Operations Assistant

A bilingual, mobile-first restaurant operations platform for employee scheduling, shift reporting, restocking, and AI-assisted management insights.

中文名称：宝藏餐厅运营助手

## Product overview

This independent full-stack product consolidates everyday restaurant workflows into one responsive application. Managers can build weekly schedules and review overtime risk, shift leads can complete structured daily reports, and employees can securely view only the schedule.

## Key features

- Chinese and English interface with persistent language selection
- Role-based access for managers, shift leads, and employees
- Mobile-first weekly scheduling grid modeled on a real restaurant workflow
- Automatic employee population in shift reports from the daily schedule
- Decimal employee performance scores and optional written feedback
- Expandable restocking checklists with editable drink and beer catalogs
- AI-generated weekly and monthly reports in the selected language
- AI-assisted overtime risk detection and scheduling recommendations
- Persistent SQLite storage with FastAPI APIs and a React interface

## Product decisions

- Employees can view schedules but cannot access management reports or evaluations.
- Shift leads do not repeatedly type employee names; scheduled employees are loaded automatically.
- Managers can add or deactivate employees without deleting historical records.
- Discontinued beverages can be removed, while new catalog items persist across devices.
- AI output follows the selected interface language while preserving employee and product names.

## Tech stack

- Frontend: React 19, Vite, responsive CSS
- Backend: FastAPI, Pydantic
- Database: SQLite
- AI: OpenAI Responses API

## Local setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Set private access codes and an optional OpenAI API key in `backend/.env`. Never commit real credentials.

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173` on the computer, or use the computer's local network address from a phone on the same Wi-Fi network.

## Privacy and security

This repository intentionally excludes the production database, real access codes, API keys, virtual environments, dependencies, and build output. Any screenshots or demo data published with this project should use fictional employee and operational information.

## Portfolio note

Built as an end-to-end product project covering workflow research, information architecture, role permissions, responsive UI design, full-stack implementation, data persistence, and applied AI reporting.
