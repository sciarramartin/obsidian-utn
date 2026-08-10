# Configuración del Baúl Obsidian UTN y Autocommit

**Fecha:** 2026-08-10  
**Categoría:** Configuración

## Pregunta / Solicitud del Usuario
> "crea una carpeta llamada baul obsidian utn y push al repo, cada conocimiento o pregunta q te haga quiero q almacenes en el baul de obsidian y lo pushees automaticamente"

## Respuesta y Acción Realizada
1. **Creación de estructura:** Se creó la carpeta `baul obsidian utn` con subcarpetas para `Conocimientos`, `Preguntas`, `Notas` y `Recursos`, incluyendo la configuración de Obsidian (`.obsidian/`).
2. **Sincronización Git Automática:** Se configuró una regla de trabajo en `.agents/rules/obsidian_sync.md` para que cada pregunta o conocimiento brindado se guarde automáticamente en formato Markdown dentro de `baul obsidian utn` y se realice un `git add`, `git commit` y `git push`.
