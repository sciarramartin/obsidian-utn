**Materia Hub:** [[2026-08-10_integracion_aplicaciones_web_utn_frc|Integración de Aplicaciones Web (IAEW)]]
**Tags:** #materia/iaew

# Servidor MCP: Departamento de Ingeniería en Sistemas (UTN FRC)

**Fecha:** 2026-08-10  
**Ubicación del Servidor:** `C:\Users\arrai\OneDrive\Documentos\obsidian-utn\mcp_utn_sistemas\index.js`  
**Web de origen:** https://www.institucional.frc.utn.edu.ar/Sistemas/  

---

## 🛠️ Herramientas MCP Disponibles

1. **`get_utn_sistemas_novedades`**
   - **Descripción:** Obtiene las últimas novedades publicadas por el departamento.
   - **Parámetros:** `categoria` (`institucional`, `academica`, `alumnos`, `investigacion`).

2. **`buscar_novedades_utn`**
   - **Descripción:** Busca publicaciones y avisos por palabras clave.
   - **Parámetros:** `query` (ej: *"examen"*, *"horarios"*, *"electiva"*).

3. **`obtener_detalle_noticia_utn`**
   - **Descripción:** Descarga el texto completo de una noticia dada su URL.
   - **Parámetros:** `url`.

---

## ⚙️ Configuración del Servidor MCP
El servidor está registrado en `.agents/mcp_config.json`:
```json
{
  "mcpServers": {
    "utn-sistemas": {
      "command": "node",
      "args": ["C:\\Users\\arrai\\OneDrive\\Documentos\\obsidian-utn\\mcp_utn_sistemas\\index.js"]
    }
  }
}
```
