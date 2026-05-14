![Tests](https://github.com/fxrebxrn/Nexel/actions/workflows/tests.yml/badge.svg)
![Docker Build](https://github.com/fxrebxrn/Nexel/actions/workflows/docker.yml/badge.svg)

# Nexel — Backend API + Frontend Chat MVP

A modern fullstack social network pet-project:

- **Backend** built with FastAPI (REST API + WebSocket chat)
- **Frontend MVP** built with plain HTML/CSS/JS (real-time chat client)
- **PostgreSQL + Redis**
- **Docker Compose** for local setup

---

## What's Implemented

### Backend (API)

- JWT authentication: login + refresh tokens
- User profiles, roles, avatars
- Follow/unfollow relationships
- Posts, likes, comments (including nested comments)
- Private chats, messages, attachments
- Notifications
- Redis caching and rate limiting
- Real-time chat over WebSocket

### Frontend MVP (Chat)

- Authentication screen (Login / Register)
- Chat list
- New chat creation via user search
- Message history + loading older messages
- Sending messages with Enter
- Typing indicator
- WebSocket status: connected / reconnecting / offline
- Auto-reconnect for socket
- Mobile mode (responsive behavior)
- Account and chat partner profile modals

---

## Project Architecture

```text
Nexel/
├── backend/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── schemas/
│   ├── core/
│   ├── utils/
│   ├── tests/
│   ├── alembic/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── main.js
│       ├── api.js
│       ├── auth.js
│       ├── chats.js
│       ├── messages.js
│       ├── socket.js
│       └── ...
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

### Backend

- Python, FastAPI
- SQLAlchemy (async)
- Alembic
- PostgreSQL
- Redis
- python-jose (JWT)
- Pydantic Settings

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- WebSocket API

---

## Quick Start (Docker, Recommended)

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd Nexel
```

### 2) Run the full project

```bash
docker compose up --build
```

After startup:

- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- PostgreSQL: `localhost:5434`
- Redis: `localhost:6379`

> Note: the frontend can be opened as static files separately, or served through your preferred static server/reverse proxy.

---

## Local Setup Without Docker

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (example):

```env
SECRET_KEY=change_me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/social_db

DEBUG=true
APP_ENV=dev

REDIS_HOST=localhost
REDIS_PORT=6379
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn main:app --reload
```

## Frontend MVP

Option 1 (open directly):

- open `frontend/index.html` in your browser

Option 2 (run local static server):

```bash
cd frontend
python -m http.server 3000
```

Then open:

- `http://localhost:3000`

---

## Frontend Config

File: `frontend/js/config.js`

- For local frontend development (ports `3000` and `5173`), backend host is hardcoded as `192.168.0.100:8000`.
- For all other cases, it uses `window.location.origin` and matching `ws/wss` protocol.

If your backend is running on another host/IP, update `API_URL` and `WS_URL` for your environment.

---

## Authentication

JWT is used:

- `POST /auth/login` → `access_token`, `refresh_token`
- `POST /auth/refresh` → new `access_token`

For protected endpoints:

```http
Authorization: Bearer <access_token>
```

WebSocket chat also connects with token:

```text
/ws/chats/{chat_id}/ws?token=<access_token>
```

---

## Main Endpoint Groups

### Auth (`/auth`)
- `POST /register`
- `POST /login`
- `POST /refresh`

### Users (`/users`)
- `GET /me/profile`
- `GET /{user_id}/profile`
- `GET /search/{name}`
- `POST /{user_id}/follow`, `DELETE /{user_id}/follow`
- `GET /{user_id}/followers`, `GET /{user_id}/following`
- `PATCH /me/avatar`, `DELETE /me/avatar`
- `PUT /{user_id}` (admin)
- `PATCH /{user_id}/role` (admin)

### Posts (`/posts`)
- Post CRUD
- Comments and likes
- Post attachments
- Subscription feed

### Chats (`/chats`)
- Create chat
- Chat list
- Message history
- Send messages
- Mark as read
- Unread count
- Message attachments
- WebSocket realtime events

### Notifications (`/notifications`)
- Notifications list
- Unread count
- Mark-as-read / mark-all-read

---

## Realtime Chat Events (MVP)

Client handles:

- `message` / `new_message`
- `typing`

Behavior:

- Auto-updating chat preview
- Appending new message to active conversation
- Increasing unread badge in inactive chats
- Auto mark-as-read for incoming messages in active chat
- Fallback reload if websocket message is not received in time

---

## Tests

Run backend tests:

```bash
cd backend
pytest
```

The repository also has GitHub Actions badges for CI.

---

## Roadmap (Possible Next Improvements)

- Full profile pages on frontend
- Upload/view attachments in MVP chat
- Presence (online/last seen)
- Push/Web notifications
- Frontend E2E tests
- Nginx config for single domain (API + static frontend)

---

## License

This project is distributed under the license specified in the `LICENSE` file.
