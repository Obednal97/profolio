# 🛡️ Security Policy

## 🔐 **Supported Versions**

Security updates are provided for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅ Yes            |
| < 1.0   | ❌ No             |

## 🚨 **Reporting a Vulnerability**

We take security seriously. If you discover a security vulnerability, please help us protect our users by reporting it responsibly.

### **How to Report**

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please:

1. **Create a Private Issue:**
   - Go to [GitHub Issues](https://github.com/Obednal97/profolio/issues)
   - Use the "Security" label
   - Mark as private if possible

2. **Include Information:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### **Response Timeline**

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 1 week
- **Fix Timeline:** Depends on severity
  - Critical: 1-3 days
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

## 🔒 **Security Measures**

### **Current Security Features**

✅ **API Key Encryption:** AES-256-GCM encryption for sensitive data  
✅ **JWT Authentication:** Secure token-based authentication  
✅ **Input Validation:** Comprehensive data validation  
✅ **SQL Injection Protection:** Prisma ORM with parameterized queries  
✅ **Environment Security:** Secrets stored in environment variables  
✅ **CORS Protection:** Configured Cross-Origin Resource Sharing  

### **Security Best Practices**

When using Profolio:

- 🔐 **Change Default Passwords:** Never use default/example passwords
- 🌐 **Network Security:** Use HTTPS in production
- 🔄 **Keep Updated:** Regularly update to latest version
- 🏠 **Firewall Protection:** Secure your server environment
- 💾 **Backup Security:** Encrypt sensitive backups

## ⚠️ **Known Security Considerations**

### **Self-Hosted Security**
As a self-hosted application, security depends on:
- Server configuration and hardening
- Network security setup
- Regular system updates
- Proper firewall configuration

### **API Key Management**
- API keys are encrypted with AES-256-GCM
- Demo mode stores keys in browser localStorage only
- Production mode stores encrypted keys on server
- Users should use strong, unique API passwords

## 🛠️ **Security Configuration**

### **Production Deployment**
```bash
# Ensure secure configuration
- Use HTTPS with proper SSL certificates
- Configure firewall to limit access
- Use strong database passwords
- Enable fail2ban for SSH protection
- Regular security updates
```

### **Environment Variables**
Ensure these are properly secured:
```bash
JWT_SECRET=strong-random-secret-here
API_ENCRYPTION_KEY=32-byte-encryption-key
DATABASE_URL=postgresql://user:password@host:port/db
```

## 📋 **Security Checklist**

Before deploying to production:

- [ ] Changed all default passwords
- [ ] Configured HTTPS/SSL
- [ ] Set strong JWT secrets
- [ ] Configured firewall rules
- [ ] Limited database access
- [ ] Enabled security logging
- [ ] Tested backup/recovery
- [ ] Reviewed network exposure

## 🔍 **Security Auditing**

### **Regular Security Reviews**
We regularly review:
- Dependency vulnerabilities
- Code security patterns
- Authentication mechanisms
- Data encryption practices

### **Community Security**
Security contributions welcome:
- Security-focused code reviews
- Vulnerability assessments
- Security documentation improvements
- Security feature suggestions

## 📞 **Contact**

For security-related questions or concerns:
- **Primary:** Create a private GitHub issue
- **Backup:** Use GitHub Discussions with security tag

## 🏆 **Security Hall of Fame**

Contributors who responsibly disclose security issues will be recognized here (with permission).

---

## 💼 **Legal**

This security policy is provided under the same MIT License as the project. By reporting vulnerabilities, you agree to responsible disclosure practices.

**Security is a shared responsibility between the project maintainers and users. Thank you for helping keep Profolio secure! 🛡️** 