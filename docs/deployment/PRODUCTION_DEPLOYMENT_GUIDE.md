# Production Deployment Guide

**Profolio Enterprise-Grade Production Deployment**

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Active for Production Deployment

---

## 📋 **Overview**

This guide provides comprehensive instructions for deploying Profolio to production environments with enterprise-grade security, monitoring, and reliability features.

**🚨 CRITICAL**: This project now uses **pnpm exclusively**. All deployment scripts have been updated accordingly.

---

## 🏗️ **Deployment Architecture Options**

### **Option 1: Docker Deployment (Recommended)**

- ✅ **Containerized**: Isolated, consistent environments
- ✅ **Scalable**: Easy horizontal scaling with orchestration
- ✅ **Portable**: Works on any Docker-compatible platform
- ✅ **Version Control**: Tagged Docker images for rollbacks

### **Option 2: Self-Hosted Server Deployment**

- ✅ **Direct Control**: Full server management
- ✅ **Performance**: Native performance without container overhead
- ✅ **Custom Configuration**: Flexible system-level customization
- ✅ **Cost Effective**: No orchestration platform costs

### **Option 3: Cloud Platform Deployment**

- ✅ **Managed Services**: Database, monitoring, backups included
- ✅ **High Availability**: Built-in redundancy and failover
- ✅ **Auto Scaling**: Automatic resource scaling
- ✅ **Global CDN**: Worldwide content delivery

---

## 🐳 **Docker Deployment (Production Ready)**

### **1. Production Docker Configuration**

**Multi-stage Dockerfile for optimized production builds:**

```dockerfile
# Build stage for backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
RUN npm install -g pnpm@9.14.4
COPY backend/package*.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY backend/ ./
RUN pnpm prisma generate
RUN pnpm run build

# Build stage for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
RUN npm install -g pnpm@9.14.4
COPY frontend/package*.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build

# Production runtime
FROM node:18-alpine AS production
RUN npm install -g pnpm@9.14.4

# Create non-root user
RUN addgroup -g 1001 -S profolio && \
    adduser -S profolio -u 1001

# Backend setup
WORKDIR /app/backend
COPY --from=backend-builder --chown=profolio:profolio /app/backend/dist ./dist
COPY --from=backend-builder --chown=profolio:profolio /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=profolio:profolio /app/backend/package.json ./
COPY --from=backend-builder --chown=profolio:profolio /app/backend/prisma ./prisma

# Frontend setup
WORKDIR /app/frontend
COPY --from=frontend-builder --chown=profolio:profolio /app/frontend/.next ./.next
COPY --from=frontend-builder --chown=profolio:profolio /app/frontend/node_modules ./node_modules
COPY --from=frontend-builder --chown=profolio:profolio /app/frontend/package.json ./
COPY --from=frontend-builder --chown=profolio:profolio /app/frontend/public ./public

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

USER profolio
EXPOSE 3000 3001

# Start script
COPY --chown=profolio:profolio docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
```

### **2. Docker Compose for Production**

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: profolio
      POSTGRES_USER: profolio
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U profolio"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  profolio:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://profolio:${DB_PASSWORD}@postgres:5432/profolio
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      API_ENCRYPTION_KEY: ${API_ENCRYPTION_KEY}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
    volumes:
      - app_logs:/app/logs
      - app_uploads:/app/uploads
    ports:
      - "80:3000"
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
      - nginx_logs:/var/log/nginx
    ports:
      - "443:443"
      - "80:80"
    depends_on:
      - profolio
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  app_logs:
  app_uploads:
  nginx_logs:
```

### **3. Production Environment Configuration**

```bash
# .env.production
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://profolio:${DB_PASSWORD}@postgres:5432/profolio
REDIS_URL=redis://redis:6379

# Security Keys (Generate unique values)
JWT_SECRET=${JWT_SECRET}
API_ENCRYPTION_KEY=${API_ENCRYPTION_KEY}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://your-domain.com

# External Services
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}

# Email Configuration (Production SMTP)
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# Monitoring & Logging
LOG_LEVEL=info
SENTRY_DSN=${SENTRY_DSN}
DATADOG_API_KEY=${DATADOG_API_KEY}

# Performance & Caching
ENABLE_REDIS_CACHE=true
ENABLE_CDN=true
CDN_URL=${CDN_URL}

