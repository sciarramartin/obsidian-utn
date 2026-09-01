# Conceptos de Seguridad: Obtención y Tipos de Tokens
**Rama:** [[Hub_IAEW|IAEW]]

**Materia:** Diseño de Sistemas / Integración de Aplicaciones en Entorno Web (UTN FRC)  
**Tags:** #materia/iaew
**Fecha:** 2026-08-13  
**Categoría:** Seguridad y Autenticación Web  

---

## 🧭 1. Endpoint de Descubrimiento (Discovery Endpoint)

Para saber cómo interactuar con un Identity Provider (IdP) y conocer dónde obtener un token, se utiliza el **Discovery Endpoint** estandarizado en OpenID Connect:

* **Endpoint Estándar:** `/.well-known/openid-configuration`
* **Ejemplo en Keycloak (AIM):**  
  `https://<host>/aim/realms/<realm_name>/.well-known/openid-configuration`

### ¿Qué hace este endpoint?
Es un documento JSON público que expone toda la metadata y capacidades del servidor de identidad. Entre sus campos más importantes expone:
* **`token_endpoint`**: La URL exacta para solicitar tokens (ej. `.../protocol/openid-connect/token`).
* **`authorization_endpoint`**: La URL para redirigir al usuario a loguearse.
* **`jwks_uri`**: La URL con las claves públicas para validar firmas locales.
* **`userinfo_endpoint`**: La URL para obtener datos del perfil del usuario logueado.

---

## ⚔️ 2. Token de Aplicación vs. Token de Usuario

Es fundamental entender la diferencia entre quién solicita el token y en nombre de quién se realiza la acción.

### A. Token de Aplicación (Client Token / App Token)
Representa a la **aplicación misma** (Machine-to-Machine / M2M). No hay un usuario humano detrás.
* **Flujo OAuth 2.0 asociado:** **Client Credentials Grant**.
* **Cómo funciona:** La aplicación se identifica ante el IdP usando su propio `client_id` y `client_secret` para obtener el token.
* **Cuándo usarlo:** 
  * Procesos en segundo plano (workers, cron jobs).
  * Comunicación directa entre microservicios internos donde no interviene un usuario (ej. un servicio de facturación que sincroniza stock con el de inventario).
  * Consumo de APIs públicas o de infraestructura.

### B. Token de Usuario (User Token)
Representa a un **usuario humano autenticado** en el sistema.
* **Flujos OAuth 2.0 comunes:** **Authorization Code Flow (con PKCE)** o **Resource Owner Password Credentials**.
* **Cómo funciona:** El usuario inicia sesión introduciendo su usuario y contraseña en el IdP, y este emite un token asociado a su identidad.
* **Cuándo usarlo:**
  * En cualquier acción interactiva iniciada por un humano (ej. ver sus notas en SYSACAD, realizar un pago con su cuenta, actualizar su perfil).
  * Cuando se requiere aplicar políticas de control de acceso basadas en los roles del usuario (RBAC) o su ID único (`sub`).

---

## 📊 Resumen Comparativo

| Característica | Token de Aplicación | Token de Usuario |
| :--- | :--- | :--- |
| **Sujeto (`sub`)** | El ID del cliente (App) | El ID único del usuario (DNI/Legajo/UUID) |
| **Flujo Típico** | Client Credentials | Authorization Code Flow |
| **Credenciales** | `client_secret` de la App | Contraseña del usuario |
| **Interactividad** | ❌ Ninguna (Totalmente automatizado) | ✅ Requiere acción humana (Login) |
| **Uso común** | Tareas programadas, Integración backend | Aplicaciones Web/Móviles (Frontend a API) |

---

## 🔍 3. Análisis de Caso Real: Flujo de Autorización en la Consola de Keycloak

Analizando la URL de autenticación de tu consola:
`https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/auth?client_id=security-admin-console&redirect_uri=https%3A%2F%2Flabsys.frc.utn.edu.ar%2Faim%2Fadmin%2Fdds-materia%2Fconsole%2F%23%2Fdds-materia%2Fusers&state=6aceb23a-fadb-4234-8d23-e844fddff263&response_mode=fragment&response_type=code&scope=openid&nonce=a30efd18-cc39-4666-ae00-80fd8a084508&prompt=none&code_challenge=2zP7rt6tRlFusfFV874lpDKP2hUlI7jV9A712jGh20E&code_challenge_method=S256`

