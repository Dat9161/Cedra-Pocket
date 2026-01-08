# Cedra GameFi Backend Setup Guide

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Node.js (version 16 or higher)
node --version

# npm or yarn
npm --version
```

### 2. Installation

```bash
# Clone or create project directory
mkdir cedra-gamefi-backend
cd cedra-gamefi-backend

# Copy integration files
cp integration/* .

# Install dependencies
npm install
```

### 3. Environment Setup

Create `.env` file:

```bash
# .env
PORT=3000
NODE_ENV=development

# Cedra Blockchain Configuration
CEDRA_RPC_URL=https://devnet.cedra.dev/v1
CONTRACT_ADDRESS=0x1
ADMIN_ADDRESS=0x123

# Ed25519 Keys (CHANGE THESE IN PRODUCTION!)
SERVER_PRIVATE_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
SERVER_PUBLIC_KEY=d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a

# Security
API_KEY=your_secure_api_key_here
JWT_SECRET=your_jwt_secret_here
```

### 4. Start Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Base URL: `http://localhost:3000`

### 1. Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1699123456789
}
```

### 2. Generate Reward Signature
```bash
POST /api/rewards/generate-signature
Content-Type: application/json

{
  "userAddress": "0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1",
  "amount": 100000,
  "nonce": 98765
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1a086010000000000cd810100000000",
    "signature": "abc123def456...",
    "publicKey": "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    "userAddress": "0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1",
    "amount": 100000,
    "nonce": 98765
  }
}
```

### 3. Check Reward Status
```bash
GET /api/rewards/status/{address}/{nonce}
```

**Example:**
```bash
GET /api/rewards/status/0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1/98765
```

### 4. Treasury Information
```bash
GET /api/treasury/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 10000000,
    "balanceFormatted": "10.000000 CEDRA",
    "isInitialized": true,
    "isPaused": false,
    "contractAddress": "0x1",
    "adminAddress": "0x123"
  }
}
```

### 5. System Configuration
```bash
GET /api/config
```

### 6. Test Wallet Signature (Development)
```bash
POST /api/rewards/generate-for-test-wallet
```

## 🧪 Testing

### Manual Testing with curl

```bash
# 1. Check health
curl http://localhost:3000/health

# 2. Generate signature for test wallet
curl -X POST http://localhost:3000/api/rewards/generate-for-test-wallet

# 3. Check treasury info
curl http://localhost:3000/api/treasury/info

# 4. Generate custom signature
curl -X POST http://localhost:3000/api/rewards/generate-signature \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1",
    "amount": 100000,
    "nonce": 12345
  }'
```

### Frontend Integration Test

```html
<!DOCTYPE html>
<html>
<head>
    <title>Cedra GameFi Test</title>
</head>
<body>
    <h1>Cedra GameFi Reward Test</h1>
    <button onclick="testReward()">Generate Test Reward</button>
    <div id="result"></div>

    <script>
        async function testReward() {
            try {
                const response = await fetch('http://localhost:3000/api/rewards/generate-for-test-wallet', {
                    method: 'POST'
                });
                
                const result = await response.json();
                document.getElementById('result').innerHTML = 
                    '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
                    
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    '<p style="color: red;">Error: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
```

## 🔐 Security Configuration

### 1. Generate New Ed25519 Keys

```javascript
// generate_keys.js
const { ed25519 } = require('@noble/ed25519');
const crypto = require('crypto');

async function generateKeys() {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    
    console.log('Private Key:', Buffer.from(privateKey).toString('hex'));
    console.log('Public Key:', Buffer.from(publicKey).toString('hex'));
}

generateKeys();
```

### 2. Production Environment Variables

```bash
# Production .env
NODE_ENV=production
PORT=3000

# Use your actual Cedra network
CEDRA_RPC_URL=https://mainnet.cedra.dev/v1
CONTRACT_ADDRESS=your_deployed_contract_address
ADMIN_ADDRESS=your_admin_address

# Generate new keys for production!
SERVER_PRIVATE_KEY=your_production_private_key
SERVER_PUBLIC_KEY=your_production_public_key

# Strong secrets
API_KEY=your_very_secure_api_key
JWT_SECRET=your_very_secure_jwt_secret
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
    restart: unless-stopped
```

### Build and Run
```bash
# Build image
docker build -t cedra-gamefi-backend .

# Run container
docker run -p 3000:3000 --env-file .env cedra-gamefi-backend

# Or use docker-compose
docker-compose up -d
```

## 📊 Monitoring & Logging

### 1. Add Logging Middleware

```javascript
// Add to your server
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console()
    ]
});

// Log all requests
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});
```

### 2. Health Check Endpoint

The server includes a comprehensive health check at `/health` that monitors:
- Server status
- Blockchain connectivity
- Treasury balance
- System configuration

## 🔧 Troubleshooting

### Common Issues

1. **Connection to Cedra RPC fails**
   ```bash
   # Check RPC URL
   curl https://devnet.cedra.dev/v1
   ```

2. **Invalid signature errors**
   - Verify Ed25519 keys are correct
   - Check message format matches Move contract
   - Ensure BCS serialization is correct

3. **Nonce already used**
   - Use unique nonces (timestamp recommended)
   - Check on-chain nonce status

4. **Treasury insufficient balance**
   - Check treasury balance via API
   - Fund treasury if needed

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Or set log level
LOG_LEVEL=debug npm start
```

## 📚 Next Steps

1. **Deploy Smart Contracts** to Cedra network
2. **Configure Production Keys** and environment
3. **Set up Database** for reward tracking
4. **Implement Authentication** for admin endpoints
5. **Add Rate Limiting** and security middleware
6. **Set up Monitoring** and alerting
7. **Create Frontend** integration

## 🆘 Support

For issues and questions:
- Check the logs in `logs/` directory
- Review API responses for error details
- Verify blockchain connectivity
- Ensure smart contracts are deployed and initialized

---

**🎮 Happy Gaming with Cedra GameFi! 🚀**