# Bitácora Clase 05: Implementación del Flujo PKCE desde Cero con Keycloak y SPA
**Rama:** [[Hub_IAEW|IAEW]]  
**Tags:** #materia/iaew #seguridad #oidc #pkce #oauth2 #keycloak #spa #jwt #postman #laboratorio  
**Fecha:** 2026-09-10  
**Estado:** Completado 100%  

---

## 🎯 1. Resumen Ejecutivo de la Clase

En esta clase se abordó la implementación integral del flujo **OpenID Connect (OIDC) con PKCE** (*Proof Key for Code Exchange*, RFC 7636), el estándar moderno mandatado por **OAuth 2.1** para aplicaciones frontend (**Single Page Applications**) y dispositivos móviles.

Se completaron exitosamente las cuatro etapas del trabajo práctico:
1. **Paso 1 (Básica):** Negociación en navegador y canje en Postman de un Authorization Code por tokens usando un par criptográfico PKCE precalculado.
2. **Paso 2 (Configuración Keycloak):** Alta y configuración de un **Cliente Público** (`spa-69650-martinsciarra`) en la consola de Keycloak del Realm `dds-materia`.
3. **Paso 3 (Análisis de Seguridad):** Provocación y captura de la matriz de errores típicos de OIDC (`PKCE verification failed`, `Code not valid`, `Redirect URI mismatch`, `Client not found`).
4. **Paso 4 (SPA Interactiva en vivo):** Desarrollo y ejecución de una Single Page Application en `http://localhost:4200` con Web Crypto API nativo, Stepper visual de 5 fases, visor de claims JWT y prueba de `/userinfo`.

---

## 🏗️ 2. Arquitectura y Parámetros del Entorno

* **Identity Provider (Keycloak):** `https://labsys.frc.utn.edu.ar/aim`
* **Realm:** `dds-materia`
* **OpenID Discovery Endpoint:** `https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/.well-known/openid-configuration`
* **Authorization Endpoint:** `https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/auth`
* **Token Endpoint:** `https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/token`
* **UserInfo Endpoint:** `https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/userinfo`

### Configuración del Cliente Creado:
* **Client ID:** `spa-69650-martinsciarra`
* **Client authentication:** `OFF` (Cliente Público, sin `client_secret`)
* **Standard flow:** `ON` (Authorization Code con PKCE)
* **Direct access grants / Implicit / Service accounts:** `OFF`
* **Valid redirect URIs:** `http://localhost:4200/*`
* **Web origins (CORS):** `*`, `+`, `http://localhost:4200`

---

## 🔐 3. Mecánica Criptográfica de PKCE

PKCE protege al cliente público frente a la intercepción del código de autorización mediante dos elementos temporales:

$$\\text{code\\_verifier} \\xrightarrow{\\text{SHA-256}} \\text{Digest} \\xrightarrow{\\text{Base64URL}} \\text{code\\_challenge}$$

1. **En la Petición de Autorización (`GET /auth`):**
   La SPA envía el `code_challenge` y el método (`S256`). Keycloak almacena el desafío asociado a la sesión del usuario.
2. **En la Petición de Token (`POST /token`):**
   La SPA envía el `code_verifier` en texto plano junto con el `code`. Keycloak calcula internamente `SHA256(code_verifier)` y comprueba que coincida exactamente con el `code_challenge` original. Si coinciden, emite los tokens; si no, aborta con HTTP 400.

---

## 🧪 4. Matriz de Errores de Seguridad Evaluados

| Prueba | Alteración en Postman | Respuesta JSON de Keycloak | Fundamento Teórico |
| :--- | :--- | :--- | :--- |
| **PKCE Fallido** | `code_verifier` incorrecto | `{"error": "invalid_grant", "error_description": "PKCE verification failed"}` | Un atacante que robe el `code` no puede canjearlo porque no posee el `code_verifier` original generado en el navegador de la víctima. |
| **Código Reutilizado** | Reenviar el mismo `code` | `{"error": "invalid_grant", "error_description": "Code not valid"}` | Los códigos de autorización son de un solo uso (*single-use*) para evitar ataques de repetición (*replay attacks*). |
| **Redirect URI Mismatch** | Cambiar la `redirect_uri` | `{"error": "invalid_grant", "error_description": "Redirect URI mismatch"}` | Mitiga ataques de redirección abierta (*Open Redirector*) donde el código es enviado a servidores de terceros. |
| **Cliente Inexistente** | `client_id` no registrado | `{"error": "invalid_client", "error_description": "Client not found"}` | El IdP no confía en peticiones de clientes anónimos o no registrados en el Realm. |

---

## 💻 5. Implementación de la SPA (`iaew-spa-pkce`)

* **Ubicación del código:** `iaew-spa-pkce/`
* **Servidor Local:** Servidor nativo Node.js en puerto `4200` con soporte de fallback SPA para la ruta `/login-callback`.
* **Criptografía:** Implementada con la API estándar del navegador (`window.crypto.subtle.digest('SHA-256')`).
* **Características:**
  - Stepper visual en tiempo real de las 5 fases del protocolo.
  - Consola de auditoría de eventos OIDC en vivo.
  - Decodificador e inspector visual de claims de `access_token` e `id_token`.
  - Botón de consulta al endpoint `/userinfo` mediante `Authorization: Bearer <token>`.
  - Botón interactivo para simular el fallo criptográfico de PKCE.

---

## 📚 6. Preguntas Clave para el Parcial Práctico

1. **¿Por qué en una SPA el `client_secret` no existe y cómo se reemplaza?**  
   Porque el código de una SPA corre del lado del cliente y es inspeccionable por cualquiera. Se reemplaza por el par dinámico `code_verifier` (secreto temporal efímero) y `code_challenge` (desafío público).
2. **¿Cuál es la diferencia entre el `id_token` y el `access_token`?**  
   El `id_token` está destinado a la aplicación cliente para identificar al usuario logueado (perfil, email, sub). El `access_token` está destinado a los Resource Servers (APIs) para autorizar peticiones HTTP.
3. **¿Por qué es obligatorio configurar `Web Origins` en Keycloak para una SPA?**  
   Porque los navegadores bloquean llamadas AJAX/Fetch cross-origin por política de CORS. Keycloak debe responder los encabezados `Access-Control-Allow-Origin: http://localhost:4200` para permitir que la SPA lea la respuesta del endpoint `/token`.

---
*Conexiones conceptuales:*
- [[2026-08-27_oidc_flujo_pkce_authorization_code|OIDC: Flujo Authorization Code con PKCE]]
- [[2026-08-13_obtencion_y_tipos_de_tokens|Obtención y Tipos de Tokens]]
- [[2026-08-20_conclusion_y_glosario_maestro_jwt_keycloak|Glosario Maestro: JWT y Keycloak]]
- [[2026-09-03_flujo_password_deprecado_y_pkce_oauth2|Flujo Password (Deprecado) y PKCE]]
