// Profolio Deployment Configuration
// Handles different deployment scenarios: SaaS vs Self-hosted

const fs = require('fs');
const path = require('path');

class DeploymentConfig {
  constructor() {
    this.deploymentType = this.detectDeploymentType();
    this.config = this.loadConfig();
  }

  detectDeploymentType() {
    // Check for self-hosted markers
    if (fs.existsSync('.self-hosted') || 
        process.env.DEPLOYMENT_TYPE === 'self-hosted' ||
        process.env.NODE_ENV === 'self-hosted') {
      return 'self-hosted';
    }
    
    // Check for production SaaS deployment
    if (process.env.NODE_ENV === 'production' && 
        (process.env.VERCEL || process.env.NETLIFY || process.env.HEROKU)) {
      return 'saas';
    }
    
    return 'development';
  }

  loadConfig() {
    const baseConfig = {
      app: {
        name: 'Profolio',
        version: '1.0.0',
        description: 'Professional Portfolio Management',
      },
      features: {
        landingPage: true,
        userRegistration: true,
        emailVerification: true,
        networkBypass: false,
        demoMode: true,
        apiKeyManagement: true,
        marketDataSync: true,
      },
      ui: {
        showBranding: true,
        theme: 'default',
        customization: true,
      },
      security: {
        requireHTTPS: false,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        maxLoginAttempts: 5,
      },
    };

    // Apply deployment-specific overrides
    switch (this.deploymentType) {
      case 'self-hosted':
        return this.applySelfHostedConfig(baseConfig);
      case 'saas':
        return this.applySaaSConfig(baseConfig);
      default:
        return this.applyDevelopmentConfig(baseConfig);
    }
  }

  applySelfHostedConfig(config) {
    return {
      ...config,
      features: {
        ...config.features,
        landingPage: false,        // Skip landing page, go straight to login
        userRegistration: false,   // Admin creates users
        emailVerification: false,  // Not needed for local deployments
        networkBypass: true,       // Allow same-network bypass
        demoMode: false,          // No demo mode needed
      },
      ui: {
        ...config.ui,
        showBranding: false,      // Remove "Powered by Profolio" branding
        customization: true,      // Allow full customization
      },
      security: {
        ...config.security,
        requireHTTPS: false,      // HTTP is okay for local networks
      },
      database: {
        autoMigrate: true,
        seedData: false,
      },
      auth: {
        defaultCredentials: {
          email: 'admin@localhost',
          password: 'changeme123',
          mustChange: true,
        },
      },
      api: {
        useMockData: false,
        enableSetupWizard: true,
      },
    };
  }

  applySaaSConfig(config) {
    return {
      ...config,
      features: {
        ...config.features,
        landingPage: true,        // Show marketing pages
        userRegistration: true,   // Allow public registration
        emailVerification: true,  // Verify emails
        networkBypass: false,     // Security required
        demoMode: true,          // Demo for potential customers
      },
      ui: {
        ...config.ui,
        showBranding: true,       // Show company branding
        customization: false,     // Limited customization
      },
      security: {
        ...config.security,
        requireHTTPS: true,       // HTTPS required
      },
      database: {
        autoMigrate: false,       // Manual migrations in production
        seedData: false,
      },
      auth: {
        defaultCredentials: null, // No default credentials
      },
      api: {
        useMockData: false,
        enableSetupWizard: false,
      },
    };
  }

  applyDevelopmentConfig(config) {
    return {
      ...config,
      features: {
        ...config.features,
        landingPage: true,
        userRegistration: true,
        emailVerification: false,  // Skip for development
        networkBypass: true,       // Easy development
        demoMode: true,           // Test demo functionality
      },
      ui: {
        ...config.ui,
        showBranding: true,
        customization: true,
      },
      security: {
        ...config.security,
        requireHTTPS: false,
      },
      database: {
        autoMigrate: true,
        seedData: true,           // Seed test data
      },
      auth: {
        defaultCredentials: {
          email: 'admin@example.com',
          password: 'admin123',
          mustChange: false,
        },
      },
      api: {
        useMockData: true,        // Use mock data when backend unavailable
        enableSetupWizard: true,
      },
    };
  }

