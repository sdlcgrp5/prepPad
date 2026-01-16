# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in PrepPad, please email security@preppad.xyz instead of using the issue tracker.

## Security Best Practices

### For Contributors

1. **Never commit secrets**
   - No API keys, passwords, or tokens in code
   - Always use environment variables
   - Check .env files are in .gitignore

2. **Sensitive Data**
   - Never commit user data (resumes, profiles)
   - Never commit database files
   - Test files should use fake data only

3. **Before Committing**
   - Run: `git diff` to review changes
   - Check for any hardcoded credentials
   - Verify .env files not staged

### Environment Variables Required

See `.env.example` files for complete list.

#### Critical Secrets
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` / `JWT_SECRET_KEY` - Token signing
- `NEXTAUTH_SECRET` - NextAuth session encryption
- `ANTHROPIC_API_KEY` - Claude AI (or DEEPSEEK_API_KEY)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - OAuth

### Deployed Environments

- **Development**: http://localhost:3000
- **Production**: https://preppad.xyz
- **API**: https://api.preppad.xyz

### Security Headers

Production uses:
- HTTPS only
- Secure session cookies
- CSRF protection
- Rate limiting
- CORS restrictions