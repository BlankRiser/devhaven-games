# DevHaven Games - Project Context

## Project Overview

**DevHaven Games** is a monorepo gaming platform powered by **Bun workspaces**. It features:
- **`apps/frontend`**: A web-based gaming application developed with **Next.js 15**, Tailwind CSS 4, shadcn/ui, Jotai, and Motion.
- **`apps/backend`**: A real-time multiplayer backend powered by **Cloudflare Workers**, **Hono**, and **Durable Objects** with WebSocket hibernation.

## Technology Stack

### Frontend (`apps/frontend`)
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Jotai](https://jotai.org/) (integrated with TanStack Query via `jotai-tanstack-query`)
- **Animations**: [Motion](https://motion.dev/) and [@number-flow/react](https://number-flow.barvian.me/) for numeric transitions.
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/) & [Lucide React](https://lucide.dev/)
- **Typography**: [Geist](https://vercel.com/font) (Sans & Mono)

### Backend (`apps/backend`)
- **Runtime**: [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- **Web Framework**: [Hono](https://hono.dev/)
- **Multiplayer & State**: [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) with WebSocket Hibernation API
- **Deployment & Dev**: [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

## Project Structure

```text
dev-games/
├── apps/
│   ├── frontend/        # Next.js 15 web client
│   │   ├── src/
│   │   │   ├── app/     # App Router pages and layouts
│   │   │   ├── components/ # Shared UI components (shadcn/ui)
│   │   │   ├── features/   # Game features & UI
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── lib/        # Utility helpers
│   │   │   └── providers/  # React providers
│   │   ├── public/      # Static assets
│   │   ├── components.json
│   │   ├── next.config.ts
│   │   └── package.json
│   └── backend/         # Cloudflare Workers + Hono + Durable Objects backend
│       ├── src/
│       │   ├── index.ts # Hono entrypoint & routes
│       │   ├── room.ts  # GameRoom Durable Object implementation
│       │   ├── types.ts # Multiplayer protocol & room state types
│       │   ├── client.ts# Multiplayer client SDK
│       │   └── games/   # Game engines (Tic-Tac-Toe, etc.)
│       ├── wrangler.jsonc
│       └── package.json
├── package.json         # Bun workspace root
├── bun.lock
├── eslint.config.mjs    # Ultracite linting configuration
└── tsconfig.json        # Workspace project references
```

## Environment & Commands

- **Package Manager**: Bun 1.x with workspaces.
- **Root Scripts**:
  - `bun dev`: Runs development servers across all workspaces.
  - `bun dev:frontend`: Runs Next.js development server for `frontend`.
  - `bun dev:backend`: Runs Cloudflare Wrangler dev server for `backend`.
  - `bun build`: Builds both frontend and backend.
  - `bun build:frontend`: Builds the Next.js frontend production bundle.
  - `bun build:backend`: Deploys / builds the Cloudflare Worker.
  - `bun lint`: Runs ESLint across workspaces.
  - `bun check`: Runs `ultracite check`.
  - `bun fix`: Runs `ultracite fix`.
