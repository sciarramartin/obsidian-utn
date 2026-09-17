# Conclusión de la Arquitectura de Seguridad: Keycloak, JWT y Validación Local
**Rama:** [[Hub_IAEW|IAEW]]
**Tags:** #materia/iaew #seguridad #jwt #keycloak #glosario #arquitectura #stateless  
**Fecha:** 2026-08-20  
**Categoría:** Síntesis y Glosario Maestro  

---

## 🎯 1. Conclusión del Ciclo de Seguridad

En este laboratorio se integraron los tres pilares de la autenticación moderna:

```
                  ┌────────────────────────────────────────┐
                  │          1. KEYCLOAK (IdP)             │
                  │   Genera claves y emite el JWT         │
                  └───────────────────┬────────────────────┘
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
    ┌─────────────────────┐                       ┌─────────────────────┐
    │     2. POSTMAN      │                       │   3. APP NODE.JS    │
    │  Pide token y hace  │                       │  Descarga claves y  │
    │ introspección remota│                       │  valida firma LOCAL │
    └─────────────────────┘                       └─────────────────────┘
```

1. **Gestor Central de Identidad (Keycloak):** Configuración de cliente confidencial (`client_credentials`) para comunicación Máquina a Máquina (M2M).
2. **Pruebas y Automatización (Postman):** Ejecución de solicitudes `/token` e `/introspect` para verificar el ciclo de vida del token en tiempo real.
3. **Validación Autónoma en Backend (Node.js + `jose`):** Verificación matemática de la firma criptográfica en memoria con las claves públicas de `/certs` (JWKS), logrando arquitectura 100% *Stateless*.

---

## 🌍 2. ¿Para qué sirve todo esto en la Industria del Software?

### ❌ El problema tradicional (Monolitos con Estado):
* Las aplicaciones manejaban sus propias tablas de usuarios en bases de datos locales.
* La sesión se almacenaba en la memoria del servidor (*Cookies / Session ID*).
* **Limitaciones:** Imposible de escalar en arquitecturas de microservicios o aplicaciones móviles distribuidas sin duplicar código y generar puntos críticos de falla.

### ✅ La solución moderna (Keycloak + JWT Stateless):
* **Centralización:** Keycloak es el único guardián de credenciales y emisor de firmas digitales.
* **Pasaporte Digital Autofirmado:** El JWT viaja en la cabecera `Authorization: Bearer <Token>`. Las APIs no consultan a la base de datos de Keycloak en cada petición; solo verifican matemáticamente la firma en memoria con la clave pública.
* **Beneficios Directos:**
  * **0 ms de latencia de red en autenticación.**
  * **Eliminación del cuello de botella y del punto único de falla (SPOF).**
  * **Independencia tecnológica entre microservicios (Node.js, Java, Python, Go).**

---

# 📚 3. Glosario Maestro de Conceptos

### 🏛️ Servidores y Descubrimiento
* **IdP (*Identity Provider* - ej. Keycloak):** Servidor centralizado responsable de autenticar identidades y emitir tokens firmados para los sistemas y usuarios.
* **Discovery OIDC (`/.well-known/openid-configuration`):** Documento JSON estandarizado que expone automáticamente todas las URLs, endpoints y capacidades criptográficas del servidor de identidad.

---

### 🔑 Tokens y Criptografía
* **JWT (*JSON Web Token* - RFC 7519):** Token compacto y autocontenido compuesto por tres partes (*Header.Payload.Signature*) que viaja en la cabecera `Authorization: Bearer`.
* **JWKS (*JSON Web Key Set*):** Conjunto estandarizado de claves criptográficas públicas publicado por el IdP en formato JSON.
* **`jwks_uri` (`/certs`):** URL del IdP donde las APIs descargan el JWKS para obtener las claves públicas.
* **`kid` (*Key ID*):** Identificador presente en el *Header* del JWT que indica con cuál clave pública del JWKS debe verificarse la firma.
* **Token Opaco (*Reference Token*):** Cadena de texto aleatoria (como un UUID) que no contiene datos legibles en su interior, obligando siempre a consultar al IdP para conocer su contenido.
* **Tokens de Vida Corta (`exp`):** Access Tokens con tiempo de expiración breve (5 a 15 min) para minimizar la ventana de riesgo ante robos o revocaciones no detectadas.

---

