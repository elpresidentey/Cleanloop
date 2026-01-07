# Contributing to CleanLoop Platform

Thank you for your interest in contributing to CleanLoop Platform! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful, inclusive, and collaborative. We welcome contributions from everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the Issues section
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment information (OS, browser, etc.)

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - A clear description of the feature
   - Use cases and benefits
   - Potential implementation approach (if you have ideas)

### Pull Requests

1. **Fork the repository** and clone it locally
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Commit your changes** with clear, descriptive messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** on GitHub

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/cleanloop-platform.git
   cd cleanloop-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Run tests**:
   ```bash
   npm test
   ```

6. **Run linting**:
   ```bash
   npm run lint
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing type definitions and patterns
- Use explicit types instead of `any` when possible

### React

- Use functional components with hooks
- Follow React best practices and patterns
- Keep components small and focused
- Use meaningful component and variable names

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Ensure mobile responsiveness
- Maintain consistent spacing and colors

### Code Formatting

- Run `npm run format` before committing
- Use Prettier for code formatting
- Follow ESLint rules (run `npm run lint`)

### Commit Messages

Use clear, descriptive commit messages:

```
feat: Add user profile editing
fix: Resolve payment PDF generation issue
docs: Update README with setup instructions
style: Format code with Prettier
refactor: Simplify authentication logic
test: Add tests for payment service
chore: Update dependencies
```

## Project Structure

```
cleanloop-platform/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API and business logic
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── lib/            # Third-party configurations
├── public/             # Static assets
├── supabase/           # Database migrations
└── convex/             # Convex functions
```

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Test on multiple browsers and devices

## Documentation

- Update README.md if needed
- Add JSDoc comments for functions and components
- Update CHANGELOG.md with your changes
- Document any breaking changes

## Review Process

1. All PRs require review before merging
2. Address review comments promptly
3. Ensure CI checks pass
4. Maintain or improve test coverage

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

Thank you for contributing to CleanLoop Platform! 🎉