# Security Headers
ENABLE_SECURITY_HEADERS=true
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🔧 **Self-Hosted Server Deployment**

### **1. System Requirements**

**Minimum Production Requirements:**

- **OS**: Ubuntu 22.04 LTS or Debian 11+
- **CPU**: 4 cores / 8 threads
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **Network**: 1 Gbps connection

**Recommended Production Requirements:**

- **OS**: Ubuntu 22.04 LTS
- **CPU**: 8 cores / 16 threads
- **RAM**: 16 GB
- **Storage**: 500 GB NVMe SSD
- **Network**: 10 Gbps connection
- **Backup**: 1 TB additional storage

### **2. Updated Installation Script (pnpm-ready)**

The existing `install-or-update.sh` script needs updates for pnpm. Key changes required:

1. **Package Manager Update**: Switch from npm to pnpm
2. **Lock File Handling**: Use pnpm-lock.yaml instead of package-lock.json
3. **Build Commands**: Update all build commands to use pnpm
4. **Dependency Installation**: Use pnpm install instead of npm ci

### **3. Production System Services**

**Backend Service** (`/etc/systemd/system/profolio-backend.service`):

```ini
[Unit]
Description=Profolio Backend API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=profolio
WorkingDirectory=/opt/profolio/backend
Environment=NODE_ENV=production
EnvironmentFile=/opt/profolio/backend/.env
ExecStart=/usr/bin/node dist/main.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=profolio-backend

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/profolio/backend/logs /opt/profolio/backend/uploads

[Install]
WantedBy=multi-user.target
```

**Frontend Service** (`/etc/systemd/system/profolio-frontend.service`):

```ini
[Unit]
Description=Profolio Frontend
After=network.target profolio-backend.service
Wants=profolio-backend.service

[Service]
Type=simple
User=profolio
WorkingDirectory=/opt/profolio/frontend
Environment=NODE_ENV=production
EnvironmentFile=/opt/profolio/frontend/.env.local
ExecStart=/usr/bin/node server.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=profolio-frontend

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/profolio/frontend/logs

[Install]
WantedBy=multi-user.target
```

---

## ☁️ **Cloud Platform Deployment**

### **1. AWS Deployment**

**Infrastructure as Code (Terraform):**

```hcl
# AWS ECS Fargate deployment
resource "aws_ecs_cluster" "profolio" {
  name = "profolio-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "profolio" {
  family                   = "profolio"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 2048
  memory                   = 4096
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "profolio"
      image = "your-registry/profolio:latest"

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        },
        {
          containerPort = 3001
          hostPort      = 3001
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://${aws_rds_cluster.profolio.master_username}:${aws_rds_cluster.profolio.master_password}@${aws_rds_cluster.profolio.endpoint}:5432/${aws_rds_cluster.profolio.database_name}"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.profolio.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

# RDS PostgreSQL Cluster
resource "aws_rds_cluster" "profolio" {
  cluster_identifier      = "profolio-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "profolio"
  master_username         = "profolio"
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  deletion_protection     = true

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.profolio.name
}
```

### **2. Google Cloud Deployment**

**Cloud Run Configuration:**

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: profolio
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/execution-environment: gen2
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
        - image: gcr.io/PROJECT_ID/profolio:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: profolio-secrets
                  key: database-url
          resources:
            limits:
              cpu: "2"
              memory: "4Gi"
            requests:
              cpu: "1"
              memory: "2Gi"
```

### **3. Vercel Deployment**

**Production Configuration** (`vercel.json`):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["frontend/**"]
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "API_ENCRYPTION_KEY": "@api-encryption-key"
  }
}
```

---

## 🔐 **Security Configuration**

### **1. SSL/TLS Setup**

**Nginx SSL Configuration:**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    # Frontend Proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Auth Rate Limiting
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3001/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### **2. Firewall Configuration**

**UFW Firewall Rules:**

```bash
# Reset firewall rules
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH (change port as needed)
sudo ufw allow 22/tcp

# HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Database (only from application servers)
sudo ufw allow from 10.0.0.0/8 to any port 5432

# Enable firewall
sudo ufw enable
```

### **3. Database Security**

**PostgreSQL Security Configuration:**

