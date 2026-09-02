# Contributing to Effect-TS Scrapping

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)
- Node.js (for Puppeteer)
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/effect-ts-scrapping.git
   cd effect-ts-scrapping
   ```
3. Install dependencies:
   ```bash
   bun install
   ```
4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

## Development Workflow

### Running Tests
```bash
bun run typecheck  # Type checking
bun run lint       # Linting
bun run format     # Code formatting
```

### Running the Scraper
```bash
bun run start
```

## Code Quality

This project maintains high code quality standards:

- **Type Safety**: All code is fully typed with TypeScript
- **Linting**: Enforced by Oxlint with custom anti-slop rules
- **Formatting**: Enforced by Biome
- **Effect Patterns**: Follows Effect-TS best practices

### Before Submitting a PR

1. Run the type checker: `bun run typecheck`
2. Run the linter: `bun run lint`
3. Format your code: `bun run format`
4. Test your changes locally

## Reporting Issues

When reporting bugs, please include:
- Target URL being scraped
- Error message and stack trace
- Environment details (Bun version, Node version)
- Steps to reproduce

## Pull Request Guidelines

- Provide a clear description of changes
- Reference related issues
- Ensure all checks pass
- Update documentation if needed

## Questions?

Feel free to open a discussion or issue for questions.
