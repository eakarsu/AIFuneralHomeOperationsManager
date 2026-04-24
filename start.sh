#!/bin/bash

# ============================================================
# Eternal Haven Funeral Home - Operations Manager
# Start Script - Sets up and launches the application
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                          ║${NC}"
echo -e "${PURPLE}║    ${CYAN}ETERNAL HAVEN FUNERAL HOME${PURPLE}                            ║${NC}"
echo -e "${PURPLE}║    ${CYAN}AI Operations Manager${PURPLE}                                 ║${NC}"
echo -e "${PURPLE}║                                                          ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}[✓] Environment variables loaded${NC}"
else
    echo -e "${RED}[✗] .env file not found! Please create one based on .env.example${NC}"
    exit 1
fi

APP_PORT=${PORT:-4000}

# ============================================================
# Step 1: Kill processes on used ports
# ============================================================
echo ""
echo -e "${YELLOW}[1/6] Cleaning up used ports...${NC}"

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}  Port $port freed${NC}"
    else
        echo -e "${GREEN}  Port $port is available${NC}"
    fi
}

cleanup_port $APP_PORT

# ============================================================
# Step 2: Check prerequisites
# ============================================================
echo ""
echo -e "${YELLOW}[2/6] Checking prerequisites...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}  [✓] Node.js ${NODE_VERSION}${NC}"
else
    echo -e "${RED}  [✗] Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}  [✓] npm ${NPM_VERSION}${NC}"
else
    echo -e "${RED}  [✗] npm is not installed${NC}"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | head -n 1)
    echo -e "${GREEN}  [✓] ${PSQL_VERSION}${NC}"
else
    echo -e "${RED}  [✗] PostgreSQL is not installed. Please install PostgreSQL${NC}"
    exit 1
fi

# Check if PostgreSQL is running
if pg_isready &> /dev/null; then
    echo -e "${GREEN}  [✓] PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}  [!] PostgreSQL is not running. Attempting to start...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
            echo -e "${RED}  [✗] Could not start PostgreSQL. Please start it manually.${NC}"
            exit 1
        }
    else
        sudo systemctl start postgresql 2>/dev/null || {
            echo -e "${RED}  [✗] Could not start PostgreSQL. Please start it manually.${NC}"
            exit 1
        }
    fi
    sleep 2
    echo -e "${GREEN}  [✓] PostgreSQL started${NC}"
fi

# ============================================================
# Step 3: Setup Database
# ============================================================
echo ""
echo -e "${YELLOW}[3/6] Setting up database...${NC}"

# Extract DB credentials from DATABASE_URL
DB_NAME="funeral_home_db"
DB_USER="funeral_admin"
DB_PASS="funeral_pass_2024"

# Create user if not exists
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}'" 2>/dev/null | grep -q 1 || {
    psql -U postgres -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}' CREATEDB;" 2>/dev/null || {
        echo -e "${YELLOW}  [!] Could not create user with postgres superuser. Trying current user...${NC}"
        createuser -s ${DB_USER} 2>/dev/null || echo -e "${YELLOW}  [!] User may already exist${NC}"
        psql -d postgres -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" 2>/dev/null || true
    }
    echo -e "${GREEN}  [✓] Database user created${NC}"
}

# Create database if not exists
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" 2>/dev/null | grep -q 1 || {
    psql -U postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" 2>/dev/null || {
        echo -e "${YELLOW}  [!] Trying alternative database creation...${NC}"
        createdb -O ${DB_USER} ${DB_NAME} 2>/dev/null || echo -e "${YELLOW}  [!] Database may already exist${NC}"
    }
    echo -e "${GREEN}  [✓] Database created${NC}"
}

echo -e "${GREEN}  [✓] Database '${DB_NAME}' ready${NC}"

# ============================================================
# Step 4: Install Dependencies
# ============================================================
echo ""
echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"

npm install --silent 2>&1 | tail -1
echo -e "${GREEN}  [✓] Dependencies installed${NC}"

# ============================================================
# Step 5: Seed Database
# ============================================================
echo ""
echo -e "${YELLOW}[5/6] Seeding database with sample data...${NC}"

node server/seed.js
echo -e "${GREEN}  [✓] Database seeded successfully${NC}"

# ============================================================
# Step 6: Start Application with Hot Reload
# ============================================================
echo ""
echo -e "${YELLOW}[6/6] Starting application with hot reload...${NC}"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║  ${CYAN}Application is starting...${GREEN}                               ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║  ${CYAN}URL:${NC}      http://localhost:${APP_PORT}${GREEN}                        ║${NC}"
echo -e "${GREEN}║  ${CYAN}Login:${NC}    admin@eternalhaven.com / admin123${GREEN}               ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║  ${YELLOW}Hot reload enabled - changes auto-restart server${GREEN}        ║${NC}"
echo -e "${GREEN}║  ${YELLOW}Press Ctrl+C to stop${GREEN}                                    ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start with nodemon for hot reload (watches server/ and public/ directories)
npx nodemon --watch server --watch public --ext js,html,css,json server/index.js
