# Patrón de Arquitectura: Backend For Frontend (BFF)

**Materia:** Integración de Aplicaciones en Entorno Web (UTN FRC)  
**Fecha:** 2026-08-10  
**Categoría:** Patrones de Integración y Arquitectura Web  

---

## 💡 ¿Qué es el Patrón BFF (Backend For Frontend)?
El **Patrón BFF** consiste en crear una capa de backend específica y dedicada para cada tipo de cliente frontend (por ejemplo, un BFF para la aplicación Web, un BFF para la App Móvil iOS/Android, y un BFF para integración con Terceros).

En lugar de que todos los clientes consuman una única API generalista o llamen a decenas de microservicios directamente, **cada frontend habla con su propio BFF**, y el BFF se encarga de orquestar la comunicación con los microservicios internos.

---

## ❓ ¿Por qué surge y qué problema resuelve?

### El problema:
- **Diferentes necesidades de UI/UX:** Una App Móvil necesita consumir menos datos (ahorro de batería y datos móviles) y prefiere 1 sola llamada comprimida. Una aplicación Web en desktop tiene mayor ancho de banda y necesita información detallada.
- **Acoplamiento excesivo:** Si los microservicios internos intentan adaptarse a los caprichos de cada diseño de UI, los microservicios se vuelven complejos y difíciles de mantener.
- **Múltiples llamadas cliente-servidor (Over-fetching / Under-fetching):** Para renderizar una sola pantalla en la App móvil, el teléfono tendría que hacer 5 llamadas consecutivas a microservicios distintos a través de la red móvil (latencia alta).

---

## 🏗️ Diagrama de Arquitectura BFF

```
[ App Móvil (iOS/Android) ]      [ App Web (Desktop/Browser) ]
            │                                  │
            ▼                                  ▼
   ┌─────────────────┐                ┌─────────────────┐
   │    BFF Móvil    │                │     BFF Web     │
   └────────┬────────┘                └────────┬────────┘
            │                                  │
            └───────────────┬──────────────────┘
                            │ (Red Interna)
                            ▼
        ┌───────────────────────────────────────┐
        │       Microservicios Internos         │
        │  [Usuarios]  [Catálogo]  [Pedidos]   │
        └───────────────────────────────────────┘
```

---

## ⚙️ Funciones Principales de un BFF
1. **Agregación de Datos (Composition):** El BFF llama a 3 microservicios internos en paralelo y combina las respuestas en un único objeto JSON listo para la UI.
2. **Transformación y Filtrado de Payloads:** Elimina campos innecesarios para el móvil y adapta formatos de fecha, moneda o idiomas.
3. **Manejo de Autenticación y Sesiones:** Convierte cookies del navegador en tokens JWT para los microservicios backend.
4. **Caché y Resiliencia:** Implementa patrones como *Circuit Breaker*, límites de tasa (*rate limiting*) y caché optimizada para la interfaz cliente.

---

## 🎓 Relación con la Materia (Integración Web)
En **Integración de Aplicaciones en Entorno Web**, el patrón BFF es clave para comprender cómo desacoplar la capa de presentación (Frontend) de los dominios de negocio (Microservicios/Backend) garantizando seguridad, alto rendimiento y escalabilidad en sistemas distribuidos.
