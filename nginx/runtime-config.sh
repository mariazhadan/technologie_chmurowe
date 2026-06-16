#!/bin/sh
set -eu

CONFIG_FILE=/usr/share/nginx/html/config.js
PUBLIC_APP_URL_VALUE=${PUBLIC_APP_URL:-http://localhost}
OAUTH_AUTH_URL_VALUE=${VITE_OAUTH_AUTHORIZATION_URL:-https://accounts.google.com/o/oauth2/v2/auth}

js_string() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

write_config_value() {
  key=$1
  value=$2
  printf '  "%s": "%s",\n' "$key" "$(js_string "$value")" >> "$CONFIG_FILE"
}

cat > "$CONFIG_FILE" <<'EOF'
window.__XPO_CONFIG__ = {
EOF

write_config_value "PUBLIC_APP_URL" "$PUBLIC_APP_URL_VALUE"
write_config_value "VITE_API_BASE" "${VITE_API_BASE:-$PUBLIC_APP_URL_VALUE}"
write_config_value "VITE_OAUTH_AUTHORIZATION_URL" "$OAUTH_AUTH_URL_VALUE"
write_config_value "VITE_OAUTH_TOKEN_PATH" "${VITE_OAUTH_TOKEN_PATH:-/api/auth/token}"
write_config_value "VITE_OAUTH_CLIENT_ID" "${VITE_OAUTH_CLIENT_ID:-CHANGE_ME_GOOGLE_CLIENT_ID}"
write_config_value "VITE_OAUTH_REDIRECT_URI" "${VITE_OAUTH_REDIRECT_URI:-$PUBLIC_APP_URL_VALUE/oauth/callback}"
write_config_value "VITE_GOOGLE_REDIRECT_URI" "${VITE_GOOGLE_REDIRECT_URI:-$PUBLIC_APP_URL_VALUE/oauth/callback}"
write_config_value "VITE_OAUTH_SCOPE" "${VITE_OAUTH_SCOPE:-openid email profile}"
write_config_value "VITE_OAUTH_LOGOUT_URL" "${VITE_OAUTH_LOGOUT_URL:-}"

cat >> "$CONFIG_FILE" <<'EOF'
};
EOF
