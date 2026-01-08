// ===================================================================
// CEDRA GAMEFI - WEB2 BACKEND INTEGRATION EXAMPLE
// Reward Distribution System with Ed25519 Signature
// ===================================================================

const express = require('express');
const { ed25519 } = require('@noble/ed25519');
const crypto = require('crypto');
const axios = require('axios');

// ===================================================================
// 1. CONFIGURATION
// ===================================================================

const CONFIG = {
    // Server configuration
    PORT: process.env.PORT || 3000,

    // Cedra blockchain configuration
    CEDRA_RPC_URL: process.env.CEDRA_RPC_URL || 'https://devnet.cedra.dev/v1',
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x1',
    ADMIN_ADDRESS: process.env.ADMIN_ADDRESS || '0x123',

    // Ed25519 keys (in production, load from secure storage)
    SERVER_PRIVATE_KEY: process.env.SERVER_PRIVATE_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    SERVER_PUBLIC_KEY: process.env.SERVER_PUBLIC_KEY || 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a',

    // Reward configuration
    REWARD_AMOUNTS: {
        SMALL: 10000,    // 0.01 CEDRA
        MEDIUM: 100000,  // 0.1 CEDRA  
        LARGE: 1000000   // 1 CEDRA
    }
};

// ===================================================================
// 2. CEDRA BLOCKCHAIN CLIENT
// ===================================================================

class CedraBlockchainClient {
    constructor(rpcUrl) {
        this.rpcUrl = rpcUrl;
    }

    async queryContract(functionName, args = []) {
        try {
            const response = await axios.post(this.rpcUrl, {
                jsonrpc: '2.0',
                method: 'view_function',
                params: [
                    `${CONFIG.CONTRACT_ADDRESS}::${functionName}`,
                    [],
                    args
                ],
                id: 1
            });

            if (response.data.error) {
                throw new Error(response.data.error.message);
            }

            return response.data.result;
        } catch (error) {
            console.error(`Error querying ${functionName}:`, error.message);
            throw error;
        }
    }

    async isNonceUsed(nonce) {
        const result = await this.queryContract('rewards::is_nonce_used', [
            CONFIG.ADMIN_ADDRESS,
            nonce.toString()
        ]);
        return result[0] === true;
    }

    async getTreasuryBalance() {
        const result = await this.queryContract('treasury::get_balance', [
            CONFIG.ADMIN_ADDRESS
        ]);
        return parseInt(result[0]);
    }

    async isRewardsInitialized() {
        const result = await this.queryContract('rewards::is_initialized', [
            CONFIG.ADMIN_ADDRESS
        ]);
        return result[0] === true;
    }

    async isSystemPaused() {
        const result = await this.queryContract('rewards::is_paused', [
            CONFIG.ADMIN_ADDRESS
        ]);
        return result[0] === true;
    }
}

// ===================================================================
// 3. ED25519 SIGNATURE SERVICE
// ===================================================================

class Ed25519SignatureService {
    constructor(privateKeyHex, publicKeyHex) {
        this.privateKey = Buffer.from(privateKeyHex, 'hex');
        this.publicKey = Buffer.from(publicKeyHex, 'hex');
    }

    // Create BCS-serialized message (matches Move contract format)
    createRewardMessage(userAddress, amount, nonce) {
        // Remove 0x prefix if present
        const cleanAddress = userAddress.startsWith('0x') ? userAddress.slice(2) : userAddress;

        // Convert to bytes
        const addressBytes = Buffer.from(cleanAddress, 'hex');
        const amountBytes = this.u64ToLittleEndianBytes(amount);
        const nonceBytes = this.u64ToLittleEndianBytes(nonce);

        // Concatenate: address + amount + nonce
        return Buffer.concat([addressBytes, amountBytes, nonceBytes]);
    }

    async signRewardMessage(userAddress, amount, nonce) {
        try {
            const message = this.createRewardMessage(userAddress, amount, nonce);
            const signature = await ed25519.sign(message, this.privateKey);

            return {
                message: message.toString('hex'),
                signature: Buffer.from(signature).toString('hex'),
                publicKey: this.publicKey.toString('hex'),
                userAddress,
                amount,
                nonce
            };
        } catch (error) {
            console.error('Error signing reward message:', error);
            throw new Error('Failed to sign reward message');
        }
    }

    async verifySignature(messageHex, signatureHex) {
        try {
            const message = Buffer.from(messageHex, 'hex');
            const signature = Buffer.from(signatureHex, 'hex');

            return await ed25519.verify(signature, message, this.publicKey);
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }

    // Convert u64 to little-endian bytes (8 bytes)
    u64ToLittleEndianBytes(number) {
        const buffer = Buffer.allocUnsafe(8);
        buffer.writeBigUInt64LE(BigInt(number));
        return buffer;
    }
}

// ===================================================================
// 4. REWARD DISTRIBUTION SERVICE
// ===================================================================

class RewardDistributionService {
    constructor(blockchainClient, signatureService) {
        this.blockchain = blockchainClient;
        this.signer = signatureService;
        this.processedRewards = new Map(); // In production, use database
    }

