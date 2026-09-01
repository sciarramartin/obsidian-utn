# Contenedores Docker, MongoDB y Persistencia en Integración Web
**Rama:** [[Hub_IAEW|IAEW]]
**Tags:** #materia/iaew #utn #sistemas #docker #mongodb #bases-de-datos #devops  
**Fecha:** 2026-08-24  
**Categoría:** Infraestructura, DevOps y Persistencia  

---

## 📦 1. ¿Qué es un Contenedor Docker?

Un **contenedor Docker** es una unidad estándar de software que empaqueta el código y todas sus dependencias para que la aplicación se ejecute de forma rápida, aislada y confiable en cualquier entorno informático.

### 🖼️ Imagen vs. 📦 Contenedor:
* **Imagen Docker (`mongo:7`):** Es el plano, plantilla o "receta congelada" inmutable que contiene el sistema de archivos, librerías y el binario del motor de base de datos.
* **Contenedor Docker (`iaew-mongo`):** Es la instancia viva en ejecución creada a partir de esa imagen. Es un proceso aislado dentro del sistema operativo anfitrión (*host*).

---

## 🔌 2. Mapeo de Puertos (Port Forwarding)

Como los contenedores residen en su propia red virtual aislada, necesitan un puente hacia el host para recibir tráfico de nuestras aplicaciones locales:

```
Máquina Anfitrión (Windows / Host)             Contenedor Docker (iaew-mongo)
┌─────────────────────────────────┐           ┌───────────────────────────────┐
│ Aplicación Node.js (app.js)     │           │ Motor MongoDB (daemon mongod) │
│                                 │           │                               │
│ Conexión hacia:                 │  (Puente) │ Escucha internamente en:      │
│ localhost:27017 ────────────────┼──────────▶│ puerto 27017                  │
└─────────────────────────────────┘           └───────────────────────────────┘
```

* **Comando clave:** `docker run --name iaew-mongo -p 27017:27017 -d mongo:7`
  * `-p 27017:27017`: Redirige el puerto local `27017` del host al puerto `27017` del contenedor.
  * `-d` (*detached*): Ejecuta el contenedor en segundo plano.
  * `--name`: Asigna un nombre identificador único al contenedor.

---

## 🍃 3. ¿Por qué MongoDB en Integración de Aplicaciones?

**MongoDB** es una base de datos NoSQL orientada a **Documentos** (formato BSON, representación binaria de JSON).

### Ventajas en Integración Web:
1. **Esquema Flexible:** Permite modelar estructuras jerárquicas complejas (como pedidos con arreglos anidados de ítems) sin necesidad de múltiples uniones (*JOINs*) relacionales.
2. **Homogeneidad de Datos:** Tanto la API Express como la base de datos hablan el mismo idioma de datos (JSON).
3. **Escalabilidad y Rendimiento:** Excelente velocidad de lectura/escritura para catálogos y transacciones de e-commerce.

---

## 🔐 4. Configuración Segura con Variables de Entorno

Para evitar exponer contraseñas y cadenas de conexión sensibles en repositorios de código:
* **`.env.example`:** Archivo plantilla público que se sube al repositorio con variables dummy o de ejemplo (`MONGODB_URI=mongodb://localhost:27017/iaew_ecommerce`).
* **`.env`:** Archivo privado con las credenciales reales de la máquina actual. **Debe estar siempre ignorado en `.gitignore`**.

---
*Conexión con notas prácticas:* Actividad Práctica Clase 02: E-commerce API REST + MongoDB
