# 📚 Cedra Quest Backend - API Documentation

## 🌐 Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000
```

## 📋 Table of Contents
- [Authentication APIs](#-authentication-apis)
- [Game APIs](#-game-apis)
- [Blockchain APIs](#-blockchain-apis)
- [Health Check APIs](#-health-check-apis)
- [Response Formats](#-response-formats)
- [Error Handling](#-error-handling)

---

## 🔐 Authentication APIs

### POST /auth/login
Xác thực người dùng qua Telegram initData

**Request Body:**
```json
{
  "initData": "string" // Telegram initData từ WebApp
}
```

**Response (Existing User):**
```json
{
  "success": true,
  "user": {
    "telegram_id": "123456789",
    "wallet_address": "0x1234...5678",
    "username": "user123",
    "total_points": 1500,
    "level": 3,
    "current_xp": 250,
    "current_rank": "SILVER",
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

**Response (New User):**
```json
{
  "success": true,
  "suggestedWalletName": "user_123456789_timestamp"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid Telegram data"
}
```

---

### POST /auth/create-wallet
Tạo ví blockchain cho người dùng mới

**Request Body:**
```json
{
  "telegram_id": "123456789",
  "requested_address": "user_123456789_timestamp",
  "public_key": "0xabcd...ef12"
}
```

**Response (Success):**
```json
{
  "success": true,
  "wallet_address": "user_123456789_timestamp",
  "transaction_hash": "0x1234...5678"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Wallet name already taken"
}
```

---

### POST /auth/recover-wallet
Khôi phục ví bằng public key

**Request Body:**
```json
{
  "public_key": "0xabcd...ef12"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "telegram_id": "123456789",
    "wallet_address": "0x1234...5678",
    "username": "user123",
    "total_points": 1500,
    "level": 3,
    "current_xp": 250,
    "current_rank": "SILVER",
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

---

## 🎮 Game APIs

### GET /game/dashboard/:userId
Lấy tất cả dữ liệu game cho dashboard

**Parameters:**
- `userId`: Telegram ID của user

**Response:**
```json
{
  "pet": {
    "level": 3,
    "exp": 150,
    "max_exp": 300,
    "happiness": 90,
    "hunger": 85,
    "pendingCoins": 25000,
    "coinRate": 1.5,
    "tier": "SILVER"
  },
  "energy": {
    "currentEnergy": 8,
    "maxEnergy": 12,
    "nextRegenTime": "2024-01-20T11:00:00Z",
    "timeToFullEnergy": 7200000
  },
  "ranking": {
    "currentRank": "SILVER",
    "totalPoints": 1500,
    "position": 42,
    "nextRankThreshold": 5000
  },
  "gameStats": {
    "totalGamesPlayed": 15,
    "totalPointsEarned": 750,
    "averageScore": 850,
    "favoriteGameType": "memory_game",
    "todayGamesPlayed": 3
  },
  "success": true
}
```

---

### GET /game/energy/status/:userId
Lấy trạng thái năng lượng của user

**Response:**
```json
{
  "currentEnergy": 8,
  "maxEnergy": 12,
  "nextRegenTime": "2024-01-20T11:00:00Z",
  "timeToFullEnergy": 7200000
}
```

---

### POST /game/energy/refill/:userId
Nạp năng lượng bằng điểm

**Request Body:**
```json
{
  "energyAmount": 3
}
```

**Response:**
```json
{
  "success": true,
  "pointsCost": 30,
  "newEnergy": 11
}
```

---

### GET /game/pet/status/:userId
Lấy trạng thái pet của user

**Response:**
```json
{
  "level": 3,
  "exp": 150,
  "max_exp": 300,
  "happiness": 90,
  "hunger": 85,
  "pendingCoins": 25000,
  "totalCoinsEarned": 100000,
  "coinRate": 1.5,
  "tier": "SILVER",
  "lastCoinTime": "2024-01-20T10:00:00Z"
}
```

---

### POST /game/pet/feed/:userId
Cho ăn pet để tăng XP

**Request Body:**
```json
{
  "feedCount": 5
}
```

**Response:**
```json
{
  "success": true,
  "pointsSpent": 100,
  "xpGained": 100,
  "newLevel": 3,
  "newExp": 250,
  "dailySpent": 100,
  "remainingDaily": 500
}
```

---

### POST /game/pet/claim/:userId
Claim coins từ pet

**Response:**
```json
{
  "success": true,
  "coinsEarned": 25000,
  "newTotalPoints": 26500,
  "hoursAccumulated": 4.5
}
```

---

### POST /game/session/start/:userId
Bắt đầu phiên chơi game

**Request Body:**
```json
{
  "gameType": "memory_game"
}
```

**Response:**
```json
{
  "success": true,
  "energyUsed": 1
}
```

---

### POST /game/session/complete/:userId
Hoàn thành phiên chơi game

**Request Body:**
```json
{
  "gameType": "memory_game",
  "score": 850,
  "duration": 120
}
```

**Response:**
```json
{
  "success": true,
  "pointsEarned": 135,
  "energyUsed": 1,
  "newEnergyLevel": 7,
  "newTotalPoints": 1635
}
```

---

### GET /game/session/stats/:userId
Lấy thống kê game của user

**Response:**
```json
{
  "totalGamesPlayed": 15,
  "totalPointsEarned": 750,
  "averageScore": 850,
  "favoriteGameType": "memory_game",
  "todayGamesPlayed": 3
}
```

---

### GET /game/ranking/user/:userId
Lấy thông tin rank của user

**Response:**
```json
{
  "currentRank": "SILVER",
  "totalPoints": 1500,
  "lifetimePoints": 2000,
  "position": 42,
  "nextRank": "GOLD",
  "nextRankThreshold": 5000,
  "pointsToNextRank": 3500
}
```

---

### GET /game/ranking/leaderboard
Lấy bảng xếp hạng

**Query Parameters:**
- `limit`: Số lượng users (1-100, default: 50)
- `offset`: Vị trí bắt đầu (default: 0)

**Response:**
```json
{
  "leaderboard": [
    {
      "position": 1,
      "telegram_id": "123456789",
      "username": "topplayer",
      "total_points": 50000,
      "current_rank": "DIAMOND",
      "level": 10
    }
  ],
  "totalUsers": 1000,
  "hasMore": true
}
```

---

### GET /game/ranking/position/:userId
Lấy vị trí của user trong bảng xếp hạng

**Response:**
```json
{
  "position": 42
}
```

---

### GET /game/ranking/statistics
Lấy thống kê phân bố rank

**Response:**
```json
{
  "totalUsers": 1000,
  "rankDistribution": {
    "BRONZE": 600,
    "SILVER": 250,
    "GOLD": 100,
    "PLATINUM": 40,
    "DIAMOND": 10
  },
  "averagePoints": 2500,
  "topPoints": 100000
}
```

---

### GET /game/cycle/current
Lấy thông tin game cycle hiện tại

**Response:**
```json
{
  "cycleNumber": 1,
  "growthRate": 0.8,
  "maxSpeedCap": 8.0,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-02-01T00:00:00Z",
  "isActive": true,
  "daysRemaining": 15
}
```

---

### GET /game/cycle/all
Lấy tất cả game cycles

**Response:**
```json
{
  "cycles": [
    {
      "cycleNumber": 1,
      "growthRate": 0.8,
      "maxSpeedCap": 8.0,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-02-01T00:00:00Z",
      "isActive": true
    }
  ]
}
```

---

## 🔗 Blockchain APIs (Cedra Network)

### POST /blockchain/create-wallet
Tạo ví on-chain trên Cedra blockchain

**Request Body:**
```json
{
  "telegram_id": "123456789",
  "wallet_name": "user_123456789_timestamp"
}
```

**Response:**
```json
{
  "success": true,
  "wallet_address": "0x1234...5678",
  "transaction_hash": "0xabcd...ef12",
  "public_key": "0x9876...5432",
  "network": "Cedra"
}
```

---

### POST /blockchain/treasury/initialize
Khởi tạo treasury trên Cedra blockchain

**Request Body:**
```json
{
  "seed": "cedra_gamefi_treasury_v1"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_hash": "0xabcd...ef12",
  "message": "Treasury initialized successfully on Cedra blockchain"
}
```

---

### POST /blockchain/treasury/deposit
Nạp tiền vào treasury

**Request Body:**
```json
{
  "amount": 10000
}
```

**Response:**
```json
{
  "success": true,
  "transaction_hash": "0xabcd...ef12",
  "message": "Deposited 10000 to treasury successfully"
}
```

---

### GET /blockchain/treasury/balance
Kiểm tra số dư treasury

**Response:**
```json
{
  "success": true,
  "balance": "50000",
  "balance_in_octas": "5000000000000",
  "network": "Cedra"
}
```

---

### POST /blockchain/rewards/initialize
Khởi tạo hệ thống rewards

**Request Body:**
```json
{
  "serverPublicKey": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "transaction_hash": "0xabcd...ef12",
  "message": "Rewards system initialized successfully"
}
```

---

### POST /blockchain/rewards/claim
Claim rewards trên Cedra blockchain

**Request Body:**
```json
{
  "user_id": "123456789",
  "amount": 1000,
  "signature": "0xsignature...",
  "nonce": "unique_nonce_123"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_hash": "0xabcd...ef12",
  "amount_claimed": 1000,
  "amount_in_octas": "100000000000",
  "user_id": "123456789",
  "network": "Cedra"
}
```

---

### GET /blockchain/balance/:walletAddress
Kiểm tra số dư CEDRA token

**Response:**
```json
{
  "balance": "5000",
  "balance_in_octas": "500000000000",
  "wallet_address": "0x1234...5678",
  "token_symbol": "CEDRA",
  "decimals": 8,
  "network": "Cedra"
}
```

---

### POST /blockchain/verify-signature
Xác minh chữ ký cho claim rewards

**Request Body:**
```json
{
  "user_id": "123456789",
  "amount": 1000,
  "nonce": "unique_nonce_123"
}
```

**Response:**
```json
{
  "signature": "0xsignature...",
  "expires_at": "2024-01-20T11:05:00Z",
  "nonce": "unique_nonce_123",
  "message": "123456789-1000-unique_nonce_123-1642680300000"
}
```

---

### GET /blockchain/transactions/:userId
Lấy lịch sử giao dịch Cedra blockchain

**Response:**
```json
{
  "transactions": [
    {
      "hash": "0xabcd...ef12",
      "type": "REWARD_CLAIM",
      "amount": 1000,
      "status": "SUCCESS",
      "timestamp": "2024-01-20T10:30:00Z",
      "version": "12345678",
      "gas_used": "1500",
      "network": "Cedra"
    }
  ],
  "total": 10,
  "page": 1
}
```

---

### GET /blockchain/nonce/:nonce/check
Kiểm tra nonce đã được sử dụng chưa

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "unique_nonce_123",
    "used": false
  }
}
```

---

### GET /blockchain/status
Kiểm tra trạng thái kết nối Cedra blockchain

**Response:**
```json
{
  "connected": true,
  "account": "0x1234...5678",
  "network": "https://rpc.cedra.network",
  "contract_address": "79ca407a19d76dcc4f722fb074781afd1a3a7316520295e4969673a81a0dabfe",
  "treasury_initialized": true,
  "rewards_initialized": true
}
```

---

## 🏥 Health Check APIs

### GET /health
Kiểm tra trạng thái hệ thống

**Response (Healthy):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00Z",
  "uptime": 86400,
  "database": "connected",
  "memory": {
    "rss": 45678912,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1234567
  }
}
```

**Response (Unhealthy):**
```json
{
  "status": "error",
  "timestamp": "2024-01-20T10:30:00Z",
  "database": "disconnected",
  "error": "Connection timeout"
}
```

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* additional error details */ }
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Codes
- `INVALID_TELEGRAM_DATA`: Telegram initData không hợp lệ
- `WALLET_NAME_TAKEN`: Tên ví đã được sử dụng
- `INSUFFICIENT_ENERGY`: Không đủ năng lượng để chơi game
- `INSUFFICIENT_POINTS`: Không đủ điểm để thực hiện action
- `USER_NOT_FOUND`: Không tìm thấy user
- `INVALID_SIGNATURE`: Chữ ký blockchain không hợp lệ
- `RATE_LIMIT_EXCEEDED`: Vượt quá giới hạn request

---

## 🔒 Authentication

### Telegram Authentication
Tất cả API endpoints (trừ `/auth/login` và `/health`) yêu cầu xác thực. Sử dụng Telegram initData để xác thực:

```javascript
// Frontend example
const initData = window.Telegram.WebApp.initData;

fetch('/api/game/dashboard/123456789', {
  headers: {
    'Authorization': `Bearer ${initData}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🚀 Rate Limiting

### Game Actions
- **Game Sessions**: Tối đa 10 games/phút
- **Pet Feeding**: Tối đa 30 feeds/phút
- **Energy Refill**: Không giới hạn (limited by points)

### API Requests
- **General APIs**: 100 requests/phút/IP
- **Authentication**: 10 requests/phút/IP
- **Blockchain**: 20 requests/phút/user

---

## 📝 Game Types

### Supported Game Types
- `memory_game`: Trò chơi ghi nhớ
- `puzzle_game`: Trò chơi xếp hình
- `reaction_game`: Trò chơi phản xạ
- `arcade_game`: Trò chơi arcade

### Pet Tiers
- `BRONZE`: Level 1-2
- `SILVER`: Level 3-4
- `GOLD`: Level 5-6
- `PLATINUM`: Level 7-8
- `DIAMOND`: Level 9-10

### User Ranks
- `BRONZE`: 0 - 9,999 points
- `SILVER`: 10,000 - 49,999 points
- `GOLD`: 50,000 - 199,999 points
- `PLATINUM`: 200,000 - 999,999 points
- `DIAMOND`: 1,000,000+ points

---

## 🔧 Development

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/cedra_quest
DIRECT_URL=postgresql://user:pass@localhost:5432/cedra_quest
TELEGRAM_BOT_TOKEN=your_bot_token
CEDRA_NETWORK_URL=https://rpc.cedra.network
CEDRA_PRIVATE_KEY=your_private_key
CEDRA_GAMEFI_ADDRESS=79ca407a19d76dcc4f722fb074781afd1a3a7316520295e4969673a81a0dabfe
CEDRA_ADMIN_ADDRESS=your_admin_address
CEDRA_PACKAGE_NAME=CedraMiniApp
```

### Running Locally
```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Seed data
npm run seed

# Start development server
npm run start:dev
```

---

*API Documentation v1.0.0*  
*Last Updated: ${new Date().toLocaleString()}*  
*Base URL: https://your-domain.com/api*