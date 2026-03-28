# Contributing to webhook-as-a-service

Thanks for your interest in contributing! This document explains how to get started.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/webhook-test-as-a-service.git
   cd webhook-test-as-a-service
   ```
3. **Create a branch** for your change:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Running Locally

### Prerequisites

- Docker and Docker Compose

### Docker (recommended)

```bash
cp .env.example .env   # edit PASSWORD
docker compose up -d --build
```

The app starts on [http://localhost:8080](http://localhost:8080).

### Without Docker

- Node.js 20+
- npm

```bash
npm install
npm run dev
```

Dev server starts on [http://localhost:3000](http://localhost:3000).

## Code Style

### TypeScript / React

- Use functional components with hooks.
- Follow the existing project structure (pages, components, hooks, lib).
- Use TypeScript strict mode.
- Use Tailwind CSS utility classes for styling.
- Keep components small and focused.

## Submitting a Pull Request

1. Make sure the build passes:
   ```bash
   docker compose up -d --build
   ```
2. Commit your changes with a clear, descriptive commit message.
3. Push your branch to your fork.
4. Open a Pull Request against the `main` branch.
5. Describe what your PR does and why.

## Reporting Bugs

Use the [bug report template](https://github.com/recurohq/webhook-test-as-a-service/issues/new?template=bug_report.md) when filing issues. Include steps to reproduce, expected behavior, and your environment details.

## Feature Requests

Use the [feature request template](https://github.com/recurohq/webhook-test-as-a-service/issues/new?template=feature_request.md). Describe the use case and proposed solution.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