```sql
-- Create dedicated database user
CREATE USER profolio_app WITH ENCRYPTED PASSWORD 'secure-password';

-- Grant minimal permissions
GRANT CONNECT ON DATABASE profolio TO profolio_app;
GRANT USAGE ON SCHEMA public TO profolio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO profolio_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO profolio_app;

-- Enable SSL connections only
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';
```

---

## 📊 **Monitoring & Logging**

### **1. Application Monitoring**

**Prometheus Configuration:**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "profolio-backend"
    static_configs:
      - targets: ["localhost:3001"]
    metrics_path: "/metrics"
    scrape_interval: 30s

  - job_name: "profolio-frontend"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/api/metrics"
    scrape_interval: 30s

  - job_name: "postgres"
    static_configs:
      - targets: ["localhost:9187"]

  - job_name: "redis"
    static_configs:
      - targets: ["localhost:9121"]
```

**Grafana Dashboard Configuration:**

```json
{
  "dashboard": {
    "title": "Profolio Production Metrics",
    "panels": [
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "Active Connections"
          }
        ]
      }
    ]
  }
}
```

### **2. Centralized Logging**

**ELK Stack Configuration** (Elasticsearch, Logstash, Kibana):

```yaml
# docker-compose.logging.yml
version: "3.8"

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch
```

### **3. Health Checks & Alerts**

**Application Health Check Endpoints:**

```typescript
// Backend health check
@Get('/health')
async healthCheck(): Promise<HealthCheckResult> {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    services: {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      external_apis: await this.checkExternalAPIs()
    }
  };
}

// Frontend health check
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    services: {
      backend: await checkBackendHealth(),
      database: await checkDatabaseConnection()
    }
  };

  return NextResponse.json(health);
}
```

**Alerting Rules** (Prometheus):

```yaml
groups:
  - name: profolio.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} requests per second"

      - alert: DatabaseConnectionFailed
        expr: up{job="postgres"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"
          description: "PostgreSQL is not responding"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }} seconds"
```

---

## 💾 **Backup & Disaster Recovery**

### **1. Database Backup Strategy**

**Automated PostgreSQL Backups:**

```bash
#!/bin/bash
# /opt/profolio/scripts/backup-database.sh

# Configuration
DB_NAME="profolio"
DB_USER="profolio"
BACKUP_DIR="/opt/profolio/backups"
RETENTION_DAYS=30
S3_BUCKET="profolio-backups"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/profolio_backup_$TIMESTAMP.sql.gz"

# Create database dump
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database backup created: $BACKUP_FILE"

    # Upload to S3 (optional)
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/database/"
        echo "✅ Backup uploaded to S3"
    fi

    # Clean old backups
    find "$BACKUP_DIR" -name "profolio_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "✅ Old backups cleaned up"
else
    echo "❌ Database backup failed"
    exit 1
fi
```

**Backup Cron Job:**

```bash
# /etc/cron.d/profolio-backup
# Daily backup at 2 AM
0 2 * * * profolio /opt/profolio/scripts/backup-database.sh >> /var/log/profolio-backup.log 2>&1

# Weekly full system backup at 3 AM on Sundays
0 3 * * 0 profolio /opt/profolio/scripts/backup-full-system.sh >> /var/log/profolio-backup.log 2>&1
```

### **2. Application Data Backup**

**File System Backup Script:**

```bash
#!/bin/bash
# /opt/profolio/scripts/backup-full-system.sh

BACKUP_ROOT="/opt/profolio/backups/system"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/profolio_system_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

# Backup application files
tar -czf "$BACKUP_DIR/application.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='logs/*' \
    --exclude='backups/*' \
    /opt/profolio/

# Backup configuration files
cp -r /etc/systemd/system/profolio-* "$BACKUP_DIR/"
cp /etc/nginx/sites-available/profolio "$BACKUP_DIR/"

