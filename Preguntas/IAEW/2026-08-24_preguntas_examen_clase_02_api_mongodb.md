# Preguntas y Respuestas Clave: Clase 02 - APIs REST, Reglas de Negocio y MongoDB

**Materia Hub:** [[2026-08-10_integracion_aplicaciones_web_utn_frc|IAEW]]  
**Tags:** #materia/iaew #utn #sistemas #preguntas-examen #api-rest #mongodb #autoevaluacion  
**Fecha:** 2026-08-24  

---

## ❓ Preguntas de Autoevaluación y Examen

### 1. ¿Cuál es la diferencia conceptual entre un endpoint CRUD y un endpoint de Operación de Negocio?
> [!NOTE]
> **Respuesta:**
> - **Endpoint CRUD (`GET/POST /productos`):** Se limita a transferir y almacenar datos de forma directa en el catálogo sin alterar reglas de dominio complejas.
> - **Operación de Negocio (`POST /pedidos/:id/confirmar`):** Ejecuta una **transición de máquina de estados** en el dominio. Valida el estado previo (`pendiente`), verifica que exista inventario disponible, descuenta unidades de forma atómica y marca la orden como `confirmado`.

---

### 2. ¿Por qué es fundamental devolver el código HTTP `409 Conflict` ante un reintento de confirmación y no un `500` ni un `400`?
> [!NOTE]
> **Respuesta:**
> - **`500 Internal Server Error`** indicaría un bug o caída en el servidor (un error de negocio del cliente jamás debe enmascararse como falla del sistema).
> - **`400 Bad Request`** indicaría que la sintaxis JSON está rota o faltan campos obligatorios.
> - **`409 Conflict`** comunica con precisión semántica que la solicitud es sintácticamente válida pero **entra en conflicto con el estado actual del recurso en el negocio** (el pedido ya fue confirmado o no hay stock).

---

### 3. ¿Qué rol cumple Mongoose y por qué no usamos el driver crudo de MongoDB directamente?
> [!NOTE]
> **Respuesta:**
> MongoDB es *schema-less* (permite guardar cualquier documento sin estructura fija). **Mongoose** actúa como una capa ODM (*Object Data Modeling*) que impone un esquema rígido, validaciones de tipo (String, Number, Date), reglas de rango (`min: 0`, `required: true`) y manejo automático de marcas de tiempo (`createdAt`, `updatedAt`).

---

### 4. ¿Por qué se utiliza el operador atómico `$inc` de MongoDB para el descuento de stock?
> [!NOTE]
> **Respuesta:**
> El operador `$inc: { stock: -cantidad }` delega la operación matemática directamente en el motor de la base de datos de manera **atómica**. Esto previene condiciones de carrera (*race conditions*) donde múltiples compras simultáneas podrían leer el mismo stock y vender unidades inexistentes (sobreventa).

---

### 5. ¿Cuál es la diferencia entre una Imagen Docker y un Contenedor?
> [!NOTE]
> **Respuesta:**
> - **Imagen (`mongo:7`):** Es la plantilla inmutable o receta empaquetada que contiene los binarios y dependencias.
> - **Contenedor (`iaew-mongo`):** Es la instancia viva y aislada en ejecución que atiende conexiones en el puerto `27017`.

---

### 6. ¿Por qué es una regla estricta no subir `.env` a Git y sí incluir `.env.example`?
> [!NOTE]
> **Respuesta:**
> El archivo `.env` contiene credenciales, cadenas de conexión y claves privadas que nunca deben exponerse públicamente. `.env.example` sirve como plantilla pública documentada para que otros desarrolladores conozcan qué variables de entorno necesita la aplicación para arrancar.

---
*Notas relacionadas:*
- [[2026-08-24_actividad_clase_02_ecommerce_api_rest_mongodb|Actividad Práctica Clase 02]]
- [[2026-08-24_docker_mongodb_contenedores_y_persistencia|Docker, MongoDB y Persistencia]]
- [[2026-08-10_apis_y_servicios_web|APIs y Servicios Web]]
