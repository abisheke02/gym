#!/bin/bash
# ============================================================
# IRONMAN FITNESS GYM CRM — Server Deploy Script
# Run this on the Ubuntu server as the deploy user
# Usage: bash deploy.sh
# ============================================================

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

APP_DIR="$HOME/gym"
REPO="https://github.com/abisheke02/gym.git"

echo ""
echo "=============================================="
echo "  IRONMAN FITNESS GYM CRM — Deploy"
echo "=============================================="
echo ""

# ── 1. Clone or pull latest code ────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "Pulling latest code..."
  cd "$APP_DIR"
  git pull origin main
else
  log "Cloning repo..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 2. Backend .env ─────────────────────────────────────────
if [ ! -f "$APP_DIR/backend/.env" ]; then
  warn ".env not found — creating from template"
  cat > "$APP_DIR/backend/.env" << 'ENVEOF'
PORT=5000
NODE_ENV=production

# ── REQUIRED: Fill these in ──
DATABASE_URL=postgresql://postgres.ehbfmayjhxjgeqboteji:YOUR_NEW_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
JWT_SECRET=PASTE_JWT_SECRET_HERE
ADMIN_PASSWORD=PASTE_ADMIN_PASSWORD_HERE
FRONTEND_URL=https://YOURDOMAIN.COM

# ── Razorpay ──────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=placeholder_secret

# ── WhatsApp (optional) ───────────────────────────────────
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=
META_VERIFY_TOKEN=
META_APP_SECRET=

# ── SMTP (password reset) ─────────────────────────────────
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@ironmanfitness.com

# ── Business ──────────────────────────────────────────────
LEAD_RESPONSE_SLA=10
DEFAULT_ANNUAL_PRICE=10000
ENVEOF
  fail "Edit backend/.env with your real values then run this script again"
fi

# ── 3. Install backend dependencies ─────────────────────────
log "Installing backend dependencies..."
cd "$APP_DIR/backend"
npm ci --omit=dev

# ── 4. Initialize database ───────────────────────────────────
log "Initializing database (creating tables if not exist)..."
node src/db/init.js && log "Database ready" || warn "DB init had warnings — check above"

# ── 5. Install frontend dependencies & build ─────────────────
log "Installing frontend dependencies..."
cd "$APP_DIR/frontend"
npm ci

log "Building frontend..."
VITE_API_URL=/api npm run build
log "Frontend built → frontend/dist/"

# ── 6. PM2 ──────────────────────────────────────────────────
log "Starting backend with PM2..."
cd "$APP_DIR"
pm2 delete gymcrm 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
log "PM2 started (gymcrm on port 5000)"

# ── 7. Nginx config ──────────────────────────────────────────
DOMAIN=$(grep FRONTEND_URL "$APP_DIR/backend/.env" | cut -d'=' -f2 | sed 's|https\?://||' | sed 's|/.*||')

log "Writing Nginx config for domain: $DOMAIN"
sudo tee /etc/nginx/sites-available/gymcrm > /dev/null << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/gymcrm /etc/nginx/sites-enabled/gymcrm
sudo nginx -t && sudo systemctl reload nginx
log "Nginx configured and reloaded"

# ── 8. SSL (only if domain is real) ──────────────────────────
if [[ "$DOMAIN" != "localhost" && "$DOMAIN" != "YOURDOMAIN.COM" ]]; then
  log "Getting SSL certificate for $DOMAIN..."
  sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "abi.tvm02@gmail.com" || warn "SSL failed — run manually: sudo certbot --nginx -d $DOMAIN"
else
  warn "Skipping SSL — update FRONTEND_URL in .env with your real domain first"
fi

echo ""
echo "=============================================="
log "Deploy complete!"
echo ""
echo "  Backend:  http://localhost:5000/health"
echo "  Frontend: http://$DOMAIN"
echo ""
echo "  PM2 logs:   pm2 logs gymcrm"
echo "  PM2 status: pm2 status"
echo "=============================================="
