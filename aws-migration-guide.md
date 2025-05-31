# 🚀 Profolio AWS Migration Guide

## Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed locally (for containerization)

## Phase 1: Database Migration (RDS PostgreSQL)

### Step 1: Create RDS Instance
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier profolio-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.9 \
  --allocated-storage 20 \
  --db-name profolio \
  --master-username profolio_user \
  --master-user-password YOUR_SECURE_PASSWORD \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --storage-encrypted
```

### Step 2: Database Migration
```bash
# Export from home server
pg_dump -h 192.168.1.27 -U username profolio_prod > profolio_backup.sql

# Import to RDS
psql -h your-rds-endpoint.amazonaws.com -U profolio_user -d profolio < profolio_backup.sql
```

## Phase 2: Containerization

### Step 1: Create Dockerfiles

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

**Docker Compose (for testing):**
```yaml
version: '3.8'
services:
  backend:
    build: 
      context: .
      dockerfile: backend/Dockerfile
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/profolio
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    ports:
      - "3001:3001"
    depends_on:
      - db

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=profolio
      - POSTGRES_USER=profolio
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Phase 3: AWS Deployment Options

### Option A: ECS Fargate (Recommended)

**Task Definition:**
```json
{
  "family": "profolio",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/profolio-backend:latest",
      "portMappings": [{"containerPort": 3001, "protocol": "tcp"}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:ssm:region:account:parameter/profolio/database-url"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/profolio",
          "awslogs-region": "us-east-1"
        }
      }
    }
  ]
}
```

### Option B: App Runner (Simplest)

**apprunner.yaml:**
```yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - cd backend && npm ci --only=production
      - npx prisma generate
run:
  runtime-version: 18
  command: npm run start:prod
  network:
    port: 3001
    env: PORT
  env:
    - name: NODE_ENV
      value: production
```

## Phase 4: Infrastructure as Code (Optional)

**Terraform Configuration:**
```hcl
# main.tf
resource "aws_rds_instance" "profolio" {
  identifier = "profolio-prod"
  engine     = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  
  db_name  = "profolio"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot = true
}

resource "aws_ecs_cluster" "profolio" {
  name = "profolio"
}

resource "aws_ecs_service" "profolio_backend" {
  name            = "profolio-backend"
  cluster         = aws_ecs_cluster.profolio.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  
  launch_type = "FARGATE"
  
  network_configuration {
    subnets         = var.private_subnets
    security_groups = [aws_security_group.backend.id]
  }
}
```

## Phase 5: CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Build and push Docker images
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker build -t profolio-backend ./backend
          docker tag profolio-backend:latest $ECR_REGISTRY/profolio-backend:latest
          docker push $ECR_REGISTRY/profolio-backend:latest
          
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster profolio --service profolio-backend --force-new-deployment
```

## Cost Estimation

### AWS Resources (Monthly)
- **RDS t3.micro**: ~$15
- **ECS Fargate (2 tasks)**: ~$25  
- **ALB**: ~$20
- **CloudWatch Logs**: ~$5
- **Data Transfer**: ~$5
- **Total**: ~$70/month

### Cost Optimization
- Use AWS Free Tier (12 months)
- Reserved Instances for steady workloads
- Auto-scaling to match demand
- CloudFront for global CDN

## Migration Timeline

### Week 1: Planning & Setup
- Set up AWS account and IAM roles
- Create development environment in AWS
- Test database migration

### Week 2: Containerization  
- Create Docker images
- Test locally with Docker Compose
- Set up ECR repositories

### Week 3: Infrastructure
- Deploy RDS instance
- Set up ECS cluster and services
- Configure networking and security

### Week 4: Migration & Cutover
- Migrate database to RDS
- Deploy applications to AWS
- Update DNS to point to AWS
- Monitor and optimize

## Rollback Plan

### Emergency Rollback
1. Update DNS back to home server
2. Keep home server running during migration
3. Database sync strategy for quick cutover

### Gradual Migration
1. Blue/Green deployment
2. Route percentage of traffic to AWS
3. Gradually increase AWS traffic
4. Monitor performance and costs

## Benefits of AWS Migration

### Scalability
- Auto-scaling based on demand
- Global CDN for better performance
- Multi-region deployment capability

### Reliability  
- 99.99% SLA with Multi-AZ RDS
- Automatic failover and backup
- Disaster recovery across regions

### Security
- AWS security best practices
- Encryption at rest and in transit  
- IAM roles and policies

### Cost Efficiency
- Pay-as-you-go pricing
- No hardware maintenance
- Automated scaling saves costs

### Professional Grade
- Monitoring and alerting
- Professional SSL certificates
- Compliance certifications 