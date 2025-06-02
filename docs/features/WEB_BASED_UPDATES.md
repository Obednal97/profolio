# 🔄 Web-Based Update System

**Professional web-based updates for self-hosted Profolio installations**

## 📋 **Overview**

The Web-Based Update System allows self-hosted Profolio users to update their installations directly from the web interface, eliminating the need to SSH into their servers and run terminal commands. The system provides automatic update detection, real-time progress tracking, and a seamless user experience.

## 🎯 **Key Benefits**

- ✅ **No SSH Required** - Update directly from the web interface
- ✅ **Automatic Detection** - Checks for updates every 24 hours
- ✅ **Real-Time Progress** - Live progress tracking with detailed logs
- ✅ **One-Click Updates** - Simple, professional update process
- ✅ **Safe & Secure** - Built-in rollback and error recovery
- ✅ **Professional UX** - Beautiful, intuitive interface

---

## 🚀 **How It Works**

### **1. Automatic Update Detection**
- System checks GitHub API every 24 hours for new releases
- Compares current version with latest stable release
- Shows notification badge when updates are available
- Caches results to prevent API rate limiting

### **2. User Notification**
- Animated badge appears in user menu when updates available
- Click notification to open comprehensive update modal
- Shows version comparison and release notes
- Provides one-click update installation

### **3. Update Process**
- Downloads latest version using existing installer script
- Provides real-time progress updates via Server-Sent Events
- Shows installation logs for transparency
- Automatically restarts services when complete

### **4. Safety Features**
- Automatic backup before update begins
- Rollback capability if update fails
- Error recovery with detailed error messages
- Cancel option during update process

---

## 🖥️ **User Interface**

### **Update Notification Badge**
Located in the user menu, the notification shows:
- 🔵 **Blue spinning** - Checking for updates
- 🔴 **Red pulsing** - Update available
- 🟢 **Green solid** - Update completed
- 🔴 **Red solid** - Update failed

### **Update Modal**
Comprehensive interface featuring:
- **Version Comparison** - Current vs latest version
- **Release Information** - Publication date and GitHub link
- **Release Notes** - Formatted changelog with improvements
- **Progress Tracking** - Real-time progress bar and status
- **Installation Logs** - Terminal-style log viewer
- **Action Buttons** - Check, Install, Cancel, Close

---

## ⚙️ **Configuration**

### **Environment Variables**

```bash
# Disable updates (optional)
NEXT_PUBLIC_DISABLE_UPDATES=true

# Set deployment mode (auto-detected)
NEXT_PUBLIC_DEPLOYMENT_MODE=self-hosted

# Backend API URL (auto-detected)
NEXT_PUBLIC_API_URL=http://your-server:3001
```

### **Self-Hosted Mode Detection**
Updates are automatically enabled when:
- ✅ `DEPLOYMENT_MODE` ≠ `cloud`
- ✅ `NODE_ENV` ≠ `development`
- ✅ `DISABLE_UPDATES` is not set

---

## 🔧 **Technical Implementation**

### **Backend Components**

#### **UpdatesService** (`backend/src/updates/updates.service.ts`)
- GitHub API integration for release checking
- Version comparison and caching logic
- Update process execution and monitoring
- Automatic background checking (24-hour intervals)

#### **UpdatesController** (`backend/src/updates/updates.controller.ts`)
- REST API endpoints for update management
- Server-Sent Events for real-time progress
- Authentication and error handling

#### **API Endpoints**
```
GET    /api/updates/check     # Check for updates
POST   /api/updates/check     # Force check (bypass cache)
GET    /api/updates/status    # Get current update status
POST   /api/updates/start     # Start update process
POST   /api/updates/cancel    # Cancel ongoing update
POST   /api/updates/clear     # Clear update status
SSE    /api/updates/progress  # Real-time progress stream
GET    /api/updates/history   # Get update history
```

### **Frontend Components**

#### **useUpdates Hook** (`frontend/src/hooks/useUpdates.ts`)
- React hook for update state management
- API integration and caching
- Real-time progress tracking via SSE
- 24-hour automatic checking interval

#### **UpdateNotification** (`frontend/src/components/updates/UpdateNotification.tsx`)
- Notification badge component
- Status indicators and animations
- Integration with user menu

#### **UpdateModal** (`frontend/src/components/updates/UpdateModal.tsx`)
- Comprehensive update interface
- Version comparison and release notes
- Progress tracking and log viewing
- Error handling and recovery

---

## 🔒 **Security Features**

### **Access Control**
- ✅ **Authentication Required** - Uses existing JWT authentication
- ✅ **Self-Hosted Only** - Disabled in cloud/development environments
- ✅ **Permission Validation** - Verifies sudo access for installer

### **Update Safety**
- ✅ **Automatic Backup** - Installer creates backup before update
- ✅ **Rollback Protection** - Can revert if update fails
- ✅ **Service Management** - Graceful service restart
- ✅ **Error Recovery** - Clear error messages and recovery options

