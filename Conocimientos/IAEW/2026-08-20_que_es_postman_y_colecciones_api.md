# Conceptos de Desarrollo: ¿Qué es Postman y para qué se usa?

**Materia Hub:** [[2026-08-10_integracion_aplicaciones_web_utn_frc|Integración de Aplicaciones Web (IAEW)]]  
**Tags:** #materia/iaew #postman #apis #testing #desarrollo-web #herramientas  
**Fecha:** 2026-08-20  
**Categoría:** Herramientas de Desarrollo y Testing de APIs  

---

## 🚀 1. ¿Qué es Postman?

**Postman** es la plataforma de software más utilizada en la industria para **diseñar, probar, depurar, documentar y consumir APIs** (servicios web REST, GraphQL, SOAP, etc.).

Funciona como un **"banco de pruebas para APIs"**, permitiendo a los desarrolladores comunicarse con servidores backend e Identity Providers (como Keycloak) **sin necesidad de programar un frontend** (interfaz de usuario) primero.

---

## 🌐 2. La Analogía: Navegador Web vs. Postman

| Característica | Navegador Web (Chrome, Edge, Firefox) | Postman |
| :--- | :--- | :--- |
| **Uso Principal** | Renderizar páginas web para usuarios finales. | Probar y validar servicios web para desarrolladores. |
| **Métodos HTTP** | Prácticamente limitado a peticiones `GET` al escribir URLs. | Soporta todos los verbos: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, etc. |
| **Cabeceras (*Headers*)** | Ocultas y difíciles de modificar manualmente. | Control total sobre cualquier cabecera (ej: `Authorization: Bearer <Token>`, `Content-Type`). |
| **Cuerpo (*Body*)** | No permite enviar cuerpos estructurados directamente. | Permite enviar cuerpos en `JSON`, `x-www-form-urlencoded`, `form-data`, texto plano o binarios. |
| **Visualización** | Muestra el HTML visual renderizado. | Muestra la respuesta cruda: Código de Estado (`200 OK`, `401 Unauthorized`), tiempo de respuesta, headers y JSON formateado. |

---

## 🛠️ 3. Funcionalidades Principales de Postman

```mermaid
graph TD
    A[Postman Workspace] --> B[1. Cliente HTTP / API Requests]
    A --> C[2. Colecciones de Endpoints]
    A --> D[3. Entornos y Variables {{base_url}}]
    A --> E[4. Scripts de Automatización / Tests]
    A --> F[5. Generación Automática de Código]
```

1. **Cliente HTTP / Request Builder:**
   * Permite configurar la URL, los parámetros de consulta (*Query Params*), las cabeceras y el cuerpo de la petición con un solo clic.
2. **Colecciones (*Collections*):**
   * Carpetas organizadas donde se guardan y agrupan todas las peticiones de un proyecto o materia (ej: una colección *"IAEW - Keycloak Lab"* con las requests `/token`, `/certs` y `/introspect`). Se pueden exportar en formato JSON para compartir con el equipo docente o compañeros.
3. **Entornos y Variables (*Environments*):**
   * Permite definir variables reutilizables como `{{base_url}}`, `{{client_id}}` o `{{access_token}}`. Si cambia la URL del servidor, se cambia en un solo lugar y se actualiza en todas las peticiones de la colección.
4. **Scripts de Automatización (*Tests & Pre-request*):**
   * Permite escribir pequeñas líneas de código en JavaScript para capturar el token devuelto por una petición de login y guardarlo automáticamente en una variable de entorno para las siguientes peticiones.
5. **Generador de Código (*Code Snippets*):**
   * Convierte cualquier petición armada en Postman a código listo para copiar y pegar en Node.js (`fetch`/`axios`), Python (`requests`), Java (`HttpClient`), cURL, etc.

---

## 🎯 4. ¿Cómo lo usamos hoy en el práctico de JWT y Keycloak?

En el práctico actual, Postman se utiliza para:
1. **Obtener el Token:** Enviar un `POST` a `https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/token` con `grant_type: client_credentials` y credenciales Basic Auth para recibir el JWT.
2. **Consultar Introspección:** Enviar un `POST` a `/protocol/openid-connect/token/introspect` enviando el token en el body para ver si Keycloak responde `{"active": true}`.
3. **Consumir APIs Protegidas:** Hacer peticiones `GET` o `POST` a una API backend agregando la cabecera `Authorization: Bearer {{token}}`.
