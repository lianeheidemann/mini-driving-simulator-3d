# Contributing

Thanks for considering a contribution to Mini Driving Simulator 3D! This is a small, learning-oriented project, so contributions of any size are welcome — from fixing a typo in the docs to picking up a [Roadmap](README.md#roadmap) item.

## Before you start

For anything non-trivial, please open an issue first (or comment on an existing one) to discuss the approach before writing code. It saves rework on both sides.

## Development setup

The project is a static site with no build step or dependencies to install. The only requirement is serving it over HTTP, since the browser's `file://` origin blocks glTF/texture loading:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project structure

- `index.html` — scene entry point (A-Frame markup, HUD, asset declarations).
- `src/components/` — A-Frame components (`AFRAME.registerComponent(...)`), one concern per file.
- `src/controls/` — input handling, decoupled from vehicle logic (see `gamepad-input.js`).
- `input/` — source 3D assets (`.glb` / `.blend`).
- `doc/step-by-step/` — the guides used while building this project; update them if your change affects how a future contributor would follow along.

## Making changes

- Keep components focused — a new concern usually deserves its own component rather than growing an existing one.
- Match the existing code style (no semicolons-first debates here — just follow what's already in the file you're editing).
- Test manually in the browser (keyboard and, if possible, a gamepad) before opening a PR. There's no automated test suite yet.
- If you touch `index.html`, the CI HTML-lint check must pass (`npx htmlhint index.html`).

## Submitting a change

1. Fork the repo and create a branch from `main`.
2. Make your change, with a clear, focused commit history.
3. Open a pull request describing what changed and why, and how you tested it.

## Reporting bugs / suggesting features

Please use the issue templates — they help keep reports consistent and actionable.

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
