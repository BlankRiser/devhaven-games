# DevHaven Games - Project Context

## Project Overview

**DevHaven Games** is a web-based gaming platform developed with **Next.js 15**. It is designed for **offline, local multiplayer** play where users can enjoy multiple games on the same PC.

- **Primary Goal**: Provide a suite of simple, polished games for local entertainment.
- **Current State**: The project is in active development with a mix of stable and work-in-progress games.

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Jotai](https://jotai.org/) (integrated with TanStack Query via `jotai-tanstack-query`)
- **Animations**: [Motion](https://motion.dev/) (formerly Framer Motion) and [@number-flow/react](https://number-flow.barvian.me/) for numeric transitions.
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: [Geist](https://vercel.com/font) (Sans & Mono)

## Project Structure

```text
src/
├── app/             # Next.js App Router (pages and layouts)
├── components/      # Shared UI components (mostly shadcn)
├── features/        # Game-specific logic and UI
│   ├── common/      # Shared game utilities/components
│   ├── hangman/     # Hangman game logic
│   ├── minesweeper/ # Minesweeper game logic
│   └── tic-tac-toe/ # Tic-Tac-Toe game logic
├── lib/             # Utility functions (e.g., cn helper)
├── providers/       # Global React context providers (Jotai, Query Client)
└── config/          # Site configuration and constants
```

## Game Status Registry

As defined in `src/features/games-list.tsx`:

| Game            | Slug          | Status            | Description                       |
| :-------------- | :------------ | :---------------- | :-------------------------------- |
| **Tic-Tac-Toe** | `tic-tac-toe` | Functional        | Stable implementation.            |
| **Hangman**     | `hangman`     | Functional (Bugs) | Playable but contains known bugs. |
| **Minesweeper** | `minesweeper` | WIP (Bugs)        | Under development; contains bugs. |

## Future Roadmap

Planned games for the platform:

- [ ] Snake
- [ ] Tetris
- [ ] Block breaker (using balls)
- [ ] Flappy bird
- [ ] Pong
- [ ] Space Invaders
- [ ] Pacman

## Development Patterns

- **Features over Components**: Logic specific to a game is stored in `src/features/[game-name]`.
- **Atomic State**: Jotai atoms are used for fine-grained state management within games.
- **Motion for Feel**: All transitions and game interactions should leverage the `motion` library for a premium feel.
- **Shadcn UI**: Use standard shadcn components for forms, buttons, and layouts to maintain consistency.

## Environment & Commands

- **Sourcing**: The project uses `bun` as the package manager.
- **Scripts**:
  - `bun dev`: Starts the development server with Turbopack.
  - `bun build`: Builds the application for production.
  - `bun start`: Starts the production server.
  - `bun lint`: Runs ESLint.
