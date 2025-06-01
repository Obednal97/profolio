# Demo Session Management

## Overview

The Demo Session Management system provides secure, time-limited access to Profolio for potential users who want to explore the platform without creating an account. Demo sessions are automatically managed with a 24-hour limit and real market data integration.

## Features

### 🕐 **24-Hour Session Limit**
- Demo sessions automatically expire after exactly 24 hours
- Real-time session tracking with remaining time logging
- Automatic cleanup of all demo data when sessions expire

### 📊 **Real Market Data Access**
- Demo users get actual Yahoo Finance market data
- Live portfolio tracking with real stock/crypto prices
- Authentic market data widget with major indices
- Real symbol lookup for asset creation

### 🔒 **Secure Session Management**
- Isolated demo data that doesn't persist
- Automatic session validation every 5 minutes
- Secure token handling for demo API access
- Manual session termination capability

## How It Works

### Session Lifecycle

```mermaid
graph TD
    A[User clicks "Try Demo"] --> B[DemoSessionManager.startDemoSession()]
    B --> C[24-hour timer starts]
    C --> D[Demo data populated]
    D --> E[User explores platform]
    E --> F{Session expired?}
    F -->|No| G[Continue using demo]
    F -->|Yes| H[Auto logout & cleanup]
    G --> F
    H --> I[Redirect to landing page]
```

### Session Validation

The system performs automatic validation:
- **Initial Check**: When demo mode is accessed
- **Periodic Check**: Every 5 minutes via background interval
- **On-Demand Check**: When user performs authenticated actions

## Implementation

### DemoSessionManager Class

The core functionality is provided by the `DemoSessionManager` utility class:

```typescript
import { DemoSessionManager } from '@/lib/demoSession';

// Check if session is valid
const session = DemoSessionManager.checkDemoSession();
if (session.isValid) {
  console.log(`Demo active: ${session.remainingTime}ms left`);
}

// Get human-readable time remaining
const timeString = DemoSessionManager.getRemainingTimeString();
console.log(`Session expires in: ${timeString}`);

// Manual session termination
DemoSessionManager.endDemoSession();
```

### Key Methods

#### `startDemoSession()`
Initializes a new 24-hour demo session:
- Sets demo mode flag in localStorage
- Records session start timestamp
- Logs session initiation

#### `checkDemoSession()`
Validates current session and returns status:
```typescript
interface SessionStatus {
  isValid: boolean;
  remainingTime: number; // milliseconds
}
```

#### `endDemoSession()`
Manually terminates demo session:
- Removes all demo-related localStorage items
- Clears temporary user data
- Redirects to landing page

#### `getRemainingTimeString()`
Returns human-readable time remaining:
- Format: "23h 45m" or "45m" for final hour
- Returns "Expired" for invalid sessions

#### `setupPeriodicCheck()`
Establishes automatic session monitoring:
- Runs every 5 minutes
- Automatically ends expired sessions
- Prevents session overrun

## Usage Examples

### Basic Session Check

```typescript
// In a React component
const demoSession = DemoSessionManager.checkDemoSession();
const isDemoMode = demoSession.isValid;

if (isDemoMode) {
  console.log('🎭 Demo mode active');
  // Show demo-specific UI or data
}
```

### Session Status Display

```typescript
// Show remaining time to user
const timeRemaining = DemoSessionManager.getRemainingTimeString();

return (
  <div className="demo-status">
    Demo session expires in: {timeRemaining}
  </div>
);
```

### Manual Session Control

```typescript
// End demo session early
const handleEndDemo = () => {
  DemoSessionManager.endDemoSession();
  // User will be redirected to landing page
};
```

## Integration Points

### Authentication System

Demo sessions integrate with the unified authentication system:

```typescript
// In useAuth hook
const demoSession = DemoSessionManager.checkDemoSession();
if (demoSession.isValid) {
  // Set demo user
  setUser({
    id: 'demo-user-id',
    email: 'demo@profolio.com',
    name: 'Demo User'
  });
}
```

