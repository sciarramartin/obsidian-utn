# Práctico: Continuamos trabajando con JWT y Keycloak
**Rama:** [[Hub_IAEW|IAEW]]
**Tags:** #materia/iaew #seguridad #jwt #keycloak #oidc #oauth2  
**Fecha:** 2026-08-20  
**Categoría:** Trabajos Prácticos y Laboratorios  

---

## 🌐 1. Datos del Entorno Keycloak (AIM)
* **Consola de Administración:** [https://labsys.frc.utn.edu.ar/aim/admin/dds-materia/console/#/](https://labsys.frc.utn.edu.ar/aim/admin/dds-materia/console/#/)
* **Base Keycloak:** `https://labsys.frc.utn.edu.ar/aim`
* **Realm:** `dds-materia`
* **Discovery Endpoint (OIDC):** `https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/.well-known/openid-configuration`

---

## 🔍 2. Endpoints Clave del Discovery JSON

```json
{
  "issuer": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia",
  "authorization_endpoint": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/auth",
  "token_endpoint": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/token",
  "userinfo_endpoint": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/userinfo",
  "jwks_uri": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/certs",
  "introspection_endpoint": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/token/introspect",
  "end_session_endpoint": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/logout"
}
```

---

## ❓ 3. Respuestas Teóricas y Conceptuales

### 1. ¿Qué endpoint utilizaría una API para obtener las claves públicas necesarias para validar localmente la firma de un JWT?
> **Respuesta:** El endpoint publicado en **`jwks_uri`** (`.../protocol/openid-connect/certs`).  
> Este endpoint devuelve un conjunto **JWKS (JSON Web Key Set)** con las claves públicas RSA/ECDSA activas del Identity Provider. La API descarga y cachea estas claves para verificar matemáticamente la firma del JWT sin contactar al servidor en cada petición.

### 2. ¿Qué endpoint utilizaríamos si en lugar de validar localmente el token quisiéramos consultar al Identity Provider si continúa activo?
> **Respuesta:** El endpoint publicado en **`introspection_endpoint`** (`.../protocol/openid-connect/token/introspect` - estándar **RFC 7662**).  
> La API envía el token al IdP mediante un POST autenticado y el IdP responde con `{"active": true, ...}` o `{"active": false}`.

### 3. ¿En qué casos conviene validar localmente la firma de un JWT?
> **Respuesta:** Conviene validar **localmente** en:
> * **Arquitecturas de Microservicios y APIs de Alto Tráfico:** Evita la latencia de red de hacer llamadas HTTP externas al IdP por cada request entrante.
> * **Escalabilidad (Stateless):** El IdP no se convierte en un cuello de botella o punto único de fallo por sobrecarga de validaciones.
> * **Tokens con expiración corta:** Al usar JWTs con tiempo de vida breve (ej. 5 a 15 minutos), el riesgo de no detectar una revocación inmediata se minimiza y se equilibra con el rendimiento.
> *(Solo se utiliza introspección remota cuando se requiere invalidación en tiempo real inmediata / blacklist estricta o tokens opacos no-JWT).*

---

## 🛠️ 4. Pasos para Configurar Clientes en Keycloak

### A. Crear Client ID con Flujo `client_credentials` (M2M / Máquina a Máquina)
1. Ingresar a la consola en el realm `dds-materia` ➔ Menú lateral **Clients** ➔ Botón **Create client**.
2. **General Settings:**
   * **Client type:** `OpenID Connect`
   * **Client ID:** `dds-client-credentials-lab` (o el nombre elegido) ➔ Click en *Next*.
3. **Capability config:**
   * **Client Authentication:** **ON** *(habilita cliente confidencial y genera el `client_secret`)*.
   * **Authorization:** OFF (opcional).
   * **Authentication flow:**
     * Marcar únicamente **Service accounts roles** *(activa el flujo `client_credentials`)*.
     * Desmarcar *Standard flow* y *Direct access grants* si es exclusivo M2M.
   * Click en *Save*.
4. **Obtener Credenciales:**
   * Ir a la pestaña **Credentials** del cliente creado.
   * Copiar el valor del campo **Client Secret**.

---

### B. Crear Client ID con Flujo `password` (Direct Access Grants / Resource Owner Password)
1. Ir a **Clients** ➔ **Create client**.
2. **General Settings:**
   * **Client ID:** `dds-password-lab` ➔ Click en *Next*.
3. **Capability config:**
   * **Client Authentication:** **OFF** (para cliente público) u **ON** (para confidencial).
   * **Authentication flow:**
     * Marcar **Direct access grants** *(habilita autenticación enviando `username` y `password`)*.
     * Click en *Save*.

---

## 📮 5. Ejemplos de Requests HTTP / Postman / cURL

### 1. Obtener Token con `client_credentials` (`POST /token`)
```http
POST https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(client_id:client_secret)>

grant_type=client_credentials
```
*(O pasando `client_id` y `client_secret` en el cuerpo form-urlencoded).*

### 2. Introspección de Token (`POST /token/introspect`)
```http
POST https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/token/introspect
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(client_id:client_secret)>

token=<ACCESS_TOKEN>&token_type_hint=access_token
```

---

## 💻 6. Aplicación Node.js de Laboratorio
* Ubicación del proyecto: `C:\Users\arrai\.gemini\antigravity\scratch\node-app-jwt\`
* Cuenta con interfaz web para:
  1. **Obtener un token:** Solicita token mediante `client_credentials`.
  2. **Validar firma localmente:** Utiliza `jose` (`createRemoteJWKSet` y `jwtVerify`) contra el `jwks_uri`.
