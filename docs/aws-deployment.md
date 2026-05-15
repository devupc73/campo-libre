# Despliegue AWS

## Servicios previstos

- Amazon ECS Fargate.
- Amazon ECR.
- Amazon RDS PostgreSQL.
- Application Load Balancer.
- CloudWatch.
- Secrets Manager.

## Flujo CI/CD

1. Push a rama main.
2. GitHub Actions ejecuta build.
3. Imagen Docker publicada en ECR.
4. ECS actualiza servicio.

## Variables necesarias

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- ECR_REPOSITORY
- ECS_CLUSTER
- ECS_SERVICE

## Arquitectura

Mobile -> API Gateway/ALB -> ECS FastAPI -> PostgreSQL RDS
