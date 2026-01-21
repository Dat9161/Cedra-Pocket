# 🎮 Cedra Quest - Blockchain Gaming Platform

A comprehensive Telegram Mini App featuring pet system, energy management, quests, and blockchain integration on Cedra Network.

## 🏗️ Architecture

```
Frontend (Next.js) → Backend (NestJS) → Database (PostgreSQL)
                                    ↓
                              Blockchain (Cedra)
```

## 🚀 Quick Deploy

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Vercel)
```bash
cd cedra-quest-backend
vercel --prod
```

### Environment Variables

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot
```

**Backend:**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
TELEGRAM_BOT_TOKEN="your-bot-token"
CEDRA_PRIVATE_KEY="your-private-key"
```

## 🎯 Features

- **Pet System** - Level up pets, mining rewards
- **Energy Management** - Game sessions with energy consumption
- **Quest System** - Social and on-chain quests
- **Ranking System** - 6-tier progression (Bronze to Leviathan)
- **Wallet Integration** - Non-custodial wallets
- **Blockchain Rewards** - On-chain reward distribution

## 📱 Telegram Bot Setup

1. Create bot with @BotFather
2. Set Mini App URL: `https://your-frontend.vercel.app`
3. Configure domain in bot settings

## 🔧 Tech Stack

- **Frontend**: Next.js 16, React 19, Zustand, Tailwind CSS
- **Backend**: NestJS 10, PostgreSQL, Prisma ORM
- **Blockchain**: Move contracts on Cedra Network
- **Deployment**: Vercel

## 📊 API Endpoints

- `GET /health` - Health check
- `POST /auth/verify` - Telegram authentication
- `GET /game/pet/status/:userId` - Pet status
- `GET /game/energy/status/:userId` - Energy status
- `GET /quests` - List quests

## 🔐 Security

- JWT authentication
- Non-custodial wallet design
- Ed25519 signature verification
- CORS protection
- Input validation

---

**Ready for production deployment! 🚀**