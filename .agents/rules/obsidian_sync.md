# Rule: Automatic Knowledge Storage & Git Push (D:\obsidian-utn)

For EVERY prompt, question, or knowledge interaction with the user in this workspace (`D:\obsidian-utn`):
1. Save/update a corresponding Markdown note inside `D:\obsidian-utn\obsidian\Preguntas\`, `D:\obsidian-utn\obsidian\Notas\`, or `D:\obsidian-utn\obsidian\Conocimientos\` (and sync with `baul obsidian utn`).
2. Format notes with clear headings, dates, user prompts, and detailed technical content.
3. Automatically execute git commands in `D:\obsidian-utn`:
   `git add .`
   `git commit -m "docs: auto-save obsidian note - <topic>"`
   `git push origin main`