Podemos identificar los parámetros estándar de **OIDC / OAuth 2.0 con PKCE** utilizados por Keycloak:
* **`client_id=security-admin-console`**: El cliente público de la consola de administración.
* **`response_type=code`**: Indica que se está iniciando el flujo **Authorization Code Flow** para obtener un token de usuario de forma segura.
* **`scope=openid`**: Indica que es una petición **OIDC** para obtener claims de identidad además de acceso.
* **`code_challenge=2zP7r...` y `code_challenge_method=S256`**: Parámetros de **PKCE** (Proof Key for Code Exchange) para proteger el intercambio de código en clientes públicos (como la consola SPA en el navegador) evitando ataques de interceptación.
* **`redirect_uri=.../#/dds-materia/users`**: La consola solicita redireccionar al usuario directamente a la sección de **Gestión de Usuarios** tras autenticarse con éxito.

---

## 🎓 4. Perspectiva de Estudiante de Sistemas (Resumen rápido para el parcial/TP)

### 1) ¿Cuál es el endpoint que nos dice cómo obtener el JWT?
Es el **Discovery Endpoint** (`/.well-known/openid-configuration`). 
* **La explicación rápida:** Es un golazo porque le pegás a esa ruta pública del servidor de identidad (como Keycloak) y te escupe un JSON con todas las URLs del entorno. De ahí sacás el `token_endpoint` (que suele terminar en `/protocol/openid-connect/token`), que es la URL exacta a la que tenés que tirarle el POST con las credenciales para que te devuelva el token.

### 2) Token de Aplicación vs. Token de Usuario (Diferencia clave)
La posta acá es saber **quién está haciendo la petición**:
* **Token de Aplicación (M2M - Machine to Machine):** Lo usa la aplicación cuando habla con otra aplicación en el backend sin que haya un usuario haciendo clic. Se obtiene por el flujo *Client Credentials* usando el ID y el secreto de la app (ej: un script cron que se levanta a las 3 AM para sincronizar stock con el backend de facturación).
* **Token de Usuario:** Lo usa un usuario de carne y hueso que se logueó en el sistema (ej: un estudiante que entra a ver sus notas). Se obtiene típicamente con *Authorization Code Flow* y el token viaja con los claims de identidad de esa persona (como legajo, mail y roles) para validar qué cosas tiene permitido tocar.

---

## 🔎 5. Relacionando la teoría con el JSON de tu Realm (`openid-configuration`)

Si miramos el JSON de configuración que nos devolvió tu servidor Keycloak para el realm `dds-materia`, podemos justificar esta diferencia basándonos en tres campos clave:

### 1. Los Flujos Permitidos (`grant_types_supported`)
* En la lista de tu JSON vemos `"client_credentials"`, que es el flujo exclusivo para generar **Tokens de Aplicación** (M2M).
* También vemos `"authorization_code"` y `"password"`, que son los métodos para generar **Tokens de Usuario** (donde interviene un humano ingresando sus datos).

### 2. Los Scopes Soportados (`scopes_supported`)
* Tu realm soporta ámbitos como `"profile"`, `"email"`, `"phone"` y `"address"`. Estos scopes se solicitan únicamente cuando generamos un **Token de Usuario**, ya que sirven para pedir información del perfil de la persona.
* Un **Token de Aplicación** no pide estos scopes, ya que a la API no le interesa el email o el teléfono de un microservicio de backend.

### 3. Los Claims Soportados (`claims_supported`)
* El JSON lista claims como `"name"`, `"given_name"`, `"family_name"`, `"preferred_username"`, `"email"` y `"auth_time"`.
* Estos atributos solo se inyectarán en la carga útil (payload) de un **Token de Usuario** (para describir a la persona logueada). En un **Token de Aplicación**, estos claims no existen, y el `"sub"` (subject) simplemente es el ID de la propia aplicación cliente.

---

## 🎯 6. Casos concretos de uso del Token de Usuario Final (User Token)

El **Token de Usuario** es obligatorio en los siguientes escenarios prácticos:

1. **Seguridad y Control de Acceso basado en Roles (RBAC):**
   * Cuando la API expone recursos restringidos para ciertos tipos de personas (ej: en el sistema de la UTN, el endpoint `POST /notas` solo debe permitir el acceso a usuarios que tengan el rol `docente` en su token, mientras que `GET /notas` está disponible para roles `alumno`).
2. **Acciones dependientes del contexto del usuario:**
   * Cuando el backend necesita saber el identificador del usuario (`sub` o `legajo`) para filtrar la información que le corresponde. Por ejemplo, al consultar `GET /perfil`, el backend no pide un ID por parámetro; lee el token del usuario logueado para buscar y devolver únicamente sus datos.
3. **Auditoría e Historial de Modificaciones:**
   * Cuando por motivos de seguridad o legales se requiere registrar un log con nombre y apellido de quién realizó una acción crítica (ej: *"El usuario juan.perez@utn.edu.ar modificó la planificación de cursada a las 18:15 hs"*).
4. **Consentimiento Delegado (OAuth2 Consent):**
   * Cuando una aplicación de terceros requiere acceder a tus datos con tu autorización (ej: permitir que una app de calendario lea tus horarios de cursada de la UTN). El token de usuario garantiza que diste permiso explícito sobre tus recursos.

---

## ⚡ 7. Respuestas Cortas (Resumen de Parcial)

### 1) ¿Qué endpoint nos dice cómo obtener el JWT?
* **`/.well-known/openid-configuration`** (Discovery Endpoint). En su JSON expone la propiedad **`token_endpoint`** (donde se solicitan los tokens).

### 2) Diferenciar Token de Aplicación y de Usuario usando el JSON de Keycloak:
* **Flujos (`grant_types_supported`):** El token de aplicación usa `"client_credentials"`; el de usuario usa `"authorization_code"` o `"password"`.
* **Datos (`claims_supported`):** El token de usuario contiene claims personales como `"email"`, `"name"` o `"family_name"`; en el de aplicación estos campos están ausentes y el `"sub"` es el Client ID.
* **Permisos (`scopes_supported`):** El token de usuario requiere scopes como `"profile"`, `"email"` o `"phone"`; el de aplicación no los solicita.

### 3) Ejemplos de la Vida Diaria (Ajenos a la Facultad)

* **Caso 1: Spotify**
  * **Token de Usuario:** Cuando usás la app en tu celular para reproducir música; tu token le indica a la API quién sos para cargar tus playlists personales y verificar si tenés suscripción Premium.
  * **Token de Aplicación:** Cuando el servidor de Spotify ejecuta una tarea automática interna a la medianoche para actualizar y publicar la lista "Top 50 de Argentina".
* **Caso 2: Slack**
  * **Token de Usuario:** Cuando escribís un mensaje en un canal de chat; el token identifica tu nombre de usuario y roles en el equipo.
  * **Token de Aplicación:** Cuando un bot o webhook (ej. de Jira o GitHub) publica automáticamente una alerta en un canal al romperse el build de producción. El bot tiene sus propias credenciales de app sin asociarse a un humano.

---

## 🧭 8. ¿Cómo identificar y construir el Discovery Endpoint?

Para responder en el parcial o en una implementación real:

### 1. ¿Cómo se construye la URL?
Cualquier servidor compatible con OIDC tiene una ruta estándar que se monta al final de la URL del Realm. La regla para armarlo es:
`URL_DEL_REALM + /.well-known/openid-configuration`

En el caso de tu Keycloak:
* **Realm URL:** `https://labsys.frc.utn.edu.ar/aim/realms/dds-materia`
* **Discovery URL:** `https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/.well-known/openid-configuration`

### 2. ¿Cómo se identifica en el JSON de Keycloak?
Al ingresar a la URL de arriba en el navegador, se descarga el JSON que pegaste. Dentro de él, lo identificás buscando la propiedad **`token_endpoint`**:
```json
"token_endpoint": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia/protocol/openid-connect/token"
```

### 3. ¿Para qué le sirve a la Aplicación?
Cuando configuras una app de frontend (como un cliente en React/Angular) o un backend para que use Keycloak, no le tenés que configurar a mano 20 endpoints distintos (login, logout, token, introspect, etc.). 
Solo le pasás la **URL del Issuer (o la del Discovery)**, y la librería de seguridad se conecta a ella, lee el JSON y descubre sola a dónde ir a pedir los tokens de forma dinámica.

