# Web2 Backend Integration Guide

## Tổng quan Kiến trúc

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web2 Backend  │◄──►│   Integration   │◄──►│ Cedra Blockchain│
│   (Node.js/API) │    │     Layer       │    │  (Move Smart    │
│                 │    │                 │    │   Contracts)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 1. Backend API Setup

### 1.1 Tạo Node.js Backend

```javascript
// package.json
{
  "name": "cedra-gamefi-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "tweetnacl": "^1.0.3",
    "bs58": "^5.0.0",
    "axios": "^1.0.0",
    "@noble/ed25519": "^1.7.0"
  }
}
```

### 1.2 Server Setup

```javascript
// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/treasury', require('./routes/treasury'));
app.use('/api/wallet', require('./routes/wallet'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

## 2. Cedra Blockchain Integration

### 2.1 Blockchain Client Setup

```javascript
// services/cedraClient.js
const axios = require('axios');

class CedraClient {
    constructor() {
        this.rpcUrl = process.env.CEDRA_RPC_URL || 'https://devnet.cedra.dev/v1';
        this.chainId = process.env.CEDRA_CHAIN_ID || 'devnet';
    }

    async getAccountInfo(address) {
        try {
            const response = await axios.post(this.rpcUrl, {
                method: 'get_account',
                params: [address]
            });
            return response.data;
        } catch (error) {
            console.error('Error getting account info:', error);
            throw error;
        }
    }

    async submitTransaction(signedTransaction) {
        try {
            const response = await axios.post(this.rpcUrl, {
                method: 'submit_transaction',
                params: [signedTransaction]
            });
            return response.data;
        } catch (error) {
            console.error('Error submitting transaction:', error);
            throw error;
        }
    }

    async getTransactionStatus(txHash) {
        try {
            const response = await axios.post(this.rpcUrl, {
                method: 'get_transaction_by_hash',
                params: [txHash]
            });
            return response.data;
        } catch (error) {
            console.error('Error getting transaction status:', error);
            throw error;
        }
    }

    async querySmartContract(moduleAddress, functionName, args = []) {
        try {
            const response = await axios.post(this.rpcUrl, {
                method: 'view_function',
                params: [moduleAddress, functionName, [], args]
            });
            return response.data;
        } catch (error) {
            console.error('Error querying smart contract:', error);
            throw error;
        }
    }
}

module.exports = new CedraClient();
```

## 3. Signature Service (Ed25519)

### 3.1 Signature Generation

```javascript
// services/signatureService.js
const { ed25519 } = require('@noble/ed25519');
const crypto = require('crypto');

class SignatureService {
    constructor() {
        // Load server private key from environment
        this.privateKey = Buffer.from(process.env.SERVER_PRIVATE_KEY, 'hex');
        this.publicKey = Buffer.from(process.env.SERVER_PUBLIC_KEY, 'hex');
    }

    // Create message for signing (matches Move contract format)
    createRewardMessage(userAddress, amount, nonce) {
        // BCS serialization to match Move contract
        const addressBytes = this.hexToBytes(userAddress);
        const amountBytes = this.u64ToBytes(amount);
        const nonceBytes = this.u64ToBytes(nonce);
        
        return Buffer.concat([addressBytes, amountBytes, nonceBytes]);
    }

    async signRewardMessage(userAddress, amount, nonce) {
        try {
            const message = this.createRewardMessage(userAddress, amount, nonce);
            const signature = await ed25519.sign(message, this.privateKey);
            
            return {
                message: message.toString('hex'),
                signature: Buffer.from(signature).toString('hex'),
                publicKey: this.publicKey.toString('hex')
            };
        } catch (error) {
            console.error('Error signing message:', error);
            throw error;
        }
    }

