# Preguntas y Respuestas Clave: OIDC (PKCE), SAML 2.0 y LDAP

**Materia Hub:** [[2026-08-10_integracion_aplicaciones_web_utn_frc|IAEW]]  
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
*Notas de estudio relacionadas:*
- [[2026-08-27_oidc_flujo_pkce_authorization_code|OIDC y Flujo PKCE]]
- [[2026-08-27_saml_autenticacion_federada_sso|Protocolo SAML 2.0]]
- [[2026-08-27_ldap_protocolo_directorio_e_integracion_oidc|Protocolo LDAP y OIDC]]
- [[2026-08-13_seguridad_y_validacion_oidc_oauth2|Seguridad y Validación OIDC / OAuth2]]
