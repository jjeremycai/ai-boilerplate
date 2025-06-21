# Contributing to TanStack Hetzner

First off, thank you for considering contributing to TanStack Hetzner! It's people like you that make this project better.

## Code of Conduct

By participating in this project, you are expected to uphold our code of conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- Why this enhancement would be useful
- Possible implementation approaches

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style
6. Issue your pull request!

## Development Setup

1. Fork and clone the repository
```bash
git clone https://github.com/your-username/tanstack-hetzner.git
cd tanstack-hetzner
```

2. Install dependencies
```bash
bun install
```

3. Set up your environment
```bash
cp .env.example .env
# Edit .env with your local configuration
```

4. Start the development servers
```bash
turbo dev
```

## Project Structure

- `apps/web/` - TanStack Start application (Cloudflare Workers)
- `packages/api/` - tRPC API server (Hetzner)
- `packages/db/` - Database schema and queries
- `packages/ui/` - Shared UI components (9ui)

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types
- Export types separately from implementations
- Use meaningful variable and function names

### React

- Use functional components with hooks
- Keep components small and focused
- Use proper TypeScript types for props
- Follow React best practices

### Testing

- Write tests for new features
- Maintain test coverage above 80%
- Use meaningful test descriptions
- Test both happy paths and edge cases

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Examples:
```
feat: add chat message editing functionality
fix: resolve memory leak in chat component
docs: update deployment instructions
style: format code according to prettier rules
refactor: extract chat logic into custom hook
test: add tests for chat room creation
chore: update dependencies
```

## Documentation

- Update documentation for any user-facing changes
- Keep README.md up to date
- Document new environment variables
- Add JSDoc comments for complex functions

## Questions?

Feel free to open an issue with your question or reach out on our Discord server.

Thank you for contributing! 🎉