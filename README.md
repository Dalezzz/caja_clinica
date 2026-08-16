# Sistema de Caja Clínica - Centro Médico Medic

Sistema local integrado para la gestión de admisión, caja, boletas electrónicas (SUNAT) y reportes de un centro médico.

## Tecnologías

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS
- **Automatización SUNAT**: Playwright

## Estructura del Proyecto

```
caja_clinica/
├── backend/          # NestJS API
├── frontend/         # React + Vite
└── implementation_plan (1).md  # Plan de implementación original
```

## Instalación y Ejecución

### 1. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend` basado en `.env.example` y define al menos:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/caja_clinica?schema=public"
JWT_SECRET="clave_secreta_segura"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
DISABLE_AUTH=false
```

En el frontend, crea un archivo `.env` basado en `frontend/.env.example` con:

```env
VITE_API_URL="http://localhost:3000"
```

### 3. Configurar PostgreSQL

- Asegúrate de tener PostgreSQL instalado y ejecutándose
- Crea una base de datos llamada `caja_clinica`
- Verifica que `DATABASE_URL` apunte a esa base

### 4. Ejecutar migraciones de Prisma

```bash
cd backend
npx prisma migrate dev --name init
```

### 5. Iniciar el backend

```bash
cd backend
npm run start:dev
```

El backend se ejecutará en http://localhost:3000

### 6. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 7. Iniciar el frontend

```bash
cd frontend
npm run dev
```

El frontend se ejecutará en http://localhost:5173

## Funcionalidades Planificadas

- Gestión de pacientes, médicos y tarifas
- Módulo de admisión y emisión de tickets
- Caja diaria (apertura, cierre, control de efectivo)
- Importación de Excel históricos
- Automatización de emisión de boletas electrónicas a SUNAT (Playwright)
- Reportes de comisiones médicas y utilidades
- Registro de dietas
