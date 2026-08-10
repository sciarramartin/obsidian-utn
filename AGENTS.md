# Workspace Rules: Obsidian UTN Vault

- **Vault Root:** `D:\obsidian-utn\`
- **Note Organization:**
  - `Notas/`: Academic notes, subject summaries, and topic notes.
  - `Preguntas/`: User questions and answered queries.
  - `Conocimientos/`: Core concepts and technical documentation.
  - `Recursos/`: Images and attached assets.
- **Automated Git Sync:**
  - For every question asked or knowledge generated, create/update the Markdown note directly in `D:\obsidian-utn\`.
  - Automatically run `git add .`, `git commit -m "docs: auto-save obsidian note - <topic>"`, and `git push origin main`.
