# Google SSO Setup Guide

## Google Cloud Console Configuration

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API or Google People API

### 2. Configure OAuth 2.0 Credentials
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Select **Web application** as the application type
4. Configure the following settings:

#### Authorized JavaScript Origins
Add these URLs (replace `your-domain.com` with your actual domain):
- `http://localhost:3000` (for local development)
- `https://your-domain.com` (for production)

#### Authorized Redirect URIs
Add these URLs:
- `http://localhost:3000/api/auth/callback/google` (for local development)
- `https://your-domain.com/api/auth/callback/google` (for production)

### 3. Environment Variables
After creating the OAuth client, add these environment variables to your `.env.local` file:

```env
# Google OAuth Configuration
AUTH_GOOGLE_ID=your-google-client-id-here
AUTH_GOOGLE_SECRET=your-google-client-secret-here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### 4. Generate NextAuth Secret
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## Testing the Integration

### Local Development
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Continue with Google" on either the sign-in or sign-up page
4. Complete the Google OAuth flow

### Expected Behavior
1. **New Google Users**: 
   - Profile auto-created from Google data
   - Redirected to resume upload page to complete setup
   
2. **Existing Google Users with Profile**: 
   - Redirected directly to dashboard
   
3. **Existing Email/Password Users**: 
   - Can continue using traditional login
   - Google account will be linked if same email

## Security Considerations

1. **Environment Variables**: Never commit OAuth credentials to version control
2. **HTTPS**: Always use HTTPS in production
3. **Domain Verification**: Verify authorized domains in Google Console
4. **Scope Limitations**: Only request necessary Google scopes

## Troubleshooting

### Common Issues
1. **Redirect URI Mismatch**: Ensure redirect URIs in Google Console match exactly
2. **Invalid Client**: Check that CLIENT_ID and CLIENT_SECRET are correct
3. **NEXTAUTH_SECRET Missing**: Ensure NEXTAUTH_SECRET is set in environment
4. **Database Connection**: Verify Prisma database connection is working

### Debug Mode
Add this to your `.env.local` for detailed NextAuth debugging:
```env
NEXTAUTH_DEBUG=true
```

## Implementation Summary

The Google SSO integration includes:

✅ **Hybrid Authentication System**
- Supports both JWT and NextAuth sessions
- Backward compatible with existing users

✅ **Smart Routing**
- Profile existence check after Google login
- Automatic redirection based on user state

✅ **Auto Profile Creation**
- Creates profile from Google data for new users
- Extracts first/last name from Google profile

✅ **UI Integration**
- Google sign-in button on both pages
- Consistent styling with existing design

✅ **Database Integration**
- NextAuth Prisma adapter
- Enhanced User model for OAuth support