---

## 🔎 9. Justificación Visual del Token de Aplicación vs. Token de Usuario en el JSON

Para demostrar la diferencia analizando directamente las propiedades del documento de Discovery (`openid-configuration`):

| Propiedad en el JSON | Valor Relacionado | Tipo de Token | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **`grant_types_supported`** | `"client_credentials"` | 💻 **Aplicación** (M2M) | Permite que una aplicación se autentique directamente con su Client ID y Secret, sin intervención humana. |
| **`grant_types_supported`** | `"authorization_code"`, `"password"` | 👤 **Usuario** | Requiere el inicio de sesión interactivo de un usuario (ingreso de usuario y contraseña). |
| **`claims_supported`** | `"email"`, `"name"`, `"preferred_username"` | 👤 **Usuario** | Son claims de identidad humana. Solo viajan dentro de un token de usuario para describir a la persona. |
| **`scopes_supported`** | `"profile"`, `"email"`, `"phone"`, `"address"` | 👤 **Usuario** | Son ámbitos que solicitan aplicaciones clientes para leer datos del perfil del usuario final logueado. |

---

## 🔑 10. ¿Qué significa la lista `grant_types_supported`?

El array `"grant_types_supported"` en el JSON de Discovery define **todos los flujos de autenticación y autorización que el servidor de Keycloak tiene habilitados para este Realm**. 

Que encuentres `"authorization_code"` y `"client_credentials"` en la misma lista significa que **el mismo servidor puede actuar en ambos roles** de forma simultánea, dependiendo de qué tipo de cliente se conecte y qué flujo solicite.

### Desglose de los valores principales en tu JSON:

1. **`"authorization_code"` (Código de Autorización):**
   * **Para qué sirve:** Es el flujo estándar y más seguro para aplicaciones móviles y web (SPAs). Redirecciona al usuario a una pantalla de login de Keycloak y luego devuelve un código que se intercambia por un token de acceso.
2. **`"client_credentials"` (Credenciales de Cliente):**
   * **Para qué sirve:** Flujo utilizado para integraciones entre servidores (Machine-to-Machine). El microservicio cliente envía su Client ID y Secret directamente al token endpoint para recibir un token de aplicación.
3. **`"refresh_token"` (Token de Refresco):**
   * **Para qué sirve:** Permite que un cliente (app) solicite un nuevo token de acceso cuando el actual expire, sin obligar al usuario a volver a escribir sus credenciales.
4. **`"password"` (Contraseña directa o Resource Owner Password Credentials):**
   * **Para qué sirve:** El cliente envía el usuario y la contraseña directamente en el cuerpo de la petición. Está obsoleto y desaconsejado por seguridad (ya que la app cliente ve y manipula la contraseña del usuario), pero Keycloak lo mantiene por compatibilidad hacia atrás.
5. **`"implicit"` (Flujo Implícito):**
   * **Para qué sirve:** Un flujo antiguo de OAuth2 donde el token se devolvía directamente en la URL del navegador. Hoy está obsoleto en favor del flujo de código de autorización con PKCE.

---

## ⚠️ 11. Aclaración Conceptual Crítica: El JSON de Discovery NO contiene los tokens

Es un error conceptual común pensar que el JSON del Discovery Endpoint contiene los tokens de usuario o de aplicación. 

* **El JSON de Discovery es solo un "manual de instrucciones"**: Le dice a las aplicaciones *cómo* y *dónde* obtener o validar los tokens.
* **El token JWT real se genera en tiempo de ejecución**: Solo existe cuando la aplicación hace una petición POST al `token_endpoint` pasando las credenciales.

---

## 🧱 12. Estructura y Composición del JSON de Discovery

El JSON total está estructurado en 4 grandes bloques de información:

### 1. Endpoints (Rutas de Acción)
Indican las URLs a las que la aplicación debe conectarse para cada tarea:
* **`authorization_endpoint`**: La URL donde el usuario pone sus credenciales (login).
* **`token_endpoint`**: La URL donde se solicita/genera el token JWT.
* **`introspection_endpoint`**: La URL donde una API valida si un token sigue siendo válido.
* **`end_session_endpoint`**: La URL para cerrar sesión (logout).
* **`jwks_uri`**: La URL que expone las claves públicas para verificar la firma de los tokens JWT de manera local.

