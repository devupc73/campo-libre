# Campo Libre

Aplicación mobile para reservar campos deportivos, organizar convocatorias, registrar participantes, controlar pagos, generar sorteos de equipos y revisar recaudación.

## Estructura

- `mobile/`: aplicación Expo React Native.
- `backend/`: API REST con FastAPI.
- `infra/terraform/`: infraestructura AWS como código.
- `docs/`: documentación funcional, técnica y despliegue.
- `.github/workflows/`: integración continua.

## Ejecución local

Backend:

```bash
cd backend
docker compose up --build
```

Mobile:

```bash
cd mobile
npm install
npm run start
```

## Estado

Base inicial del producto Campo Libre lista para desarrollo incremental.