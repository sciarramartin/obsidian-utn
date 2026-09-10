# Preguntas y Respuestas Clave: OIDC (PKCE), SAML 2.0 y LDAP
**Rama:** [[Hub_IAEW|IAEW]]
**Tags:** #materia/iaew #utn #sistemas #preguntas-examen #seguridad #oidc #pkce #saml #ldap #autoevaluacion  
**Fecha:** 2026-08-27  

---

## ❓ Cuestionario de Examen y Autoevaluación

### 1. ¿Por qué el flujo Authorization Code tradicional con `client_secret` no es seguro para SPAs o Aplicaciones Móviles, y cómo lo soluciona PKCE?
> [!NOTE]
> **Respuesta:**
> En SPAs (código JavaScript descargado al navegador) y aplicaciones móviles, el código es público y descompilable, por lo que **no se puede ocultar un `client_secret` de forma segura**.  
> **PKCE** (*Proof Key for Code Exchange*, RFC 7636) elimina la necesidad de un secreto fijo: el cliente genera en cada login un secreto dinámico (`code_verifier`) y envía su hash SHA-256 (`code_challenge`). Al canjear el código de autorización, el IdP valida que el cliente posea el verificador original, impidiendo ataques de interceptación del código.

---

### 2. ¿Se puede cumplir el objetivo de SAML con OIDC? Explique la equivalencia de conceptos.
> [!NOTE]
> **Respuesta:**
> **Sí, al 100%.** OIDC fue diseñado expresamente para suceder y modernizar a SAML en Single Sign-On (SSO) y federación de identidades.
> - **IdP (SAML)** $\leftrightarrow$ **OpenID Provider / IdP (OIDC)** (Keycloak, Google).
> - **Service Provider (SAML)** $\leftrightarrow$ **Relying Party / Client (OIDC)**.
> - **Aserción XML (SAML)** $\leftrightarrow$ **ID Token JWT (OIDC)**.
> - **Certificados X.509** $\leftrightarrow$ **Claves Públicas JWKS (`/certs`)**.
> 
> *Ventaja de OIDC:* Soporta apps móviles/SPAs con PKCE, entrega `access_token` para proteger APIs REST y es mucho más liviano (JSON vs XML).

---

### 3. ¿Por qué una empresa utiliza LDAP/Active Directory para gestionar identidades en vez de una base de datos relacional (PostgreSQL/MySQL)?
> [!NOTE]
> **Respuesta:**
> 1. **Patrón de carga Read-Heavy (99% lectura vs. 1% escritura):** Las identidades se validan miles de veces por segundo (WiFi, VPN, emails, logins), pero se escriben rara vez. LDAP está optimizado a nivel de bajo nivel para búsquedas ultra-rápidas en memoria.
> 2. **Estándar Universal "Plug & Play":** Routers, VPNs, impresoras, servidores Linux (PAM) y Windows soportan LDAP de fábrica sin programar adaptadores a medida.
> 3. **Estructura Jerárquica:** Modela el organigrama empresarial de forma nativa (`dc`, `ou`, `cn`) sin `JOINs` complejos.

---

### 4. Si la información del usuario se modifica en LDAP (ej. cambio de apellido o despido), ¿cómo se evita la inconsistencia en las bases de datos de las aplicaciones?
> [!NOTE]
> **Respuesta:**
> 1. **Identificador Inmutable (`sub`):** Usar el `sub` (UUID) del JWT como clave primaria en la app, nunca el `email` ni el `username`.
> 2. **Sincronización Just-In-Time (JIT):** En cada login OIDC, la app toma los claims frescos del JWT y ejecuta un *Upsert* en su base de datos.
> 3. **Eventos / Protocolo SCIM:** Para bajas inmediatas, el IdP emite webhooks o llamadas SCIM (RFC 7643) para revocar sesiones activas en tiempo real.
> 4. **Expiración corta de tokens:** Usar Access Tokens de corta duración (ej: 5-15 min) para que los permisos revocados caduquen rápidamente.

---

### 5. ¿Dónde y cómo se almacenan las contraseñas de los usuarios en Keycloak?
> [!NOTE]
> **Respuesta:**
> Keycloak **nunca guarda contraseñas en texto plano**:
> - En su base de datos relacional interna (PostgreSQL/MySQL), las almacena como **hashes criptográficos con salt** usando algoritmos resistentes a fuerza bruta (**PBKDF2 con SHA-512** o **Argon2**).
> - Si está federado con LDAP/Active Directory, **no almacena las contraseñas**: delega la validación en tiempo real al servidor LDAP mediante conexiones cifradas LDAPS (puerto `636/TCP`).

---