    async validateRewardRequest(userAddress, amount, nonce) {
        const errors = [];

        // Validate address format
        if (!/^0x[a-fA-F0-9]{64}$/.test(userAddress)) {
            errors.push('Invalid address format');
        }

        // Validate amount
        const validAmounts = Object.values(CONFIG.REWARD_AMOUNTS);
        if (!validAmounts.includes(amount)) {
            errors.push(`Invalid amount. Must be one of: ${validAmounts.join(', ')}`);
        }

        // Validate nonce
        if (!Number.isInteger(nonce) || nonce <= 0) {
            errors.push('Nonce must be a positive integer');
        }

        // Check if nonce is already used
        try {
            const isUsed = await this.blockchain.isNonceUsed(nonce);
            if (isUsed) {
                errors.push('Nonce already used');
            }
        } catch (error) {
            errors.push('Failed to check nonce status');
        }

        // Check if system is paused
        try {
            const isPaused = await this.blockchain.isSystemPaused();
            if (isPaused) {
                errors.push('Reward system is currently paused');
            }
        } catch (error) {
            console.warn('Could not check system pause status');
        }

        // Check treasury balance
        try {
            const balance = await this.blockchain.getTreasuryBalance();
            if (balance < amount) {
                errors.push('Insufficient treasury balance');
            }
        } catch (error) {
            console.warn('Could not check treasury balance');
        }

        return errors;
    }

    async generateRewardSignature(userAddress, amount, nonce) {
        // Validate request
        const validationErrors = await this.validateRewardRequest(userAddress, amount, nonce);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        // Generate signature
        const signatureData = await this.signer.signRewardMessage(userAddress, amount, nonce);

        // Store in processed rewards (for tracking)
        const rewardId = `${userAddress}-${nonce}`;
        this.processedRewards.set(rewardId, {
            ...signatureData,
            timestamp: Date.now(),
            status: 'signature_generated'
        });

        return signatureData;
    }

