# Discord Authentication Setup Guide

This guide explains how to set up Discord OAuth2 authentication for the Usogui fansite.

## Overview

The site now uses Discord as the primary (and only) authentication method. Users can:
- Login/register with Discord (automatic registration on first login)
- Use development bypass for testing (development only)
- Admin users are automatically assigned based on Discord ID

## Discord Application Setup

### 1. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Usogui Fansite" (or your preferred name)
4. Click "Create"

### 2. Configure OAuth2
1. Go to "OAuth2" tab in your application
2. Add redirect URIs:
   - Development: `http://localhost:3001/api/auth/discord/callback`
   - Production: `https://yourdomain.com/api/auth/discord/callback`
3. Save changes

### 3. Get Credentials
1. Go to "OAuth2" tab
2. Copy "Client ID"
3. Copy "Client Secret" (click "Reset Secret" if needed)

## Environment Configuration

### Backend (.env)
```bash
# Discord OAuth2 Authentication
DISCORD_CLIENT_ID=your_discord_application_client_id
DISCORD_CLIENT_SECRET=your_discord_application_client_secret
DISCORD_CALLBACK_URL=http://localhost:3001/api/auth/discord/callback
ADMIN_DISCORD_ID=your_discord_user_id_for_admin_access

# Other existing config...
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Get Your Discord User ID (for Admin Access)

1. Enable Developer Mode in Discord:
   - Settings → App Settings → Advanced → Developer Mode (ON)
2. Right-click your username in Discord
3. Click "Copy User ID"
4. Use this ID in `ADMIN_DISCORD_ID` environment variable

## Database Migration

Run the database migration to add Discord fields:

```bash
cd server
yarn typeorm migration:run
```

## Development Authentication

### Option 1: Discord OAuth (Recommended for Production Testing)
- Click "Continue with Discord" on login page
- Redirects to Discord for authorization
- Returns to site with authentication

### Option 2: Development Bypass (Development Only)
- Available when `NODE_ENV=development`
- "Dev Login (User)" - Login as regular user
- "Dev Login (Admin)" - Login as admin user
- Bypasses Discord entirely for quick testing

## Authentication Flow

### New Users
1. Click "Continue with Discord"
2. Redirected to Discord OAuth
3. Authorize the application
4. Automatically registered and logged in
5. Admin role assigned if Discord ID matches `ADMIN_DISCORD_ID`

### Existing Users
1. Same flow as new users
2. Existing account updated with latest Discord info
3. Role preserved (unless promoted to admin)

## Legacy Authentication

The old email/password authentication has been moved to `/auth/legacy/*` endpoints and is preserved in the `server/src/modules/auth/legacy/` folder for future reference. The frontend no longer uses these endpoints.

## API Endpoints

### New Discord Endpoints
- `GET /api/auth/discord` - Start Discord OAuth flow
- `GET /api/auth/discord/callback` - Handle Discord callback
- `POST /api/auth/dev-login` - Development bypass (dev only)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Legacy Endpoints (Preserved)
- `POST /auth/legacy/register` - Legacy registration
- `POST /auth/legacy/login` - Legacy login
- All other legacy auth endpoints preserved

## Troubleshooting

### "Discord application not found"
- Verify `DISCORD_CLIENT_ID` is correct
- Check Discord application exists and is not deleted

### "Invalid redirect URI"
- Verify callback URL matches exactly in Discord application settings
- Check `DISCORD_CALLBACK_URL` environment variable

### "Development login not available"
- Only works when `NODE_ENV=development`
- Not available in production for security

### "Popup blocked"
- Browser blocked popup, will fallback to redirect
- Allow popups for better UX (optional)

### Admin not working
- Verify `ADMIN_DISCORD_ID` matches your Discord user ID exactly
- Check Discord ID was copied correctly (right-click username → Copy User ID)

## Production Deployment

1. Update Discord application redirect URIs for production domain
2. Set production environment variables
3. Set `NODE_ENV=production` (removes dev login options)
4. Run migrations: `yarn typeorm migration:run`
5. Deploy both backend and frontend

## Security Notes

- Discord client secret must be kept secure
- Development bypass is automatically disabled in production
- JWT tokens are still used for session management
- Refresh tokens are stored and managed securely
