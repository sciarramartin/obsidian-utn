# Conceptos Fundamentales: APIs y Servicios Web

**Materia:** Integración de Aplicaciones en Entorno Web (UTN FRC)  
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
