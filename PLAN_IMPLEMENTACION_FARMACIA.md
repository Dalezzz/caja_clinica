# Plan de Implementación: Módulo de Farmacia y Kardex

Este documento es la guía oficial paso a paso para el desarrollo del Módulo de Farmacia, Kardex y Sistema de Inyección Masiva (Excel). 

> [!IMPORTANT]
> **REGLA DE ORO DE SEGURIDAD:** 
> Toda la lógica de negocio, cálculos de saldos, validación de stock y cálculos de precios **DEBEN manejarse estrictamente en el Backend (NestJS)**. El Frontend (React) actuará únicamente como una capa de presentación ("tonta"). Esto es para prevenir que cualquier usuario manipule los datos desde el navegador.

---

## 🛠️ Fase 1: Arquitectura de Base de Datos y Roles (Backend Base)

**Objetivo:** Preparar los cimientos de la base de datos (Prisma) y establecer el sistema de roles.

1. **Actualizar `schema.prisma`:**
   - Añadir el nuevo rol al Enum existente: `enum Role { ADMIN, CAJA, FARMACIA }`.
   - Crear el modelo `Producto` (id, nombre, detalle, categoria, stock_actual, unidad_medida).
   - Crear el modelo `MovimientoKardex` (id, productoId, fecha, tipo: `ENTRADA`/`SALIDA`/`AJUSTE`, cantidad, saldo_resultante, motivo).
2. **Generar Migraciones:** 
   - Ejecutar `npx prisma migrate dev` para aplicar los cambios a la base de datos local.
3. **Módulo de Farmacia (NestJS):**
   - Crear la estructura básica: `FarmaciaModule`, `FarmaciaController`, `FarmaciaService`.
   - Implementar Guards de seguridad (`@Roles(Role.FARMACIA, Role.ADMIN)`) para asegurar que solo usuarios autorizados accedan a estos endpoints.

---

## 🚀 Fase 2: Motor de Inyección Masiva de Excel (Backend)

**Objetivo:** Permitir la carga de un archivo Excel (Kardex histórico) e inyectarlo transaccionalmente en la base de datos.

1. **Instalación y Configuración:**
   - Instalar la librería `xlsx` en el backend (`npm install xlsx`).
   - Configurar soporte de subida de archivos (File Interceptor de NestJS).
2. **Endpoint de Subida:**
   - Crear el endpoint `POST /farmacia/importar` que reciba el archivo (`multipart/form-data`) y el parámetro del contexto (`clinica` o `farmacia`).
3. **Algoritmo de Parseo Seguro (Backend):**
   - Leer el buffer del Excel.
   - Detectar qué hojas son de "Resumen" (para extraer categorías) y cuáles son de "Productos individuales".
   - Convertir las fechas numéricas de Excel (ej. `46113`) a objetos `Date` de JavaScript de forma precisa.
   - Filtrar y descartar filas vacías (donde saldo es 0 y fecha es null).
4. **Inserción Transaccional:**
   - Usar `$transaction` de Prisma para asegurar que si falla la inserción de una hoja, se revierta todo y la base de datos no quede corrupta.

---

## 💻 Fase 3: Interfaz de Usuario de Farmacia (Frontend)

**Objetivo:** Construir el layout exclusivo para los usuarios con el rol `FARMACIA`.

1. **Enrutamiento y Seguridad:**
   - Crear rutas privadas en React (ej. `/farmacia`) que solo rendericen si el token del usuario tiene el rol `FARMACIA`.
   - Si no tiene permisos, redirigir al login o a "No autorizado".
2. **Vista Principal (Dashboard Farmacia):**
   - Listado de productos paginado con barra de búsqueda y filtros por categoría.
   - Mostrar el `stock_actual` (calculado y enviado por el backend).
3. **Vista de Kardex Detallado:**
   - Al hacer clic en un producto, abrir un modal o vista que muestre el historial exacto (Entradas, Salidas, Fechas, Saldo).
4. **Interfaz de Inyección Masiva:**
   - Crear un componente tipo "Dropzone" o "Input File" para subir el Excel, con botones de confirmación y alertas de éxito/error conectadas al backend.

---

## 🔗 Fase 4: Integración Transaccional Caja <-> Farmacia

**Objetivo:** Conectar el flujo de ventas para que el inventario se actualice automáticamente.

1. **Lógica de Descuento (Backend):**
   - Modificar el `TicketsService` actual: cuando un paciente adquiere un servicio que incluye insumos médicos, el sistema debe disparar un evento o llamar directamente al `FarmaciaService`.
   - Se debe registrar automáticamente un `MovimientoKardex` de tipo `SALIDA` y recalcular el `stock_actual` del producto asociado.
   - **Vital:** Todo el cálculo se hace en el servidor. El frontend solo enviará "Se vendió 1 paracetamol", el backend validará si hay stock, descontará 1, y recalculará los precios y el saldo.
2. **Validación de Stock Insuficiente:**
   - Si la Caja intenta vender algo sin stock, el backend debe lanzar un error `400 Bad Request` indicando "Stock insuficiente para X producto".

> **Nota para el desarrollador:** Puedes comentar o avisar cuando estés listo para arrancar con la "Fase 1" y yo te ayudaré generando los modelos de base de datos exactos.