### Market Data Widget

Demo users receive real market data:

```typescript
// In market data components
const demoSession = DemoSessionManager.checkDemoSession();
const isDemoMode = demoSession.isValid;

// Demo users get real Yahoo Finance data
const headers = {
  'Content-Type': 'application/json',
  'x-demo-mode': isDemoMode ? 'true' : 'false'
};
```

### API Access

Demo users access backend APIs with proper tokens:

```typescript
// Frontend API route
function getUserFromToken(request: NextRequest) {
  const isDemoMode = request.headers.get('x-demo-mode') === 'true';
  
  if (isDemoMode) {
    return {
      id: 'demo-user-id',
      isDemo: true
    };
  }
  // ... handle real users
}
```

## Console Logging

The system provides detailed console feedback:

```
🎭 Demo session started - expires in 24 hours
🎭 Demo session active - 23h 45m remaining  
🎭 Demo mode: Fetching real market data with temporary session
🎭 Demo session expired after 24 hours
🎭 Demo session ended - all temporary data cleared
```

## Security Considerations

### Data Isolation
- Demo data is completely isolated from real user data
- All demo information stored in localStorage only
- No database persistence for demo sessions

### Session Security
- Sessions cannot be extended or renewed
- Automatic cleanup prevents data accumulation
- No permanent authentication tokens for demo users

### API Security
- Demo users have read-only access to market data
- Backend APIs validate demo tokens separately
- Demo mode header prevents data persistence

## Configuration

### Session Duration
The session duration is configurable in `DemoSessionManager`:

```typescript
private static readonly DEMO_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

### Validation Interval
Periodic checks can be adjusted:

```typescript
// Check every 5 minutes
setInterval(() => {
  // validation logic
}, 5 * 60 * 1000);
```

## Troubleshooting

### Common Issues

#### **Demo Session Not Starting**
- Check localStorage permissions
- Verify JavaScript execution in browser
- Ensure DemoSessionManager import is correct

#### **Session Expires Immediately**
- Check system clock accuracy
- Verify localStorage isn't being cleared by browser
- Ensure session duration constant is correct

#### **Periodic Validation Not Working**
- Check browser tab isn't suspended
- Verify setInterval isn't blocked
- Ensure DemoSessionManager module loads correctly

### Debug Commands

```javascript
// Check current session status
console.log(DemoSessionManager.checkDemoSession());

// View localStorage demo data
console.log({
  demoMode: localStorage.getItem('demo-mode'),
  sessionStart: localStorage.getItem('demo-session-start'),
  userData: localStorage.getItem('user-data')
});

// Force session end
DemoSessionManager.endDemoSession();
```

## Best Practices

### Implementation
1. **Always check session validity** before showing demo features
2. **Use session status** for conditional UI rendering
3. **Handle session expiration gracefully** in user interactions
4. **Provide clear feedback** about session limitations

### User Experience
1. **Inform users about time limits** upfront
2. **Show remaining time** in UI when helpful
3. **Provide easy session termination** option
4. **Guide users to registration** before expiration

### Security
1. **Never store sensitive data** in demo sessions
2. **Validate demo tokens** on backend
3. **Isolate demo operations** from real user data
4. **Monitor demo usage** for abuse prevention

## Future Enhancements

### Planned Features
- **Usage Analytics**: Track demo feature usage
- **Guided Tours**: Interactive onboarding for demo users
- **Feedback Collection**: Gather user feedback during demo
- **Extended Sessions**: Admin-configurable session durations

### Potential Improvements
- **Session Warnings**: Notify users before expiration
- **Data Export**: Allow demo users to export sample data
- **Multi-Device Sessions**: Sync demo sessions across devices
- **Progressive Features**: Unlock features as demo progresses

---

**The Demo Session Management system provides a secure, authentic preview of Profolio's capabilities while maintaining strict session boundaries and automatic cleanup.** 