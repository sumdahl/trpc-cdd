🚨 Fix: JWT Logout Does Not Invalidate Active Session
Problem

Logout only invalidates the refresh token, while the access token remains valid.
Result: User can still access protected routes (/auth/me) after logout.

Expected Behavior
Logout must terminate the session immediately
All protected endpoints should return 401 Unauthorized after logout
Root Cause
JWT access tokens are stateless
Backend does not track or revoke active access tokens
Only refresh token is removed → current session still valid
Solution Strategy
✅ Recommended: Token Blacklisting (Redis)
Store invalidated access tokens (or jti) in Redis
Add TTL = access token expiry
On each request → check blacklist before allowing access
Required Changes
1. Logout Flow
Delete refresh token (existing ✅)
Add access token (or jti) to Redis blacklist
2. Auth Middleware
Extract token / jti
Check Redis:
If blacklisted → reject (401)
Else → allow
3. Token Generation
Include unique jti in access token payload
4. Data Store (Redis)
Key: blacklist:<jti>
Value: true
TTL: match token expiration