    async verifySignature(message, signature, publicKey) {
        try {
            const messageBytes = Buffer.from(message, 'hex');
            const signatureBytes = Buffer.from(signature, 'hex');
            const publicKeyBytes = Buffer.from(publicKey, 'hex');
            
            return await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }

    // Helper functions
    hexToBytes(hex) {
        const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
        return Buffer.from(cleanHex, 'hex');
    }

    u64ToBytes(number) {
        const buffer = Buffer.allocUnsafe(8);
        buffer.writeBigUInt64LE(BigInt(number));
        return buffer;
    }
}

module.exports = new SignatureService();
```

## 4. API Routes

### 4.1 Rewards API

```javascript
// routes/rewards.js
const express = require('express');
const router = express.Router();
const cedraClient = require('../services/cedraClient');
const signatureService = require('../services/signatureService');

// Generate reward signature
router.post('/generate-signature', async (req, res) => {
    try {
        const { userAddress, amount, nonce } = req.body;

        // Validate input
        if (!userAddress || !amount || !nonce) {
            return res.status(400).json({
                error: 'Missing required fields: userAddress, amount, nonce'
            });
        }

        // Check if nonce is already used
        const isNonceUsed = await cedraClient.querySmartContract(
            process.env.CONTRACT_ADDRESS,
            'rewards::is_nonce_used',
            [process.env.ADMIN_ADDRESS, nonce]
        );

        if (isNonceUsed.result[0]) {
            return res.status(400).json({
                error: 'Nonce already used'
            });
        }

        // Generate signature
        const signatureData = await signatureService.signRewardMessage(
            userAddress,
            amount,
            nonce
        );

        res.json({
            success: true,
            data: {
                userAddress,
                amount,
                nonce,
                signature: signatureData.signature,
                message: signatureData.message
            }
        });

    } catch (error) {
        console.error('Error generating signature:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Check reward status
router.get('/status/:address/:nonce', async (req, res) => {
    try {
        const { address, nonce } = req.params;

        const isNonceUsed = await cedraClient.querySmartContract(
            process.env.CONTRACT_ADDRESS,
            'rewards::is_nonce_used',
            [process.env.ADMIN_ADDRESS, nonce]
        );

        res.json({
            success: true,
            data: {
                address,
                nonce,
                claimed: isNonceUsed.result[0]
            }
        });

    } catch (error) {
        console.error('Error checking reward status:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

module.exports = router;
```

### 4.2 Treasury API

```javascript
// routes/treasury.js
const express = require('express');
const router = express.Router();
const cedraClient = require('../services/cedraClient');

// Get treasury balance
router.get('/balance', async (req, res) => {
    try {
        const balance = await cedraClient.querySmartContract(
            process.env.CONTRACT_ADDRESS,
            'treasury::get_balance',
            [process.env.ADMIN_ADDRESS]
        );

        res.json({
            success: true,
            data: {
                balance: balance.result[0],
                balanceFormatted: (balance.result[0] / 1000000).toFixed(6) + ' CEDRA'
            }
        });

    } catch (error) {
        console.error('Error getting treasury balance:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Get treasury info
router.get('/info', async (req, res) => {
    try {
        const [balance, resourceAddress, admin, isInitialized] = await Promise.all([
            cedraClient.querySmartContract(
                process.env.CONTRACT_ADDRESS,
                'treasury::get_balance',
                [process.env.ADMIN_ADDRESS]
            ),
            cedraClient.querySmartContract(
                process.env.CONTRACT_ADDRESS,
                'treasury::get_resource_account_address',
                [process.env.ADMIN_ADDRESS]
            ),
            cedraClient.querySmartContract(
                process.env.CONTRACT_ADDRESS,
                'treasury::get_admin',
                [process.env.ADMIN_ADDRESS]
            ),
            cedraClient.querySmartContract(
                process.env.CONTRACT_ADDRESS,
                'treasury::is_initialized',
                [process.env.ADMIN_ADDRESS]
            )
        ]);

        res.json({
            success: true,
            data: {
                balance: balance.result[0],
                balanceFormatted: (balance.result[0] / 1000000).toFixed(6) + ' CEDRA',
                resourceAddress: resourceAddress.result[0],
                admin: admin.result[0],
                isInitialized: isInitialized.result[0]
            }
        });

    } catch (error) {
        console.error('Error getting treasury info:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

module.exports = router;
```

### 4.3 Wallet API

```javascript
// routes/wallet.js
const express = require('express');
const router = express.Router();
const cedraClient = require('../services/cedraClient');

// Validate wallet address
router.post('/validate', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({
                error: 'Address is required'
            });
        }

        // Check if address format is valid (basic validation)
        const isValidFormat = /^0x[a-fA-F0-9]{64}$/.test(address);
        
        if (!isValidFormat) {
            return res.status(400).json({
                error: 'Invalid address format'
            });
        }

        // Check if account exists on chain
        const accountInfo = await cedraClient.getAccountInfo(address);

        res.json({
            success: true,
            data: {
                address,
                exists: !!accountInfo,
                valid: isValidFormat
            }
        });

    } catch (error) {
        // Account might not exist, which is okay
        res.json({
            success: true,
            data: {
                address: req.body.address,
                exists: false,
                valid: /^0x[a-fA-F0-9]{64}$/.test(req.body.address)
            }
        });
    }
});

// Get wallet reward history
router.get('/rewards/:address', async (req, res) => {
    try {
        const { address } = req.params;

        // This would typically query a database or event logs
        // For now, we'll return a mock response
        res.json({
            success: true,
            data: {
                address,
                totalRewards: 0,
                claimedRewards: 0,
                pendingRewards: 0,
                history: []
            }
        });

    } catch (error) {
        console.error('Error getting wallet rewards:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

module.exports = router;
```

## 5. Environment Configuration

### 5.1 Environment Variables

```bash
# .env
PORT=3000
NODE_ENV=development

# Cedra Blockchain Configuration
CEDRA_RPC_URL=https://devnet.cedra.dev/v1
CEDRA_CHAIN_ID=devnet

# Smart Contract Configuration
CONTRACT_ADDRESS=0x1
ADMIN_ADDRESS=0x123

# Server Keys (Ed25519)
SERVER_PRIVATE_KEY=your_private_key_hex
SERVER_PUBLIC_KEY=d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a

# Database (if needed)
DATABASE_URL=postgresql://user:password@localhost:5432/cedra_gamefi

# Security
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

## 6. Frontend Integration

### 6.1 JavaScript Client

```javascript
// frontend/cedraGameFiClient.js
class CedraGameFiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || 'http://localhost:3000/api';
    }

    async generateRewardSignature(userAddress, amount, nonce) {
        const response = await fetch(`${this.baseUrl}/rewards/generate-signature`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userAddress,
                amount,
                nonce
            })
        });

        return await response.json();
    }

    async checkRewardStatus(address, nonce) {
        const response = await fetch(`${this.baseUrl}/rewards/status/${address}/${nonce}`);
        return await response.json();
    }

    async getTreasuryBalance() {
        const response = await fetch(`${this.baseUrl}/treasury/balance`);
        return await response.json();
    }

    async validateWallet(address) {
        const response = await fetch(`${this.baseUrl}/wallet/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address })
        });

        return await response.json();
    }
}

// Usage example
const client = new CedraGameFiClient();

async function claimReward() {
    const userAddress = '0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1';
    const amount = 100000; // 0.1 CEDRA
    const nonce = Date.now(); // Use timestamp as nonce

    try {
        // 1. Generate signature from backend
        const signatureData = await client.generateRewardSignature(userAddress, amount, nonce);
        
        if (!signatureData.success) {
            throw new Error(signatureData.error);
        }

        // 2. Call smart contract with signature
        // This would be done through wallet integration (e.g., Petra, Martian)
        const transaction = {
            function: `${CONTRACT_ADDRESS}::rewards::claim_reward`,
            arguments: [
                ADMIN_ADDRESS,
                amount,
                nonce,
                signatureData.data.signature
            ]
        };

        // Submit transaction through wallet
        const result = await window.aptos.signAndSubmitTransaction(transaction);
        
        console.log('Reward claimed successfully:', result);
        
    } catch (error) {
        console.error('Error claiming reward:', error);
    }
}
```

## 7. Deployment Guide

### 7.1 Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 7.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CEDRA_RPC_URL=https://mainnet.cedra.dev/v1
    volumes:
      - ./.env:/app/.env
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped
```

## 8. Security Best Practices

### 8.1 API Security

```javascript
// middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Security headers
app.use(helmet());
app.use(limiter);

// API key validation
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    next();
};

module.exports = { validateApiKey };
```

### 8.2 Input Validation

```javascript
// middleware/validation.js
const { body, validationResult } = require('express-validator');

const validateRewardRequest = [
    body('userAddress')
        .matches(/^0x[a-fA-F0-9]{64}$/)
        .withMessage('Invalid address format'),
    body('amount')
        .isInt({ min: 1, max: 10000000 })
        .withMessage('Amount must be between 1 and 10,000,000'),
    body('nonce')
        .isInt({ min: 1 })
        .withMessage('Nonce must be a positive integer'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }
        next();
    }
];

module.exports = { validateRewardRequest };
```

## 9. Testing

### 9.1 API Tests

```javascript
// tests/api.test.js
const request = require('supertest');
const app = require('../server');

describe('Rewards API', () => {
    test('Generate signature for valid request', async () => {
        const response = await request(app)
            .post('/api/rewards/generate-signature')
            .send({
                userAddress: '0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1',
                amount: 100000,
                nonce: 12345
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.signature).toBeDefined();
    });

    test('Reject invalid address format', async () => {
        const response = await request(app)
            .post('/api/rewards/generate-signature')
            .send({
                userAddress: 'invalid_address',
                amount: 100000,
                nonce: 12345
            });

        expect(response.status).toBe(400);
    });
});
```

## 10. Monitoring & Logging

### 10.1 Logging Setup

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

module.exports = logger;
```

---

## Tóm tắt Integration

Hệ thống tích hợp Web2-Web3 này cung cấp:

1. **RESTful API** cho frontend integration
2. **Ed25519 signature service** cho reward verification
3. **Blockchain client** cho smart contract interaction
4. **Security middleware** cho API protection
5. **Comprehensive testing** và monitoring

Kiến trúc này cho phép ứng dụng Web2 truyền thống tương tác seamlessly với Cedra blockchain thông qua các API endpoints đơn giản.