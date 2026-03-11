# CLAUDE.md — Flowerapp

This file provides guidance for AI assistants (Claude, etc.) working in this repository.

## Project Overview

**Flowerapp** is a new project. This repository is in its initial setup phase.

## Repository Structure

```
Flowerapp/
├── CLAUDE.md          # AI assistant guidance (this file)
└── (project files TBD)
```

> **Note:** This project is newly initialized. Update this section as the codebase grows.

## Getting Started

1. Clone the repository
2. Install dependencies (update once a package manager is chosen)
3. Run the development server (update once configured)

## Development Workflow

### Branch Naming

- Feature branches: `feature/<description>`
- Bug fixes: `fix/<description>`
- Claude/AI branches: `claude/<description>-<session-id>`

### Commits

- Write clear, concise commit messages describing **why** the change was made
- Keep commits focused on a single logical change

### Code Style

- Follow the conventions established by the project's linter/formatter configuration (to be added)
- Prefer clarity over cleverness
- Keep functions small and focused

## Commands Reference

> Update this section as build tooling is configured.

| Task | Command |
|------|---------|
| Install dependencies | TBD |
| Run dev server | TBD |
| Run tests | TBD |
| Lint | TBD |
| Build for production | TBD |

## Key Conventions for AI Assistants

1. **Read before writing** — Always read existing files before modifying them
2. **Minimal changes** — Only change what is necessary to accomplish the task
3. **No over-engineering** — Avoid adding abstractions, utilities, or features beyond what was requested
4. **Security first** — Never introduce command injection, XSS, SQL injection, or other vulnerabilities
5. **Don't guess** — If context is missing, ask the user rather than making assumptions
6. **Test your work** — Run available tests after making changes
7. **Keep this file updated** — When adding new tools, scripts, or conventions, update CLAUDE.md accordingly

## Architecture

> Document the architecture here as the project takes shape (framework, state management, routing, API layer, database, etc.)

## Environment & Configuration

> Document environment variables, config files, and secrets management here once established.
