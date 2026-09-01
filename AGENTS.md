# Workspace Rules: Mi Segundo Cerebro (UTN & Materias)

- **Vault Location:** `C:\Users\arrai\OneDrive\Documentos\obsidian-utn\`
- **Vault Name:** `Mi Segundo Cerebro`

---

## 🌳 Arquitectura del Árbol Jerárquico:

### 1. Tronco / Nodo Raíz:
* `00_Indice_Maestro.md`: Raíz central del Segundo Cerebro Universitario.

### 2. Ramas y Hubs Específicos:
* **🟣 Rama IAEW:** `Hub_IAEW.md` (Tag `#materia/iaew`, enlace `**Rama:** [[Hub_IAEW|IAEW]]`).
* **🟢 Rama Emprendimientos Tecnológicos:** `Hub_Emprendimientos_Tecnologicos.md` (Tag `#materia/emprendimientos-tecnologicos`, incluye FarmaLink, enlace `**Rama:** [[Hub_Emprendimientos_Tecnologicos|Emprendimientos Tecnológicos]]`).
* **🟠 Rama Contenido General UTN:** `Hub_UTN_General.md` (Tag `#materia/pps` o `#utn/general`, incluye PPS 200hs y Servidores MCP, enlace `**Rama:** [[Hub_UTN_General|Contenido General UTN]]`).

---

## 🤖 Reglas de Creación, Anti-Duplicados y Mantenimiento de Grafo:

### 🛡️ 1. Regla Anti-Duplicados y Actualización Append-Only:
- **BÚSQUEDA PREVIA OBLIGATORIA:** Antes de crear una nota, verificar siempre si ya existe un documento relacionado con ese concepto o tema (ej: *OIDC*, *SAML*, *Middlewares / Seguridad*, *FarmaLink*, *Keycloak*, *Postman*, etc.).
- **MODO APPEND-ONLY (ENRIQUECIMIENTO CONTINUO):** Si el tema, pregunta, duda o profundización ya tiene una nota existente en el baúl:
  * **ESTÁ ESTRICTAMENTE PROHIBIDO CREAR UN ARCHIVO DUPLICADO O SEPARADO.**
  * Abrir la nota existente y **agregar la nueva información abajo al final (append)** con una nueva sección (ej: `--- \n\n## 📝 [Fecha] - Pregunta / Profundización: <Título>\n...`).
  * Conservar intactos los enlaces originales (`**Rama:** [[...]]`), sus metadatos y el grafo de Obsidian.
- **CREACIÓN DE NOTAS NUEVAS:** Crear un archivo `.md` nuevo **únicamente** cuando se trate de un concepto, laboratorio o clase completamente nuevo que no tenga nota previa relacionada.

### 🌳 2. Enrutamiento y Mantenimiento de Grafo:
- **AUTO-REGISTRO PROACTIVO:** Cada nuevo concepto, duda o laboratorio se registra automáticamente con su enlace a la rama correspondiente.
- **NUEVAS MATERIAS / TEMAS:** Si se consulta sobre una materia nueva de la carrera, crear su propio Hub dedicado (ej: `Hub_Sistemas_Operativos.md`) conectado a `00_Indice_Maestro.md`.
- **PLUGIN DATAVIEW:** Utilizar bloques ```dataview para generar tablas dinámicas en los Hubs.

---

## 🛑 Regla de Sincronización Git:
- **SIN PUSH AUTOMÁTICO:** Guardar cambios localmente en el disco. Ejecutar `git push` únicamente cuando el usuario lo solicite de forma explícita.
