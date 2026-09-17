# 🧠 Mi Segundo Cerebro - UTN FRC

**Estudiante:** Martín Sciarra  
**Universidad:** UTN FRC (Ingeniería en Sistemas de Información)  
**Tags:** #hub #segundo-cerebro #utn #sistemas #moc  

---

## 🗺️ Mapa Central de Materias y Ramas

```mermaid
graph TD
    Raiz["🏛️ [[00_Indice_Maestro|Mi Segundo Cerebro (Raíz)]]"]
    Raiz --> H_IAEW["🟣 [[Hub_IAEW|IAEW (Integración de Aplicaciones Web)]]"]
    Raiz --> H_ET["🟢 [[Hub_Emprendimientos_Tecnologicos|Emprendimientos Tecnológicos (FarmaLink)]]"]
    Raiz --> H_UTN["🟠 [[Hub_UTN_General|Contenido General UTN (PPS y Trámites)]]"]
    Raiz --> H_PM["🔵 [[Hub_Project_Manager|Project Manager (Proyecto Final)]]"]

    H_IAEW --> IAEW_Notas["📝 Notas, Labs y Exámenes"]
    H_ET --> ET_Notas["🚀 Metodología ExO y FarmaLink"]
    H_UTN --> UTN_Notas["📋 PPS 200hs y Servidores MCP"]
    H_PM --> PM_Notas["📊 Gestión, PMBOK, Ágiles y Parciales"]
```

---

## 🧭 Acceso a las Ramas

* 🟣 **[[Hub_IAEW|Integración de Aplicaciones en Entorno Web (IAEW)]]** — 30 notas (APIs, OIDC, SAML, LDAP, Middlewares, RBAC, Labs).
* 🟢 **[[Hub_Emprendimientos_Tecnologicos|Emprendimientos Tecnológicos]]** — 6 notas (Metodología ExO, Sprint 1 y Proyecto **FarmaLink**).
* 🟠 **[[Hub_UTN_General|Contenido General de la UTN]]** — 2 notas (Instructivo de PPS 200hs y Servidor MCP UTN).
* 🔵 **[[Hub_Project_Manager|Project Manager (Proyecto Final)]]** — Gestión de proyectos, PMBOK, metodologías ágiles y preparación de parcial.

---

## ⚡ Últimas Notas Registradas (Dataview)

```dataview
TABLE file.mtime as "Modificado"
FROM ""
WHERE file.name != "00_Indice_Maestro" AND !contains(file.name, "Hub_")
SORT file.mtime DESC
LIMIT 8
```
