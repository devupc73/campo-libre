# Campo Libre - AWS EC2 Deployment

## Objetivo

Desplegar frontend, backend y PostgreSQL en una instancia EC2 con IP publica fija mediante Elastic IP.

## Arquitectura

- EC2 Ubuntu 24.04 LTS
- Elastic IP asociada a la instancia
- Docker Compose
- Nginx reverse proxy
- Frontend Expo Web
- Backend FastAPI
- PostgreSQL privado en Docker
- SSL con Let's Encrypt
- GitHub Actions por SSH

## DNS sugerido

Crear dos registros A apuntando a la Elastic IP:

- campo.esstrategicpartners.com -> Elastic IP
- api.esstrategicpartners.com -> Elastic IP

## Security Group

Abrir solo:

- 22/tcp desde tu IP administrativa
- 80/tcp desde 0.0.0.0/0
- 443/tcp desde 0.0.0.0/0

No abrir PostgreSQL a internet.

## Preparacion inicial EC2

Conectarse por SSH y ejecutar:

```bash
cd /tmp
git clone https://github.com/devupc73/campo-libre.git
cd campo-libre
bash deploy/aws-ec2/bootstrap-ubuntu.sh
```

Cerrar y volver a entrar por SSH para activar permisos Docker.

## Certificados SSL

Antes del primer despliegue productivo, emitir certificados:

```bash
sudo certbot certonly --standalone -d campo.esstrategicpartners.com
sudo certbot certonly --standalone -d api.esstrategicpartners.com
```

## GitHub Secrets requeridos

Configurar en GitHub > Settings > Secrets and variables > Actions:

- EC2_HOST: Elastic IP o DNS publico de EC2
- EC2_USER: ubuntu
- EC2_SSH_KEY: private key PEM del usuario
- EC2_APP_DIR: /opt/campo-libre
- FRONTEND_DOMAIN: campo.esstrategicpartners.com
- API_DOMAIN: api.esstrategicpartners.com
- POSTGRES_DB: campo_libre
- POSTGRES_USER: campo
- POSTGRES_PASSWORD: password seguro

## Despliegue

El workflow `.github/workflows/deploy-aws-ec2.yml` se ejecuta en push a main o manualmente.

## Validacion

```bash
curl https://api.esstrategicpartners.com/health
```

Abrir:

```text
https://campo.esstrategicpartners.com
```

## Nota IP fija

La IP publica fija se garantiza asociando una Elastic IP a la instancia EC2. No usar la Public IPv4 autogenerada de EC2 para DNS porque cambia si la instancia se detiene y arranca nuevamente.
