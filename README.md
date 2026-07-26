# Malla Interactiva UDD

Planificador curricular interactivo para la **Universidad del Desarrollo**. Es una reescritura en TypeScript inspirada en [Malla Interactiva](https://github.com/BooterMan98/malla-interactiva), creada originalmente para la USM.

## Tecnologías

- **Monorepo**: espacios de trabajo de pnpm
- **Backend**: Fastify + SQLite + OpenAPI
- **Frontend**: React + Vite
- **Código compartido**: esquemas Zod, lógica de dominio y validación
- **Despliegue**: Docker / Docker Compose y [Vercel](#vercel)

## Estructura del proyecto

```text
malla-interactiva-udd/
├── data/iit/              # JSON de origen de la malla curricular
├── data/malla.db          # Base de datos SQLite generada (ignorada por Git)
├── packages/
│   ├── shared/            # Tipos, esquemas y lógica de dominio
│   ├── backend/           # API con Fastify
│   └── frontend/          # Aplicación React
└── docs/                  # Documentos fuente en PDF
```

## Requisitos previos

- Node.js 22.5+
- pnpm 10+

## Puesta en marcha

```bash
pnpm install
pnpm db:import    # JSON → SQLite (también se ejecuta al iniciar el servidor por primera vez)
pnpm dev          # API en http://localhost:3001
pnpm dev:frontend # Interfaz en http://localhost:5173 (redirige /api al backend)
```

### OpenAPI

Documentación interactiva en **http://localhost:3001/docs**.

Especificación en formato JSON en **http://localhost:3001/docs/json**.

### Base de datos

Los archivos JSON de `data/iit/` son la fuente oficial de la malla curricular. Para importarlos a SQLite:

```bash
pnpm db:import
```

Variables de entorno:

| Variable | Valor predeterminado | Descripción |
|----------|----------------------|-------------|
| `DATABASE_PATH` | `data/malla.db` | Ruta del archivo SQLite |
| `DB_AUTO_SEED` | `true` | Importa el JSON si la base de datos está vacía al iniciar |

Después de editar `curriculum.json`, vuelve a ejecutar `pnpm db:import` y reinicia el servidor.

### Docker

```bash
docker compose up --build
```

### Vercel

El frontend se compila como un sitio estático con Vite y la API se ejecuta como una única función sin servidor en `/api/*`. En Vercel, los datos curriculares se cargan desde `data/*/curriculum.json`, sin usar SQLite.

1. Importa el repositorio en [Vercel](https://vercel.com/new).
2. Usa la configuración de `vercel.json` (instalación: `pnpm install`; compilación: `pnpm run build:vercel`; salida: `packages/frontend/dist`).
3. Despliega el proyecto.

Vista previa local de la configuración de producción (API e interfaz estática):

```bash
pnpm install
pnpm run build:vercel
npx vercel dev
```

Variables de entorno opcionales:

| Variable | Valor predeterminado en Vercel | Descripción |
|----------|--------------------------------|-------------|
| `CURRICULUM_SOURCE` | `json` | Carga las carreras desde archivos JSON (obligatorio en Vercel) |
| `DATA_DIR` | `./data` | Ruta de las carpetas que contienen los JSON curriculares |

Después de editar `data/iit/curriculum.json`, confirma los cambios y vuelve a desplegar. En Vercel no es necesario ejecutar `db:import`.

### Pruebas y validación

```bash
pnpm test
pnpm validate:curriculum
```

## Rutas de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Comprueba el estado del servicio |
| `GET` | `/docs` | Abre la interfaz de OpenAPI |
| `GET` | `/careers` | Enumera las carreras disponibles |
| `GET` | `/careers/:code/curriculum` | Obtiene la malla curricular completa y sus categorías |
| `POST` | `/careers/:code/eligibility` | Obtiene el estado de desbloqueo de las asignaturas |
| `POST` | `/careers/:code/credits` | Obtiene el avance de créditos |
| `GET` | `/careers/:code/validate` | Obtiene el informe de validación |

## Datos curriculares

La planificación es híbrida (`meta.scheduling`): semestres **s1–s4** y luego trimestres **t9–t20**.

La carrera exige **561 créditos** en total, incluidos **32 créditos extradisciplinarios** representados por asignaturas EEL en la malla.

`pnpm validate:curriculum` ejecuta verificaciones de integridad sobre los archivos JSON de origen.

## Créditos

Proyecto inspirado en [Malla Interactiva](https://github.com/BooterMan98/malla-interactiva), creado originalmente por Sebastián Aedo y la comunidad de código abierto de la USM.

## Licencia

Por definir.
