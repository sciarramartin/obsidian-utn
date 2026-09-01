# Concepto: Computación en la Nube (Cloud Computing)
**Rama:** [[Hub_IAEW|IAEW]]

**Materia:** Integración de Aplicaciones en Entorno Web (UTN FRC)  
**Tags:** #materia/iaew
**Fecha:** 2026-08-10  
**Categoría:** Infraestructura y Despliegue de Aplicaciones  

---

## ☁️ 1. ¿Qué es Cloud Computing?

**Cloud Computing** (Computación en la Nube) es la **entrega a demanda de recursos de computación a través de Internet** —incluyendo servidores virtuales, almacenamiento de datos, bases de datos, redes, software y analítica— bajo un modelo de **pago por uso (pay-as-you-go)**.

Permite a desarrolladores y empresas desplegar aplicaciones a escala global **sin necesidad de adquirir, instalar o mantener datacenters físicos o servidores propios**.

---

## 🚗 Analogía Sencilla: Comprar un Auto vs. Usar Uber

- **Computación Tradicional (On-Premise):** Es como **comprar un auto físico**. Requiere una gran inversión inicial, pagar mantenimiento, garage y seguro. Si el auto queda estacionado, sigues pagando costos fijos.
- **Cloud Computing:** Es como **usar Uber o alquilar**. Pides el recurso solo cuando lo necesitas, pagas únicamente por el tiempo/kilómetros consumidos y el mantenimiento corre por cuenta del proveedor.

---

## 🏗️ 2. Modelos de Servicio de la Nube (La Pirámide de Cloud)

### 1️⃣ IaaS (Infrastructure as a Service - Infraestructura como Servicio)
- Te provee hardware virtualizado (servidores, redes, discos). Tú te encargas de instalar el sistema operativo, librerías y aplicaciones.
- **Ejemplos:** AWS EC2, Google Compute Engine, Azure Virtual Machines.

### 2️⃣ PaaS (Platform as a Service - Plataforma como Servicio)
- Te provee la plataforma y el entorno de ejecución listos (Node.js, Python, Java, Docker). Tú solo subes el código de tu aplicación.
- **Ejemplos:** Vercel, Render, Heroku, AWS Elastic Beanstalk.

### 3️⃣ SaaS (Software as a Service - Software como Servicio)
- Aplicaciones completas listas para ser consumidas directamente por los usuarios finales a través del navegador.
- **Ejemplos:** Google Workspace, Office 365, GitHub, Notion.

### ⚡ Serverless / FaaS (Function as a Service)
- Ejecución de bloques de código (funciones) gatillados por eventos. El servidor "desaparece" y solo pagas por los milisegundos que dura la ejecución de la función.
- **Ejemplos:** AWS Lambda, Google Cloud Functions, Azure Functions.

---

## 🌐 3. Modelos de Despliegue
- **Nube Pública:** Infraestructura compartida administrada por grandes proveedores (Amazon AWS, Microsoft Azure, Google Cloud).
- **Nube Privada:** Infraestructura de nube usada exclusivamente por una sola organización (común en bancos o gobierno).
- **Nube Híbrida:** Combina servidores locales propios (On-premise) con recursos de Nube Pública.

---

## 🎓 Relevancia en Integración de Aplicaciones Web (IAEW)
En la arquitectura web moderna, las aplicaciones integradas (APIs REST, Microservicios, BFF, WebSockets y brokers de mensajería como RabbitMQ) se empaquetan en contenedores (**Docker**) y se despliegan sobre entornos Cloud (**PaaS / IaaS**) para lograr escalabilidad automática y alta disponibilidad.

---

## 🚀 4. Ventajas Principales de Cloud Computing

1. **💰 Reducción de Costos (CapEx a OpEx):**
   - Elimina la inversión inicial masiva en hardware y servidores físicos (**CapEx**).
   - Se transforma en costo operativo (**OpEx**): pagas únicamente por los recursos que realmente consumes.

2. **📈 Escalabilidad Elástica (Auto-scaling):**
   - **Escalabilidad Horizontal:** Si tu web tiene un pico repentino de tráfico (ej. Black Friday / Hot Sale), la nube crea automáticamente 50 servidores adicionales y los destruye cuando el tráfico vuelve a la normalidad.
   - **Escalabilidad Vertical:** Permite aumentar la RAM o procesador de un servidor en cuestión de segundos.

3. **⏱️ Agilidad y Velocidad de Despliegue (Time to Market):**
   - Comprar e instalar un servidor físico tradicional solía tardar semanas o meses. En la nube, aprovisionar un servidor o base de datos toma **segundos**.

4. **🛡️ Alta Disponibilidad y Tolerancia a Fallos (High Availability):**
   - Los proveedores globales cuentan con Data Centers redundantes repartidos en múltiples regiones geográficas. Si un servidor o data center sufre un desastre o corte eléctrico, el tráfico conmuta automáticamente a otro nodo sin interrumpir el servicio.

5. **🌎 Alcance Global Inmediato:**
   - Permite desplegar tu aplicación web cerca de tus usuarios en cualquier continente con un solo clic, reduciendo la latencia de red.

6. **🛠️ Mantenimiento y Actualizaciones a cargo del Proveedor:**
   - El proveedor maneja la seguridad física, aire acondicionado, parches de seguridad del hipervisor y reemplazo de hardware dañado.