### ⚡ Métodos de Validación
* **Validación Local (*Stateless Verification*):** Verificación matemática y autónoma que hace la API en memoria con la clave pública (JWKS). Es ultra rápida, no genera tráfico contra el IdP y valida firma y expiración en microsegundos.
* **Introspección de Tokens (RFC 7662 / `/token/introspect`):** Consulta HTTP `POST` remota que hace la API al IdP para verificar en tiempo real si el token sigue activo o fue revocado en la base de datos del servidor.
* **Claim `"active"`:** Campo booleano (`true`/`false`) que devuelve el endpoint de introspección para indicar si el token es válido en ese instante.
* **Token *Stateless* vs. *Stateful*:**
  * *Stateless (Sin estado):* La API valida el JWT por su cuenta sin almacenar sesiones ni consultar al servidor.
  * *Stateful (Con estado):* Requiere consultar el estado de la sesión centralizada en el IdP en cada petición.

---

### 🏗️ Arquitectura y Rendimiento
* **Latencia / Overhead de Red:** Demora que se produce al enviar peticiones HTTP por la red. La validación local reduce esta latencia a cero milisegundos de red.
* **Punto Único de Falla (*Single Point of Failure - SPOF*):** Componente que si cae, detiene todo el sistema. La validación local evita que una caída de Keycloak bloquee las peticiones a las APIs si los tokens ya están emitidos.
* **Cuello de Botella (*Bottleneck*):** Saturación de un servidor central ante alto tráfico. La validación local distribuye la carga entre todas las APIs en lugar de sobrecargar al IdP.
* **Revocación de Tokens (*Token Revocation*):** Anulación manual o inmediata de un token antes de su vencimiento natural (por cierre de sesión o cambio de password).
* **Microservicios (*Microservices Architecture*):** Sistemas distribuidos en múltiples servicios independientes donde la validación local es obligatoria para no colapsar el IdP con llamadas cruzadas entre servicios.

---

## 📝 [2026-09-15] - Profundización: Escalabilidad y Cuellos de Botella en Login Casero con JWT

### ❓ La Pregunta Arquitectónica:
*¿Si se utiliza únicamente JWT para un sistema de autenticación "casero" (implementado en el propio backend contra la base de datos relacional/NoSQL), existiría cuello de botella al escalar a muchos usuarios concurrentes?*

---

### 🔍 Diagnóstico por Etapas del Ciclo de Vida

Para analizar dónde se produce el cuello de botella, se debe desglosar el flujo en dos momentos completamente distintos: **El Login (Emisión)** y **El Consumo de APIs (Validación)**.

```
MOMENTO 1: LOGIN (POST /auth/login)
Cliente ──[Credenciales]──► Backend (Node/Go/Java) ──[SELECT]──► Base de Datos
                                │ (Bcrypt / Argon2)
                                └─► ¡CUELLO DE BOTELLA EN CPU!

MOMENTO 2: PETICIONES A LA API (GET /productos)
Cliente ──[Bearer JWT]──► Backend ──(Verifica firma en RAM)──► Responde
                                │ (Stateless puro: NO va a BD)
                                └─► ¡ESCALABILIDAD LINEAL HORIZONTAL!
```

---

### 💥 1. Momento de Emisión (`/login`): El Verdadero Cuello de Botella

Si miles de usuarios intentan iniciar sesión en simultáneo (picos de tráfico, inicio de jornada, eventos masivos):

1. **Cuello de Botella de CPU (Bcrypt / Argon2):**
   * Por diseño criptográfico y seguridad anti-fuerza bruta, los algoritmos de hashing de contraseñas (*Bcrypt*, *Argon2id*, *PBKDF2*) son deliberadamente **lentos y demandantes de CPU** (CPU-bound).
   * Un *cost factor* estándar (ej. 10 a 12 en Bcrypt) tarda entre **100 ms y 300 ms de uso de CPU al 100% en un hilo**.
   * Si entran 1.000 peticiones concurrentes de login por segundo en un servidor de 4 u 8 cores, el CPU se satura al 100% de inmediato, encolando peticiones y disparando los timeouts HTTP, **mucho antes de que la base de datos empiece a sufrir**.
2. **Saturación del Connection Pool de la BD:**
   * Aunque una consulta `SELECT * FROM users WHERE email = ?` con índice tarda menos de 1 ms, si el pool de conexiones (ej. 20 conexiones máximas en Postgres/MySQL) se bloquea esperando resolver hilos o workers saturados, las peticiones mueren por *Connection Pool Starvation*.
   * Si el endpoint `/login` comparte la misma base de datos y pool que las operaciones críticas del negocio (ej. pagos, pedidos), el colapso del login arrastra a toda la aplicación.

---

### 🛡️ 2. Momento de Validación (Consumo de la API): ¿Hay cuello de botella en BD?

Aquí es donde se define si el diseño escala o colapsa:

#### Caso A: JWT Stateless Puro (Diseño Correcto)
* **Comportamiento:** En cada request, el middleware solo ejecuta:
  ```javascript
  // Validación 100% matemática y en memoria RAM (microsegundos)
  const decoded = jwt.verify(token, SECRET_KEY);
  req.user = decoded;
  next();
  ```