### 2. Flujos y Capacidades Soportadas (Políticas)
Definen las reglas de juego del servidor:
* **`grant_types_supported`**: Métodos habilitados para pedir tokens (ej: `client_credentials`, `authorization_code`).
* **`scopes_supported`**: Ámbitos de información permitidos (ej: `openid`, `profile`, `email`).
* **`response_types_supported`**: Qué espera recibir la app tras el login (ej: `code`, `token`, `id_token`).

### 3. Claims de Identidad
* **`claims_supported`**: Lista de atributos del usuario que pueden venir codificados dentro del token (ej: `email`, `preferred_username`, `name`).

### 4. Detalles Criptográficos y de Algoritmos
Definen cómo se firman y encriptan los tokens para asegurar que no sean falsificados:
* **`id_token_signing_alg_values_supported`**: Algoritmos de firma soportados (ej: `RS256`, `HS256`).
* **`id_token_encryption_alg_values_supported`**: Algoritmos de cifrado.

---

## 🏗️ 13. Criterio Práctico de Arquitectura: ¿Cuándo usar cada uno?

Tal como observamos, el **JSON de Discovery no te dice cuál token estás usando en tiempo real**, sino que lista qué flujos soporta el servidor para crearlos. La decisión de cuál usar depende de la arquitectura de la aplicación:

### 👤 Cuándo usar Token de Usuario (User Token)
* **Regla:** Siempre que la acción esté ligada a la presencia de un **humano interactuando con la interfaz**.
* **Escenario:** El frontend (web/mobile) hace una llamada a la API.
* **Por qué:** El token contiene los datos y roles de la persona (`preferred_username`, `email`, `roles: ["docente"]`). Esto le permite al backend:
  1. Saber quién es la persona para auditar la acción.
  2. Filtrar los datos en base a su identidad (ej. mostrar solo sus notas).
  3. Denegar el acceso si la persona no tiene el rol necesario.

### 💻 Cuándo usar Token de Aplicación (App Token)
* **Regla:** Cuando la comunicación es entre **sistemas autónomos sin intervención de un usuario** (M2M / Machine-to-Machine).
* **Escenario:** Un servidor backend habla con otro servidor backend o base de datos.
* **Por qué:** No hay un usuario logueado en ese flujo. El token solo representa los permisos de la aplicación en sí misma (`client_id: "servicio-facturacion"`).
* **Casos típicos:**
  1. Tareas programadas o scripts batch (ej: un cron que sincroniza stock a la madrugada).
  2. Webhooks automáticos (ej: notificaciones de pago enviadas de Stripe a tu backend).
  3. Microservicios internos comunicándose entre sí para tareas del sistema general.

---

## 🧩 14. Anatomía y Composición de un Token JWT

Un token JWT (JSON Web Token) se compone de **tres partes separadas por puntos (`.`)**:
`header.payload.signature`

1. **Header (Cabecera):** Especifica el algoritmo de firma y el tipo de token (ej. `{"alg": "RS256", "typ": "JWT"}`).
2. **Payload (Carga Útil):** Contiene los datos o atributos (**claims**). Esta es la sección donde se diferencian el de usuario y el de aplicación.
3. **Signature (Firma):** Se genera encriptando el Header y el Payload con la clave privada del servidor de identidad (como Keycloak) para evitar falsificaciones.

---

## ⚖️ 15. Comparación Práctica: Payload de Usuario vs. Aplicación

### A. Payload de un Token de Usuario (Ejemplo conceptual)
Contiene información que identifica a la persona que inició sesión:
```json
{
  "sub": "1503c1fb-0d2b-4956-94c9-a68eb82642fc", // ID del Usuario
  "iss": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia",
  "exp": 1786656907,
  "name": "dds-admin",
  "email": "admin@utn.edu.ar",
  "roles": ["view-realm", "manage-users"] // Roles de la persona
}
```

### B. Payload de un Token de Aplicación (Ejemplo M2M)
Solo identifica al sistema que realiza la petición; no existen claims de perfil personal:
```json
{
  "sub": "servicio-facturacion", // ID del Cliente (la App)
  "iss": "https://labsys.frc.utn.edu.ar/aim/realms/dds-materia",
  "exp": 1786656907,
  "roles": ["read-inventory", "write-invoices"] // Permisos de la App
}
```

