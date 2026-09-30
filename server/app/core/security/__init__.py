"""
app/core/security

Autenticación y autorización basada en Better Auth y tokens JWT.
"""

from app.core.security.auth import Admin, AdminUser, AuthUser, CurrentUser, Role, require_role

__all__ = ["Admin", "AdminUser", "AuthUser", "CurrentUser", "Role", "require_role"]
