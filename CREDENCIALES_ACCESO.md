# Credenciales de Acceso al Sistema de Caja Clínica

Este documento contiene las credenciales de prueba predeterminadas para ingresar al sistema local. Por favor, asegúrate de que el backend esté corriendo (`npm run start:dev` en la carpeta backend) para que la autenticación funcione correctamente.

## Enlace de Acceso
🔗 **URL del Sistema:** [http://localhost:5173](http://localhost:5173)

---

## 👑 Rol: Administrador
Este rol tiene acceso total al sistema, incluyendo configuración de reportes de WhatsApp, liquidación de médicos, importador Excel y estadísticas financieras.

- **Usuario:** `admin`
- **Contraseña:** `admin1234`

---

## 🧑‍💻 Rol: Recepcionista (Cajero)
Este rol está limitado a las operaciones diarias (POS): generar tickets, ver la cola de espera, ingresar egresos básicos y ver el arqueo de caja actual. No puede ver configuraciones ni estadísticas globales.

- **Usuario:** `user`
- **Contraseña:** `user1234`

---

## 💊 Rol: Farmacia
Este rol tiene acceso directo al inventario, productos farmacéuticos, consulta y registro de movimientos de Kardex e importación masiva de Excel.

- **Usuario:** `farmacia`
- **Contraseña:** `farmacia1234`

---

> **Nota para el Tester:** 
> Dentro de la cuenta de Recepcionista, existe un botón llamado "Modo Administrador". Si se hace clic allí y se ingresa la contraseña de administrador (`admin1234`), se desbloquearán temporalmente funciones críticas (como anular comprobantes o aplicar descuentos no autorizados) sin necesidad de cerrar sesión.