### 6. ¿Por qué los flujos "Password" (ROPC) e "Implicit Grant" están formalmente DEPRECADOS en OAuth 2.1, y qué flujo debe usarse en su lugar?
> [!NOTE]
> **Respuesta:**
> - **Resource Owner Password Credentials (`password`):** Fue deprecado porque rompe el principio de delegación: la aplicación cliente le pide al usuario su usuario y contraseña, lo cual entrena al usuario a entregar credenciales a aplicaciones intermedias, expone las contraseñas al frontend y a intermediarios, e impide implementar MFA/2FA sin acoplamientos complejos.
> - **Implicit Flow:** Fue deprecado porque devolvía el `access_token` en el fragmento hash (`#`) de la URL del navegador, exponiéndolo en el historial de navegación, logs de servidores y a través de ataques de scripts maliciosos (XSS / referer headers).
> - **Reemplazo universal:** Se debe utilizar **Authorization Code con PKCE** tanto para aplicaciones frontend (SPAs) como para clientes móviles.

---

### 7. Para un Parcial Práctico: ¿Cuáles son los parámetros exactos para canjear un código PKCE en Postman (`POST /token`)?
> [!NOTE]
> **Respuesta:**
> - **Método:** `POST`
> - **URL:** `https://<idp-host>/realms/<realm>/protocol/openid-connect/token`
> - **Headers:** `Content-Type: application/x-www-form-urlencoded`
> - **Body (Form URL-Encoded):**
>   1. `grant_type`: `authorization_code`
>   2. `client_id`: ID del cliente público (ej. `spa-69650-martinsciarra`)
>   3. `redirect_uri`: La misma URI de redirección registrada (ej. `http://localhost:4200/login-callback`)
>   4. `code`: El código de autorización recibido tras autenticarse en el navegador.
>   5. `code_verifier`: El texto plano original de alta entropía cuyo hash generó el `code_challenge`.
>   *(Nota de examen: ¡NO se envía `client_secret` porque un cliente público no lo tiene!)*

---

### 8. ¿Qué causa el error `{"error": "invalid_grant", "error_description": "PKCE verification failed"}` y qué vector de ataque mitiga?
> [!NOTE]
> **Respuesta:**
> Ocurre cuando el Identity Provider (Keycloak) calcula `SHA-256(code_verifier)` enviado en el canje de token y el resultado **no coincide** con el `code_challenge` que se registró al inicio del flujo en `/auth`.  
> **Ataque que mitiga:** Demuestra que si un atacante o software malicioso intercepta el `code` de autorización (por ejemplo, capturando el tráfico del navegador o registrando un esquema de URL falso), **no puede obtener el token**, ya que el atacante no conoce el `code_verifier` efímero que reside exclusivamente en la memoria/sessionStorage del cliente legítimo.

---

### 9. ¿Por qué es obligatorio configurar `Web Origins` en Keycloak para una SPA y qué ocurre si se olvida?
> [!NOTE]
> **Respuesta:**
> Las SPAs (React, Angular, Vue, JS vanilla) ejecutan llamadas HTTP asíncronas (`fetch` / `axios`) desde el navegador hacia un dominio distinto (el del IdP).  
> Los navegadores aplican la **Same-Origin Policy (SOP)** y envían una petición preliminar `OPTIONS` (Preflight). Si en Keycloak no se configura el origen de la SPA en `Web Origins` (ej: `http://localhost:4200` o `*`), Keycloak no responderá los encabezados `Access-Control-Allow-Origin`, y el navegador bloqueará la lectura de la respuesta, impidiendo que la SPA obtenga los tokens aunque la contraseña del usuario sea correcta.

---

### 10. ¿Cuál es la diferencia entre validar un Access Token de forma "Offline" vs. "Online" en una API?
> [!NOTE]
> **Respuesta:**
> - **Offline (Validación Criptográfica Local):** La API descarga una vez las claves públicas del IdP desde el endpoint JWKS (`/.well-known/openid-configuration` $\rightarrow$ `/protocol/openid-connect/certs`) y valida la firma RSA/ECDSA, emisor (`iss`) y expiración (`exp`) localmente en memoria. **Es ultra-rápida (0 ms de red)** y se usa en arquitecturas de microservicios de alto tráfico.
> - **Online (Token Introspection, RFC 7662):** En cada petición, la API hace una llamada HTTP `POST /protocol/openid-connect/token/introspect` hacia Keycloak consultando si el token sigue activo. Permite revocación instantánea en caso de baja o compromiso de credenciales, pero añade latencia y sobrecarga sobre el Identity Provider.

---
*Conexiones conceptuales:*
- [[2026-08-27_oidc_flujo_pkce_authorization_code|OIDC: Flujo Authorization Code con PKCE]]
- [[2026-08-27_saml_autenticacion_federada_sso|Protocolo SAML 2.0]]
- [[2026-08-27_ldap_protocolo_directorio_e_integracion_oidc|Protocolo LDAP y OIDC]]
- [[2026-08-13_seguridad_y_validacion_oidc_oauth2|Seguridad y Validación OIDC / OAuth2]]
- [[2026-09-10_actividad_clase_05_pkce_keycloak_spa|Bitácora Clase 05: PKCE Keycloak y SPA]]