---

## 🎬 16. Dos Ejemplos Simples de la Vida Real

### Ejemplo 1: Netflix
* **Token de Usuario:** Iniciás sesión en tu tele. El token identifica tu cuenta para cargar tu perfil de usuario, tu historial de películas vistas y tu lista de favoritos.
* **Token de Aplicación:** El backend de Netflix ejecuta un proceso a la noche que consulta una base de datos externa de directores y actores (ej. IMDb) para actualizar las fichas de las películas automáticamente.

### Ejemplo 2: Google Drive
* **Token de Usuario:** Entrás a un archivo de Docs. Tu token le dice al servidor tu mail de Gmail para validar si tenés permisos de "Editor" o "Lector" sobre ese documento específico.
* **Token de Aplicación:** Una herramienta de copias de seguridad externa sube automáticamente tus archivos locales a Drive a las 4 AM sin que estés conectado.

---

## 🔍 17. ¿Son `sub` y `roles` siempre iguales en todos los tokens?

No, definitivamente **no son iguales**. Aunque los nombres de las propiedades (las llaves) sean las mismas en el JSON del JWT, su contenido y significado cambian completamente según el tipo de token:

### 1. El campo `sub` (Subject - Sujeto)
* **En Token de Usuario:** Representa el identificador único del **usuario humano** (suele ser un UUID generado por Keycloak, ej. `"1503c1fb-0d2b-4956-94c9-a68eb82642fc"` o el nombre de usuario `"dds-admin"`).
* **En Token de Aplicación:** Representa el identificador único de la **aplicación cliente** (el Client ID registrado en Keycloak, ej. `"servicio-facturacion"`).

### 2. El campo `roles` (Roles/Permisos)
* **En Token de Usuario:** Son los **roles del negocio asignados a personas** (ej. `"alumno"`, `"docente"`, `"auditor"`). Determinan qué pantallas puede ver el usuario y qué acciones puede iniciar.
* **En Token de Aplicación:** Son **roles o permisos técnicos del sistema** (ej. `"read-inventory"`, `"api-writer"`, `"db-backup"`). No están asociados a personas, sino a los permisos de acceso técnico otorgados a la aplicación para comunicarse con otras APIs de forma automática.

---

## 🏷️ 18. ¿Qué son las Claims en un JWT?

En el contexto de JWT (JSON Web Tokens), una **claim** (que se traduce como *afirmación* o *declaración*) es simplemente **un par clave-valor** dentro de la sección del **Payload** del token. 

Representan declaraciones de información que el servidor de identidad (Keycloak) realiza sobre la entidad autenticada (sea un usuario o una app) y que el backend puede tomar como verdaderas porque el token está firmado digitalmente.

### Clasificación de las Claims según el Estándar (RFC 7519):

#### 1. Claims Registradas (Registered Claims)
Son llaves estándar predefinidas en la especificación de JWT. Aunque son opcionales, se recomiendan para interoperabilidad. Tienen nombres cortos de 3 letras:
* **`iss` (Issuer - Emisor):** El servidor que generó el token (ej. Keycloak).
* **`sub` (Subject - Sujeto):** A quién pertenece el token (ID de usuario o de cliente).
* **`aud` (Audience - Audiencia):** Para qué cliente u API está destinado este token.
* **`exp` (Expiration Time - Expiración):** La marca de tiempo (timestamp Unix) en la que el token vence y deja de ser válido.
* **`iat` (Issued At - Emitido en):** Cuándo se creó el token.

#### 2. Claims Públicas (Public Claims)
Claims adicionales estándar definidas por protocolos sobre JWT, como **OpenID Connect (OIDC)**, para representar atributos comunes de perfil:
* **`email`**: Dirección de correo electrónico.
* **`name`**: Nombre completo del usuario.
* **`preferred_username`**: Nombre de usuario del logueo.

#### 3. Claims Privadas o Personalizadas (Private/Custom Claims)
Son propiedades creadas a medida para las necesidades específicas de tu aplicación y tu negocio:
* **Ejemplo UTN:** `{"legajo": "84512", "plan_estudios": "2008", "comision": "3K1"}`.

---
*Nota registrada automáticamente en el Baúl de Obsidian UTN.*
