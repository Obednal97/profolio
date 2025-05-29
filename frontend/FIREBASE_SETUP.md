# Firebase Authentication Setup Guide

## Current Status ✅
- Firebase project: `profolio-9c8e0`
- Firebase SDK installed
- Authentication system implemented
- Email/Password authentication ready
- Google authentication ready (needs console setup)

## Firebase Console Setup Required

### 1. Enable Authentication Methods

1. Go to [Firebase Console](https://console.firebase.google.com/project/profolio-9c8e0/authentication/providers)
2. Sign in with your Google account
3. Click on "Authentication" in the left sidebar
4. Go to "Sign-in method" tab
5. Enable the following providers:

#### Email/Password
- Click on "Email/Password"
- Enable "Email/Password"
- Click "Save"

#### Google
- Click on "Google"
- Enable "Google"
- Add your project's authorized domains:
  - `localhost` (for development)
  - `profolio.app` (for production)
  - Any other domains you'll use
- Click "Save"

### 2. Configure Authorized Domains

1. In the Authentication section, go to "Settings" tab
2. Scroll down to "Authorized domains"
3. Add these domains:
   - `localhost` (for development)
   - `127.0.0.1` (for development)
   - `profolio.app` (for production)
   - Any other domains you'll deploy to

### 3. Optional: Customize Email Templates

1. Go to "Templates" tab in Authentication
2. Customize the email templates for:
   - Email verification
   - Password reset
   - Email address change

## Features Implemented ✅

### Authentication Methods
- ✅ Email/Password sign up
- ✅ Email/Password sign in
- ✅ Google sign in/sign up
- ✅ Password reset via email
- ✅ Automatic token management
- ✅ Auth state persistence

### Pages Created
- ✅ `/auth/signIn` - Sign in page
- ✅ `/auth/signUp` - Sign up page  
- ✅ `/auth/forgot-password` - Password reset page

### Security Features
- ✅ Form validation
- ✅ Password strength requirements
- ✅ Email format validation
- ✅ Error handling
- ✅ Loading states
- ✅ Auto-redirect when authenticated

## Testing the Authentication

### 1. Test Email/Password Authentication

1. Start the development server: `npm run dev`
2. Go to `http://localhost:3001/auth/signUp`
3. Create a new account with:
   - Valid email address
   - Strong password (8+ chars, uppercase, lowercase, number, special char)
   - Full name
4. Check your email for verification (if enabled)
5. Try signing in at `http://localhost:3001/auth/signIn`

### 2. Test Google Authentication

1. Make sure Google provider is enabled in Firebase Console
2. Go to sign in or sign up page
3. Click "Continue with Google"
4. Complete Google OAuth flow
5. Should redirect to dashboard

### 3. Test Password Reset

1. Go to `http://localhost:3001/auth/forgot-password`
2. Enter your email address
3. Check your email for reset link
4. Follow the link to reset password

## Code Structure

### Authentication Context (`/lib/auth.ts`)
- `AuthProvider` - React context provider
- `useAuth()` - Hook for authentication state and methods
- Methods: `signIn`, `signUp`, `signInWithGoogleProvider`, `signOut`, `resetUserPassword`

### Firebase Service (`/lib/firebase.ts`)
- Firebase configuration and initialization
- Authentication helper functions
- Token management

### Pages
- Sign in page with email/password and Google options
- Sign up page with validation and Google options
- Password reset page with email verification

## Environment Variables

No environment variables needed - configuration is in `/public/firebase-config.json`

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to authorized domains in Firebase Console

2. **"Firebase: Error (auth/popup-blocked)"**
   - Browser is blocking popups for Google sign in
   - Allow popups for your domain

3. **"Firebase: Error (auth/user-not-found)"**
   - User doesn't exist, redirect to sign up

4. **"Firebase: Error (auth/wrong-password)"**
   - Invalid password, show error message

5. **Google Sign In not working**
   - Check that Google provider is enabled
   - Verify authorized domains are set
   - Check browser console for errors

### Debug Mode

Add this to see authentication state changes:
```javascript
// In your component
useEffect(() => {
  console.log('Auth state:', { user, loading, token });
}, [user, loading, token]);
```

## Next Steps

1. ✅ Enable authentication methods in Firebase Console
2. ✅ Test all authentication flows
3. ✅ Set up email templates (optional)
4. ✅ Add user profile management
5. ✅ Implement role-based access control (if needed)

## Production Checklist

- [ ] Enable authentication methods in Firebase Console
- [ ] Add production domain to authorized domains
- [ ] Test all authentication flows in production
- [ ] Set up proper error monitoring
- [ ] Configure email templates
- [ ] Set up user management workflows 