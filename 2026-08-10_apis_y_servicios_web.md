# Conceptos Fundamentales: APIs y Servicios Web
**Rama:** [[Hub_IAEW|IAEW]]

**Materia:** Integración de Aplicaciones en Entorno Web (UTN FRC)  
**Tags:** #materia/iaew
**Fecha:** 2026-08-10  
**Categoría:** Arquitectura e Integración Web  

---

## 🔌 1. ¿Qué es una API (Application Programming Interface)?

Una **API** (Interfaz de Programación de Aplicaciones) es un **conjunto de reglas, funciones y protocolos** que permite que dos programas de software se comuniquen e intercambien información de forma estandarizada, **sin necesidad de conocer la lógica interna del otro sistema**.

### 🍽️ La Analogía del Menú del Restaurante:
- **El Menú:** Es la API. Te muestra exactamente qué platillos puedes solicitar (endpoints) y qué especificaciones requieren (parámetros de entrada).
- **El Cliente:** Tú pides la comida siguiendo las reglas del menú.
- **La Cocina:** Es el backend o servidor. No necesitas saber cómo cocina el chef o cómo está estructurada la cocina; solo pides mediante la API y recibes el resultado.

> **Ámbito:** El concepto de API es amplio. Existen APIs dentro del mismo sistema operativo (ej: API de la cámara en Android/iOS), APIs en librerías de código (ej: API de ordenamiento en Java/C#) y **APIs Web**.

---

## 🌐 2. ¿Qué es un Servicio Web (Web Service)?

Un **Servicio Web** es un **tipo específico de API** que permite la comunicación entre dos sistemas a través de una **red (Internet o Intranet) utilizando el protocolo HTTP/HTTPS**.

Un servicio web expone funciones en un servidor para que clientes externos (aplicaciones móviles, navegadores web u otros servidores) consuman sus servicios enviando peticiones y recibiendo datos estructurados (generalmente en **JSON** o **XML**).

---

## ⚔️ Diferencia Clave: API vs. Servicio Web

> **Regla de oro:** *"Todos los Servicios Web son APIs, pero no todas las APIs son Servicios Web."*

| Característica | API | Servicio Web (Web Service) |
| :--- | :--- | :--- |
| **Requiere Red (Internet)** | No necesariamente (puede ser local dentro del sistema) | **Sí, siempre** utiliza red e interfaces HTTP/HTTPS |
| **Arquitectura** | Concepto general de interfaz de código | Implementación orientada a comunicación cliente-servidor web |
| **Ejemplo** | API de lectura de archivos local, Win32 API, `Math.floor()` | API REST de Mercado Pago, API de la UTN FRC, API de Google Maps |

---

## 🛠️ Principales Estándares de Servicios Web en la Industria

1. **REST (Representational State Transfer):**
   - El estándar más utilizado en la web moderna. Utiliza verbos HTTP (GET, POST, PUT, DELETE) y datos en formato **JSON**.
2. **SOAP (Simple Object Access Protocol):**
   - Estándar clásico basado estrictamente en **XML** y contratos WSDL. Muy utilizado en bancos, entidades financieras y organismos de gobierno.
3. **GraphQL:**
   - Creado por Meta. Permite al cliente solicitar en una sola consulta únicamente los campos exactos que necesita.
4. **gRPC:**
   - Creado por Google. Utiliza HTTP/2 y Protocol Buffers para comunicación entre microservicios a ultra alta velocidad.

---

## 🛡️ 5. APIs como Guardianas de Reglas de Negocio (CRUD vs. Operaciones de Dominio)

> [!NOTE]
> **Principio de Diseño:** *"Una API no solo guarda y recupera datos; también protege las invariantes y reglas de negocio del dominio."*

### Comparativa: CRUD vs. Operación de Negocio
| Tipo de Endpoint | Ejemplo | Propósito y Comportamiento |
| :--- | :--- | :--- |
| **CRUD Estándar** | `GET /productos`<br>`POST /productos` | Lectura o alta directa de recursos en el catálogo. |
| **Operación de Negocio** | `POST /pedidos/:id/confirmar` | Ejecuta **transiciones de estado**, valida stock disponible, calcula totales y previene operaciones duplicadas. |

### Semántica de Códigos de Estado HTTP en APIs REST
- **`200 OK`:** Petición procesada exitosamente.
- **`201 Created`:** Recurso nuevo creado satisfactoriamente en el servidor.
- **`400 Bad Request`:** Petición malformada o faltan campos obligatorios en el payload.
- **`404 Not Found`:** El identificador del recurso no existe en el sistema.
- **`409 Conflict`:** La petición es sintácticamente válida pero **entra en conflicto con el estado actual del recurso en el negocio** (ej: reintentar confirmar un pedido que ya fue confirmado o intentar comprar sin stock).
- **`500 Internal Server Error`:** Falla interna o bug no controlado en el servidor. **Nunca se debe responder 500 ante un error de validación de negocio del cliente.**

