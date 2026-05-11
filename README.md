# CodeLab Platform

SaaS platform for programming instructors. Create exercises, share with students via link, monitor progress live, and deliver AI-powered Socratic hints.

## Architecture

```
Browser (Angular 18 + Material + Monaco + Chart.js)
    |  HTTP / WebSocket (SignalR)
.NET 8 ASP.NET Core API
    |  Auth | Exercises | Submissions | Analytics | Hints | Hub
    |
MySQL 8.0 (EF Core)     Code Execution (Process.Start)
                         python3 | node | java | mono
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 18 (standalone), Angular Material, Monaco Editor, Chart.js, @microsoft/signalr |
| Backend | .NET 8, ASP.NET Core, EF Core 8, SignalR, JWT Bearer, ASP.NET Identity |
| Database | MySQL 8.0 |
| AI | Anthropic Claude `claude-sonnet-4-6` — Socratic hints |
| Execution | Local process inside Docker (python3, node, javac/java, mcs/mono) |
| Infra | Docker Compose, GitHub Actions CI/CD |

## Quick Start

```bash
cd docker
docker compose up -d --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:4200 |
| API + Swagger | http://localhost:5000/swagger |
| Health | http://localhost:5000/health |

Register as **Instructor** to create exercises. Share the exercise URL with students — no account needed.

## Local Development

```bash
# Backend (requires MySQL on localhost:3307)
cd backend && dotnet run --project CodeLab.API

# Frontend
cd frontend && npm install --legacy-peer-deps && npm start
```

## Environment Variables

See [.env.example](.env.example) for all variables.

| Variable | Description |
|---|---|
| `Jwt__Key` | JWT signing key (min 32 chars) |
| `ConnectionStrings__DefaultConnection` | MySQL connection string |
| `Anthropic__ApiKey` | Claude API key (optional — hints work without it with fallback message) |
| `Frontend__Url` | Frontend origin for CORS |

## CI/CD (GitHub Actions)

### Required Secrets

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `RAILWAY_TOKEN` | Railway deploy token |
| `VERCEL_TOKEN` | Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel org ID (`vercel whoami`) |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `PROD_API_URL` | e.g. `https://codelab-api.up.railway.app` |
| `PROD_FRONTEND_URL` | e.g. `https://codelab.vercel.app` |

### Pipelines

- **`ci.yml`** — triggered on PR: build backend, run xUnit tests, build frontend
- **`cd.yml`** — triggered on merge to `main`: deploy to Vercel + Railway, smoke tests

## API Reference

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET/POST/PUT/DELETE | `/api/exercises` | Instructor |
| GET | `/api/exercises/share/{token}` | Public |
| POST | `/api/sessions` | Public |
| POST | `/api/submissions` | Public (rate limited) |
| POST | `/api/hints` | Public (rate limited) |
| GET | `/api/analytics/overview` | Instructor |
| GET | `/api/analytics/exercise/{id}` | Instructor |
| GET | `/api/analytics/group/{id}` | Instructor |
| GET | `/api/analytics/group/{id}/csv` | Instructor |
| GET | `/api/analytics/weekly` | Instructor |
| GET | `/api/monitor/submissions` | Instructor |
| WS | `/hubs/exercise` | Public / JWT |
| GET | `/health` | Public |

## Features

- **Exercises**: create with hidden test cases, boilerplate code, and stuck threshold
- **Student editor**: Monaco Editor, instant test results, AI hints (Socratic — never gives the answer)
- **Real-time monitor**: instructor sees active students and submission feed live via SignalR
- **Analytics dashboard**: success rate by exercise (bar chart), weekly activity (line chart), error distribution (donut chart), at-risk student table with CSV export
- **Code execution**: runs inside Docker — no external API required
