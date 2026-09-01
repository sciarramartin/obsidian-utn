# Protocolo LDAP: Servicios de Directorio e Integración con OIDC
**Rama:** [[Hub_IAEW|IAEW]]
**Tags:** #materia/iaew #seguridad #ldap #directorio #active-directory #oidc #keycloak #utn  
**Fecha:** 2026-08-27  
**Categoría:** Seguridad e Infraestructura  

---

## 🌳 1. ¿Qué es LDAP (Lightweight Directory Access Protocol)?

**LDAP** es un protocolo estándar abierto de nivel de aplicación sobre **TCP/IP** utilizado para acceder, buscar y administrar información estructurada de usuarios, grupos, permisos y dispositivos en un **Directorio Jerárquico**.

### Estructura Jerárquica del Árbol (DIT - Directory Information Tree):
```text
dc=empresa,dc=com (Domain Component)
 ├── ou=usuarios (Organizational Unit)
 │    ├── cn=Juan Pérez
 │    └── cn=María Gómez
 └── ou=grupos
      └── cn=Administradores
```

!jxplorer_ldap_view.png
*Vista de un repositorio LDAP en JXplorer (`uid=jdoe,ou=users,dc=example,dc=com`).*


---

## 🔌 2. Puertos de Red Estándar

| Puerto | Protocolo | Tipo de Conexión |
| :--- | :--- | :--- |
| **`389/TCP`** | **LDAP** | Conexión estándar sin cifrar (puede elevarse mediante `StartTLS`). |
| **`636/TCP`** | **LDAPS** | Conexión segura cifrada con SSL/TLS desde el inicio de la conexión. |

---

## 📋 3. Atributos Fundamentales en LDAP

| Atributo | Nombre | Descripción y Ejemplo |
| :--- | :--- | :--- |
| **`dn`** | *Distinguished Name* | Ruta absoluta y única del objeto en el árbol (ej: `uid=jperez,ou=usuarios,dc=empresa,dc=com`). |
| **`cn`** | *Common Name* | Nombre común del objeto (ej: `Juan Pérez` o `Administradores`). |
| **`uid`** | *User ID* | Identificador único de inicio de sesión (ej: `jperez`). |
| **`sn`** | *Surname* | Apellido del usuario (ej: `Pérez`). |
| **`givenName`** | *Given Name* | Nombre de pila del usuario (ej: `Juan`). |
| **`mail`** | *Email Address* | Correo corporativo (ej: `jperez@empresa.com`). |
| **`memberOf`** | *Group Membership* | Lista de grupos a los que pertenece el usuario. |
| **`userPassword`**| *User Password* | Hash de la contraseña del usuario. |
| **`objectClass`** | *Object Class* | Tipo de objeto (`inetOrgPerson`, `posixAccount`). |

---

## 🛠️ Herramientas para Administrar y Explorar LDAP:
1. **JXplorer:** Cliente GUI libre en Java para explorar y modificar árboles DIT.
2. **Apache Directory Studio:** Herramienta profesional basada en Eclipse para administración y esquemas.
3. **Active Directory Users and Computers (ADUC):** Administrador nativo de Microsoft Windows Server.
4. **phpLDAPadmin:** Panel web para gestión de directorios sobre el navegador.
5. **`ldapsearch` / `ldapmodify`:** Herramientas CLI nativas de terminal en Linux/Unix.

---

## 🔄 4. Relación e Integración Arquitectónica: LDAP vs. OIDC

En entornos corporativos modernos, **LDAP y OIDC colaboran estrechamente**:

```
[ Frontend / SPAs / APIs ]
             │
             │ (OIDC / OAuth 2.0 sobre HTTPS con JSON/JWT)
             ▼
┌──────────────────────────────────────────────┐
│ Servidor OIDC (Keycloak / Azure AD / Auth0)  │
│ - Expone endpoints REST (/auth, /token)      │
│ - Emite Tokens JWT firmados criptográficamente│
└──────────────────────────────────────────────┘
             │
             │ (LDAP / LDAPS sobre TCP/636 con User Federation)
             ▼
┌──────────────────────────────────────────────┐
│ Directorio Central (Active Directory / LDAP) │
│ - Repositorio corporativo de usuarios y roles │
└──────────────────────────────────────────────┘
```

