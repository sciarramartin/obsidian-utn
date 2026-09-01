# Conceptos de Seguridad: Analogía y Ejemplo de OIDC y OAuth 2.0
**Rama:** [[Hub_IAEW|IAEW]]

**Materia:** Integración de Aplicaciones en Entorno Web (UTN FRC)  
**Tags:** #materia/iaew
**Fecha:** 2026-08-13  
**Categoría:** Seguridad y Autenticación Web  

---

Para entender **OpenID Connect (OIDC)**, **OAuth 2.0** y sus métodos de validación de forma simple, utilizaremos la analogía clásica de **un hotel**.

---

## 🏨 La Analogía del Hotel

Imagina que quieres hospedarte en un hotel y usar sus instalaciones (la habitación, el gimnasio, el spa).

### 🪪 1. Autenticación: ¿Quién eres? (OIDC)
Cuando llegas al hotel, vas a la recepción y muestras tu **DNI o Pasaporte** físico. 
* El recepcionista verifica tu identidad y confirma que eres tú.
* **Equivalente técnico (OIDC):** El DNI es el **ID Token**. Contiene tus datos de identidad (nombre, foto, fecha de nacimiento). OIDC sirve para saber **quién eres** (Autenticación).

### 🔑 2. Autorización: ¿A qué tienes acceso? (OAuth 2.0)
Una vez confirmada tu identidad, el recepcionista no te da tu DNI de vuelta para abrir las puertas; te entrega una **tarjeta magnética (llave)**.
* Esta tarjeta no tiene tu foto ni tu nombre impreso. Solo tiene codificados ciertos accesos: abrir la habitación 302 y el gimnasio, pero no la suite presidencial.
* **Equivalente técnico (OAuth 2.0):** La tarjeta es el **Access Token**. Define los permisos (*scopes*) y sirve para saber **a qué tienes permiso de acceder** (Autorización).

---

## ⚙️ ¿Cómo funciona la Validación en esta analogía?

Cuando vas a la puerta de la habitación 302 y pasas la tarjeta por el lector (la API), el lector debe verificar si la tarjeta es válida. Hay dos formas de hacerlo:

### 🔒 Opción A: Validación Local
El lector de la puerta está programado con reglas criptográficas. Lee la tarjeta y descifra su código de firma de forma autónoma.
* **Cómo funciona:** La puerta verifica localmente: *"Esta tarjeta fue firmada por la máquina de la recepción, está configurada para la habitación 302 y no ha vencido su hora de checkout"*. La puerta se abre al instante sin consultar a nadie.
* **Problema:** Si el recepcionista te canceló la tarjeta en la recepción porque la reportaste como perdida, la puerta de la habitación no se enterará de inmediato (abrirá la puerta de todas formas hasta que venza tu hora de checkout).

### ☎️ Opción B: Validación Remota (/introspect)
El lector de la puerta no tiene memoria ni lógica de descifrado. Está conectado por cable a la recepción.
* **Cómo funciona:** Cada vez que pasas la tarjeta, el lector hace una llamada rápida a la recepción: *"Hola, tengo aquí la tarjeta #987. ¿Sigue estando activa y tiene acceso a la 302?"*. La recepción responde: *"Sí, está activa"* o *"No, esa tarjeta fue cancelada"*.
* **Problema:** Si hay mucha gente usando las puertas, la central de recepción se satura y las llamadas pueden tardar, haciendo que las puertas tarden en abrir.

---

## 🧠 Resumen Rápido

* **OIDC (ID Token):** El DNI / Pasaporte. Dice **quién eres** (Identidad).
* **OAuth 2.0 (Access Token):** La Tarjeta Llave. Dice **qué puedes abrir** (Permisos).
* **Validación Local:** La cerradura inteligente verifica la tarjeta de forma autónoma (rápido, pero desactualizado).
* **Introspección (Remota):** La cerradura llama a la recepción central en cada lectura (lento, pero en tiempo real).

---
*Nota registrada automáticamente en el Baúl de Obsidian UTN.*