# Backup uploaded files
if [ -d "/opt/profolio/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads.tar.gz" /opt/profolio/uploads/
fi

# Upload to cloud storage
if command -v aws &> /dev/null; then
    aws s3 sync "$BACKUP_DIR" "s3://profolio-backups/system/$TIMESTAMP/"
fi

echo "✅ Full system backup completed: $BACKUP_DIR"
```

### **3. Disaster Recovery Plan**

**Recovery Procedures:**

```bash
#!/bin/bash
# /opt/profolio/scripts/disaster-recovery.sh

# 1. Stop services
systemctl stop profolio-frontend profolio-backend nginx

# 2. Restore database
echo "Restoring database from backup..."
BACKUP_FILE="$1"  # Path to backup file
gunzip -c "$BACKUP_FILE" | psql -U profolio -d profolio

# 3. Restore application files
echo "Restoring application files..."
tar -xzf "/path/to/application.tar.gz" -C /

# 4. Restore uploads
echo "Restoring uploaded files..."
tar -xzf "/path/to/uploads.tar.gz" -C /

# 5. Fix permissions
chown -R profolio:profolio /opt/profolio
chmod +x /opt/profolio/scripts/*.sh

# 6. Start services
systemctl start profolio-backend
sleep 5
systemctl start profolio-frontend
systemctl start nginx

# 7. Verify services
if systemctl is-active --quiet profolio-backend profolio-frontend nginx; then
    echo "✅ Disaster recovery completed successfully"
else
    echo "❌ Some services failed to start"
    exit 1
fi
```

---

## 🚀 **Deployment Commands Quick Reference**

### **Docker Deployment**

```bash
# Build production image
docker build -t profolio:latest .

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Check health
docker-compose exec profolio curl http://localhost:3000/health

# View logs
docker-compose logs -f profolio

# Backup database
docker-compose exec postgres pg_dump -U profolio profolio | gzip > backup.sql.gz

# Scale services
docker-compose up -d --scale profolio=3
```

### **Self-Hosted Deployment**

```bash
# Update to latest version
sudo ./install-or-update.sh update

# Check service status
systemctl status profolio-backend profolio-frontend

# View logs
journalctl -u profolio-backend -f
journalctl -u profolio-frontend -f

# Restart services
systemctl restart profolio-backend profolio-frontend

# Run health check
curl -f http://localhost:3001/health
curl -f http://localhost:3000/health
```

### **Cloud Deployment**

```bash
# AWS ECS deployment
aws ecs update-service --cluster profolio-cluster --service profolio --force-new-deployment

# Google Cloud Run deployment
gcloud run deploy profolio --image gcr.io/PROJECT_ID/profolio:latest --platform managed

# Vercel deployment
vercel --prod
```

---

## 📈 **Performance Optimization**

### **1. Caching Strategy**

- **Redis**: Session storage, API response caching
- **CDN**: Static asset delivery (images, CSS, JS)
- **Browser Caching**: Aggressive caching for static resources
- **Database Query Optimization**: Indexed queries, connection pooling

### **2. Auto Scaling Configuration**

- **Horizontal Scaling**: Multiple application instances behind load balancer
- **Vertical Scaling**: Dynamic resource allocation based on load
- **Database Scaling**: Read replicas for read-heavy workloads

### **3. CDN Integration**

- **CloudFlare**: Global CDN with DDoS protection
- **AWS CloudFront**: Integrated with AWS infrastructure
- **Google Cloud CDN**: Low-latency global distribution

---

## 🔍 **Production Checklist**

### **Pre-Deployment Checklist**

- [ ] ✅ Updated CI/CD workflows to use pnpm
- [ ] ✅ Created Docker containers for all services
- [ ] ✅ Configured production environment variables
- [ ] ✅ Set up SSL certificates
- [ ] ✅ Configured security headers and firewalls
- [ ] ✅ Set up monitoring and alerting
- [ ] ✅ Implemented backup strategy
- [ ] ✅ Created disaster recovery procedures
- [ ] ✅ Load tested application
- [ ] ✅ Security audit completed

### **Post-Deployment Checklist**

- [ ] ✅ Verify all services are running
- [ ] ✅ Test authentication and authorization
- [ ] ✅ Verify database connections
- [ ] ✅ Test backup and restore procedures
- [ ] ✅ Monitor application metrics
- [ ] ✅ Check SSL certificate validity
- [ ] ✅ Verify CDN configuration
- [ ] ✅ Test alert notifications
- [ ] ✅ Performance benchmark comparison
- [ ] ✅ Security scan results review

---

**🚀 Ready for production deployment!** Choose your deployment method and follow the appropriate section for a robust, secure, and scalable Profolio deployment.
