# Rule: Automatic Knowledge Storage & Git Sync

Target Directory: `D:\obsidian-utn\`

1. Every user query, concept, or academic knowledge must be written to its corresponding folder:
   - `Notas/`
   - `Preguntas/`
   - `Conocimientos/`
2. Notes must be structured with Markdown titles, dates, user prompts, and comprehensive answers.
3. Automatically execute Git workflow:
   `git add .`
   `git commit -m "docs: auto-save note - <topic>"`
   `git push origin main`