  // Generate Next.js environment variables
  generateNextEnvVars() {
    const envVars = {
      NEXT_PUBLIC_APP_NAME: this.config.app.name,
      NEXT_PUBLIC_APP_VERSION: this.config.app.version,
      NEXT_PUBLIC_DEPLOYMENT_TYPE: this.deploymentType,
      NEXT_PUBLIC_USE_MOCK_API: this.config.api.useMockData.toString(),
      NEXT_PUBLIC_ENABLE_DEMO_MODE: this.config.features.demoMode.toString(),
      NEXT_PUBLIC_SHOW_LANDING_PAGE: this.config.features.landingPage.toString(),
      NEXT_PUBLIC_ALLOW_REGISTRATION: this.config.features.userRegistration.toString(),
      NEXT_PUBLIC_SHOW_BRANDING: this.config.ui.showBranding.toString(),
    };

    // Write to .env.local for Next.js
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    fs.writeFileSync('.env.local', envContent);
    console.log(`Generated .env.local for ${this.deploymentType} deployment`);

    return envVars;
  }

  // Generate backend configuration
  generateBackendConfig() {
    const backendConfig = {
      deployment: this.deploymentType,
      features: this.config.features,
      security: this.config.security,
      database: this.config.database,
    };

    fs.writeFileSync('config.json', JSON.stringify(backendConfig, null, 2));
    console.log(`Generated config.json for ${this.deploymentType} deployment`);

    return backendConfig;
  }

  // Generate Docker Compose for self-hosted
  generateDockerCompose() {
    if (this.deploymentType !== 'self-hosted') {
      return;
    }

    const dockerCompose = `
version: '3.8'

services:
  profolio-db:
    image: postgres:15
    environment:
      POSTGRES_DB: profolio
      POSTGRES_USER: profolio
      POSTGRES_PASSWORD: \${DB_PASSWORD:-changeme}
    volumes:
      - profolio_db_data:/var/lib/postgresql/data
    networks:
      - profolio_network
    restart: unless-stopped

  profolio-app:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://profolio:\${DB_PASSWORD:-changeme}@profolio-db:5432/profolio
      JWT_SECRET: \${JWT_SECRET}
      API_KEY_ENCRYPTION_SECRET: \${ENCRYPTION_SECRET}
      DEPLOYMENT_TYPE: self-hosted
    ports:
      - "3000:3000"
    depends_on:
      - profolio-db
    networks:
      - profolio_network
    restart: unless-stopped
    volumes:
      - profolio_uploads:/app/uploads

volumes:
  profolio_db_data:
  profolio_uploads:

networks:
  profolio_network:
    driver: bridge
`;

    fs.writeFileSync('docker-compose.yml', dockerCompose.trim());
    console.log('Generated docker-compose.yml for self-hosted deployment');
  }

  // Get configuration for current deployment
  getConfig() {
    return {
      deploymentType: this.deploymentType,
      config: this.config,
    };
  }

  // Initialize deployment
  async initialize() {
    console.log(`Initializing ${this.deploymentType} deployment...`);
    
    this.generateNextEnvVars();
    this.generateBackendConfig();
    
    if (this.deploymentType === 'self-hosted') {
      this.generateDockerCompose();
    }

    console.log(`${this.deploymentType} deployment configuration complete!`);
    return this.getConfig();
  }
}

// Export for use in build scripts
module.exports = new DeploymentConfig();

// CLI usage
if (require.main === module) {
  const deployment = new DeploymentConfig();
  deployment.initialize().then(() => {
    console.log('Deployment configuration generated successfully!');
  }).catch(console.error);
} 