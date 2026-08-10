# Rule: Automatic Knowledge Storage & Git Push

For EVERY prompt, question, or knowledge interaction with the user in this workspace:
1. Create or update a Markdown note inside `baul obsidian utn/Preguntas/` (for user questions) or `baul obsidian utn/Conocimientos/` (for concepts and technical knowledge).
2. Use clear markdown headers, tags, date, and comprehensive formatting.
3. Immediately run `git add`, `git commit -m "docs: auto-save note - <topic>"`, and `git push origin main` to synchronize changes with GitHub.
