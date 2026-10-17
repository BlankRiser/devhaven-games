# DevHaven Games

A web-based gaming platform configured as a **Bun monorepo** with offline and real-time multiplayer support.

## Architecture

- **`apps/frontend`**: Next.js 15 App Router web application with Tailwind CSS 4, shadcn/ui, Jotai, and Motion.
- **`apps/backend`**: Real-time multiplayer game server built on **Cloudflare Workers**, **Hono**, and **Durable Objects** with WebSocket Hibernation.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.3+ recommended)

### Installation

```bash
bun install
```

### Development

Run all apps concurrently:

```bash
bun dev
```

Or run individual apps:

```bash
# Frontend (Next.js)
bun dev:frontend

# Backend (Cloudflare Workers + Hono)
bun dev:backend
```

### Building & Typechecking

```bash
# Typecheck backend
bun --filter backend typecheck

# Build frontend
bun build:frontend

# Deploy backend
bun --filter backend deploy
```
