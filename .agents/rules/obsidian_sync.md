# Rule: Automatic Knowledge Storage & Git Sync

Target Directory: `D:\obsidian-utn\`

1. **Append-Only Policy for Explanations:**
   When adding clarifications, simpler explanations, or follow-ups, **NEVER overwrite or delete existing technical content**. Always append the new explanation below the existing content with a divider (`---`) and a clear header (e.g. `## 💡 Explicación Sencilla / Analogía`).

2. **Categorization:**
   Save notes in:
   - `Notas/`
   - `Preguntas/`
   - `Conocimientos/`

3. **Automated Git Workflow:**
   Automatically execute:
   `git add .`
   `git commit -m "docs: auto-save note - <topic>"`
   `git push origin main`
