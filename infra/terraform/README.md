# Terraform AWS

Infraestructura prevista para Campo Libre.

## Componentes

- VPC
- Subnets publicas y privadas
- ECS Fargate
- ECR
- RDS PostgreSQL
- ALB
- CloudWatch
- Secrets Manager

## Ambientes

- dev
- qa
- prod

## Variables previstas

- project_name
- aws_region
- environment
- db_username
- db_password
- container_port