### Comparativa: LDAP vs. OIDC
| Aspecto | LDAP | OIDC (OpenID Connect) |
| :--- | :--- | :--- |
| **Tipo de protocolo** | Consulta y autenticación de directorio | Autenticación federada basada en tokens |
| **Transporte** | TCP/IP directo (puertos 389/636) | HTTP/HTTPS (RESTful) |
| **Modelo de datos** | Jerárquico (Árbol DIT con DNs) | JSON / Claims en JWT |
| **Ámbito de uso** | Red interna, VPNs, Active Directory corporativo | Aplicaciones web, SPAs, APIs móviles, SaaS |
| **Rol en la arquitectura** | **Almacén de identidad (*Backend*)** | **Capa de federación y tokens (*Frontend de Identidad*)** |

---

## ⚖️ 5. ¿Por qué usar LDAP y no una Base de Datos Tradicional (PostgreSQL/MongoDB)?

1. **Patrón de Carga Read-Heavy (99% Lecturas vs. 1% Escrituras):**
   - En una empresa, las identidades y permisos se consultan miles de veces por segundo (logins, accesos a WiFi, VPN, emails), mientras que las modificaciones ocurren rara vez (cambio de contraseña trimestral o alta de nuevo empleado).
   - LDAP está optimizado desde su núcleo para **búsquedas y lecturas ultra-rápidas en memoria**, superando a las bases de datos relacionales tradicionales para este propósito.
2. **Estándar Universal "Plug & Play":**
   - Cualquier dispositivo o software corporativo (VPNs de Cisco, routers, impresoras de red, Linux PAM, Windows, Jira, GitLab) ya viene de fábrica preparado para autenticar contra LDAP sin programar adaptadores a medida.
3. **Estructura Jerárquica Natural (Organigrama):**
   - Modela directamente la jerarquía empresarial (País $\rightarrow$ Sede $\rightarrow$ Departamento $\rightarrow$ Grupos $\rightarrow$ Usuarios) sin requerir tablas intermedias ni consultas recursivas complejas de SQL.
4. **Políticas Centralizadas a nivel Sistema Operativo:**
   - Permite aplicar directivas de seguridad globales (bloqueo tras $N$ intentos fallidos, caducidad de contraseñas, políticas de grupo GPO).

---

## 🛡️ 6. Inconsistencia de Datos y Sincronización (LDAP vs. Bases de Datos de Aplicaciones)

> [!WARNING]
> **El Problema de "Datos Obsoletos" (*Stale Data*):**  
> Si Recursos Humanos modifica el apellido de un empleado, le cambia el rol o lo despide en LDAP, la base de datos de una aplicación web que guarde una copia local podría quedar desactualizada o conceder accesos indebidos.

### Estrategias de Arquitectura para Resolver la Inconsistencia:
1. **Identificadores Inmutables (`sub` o `UUID`):**
   - Nunca usar el `email` o el `username` como clave primaria de la base de datos local. Usar el identificador inmutable (`sub` del JWT o `objectGUID` de LDAP).
2. **Sincronización Just-In-Time (JIT) en cada Login:**
   - Cada vez que el usuario se loguea vía OIDC, la aplicación recibe el JWT fresco con los claims actuales y ejecuta un *Upsert* (actualizar datos locales de perfil automáticamente).
3. **Sincronización Asíncrona por Eventos / Protocolo SCIM:**
   - Mediante el estándar **SCIM (RFC 7643/7644)** o webhooks del IdP, las bajas de usuarios se propagan en tiempo real a las aplicaciones para revocar sesiones activas inmediatamente.
4. **Sincronización Periódica de Keycloak (User Federation Sync):**
   - Keycloak ejecuta un cronjob (*Periodic Changed Users Sync*) que consulta periódicamente a LDAP para mantener su caché interna al día.

---
*Conexiones conceptuales:*
- OpenID Connect y Flujo PKCE
- Protocolo SAML 2.0 y SSO
- Keycloak y AIM

