# 🟠 Hub: Contenido General de la UTN (PPS y Trámites)

**MOC Principal:** [[00_Indice_Maestro|Mi Segundo Cerebro]]  
**Tags:** #hub #utn #sistemas #pps #tramites  

---

## 📋 Documentos Académicos y Servicios

* [[2026-08-13_instructivo_pps_utn_frc|Instructivo y Reglamento de la PPS (200 Horas Reloj)]]
* [[2026-08-10_servidor_mcp_utn_sistemas|Servidor MCP UTN Sistemas: Guía de Integración y Consultas]]

---

## 📋 Lista de Notas Generales UTN (Dataview)

```dataview
TABLE file.mtime as "Modificado"
FROM ""
WHERE contains(file.tags, "pps") OR contains(file.name, "mcp_utn")
SORT file.mtime DESC
```
