# Preguntas y Respuestas Clave: Clase 03 - Seguridad en APIs, Middlewares y Roles
**Rama:** [[Hub_IAEW|IAEW]]
**Tags:** #materia/iaew #utn #sistemas #preguntas-examen #seguridad #express #rbac #autoevaluacion  
**Fecha:** 2026-08-31  

---

## ❓ Cuestionario de Autoevaluación y Examen

### 1. ¿Cuál es la diferencia técnica y semántica entre los códigos HTTP `401 Unauthorized` y `403 Forbidden`?
> [!NOTE]
> **Respuesta:**
> - **`401 Unauthorized` (Falta de Autenticación):** Indica que la petición no presenta credenciales válidas (*"No sé quién sos"*). Ocurre cuando falta el token Bearer, el token es inválido o la API Key es errónea.
> - **`403 Forbidden` (Falta de Autorización):** Indica que el servidor identificó correctamente al usuario, pero sus permisos o roles son insuficientes para ejecutar la acción solicitada (*"Sé quién sos, pero no podés hacer esto"*). Ocurre, por ejemplo, cuando un usuario con rol `cliente` intenta ejecutar `POST /productos` (reservado para `admin`).

---

### 2. ¿Por qué es una buena práctica arquitectónica usar Middlewares en Express para la seguridad en lugar de validaciones dentro de cada controlador?
> [!NOTE]
> **Respuesta:**
> Utilizar middlewares desacopla la seguridad de la lógica del negocio, aplicando el principio de **Responsabilidad Única (SRP)** y el patrón **Chain of Responsibility**. Evita la duplicación de código en múltiples rutas, reduce la probabilidad de olvidar controles de seguridad y permite encadenar protecciones reutilizables (`requireApiKey` $\rightarrow$ `requireAuth` $\rightarrow$ `requireRole`).

---

### 3. ¿Por qué las credenciales y API Keys deben residir en variables de entorno (`.env`) y no en el código fuente?
> [!NOTE]
> **Respuesta:**
> El código fuente se versiona en repositorios compartidos (como GitHub). Dejar claves fijas (*hardcoded*) expone la seguridad de la infraestructura a cualquier persona con acceso al repositorio. El archivo `.env` se excluye mediante `.gitignore`, asegurando que los secretos se configuren de forma independiente y segura en cada entorno de ejecución.

---

### 4. ¿Qué riesgos presenta permitir que un Agente de IA ejecute endpoints de una API sin control de autorización, y qué medidas deben aplicarse?
> [!NOTE]
> **Respuesta:**
> - **Riesgos:** En lecturas (`GET /pedidos`), puede filtrar información privada o sensible de clientes (PII). En escrituras (`POST /productos`, `POST /pedidos/:id/confirmar`), puede alterar precios, corromper el stock físico o ejecutar transacciones financieras descontroladas.
> - **Medidas:** Aplicar el principio de menor privilegio con roles estrictos (`admin` vs `cliente`), exigir confirmación explícita para acciones destructivas y registrar un **log de auditoría inmutable** (*Audit Trail*) con timestamp, identificador del agente, IP, payload y resultado de la operación.

---
- Seguridad en APIs, Middlewares y RBAC
- Actividad Práctica Clase 03
- APIs y Servicios Web
