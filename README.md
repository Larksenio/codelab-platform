# CodeLab Platform

A SaaS web application for programming instructors to create coding exercises, monitor students in real-time, and provide AI-powered hints.

## Architecture

```
codelab-platform/
├── frontend/          Angular 18 (standalone components, signals, lazy loading)
├── backend/           .NET 8 ASP.NET Core Web API + SignalR
│   ├── CodeLab.API/   Main application
│   └── CodeLab.Tests/ xUnit tests
└── docker/            Docker Compose for local dev
```

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | Angular 18, Angular Material, SignalR client    |
| Backend   | .NET 8, ASP.NET Core, Entity Framework Core 8   |
| Database  | MySQL 8.0                                       |
| Auth      | ASP.NET Core Identity + JWT Bearer              |
| Real-time | SignalR (WebSockets)                            |
| AI        | Anthropic Claude API (claude-sonnet-4-20250514) |
| Deploy    | Railway (backend) + Vercel (frontend)           |

## Local Setup

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Clone and configure

```bash
git clone <repo-url>
cd codelab-platform
cp .env.example .env
# Edit .env with your values (especially Anthropic API key for Phase 3)
```

### 2. Start with Docker Compose (recommended)

```bash
cd docker
docker compose up -d
```

Services:
- MySQL: `localhost:3306`
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:4200`
- Swagger UI: `http://localhost:5000/swagger`

### 3. Manual setup (without Docker)

**Backend:**
```bash
cd backend/CodeLab.API
# Edit appsettings.Development.json with your MySQL connection string
dotnet run
```

**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
ng serve
```

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description | Required |
|----------|-------------|----------|
| `ConnectionStrings__DefaultConnection` | MySQL connection string | Yes |
| `Jwt__Key` | JWT signing key (min 32 chars) | Yes |
| `Jwt__Issuer` | JWT issuer | Yes |
| `Jwt__Audience` | JWT audience | Yes |
| `Anthropic__ApiKey` | Claude API key | Phase 3+ |

## API Endpoints (Phase 1)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login and get JWT |
| GET | `/api/auth/me` | Bearer | Get current user |

## Running Tests

```bash
cd backend
dotnet test CodeLab.sln
```

## Development Progress

- [x] **Phase 1** — Foundation & Authentication (v0.1.0)
- [ ] **Phase 2** — Exercises, Monaco Editor & Code Execution
- [ ] **Phase 3** — Real-time Monitoring & AI Hints
- [ ] **Phase 4** — Analytics, Polish & Deploy
