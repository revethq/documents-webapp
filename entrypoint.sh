#!/bin/sh
set -e

# Sanitize a value for safe JavaScript string embedding
# Escapes backslashes, quotes, and newlines to prevent injection
sanitize() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e "s/'/\\'/g" -e ':a;N;$!ba;s/\n/\\n/g'
}

# Generate runtime config with sanitized values
cat > /app/public/__config.js << EOF
window.__ENV__ = {
  API_URL: "$(sanitize "$NEXT_PUBLIC_API_URL")",
  OIDC_AUTHORIZATION_SERVER_URI: "$(sanitize "$NEXT_PUBLIC_OIDC_AUTHORIZATION_SERVER_URI")",
  OIDC_CLIENT_ID: "$(sanitize "$NEXT_PUBLIC_OIDC_CLIENT_ID")",
  OIDC_REDIRECT_URI: "$(sanitize "$NEXT_PUBLIC_OIDC_REDIRECT_URI")",
  OIDC_SCOPE: "$(sanitize "$NEXT_PUBLIC_OIDC_SCOPE")"
};
EOF

echo "Runtime config generated:"
cat /app/public/__config.js

exec node server.js