### **Data Protection**
- ✅ **Environment Preservation** - Protects configuration files
- ✅ **Database Safety** - No data loss during updates
- ✅ **Network Security** - Secure API communication

---

## 📱 **User Experience Flow**

### **1. Update Available**
1. System detects new version (background check)
2. Red pulsing badge appears in user menu
3. Tooltip shows "Update available: v1.2.3 → v1.2.4"

### **2. View Update**
1. User clicks update notification
2. Modal opens showing version comparison
3. Release notes and publication date displayed
4. "Install Update" button prominently shown

### **3. Install Update**
1. User clicks "Install Update" button
2. Real-time progress bar appears
3. Status updates: Checking → Downloading → Installing → Restarting
4. Installation logs stream in real-time

### **4. Update Complete**
1. Green success indicator appears
2. "Update completed successfully" message
3. Modal auto-closes after 3 seconds
4. User can continue using updated system

---

## 🛠️ **Installation & Setup**

### **Automatic Setup**
The update system is automatically included in Profolio v1.2.4+ installations. No additional setup required for new installations.

### **Existing Installations**
Update to v1.2.4+ using the terminal installer, then the web-based update system will be available for future updates:

```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | sudo bash
```

### **Verification**
After installation, verify the update system:
1. Login to your Profolio web interface
2. Look for update icon in user menu (next to notifications)
3. Click update icon to open update modal
4. Should show "Your system is up to date"

---

## 🔍 **Troubleshooting**

### **Update Badge Not Showing**
- ✅ Verify you're in self-hosted mode (not cloud/development)
- ✅ Check that `DISABLE_UPDATES` is not set
- ✅ Ensure user is logged in (authentication required)
- ✅ Wait up to 24 hours for first automatic check

### **Update Check Fails**
- ✅ Verify internet connectivity from server
- ✅ Check GitHub API rate limits (60 requests/hour)
- ✅ Review backend logs for API errors
- ✅ Try manual check with "Check for Updates" button

### **Update Installation Fails**
- ✅ Verify sudo access for profolio user
- ✅ Check installer script exists at `/opt/profolio/install-or-update.sh`
- ✅ Review installation logs in update modal
- ✅ Use manual rollback if needed: `--rollback` option

### **Progress Not Updating**
- ✅ Check Server-Sent Events support in browser
- ✅ Verify WebSocket/SSE not blocked by firewall
- ✅ Refresh page and try update again
- ✅ Check backend logs for SSE errors

---

## 📊 **API Reference**

### **UpdateInfo Interface**
```typescript
interface UpdateInfo {
  currentVersion: string;      // Current installed version
  latestVersion: string;       // Latest available version
  hasUpdate: boolean;          // Whether update is available
  releaseNotes: string;        // Markdown release notes
  publishedAt: string;         // Release publication date
  downloadUrl: string;         // GitHub release URL
}
```

### **UpdateProgress Interface**
```typescript
interface UpdateProgress {
  stage: 'checking' | 'downloading' | 'installing' | 'restarting' | 'complete' | 'error';
  message: string;             // Human-readable status message
  progress: number;            // 0-100 percentage complete
  error?: string;              // Error message if failed
  logs?: string[];             // Installation log lines
}
```

### **Example API Usage**
```typescript
// Check for updates
const updateInfo = await fetch('/api/updates/check').then(r => r.json());

// Start update
await fetch('/api/updates/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ version: '1.2.4' }) // Optional specific version
});

// Real-time progress
const eventSource = new EventSource('/api/updates/progress');
eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(progress);
};
```

---

## 🔗 **Related Documentation**

- [Installation Guide](../installation/QUICK_START.md)
- [Installer Documentation](../installer/INSTALLER_GUIDE.md)
- [Release Process](../processes/RELEASE_PROCESS_GUIDE.md)
- [Self-Hosted Deployment](../deployment/SELF_HOSTED.md)

---

## 🎯 **Future Enhancements**

### **Planned Features**
- 📅 **Update Scheduling** - Schedule updates for specific times
- 📊 **Update History** - View past update history and logs
- 🔔 **Email Notifications** - Email alerts for available updates
- 🎚️ **Update Channels** - Choose stable, beta, or dev releases
- 📱 **Mobile App Integration** - Update from mobile app
- 🔄 **Automatic Updates** - Optional fully automatic updates

### **Advanced Features**
- 🏗️ **Staged Rollouts** - Gradual update deployment
- 🧪 **Update Testing** - Pre-update compatibility checks
- 📦 **Custom Packages** - Install custom/private updates
- 🌐 **Multi-Server Updates** - Update multiple instances
- 📈 **Analytics Integration** - Update success/failure metrics

---

**The Web-Based Update System transforms Profolio maintenance from a technical task into a seamless, professional experience that any user can confidently perform.** 