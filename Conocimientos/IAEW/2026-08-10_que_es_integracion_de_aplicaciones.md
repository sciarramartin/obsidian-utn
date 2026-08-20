# Concepto: ¿Qué significa Integrar Aplicaciones en Entornos Web?

**Materia:** Integración de Aplicaciones en Entorno Web (UTN FRC)  
**Materia Hub:** [[2026-08-10_integracion_aplicaciones_web_utn_frc|Integración de Aplicaciones Web (IAEW)]]
**Tags:** #materia/iaew
**Fecha:** 2026-08-10  
**Categoría:** Arquitectura de Software  

---

## 💡 Definición Fundamental
En ingeniería de software y desarrollo web, **integrar aplicaciones** significa **conectar sistemas heterogéneos y autónomos** (escritos en diferentes lenguajes, que usan distintas bases de datos o están alojados en diferentes servidores) para que puedan **comunicarse, intercambiar datos y coordinar flujos de trabajo** de forma fluida, segura y transparente.

---

## 🏢 ¿Por qué es crucial en la industria real?
En el mundo real, una empresa u organización nunca opera con un solo programa aislado. Por ejemplo, en un sistema de comercio electrónico:
1. La **Tienda Web (React/Next.js)** interactúa con el usuario.
2. El **Servicio de Pagos** se integra con **Mercado Pago / Stripe** (vía API REST y Webhooks).
3. El **Sistema de Inventario y Logística** (ERP en Java/Python) descuenta el stock en tiempo real.
4. El **Servicio de Notificaciones** envía un email (vía SendGrid) y un WhatsApp (vía Twitch/Twilio).
5. El **Servicio de Facturación** genera la factura electrónica fiscal (vía AFIP/API Fiscal).

**Integrar** es construir los puentes digitales entre todas estas piezas independientes.

---

## 🛠️ Principales Mecanismos y Patrones de Integración
- **APIs REST y Servicios Web:** Intercambio de datos formateados (JSON/XML) a través del protocolo HTTP/HTTPS.
- **Webhooks (Notificaciones por eventos):** Un servidor emite un callback HTTP cuando ocurre un evento específico (ej. "Pago aprobado").
- **Mensajería Asíncrona (Event-Driven Architecture):** Uso de brokers de mensajes como **RabbitMQ** o **Apache Kafka** para procesar tareas pesadas o enviar eventos sin bloquear a los usuarios.
- **WebSockets / Real-Time:** Comunicación bidireccional continua (ej. seguimiento de entregas en mapa, chats, notificaciones en vivo).
- **API Gateways:** Enrutamiento centralizado, autenticación (OAuth2 / JWT), control de tráfico (rate limiting) y transformación de protocolos.
- **Bases de Datos e Intercambio de Datos:** ETLs, sincronizaciones y pipelines de datos.

---

## 🎯 Objetivo Pedagógico de la Materia
El objetivo de la materia en la **UTN FRC** es aprender a **diseñar e implementar las capas de middleware, servicios REST/gRPC/GraphQL, seguridad y arquitecturas cliente-servidor** necesarias para conectar aplicaciones modernas en la nube de forma robusta, escalable y mantenible.
