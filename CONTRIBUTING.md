# Contributing to S3 Deck

We love your input! We want to make contributing to S3 Deck as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (for building Tauri apps and backend)

### Getting Started

1. Clone your fork of the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/s3deck.git
   cd s3deck
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development environment:
   ```bash
   npm run start
   ```

4. Make your changes and test them thoroughly.

### Code Style

- **Frontend**: Follow React best practices and use ESLint
- **Backend**: Follow Rust conventions and use `cargo fmt`
- **Commits**: Use descriptive commit messages

### Testing

- Frontend tests: `npm test`
- Backend tests: `cd src-tauri && cargo test`
- E2E tests: Manual testing with `npm run tauri dev`

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/ODudek/s3deck/issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature has already been requested
2. Provide a clear and detailed explanation of the feature
3. Explain why this feature would benefit other users
4. Consider whether it fits with the project's scope and goals

## Project Structure

```
s3deck/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   └── ...
├── src-tauri/             # Tauri application
│   ├── src/               # Rust backend
│   │   ├── main.rs        # Entry point
│   │   ├── lib.rs         # Library entry point
│   │   ├── commands.rs    # Tauri commands
│   │   ├── s3_client.rs   # S3 operations
│   │   ├── config.rs      # Configuration management
│   │   └── models.rs      # Data models
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── .github/workflows/     # GitHub Actions
└── ...
```

## Areas for Contribution

### High Priority
- Bug fixes
- Performance improvements
- Cross-platform compatibility
- Documentation improvements

### Medium Priority
- New S3 service integrations
- UI/UX enhancements
- Additional file management features
- Accessibility improvements

### Low Priority
- Code refactoring
- Additional themes
- Advanced configuration options

## Code Review Process

1. All submissions require review before merging
2. We may ask for changes via code review
3. Once approved, changes will be merged by maintainers
4. Continuous integration tests must pass

## Community

- Follow our [Code of Conduct](https://github.com/ODudek/s3deck/blob/main/CODE_OF_CONDUCT.md)
- Be respectful and constructive in discussions
- Help others in issues and discussions
- Share your use cases and feedback

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

## Questions?

Don't hesitate to ask questions in:
- [GitHub Issues](https://github.com/ODudek/s3deck/issues) for bugs and features
- [GitHub Discussions](https://github.com/ODudek/s3deck/discussions) for general questions

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Thank you for contributing to S3 Deck! 🚀