    async getRewardStatus(userAddress, nonce) {
        const rewardId = `${userAddress}-${nonce}`;
        const localRecord = this.processedRewards.get(rewardId);

        // Check on-chain status
        let onChainStatus = 'not_claimed';
        try {
            const isUsed = await this.blockchain.isNonceUsed(nonce);
            onChainStatus = isUsed ? 'claimed' : 'not_claimed';
        } catch (error) {
            console.warn('Could not check on-chain status');
        }

        return {
            userAddress,
            nonce,
            localRecord: localRecord || null,
            onChainStatus,
            timestamp: localRecord?.timestamp || null
        };
    }
}

// ===================================================================
// 5. EXPRESS API SERVER
// ===================================================================

class RewardAPIServer {
    constructor() {
        this.app = express();
        this.blockchain = new CedraBlockchainClient(CONFIG.CEDRA_RPC_URL);
        this.signer = new Ed25519SignatureService(
            CONFIG.SERVER_PRIVATE_KEY,
            CONFIG.SERVER_PUBLIC_KEY
        );
        this.rewardService = new RewardDistributionService(
            this.blockchain,
            this.signer
        );

        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: Date.now() });
        });

        // Generate reward signature
        this.app.post('/api/rewards/generate-signature', async (req, res) => {
            try {
                const { userAddress, amount, nonce } = req.body;

                if (!userAddress || amount === undefined || !nonce) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing required fields: userAddress, amount, nonce'
                    });
                }

                const signatureData = await this.rewardService.generateRewardSignature(
                    userAddress,
                    parseInt(amount),
                    parseInt(nonce)
                );

                res.json({
                    success: true,
                    data: signatureData
                });

            } catch (error) {
                console.error('Error generating signature:', error);
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Check reward status
        this.app.get('/api/rewards/status/:address/:nonce', async (req, res) => {
            try {
                const { address, nonce } = req.params;

                const status = await this.rewardService.getRewardStatus(
                    address,
                    parseInt(nonce)
                );

                res.json({
                    success: true,
                    data: status
                });

            } catch (error) {
                console.error('Error checking reward status:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });

        // Get treasury info
        this.app.get('/api/treasury/info', async (req, res) => {
            try {
                const balance = await this.blockchain.getTreasuryBalance();
                const isInitialized = await this.blockchain.isRewardsInitialized();
                const isPaused = await this.blockchain.isSystemPaused();

                res.json({
                    success: true,
                    data: {
                        balance,
                        balanceFormatted: `${(balance / 1000000).toFixed(6)} CEDRA`,
                        isInitialized,
                        isPaused,
                        contractAddress: CONFIG.CONTRACT_ADDRESS,
                        adminAddress: CONFIG.ADMIN_ADDRESS
                    }
                });

            } catch (error) {
                console.error('Error getting treasury info:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get treasury info'
                });
            }
        });

        // Get reward configuration
        this.app.get('/api/config', (req, res) => {
            res.json({
                success: true,
                data: {
                    rewardAmounts: CONFIG.REWARD_AMOUNTS,
                    contractAddress: CONFIG.CONTRACT_ADDRESS,
                    serverPublicKey: CONFIG.SERVER_PUBLIC_KEY
                }
            });
        });

        // Example: Generate signature for specific wallet (from your test)
        this.app.post('/api/rewards/generate-for-test-wallet', async (req, res) => {
            try {
                const testWallet = '0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1';
                const amount = CONFIG.REWARD_AMOUNTS.MEDIUM; // 0.1 CEDRA
                const nonce = Date.now(); // Use timestamp as nonce

                const signatureData = await this.rewardService.generateRewardSignature(
                    testWallet,
                    amount,
                    nonce
                );

                res.json({
                    success: true,
                    message: 'Signature generated for test wallet',
                    data: signatureData,
                    instructions: {
                        step1: 'Use this signature data to call the smart contract',
                        step2: 'Call rewards::claim_reward with the provided signature',
                        step3: 'The wallet will receive 0.1 CEDRA if transaction succeeds'
                    }
                });

            } catch (error) {
                console.error('Error generating test signature:', error);
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    start() {
        this.app.listen(CONFIG.PORT, () => {
            console.log(`🚀 Cedra GameFi Backend Server running on port ${CONFIG.PORT}`);
            console.log(`📡 Connected to Cedra RPC: ${CONFIG.CEDRA_RPC_URL}`);
            console.log(`📝 Contract Address: ${CONFIG.CONTRACT_ADDRESS}`);
            console.log(`👤 Admin Address: ${CONFIG.ADMIN_ADDRESS}`);
            console.log(`🔑 Server Public Key: ${CONFIG.SERVER_PUBLIC_KEY}`);
            console.log('\n📋 Available endpoints:');
            console.log('  GET  /health');
            console.log('  POST /api/rewards/generate-signature');
            console.log('  GET  /api/rewards/status/:address/:nonce');
            console.log('  GET  /api/treasury/info');
            console.log('  GET  /api/config');
            console.log('  POST /api/rewards/generate-for-test-wallet');
        });
    }
}

// ===================================================================
// 6. FRONTEND INTEGRATION EXAMPLE
// ===================================================================

const FRONTEND_EXAMPLE = `
// Frontend JavaScript example for claiming rewards

class CedraGameFiClient {
    constructor(backendUrl = 'http://localhost:3000') {
        this.backendUrl = backendUrl;
    }

    async claimReward(userAddress, amount, nonce) {
        try {
            // Step 1: Get signature from backend
            const response = await fetch(\`\${this.backendUrl}/api/rewards/generate-signature\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userAddress, amount, nonce })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error);
            }

            // Step 2: Prepare transaction for wallet
            const transaction = {
                function: "0x1::rewards::claim_reward",
                arguments: [
                    "0x123", // admin_address
                    amount.toString(),
                    nonce.toString(),
                    result.data.signature
                ]
            };

            // Step 3: Submit through wallet (example with Aptos wallet)
            if (window.aptos) {
                const txResult = await window.aptos.signAndSubmitTransaction(transaction);
                console.log('Reward claimed successfully:', txResult);
                return txResult;
            } else {
                throw new Error('Wallet not connected');
            }

        } catch (error) {
            console.error('Error claiming reward:', error);
            throw error;
        }
    }
}

// Usage example
const client = new CedraGameFiClient();

// Claim 0.1 CEDRA for test wallet
client.claimReward(
    '0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1',
    100000, // 0.1 CEDRA
    Date.now() // Use timestamp as nonce
).then(result => {
    console.log('Success!', result);
}).catch(error => {
    console.error('Failed:', error);
});
`;

// ===================================================================
// 7. START SERVER
// ===================================================================

if (require.main === module) {
    console.log('🎮 Cedra GameFi - Web2 Backend Integration');
    console.log('==========================================');

    const server = new RewardAPIServer();
    server.start();

    // Log frontend example
    console.log('\n📱 Frontend Integration Example:');
    console.log(FRONTEND_EXAMPLE);
}

module.exports = {
    CedraBlockchainClient,
    Ed25519SignatureService,
    RewardDistributionService,
    RewardAPIServer,
    CONFIG
};