* **Impacto en BD:** **CERO consultas a la base de datos.**
* **Escalabilidad:** Escala casi de forma infinita en horizontal. Se pueden levantar 20 réplicas del backend detrás de un Load Balancer (Nginx/AWS ALB) y ninguna consultará al motor de BD para autenticar.

#### Caso B: El Antipatrón "Pseudo-JWT" (Error Común en Implementaciones Caseras)
* **Comportamiento:**
  ```javascript
  const decoded = jwt.verify(token, SECRET_KEY);
  // ❌ ANTIPATRÓN: Buscar al usuario en la BD en CADA request protegido
  const user = await db.query('SELECT * FROM users WHERE id = $1', [decoded.sub]);
  ```
* **Impacto en BD:** **CATASTRÓFICO.** Si 10.000 usuarios hacen 5 requests por segundo, la base de datos recibe **50.000 queries/segundo** solo para comprobar si el usuario existe. Se destruyó por completo el propósito *stateless* del JWT y la base de datos colapsa por I/O, locks y agotamiento de conexiones.

#### Caso C: El Problema de la Revocación Inmediata (Blacklist)
* El talón de Aquiles del JWT casero es el **Logout** o la baja de usuario: el token emitido sigue siendo válido hasta que expira (`exp`).
* Si para solucionar esto se crea una tabla en SQL (`blacklisted_tokens`) y se consulta en cada petición:
  `SELECT 1 FROM blacklisted_tokens WHERE token_id = ?`
  se vuelve a reintroducir la base de datos en el camino crítico de cada request.
* **Solución de Arquitectura:** Utilizar **Redis** en memoria con expiración automática (TTL igual al tiempo de vida restante del token) para validar listas negras o versionado de usuario (`token_version`).

---

### 📊 Cuadro Comparativo: Cuello de Botella según Arquitectura

| Componente / Escenario | Login Casero (JWT Puro) | Login Casero ("Pseudo-JWT" con BD) | Sesiones Tradicionales (Stateful) | IdP Especializado (Keycloak / Auth0) |
| :--- | :--- | :--- | :--- | :--- |
| **Validación de Token/Sesión** | En RAM (0 ms de BD) | En BD SQL en cada request | En BD SQL o Redis | Clave pública JWKS en RAM (0 ms IdP) |
| **Cuello de botella principal** | **CPU** en `/login` (Bcrypt) | **Base de Datos** (saturación I/O) | **Almacén de Sesiones** (BD/Redis) | Clúster IdP aislado (no afecta al negocio) |
| **Escalabilidad Horizontal** | ⭐⭐⭐⭐⭐ (Excelente) | ⭐ (Pésima) | ⭐⭐ (Requiere Redis distribuido) | ⭐⭐⭐⭐⭐ (Desacoplado) |
| **Revocación Inmediata** | Compleja (Requiere Redis) | Sencilla (Flag en BD, pero costoso) | Sencilla (Borrar sesión) | Manejada por Backchannel / Introspección |
| **Aislamiento de Falla** | Si cae `/login`, el resto opera | Si cae la BD, cae TODO | Si cae el almacén, cae TODO | Si cae el IdP, los JWT vigentes siguen funcionando |

---

### 🚀 Buenas Prácticas para Evitar el Cuello de Botella en un Login Casero

1. **Tokens de Acceso de Vida Corta (`exp` de 5 a 15 min):** Minimiza la necesidad de consultar la base de datos para revocar accesos en caliente.
2. **Refresh Tokens en Base de Datos / Redis:** Solo se consulta la base de datos cuando el Access Token vence (1 vez cada 15 min por usuario, en lugar de 1 vez por petición).
3. **Aislar el cómputo de contraseñas:** Ejecutar el endpoint de `/login` en un microservicio independiente o contenedor aislado para que los picos de CPU por Bcrypt/Argon2 no dejen sin recursos a los endpoints de negocio.
4. **Rate Limiting Estricto en `/login`:** Proteger el endpoint contra ataques de fuerza bruta y DDoS que agotan el CPU del servidor (ej. máximo 5 intentos por IP por minuto).
5. **No buscar el usuario en la BD en cada petición:** Si se requieren los roles o permisos, empaquetarlos como *claims* dentro del *payload* del JWT (`roles: ["admin", "ventas"]`) al momento de firmarlo.
6. **Usar Redis para eventos de invalidación global:** Si se necesita invalidar todos los tokens de un usuario al cambiar contraseña, almacenar en caché un `token_version` o marca temporal `password_changed_at` y verificarlo solo contra memoria volátil.
