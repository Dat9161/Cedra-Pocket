// ===================================================================
// CEDRA GAMEFI - INTEGRATION TEST SCRIPT
// Test Web2 Backend Integration with Cedra Blockchain
// ===================================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_WALLET = '0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1';

class IntegrationTester {
    constructor(baseUrl = BASE_URL) {
        this.baseUrl = baseUrl;
        this.testResults = [];
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 Running: ${testName}`);
        try {
            const result = await testFunction();
            console.log(`✅ PASSED: ${testName}`);
            this.testResults.push({ name: testName, status: 'PASSED', result });
            return result;
        } catch (error) {
            console.log(`❌ FAILED: ${testName} - ${error.message}`);
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
            throw error;
        }
    }

    async testHealthCheck() {
        const response = await axios.get(`${this.baseUrl}/health`);

        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }

        if (!response.data.status || response.data.status !== 'healthy') {
            throw new Error('Health check failed');
        }

        return response.data;
    }

    async testTreasuryInfo() {
        const response = await axios.get(`${this.baseUrl}/api/treasury/info`);

        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }

        const data = response.data;
        if (!data.success) {
            throw new Error('Treasury info request failed');
        }

        // Validate response structure
        const required = ['balance', 'balanceFormatted', 'isInitialized', 'contractAddress'];
        for (const field of required) {
            if (!(field in data.data)) {
                throw new Error(`Missing field: ${field}`);
            }
        }

        return data.data;
    }

    async testConfigEndpoint() {
        const response = await axios.get(`${this.baseUrl}/api/config`);

        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }

        const data = response.data;
        if (!data.success) {
            throw new Error('Config request failed');
        }

        // Validate config structure
        if (!data.data.rewardAmounts || !data.data.contractAddress || !data.data.serverPublicKey) {
            throw new Error('Invalid config structure');
        }

        return data.data;
    }

    async testSignatureGeneration() {
        const requestData = {
            userAddress: TEST_WALLET,
            amount: 100000, // 0.1 CEDRA
            nonce: Date.now()
        };

        const response = await axios.post(
            `${this.baseUrl}/api/rewards/generate-signature`,
            requestData,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }

        const data = response.data;
        if (!data.success) {
            throw new Error(`Signature generation failed: ${data.error}`);
        }

        // Validate signature data
        const required = ['message', 'signature', 'publicKey', 'userAddress', 'amount', 'nonce'];
        for (const field of required) {
            if (!(field in data.data)) {
                throw new Error(`Missing field in signature data: ${field}`);
            }
        }

        // Validate signature format (should be hex string)
        if (!/^[a-fA-F0-9]+$/.test(data.data.signature)) {
            throw new Error('Invalid signature format');
        }

        // Validate message format (should be hex string)
        if (!/^[a-fA-F0-9]+$/.test(data.data.message)) {
            throw new Error('Invalid message format');
        }

        return data.data;
    }

    async testRewardStatus() {
        const nonce = Date.now();

        const response = await axios.get(
            `${this.baseUrl}/api/rewards/status/${TEST_WALLET}/${nonce}`
        );

        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }

        const data = response.data;
        if (!data.success) {
            throw new Error('Reward status request failed');
        }

        // Validate response structure
        const required = ['userAddress', 'nonce', 'onChainStatus'];
        for (const field of required) {
            if (!(field in data.data)) {
                throw new Error(`Missing field: ${field}`);
            }
        }

        return data.data;
    }

    async testTestWalletSignature() {
        const response = await axios.post(`${this.baseUrl}/api/rewards/generate-for-test-wallet`);

        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }

        const data = response.data;
        if (!data.success) {
            throw new Error(`Test wallet signature failed: ${data.error}`);
        }

        // Should contain signature data and instructions
        if (!data.data || !data.instructions) {
            throw new Error('Missing signature data or instructions');
        }

        return data;
    }

    async testInvalidRequests() {
        // Test invalid address format
        try {
            await axios.post(`${this.baseUrl}/api/rewards/generate-signature`, {
                userAddress: 'invalid_address',
                amount: 100000,
                nonce: 12345
            });
            throw new Error('Should have failed with invalid address');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                // Expected error
                return { validationWorking: true };
            }
            throw error;
        }
    }

    async testMessageConsistency() {
        const requestData = {
            userAddress: TEST_WALLET,
            amount: 100000,
            nonce: 12345 // Fixed nonce for consistency test
        };

        // Generate signature twice with same parameters
        const response1 = await axios.post(
            `${this.baseUrl}/api/rewards/generate-signature`,
            requestData
        );

        const response2 = await axios.post(
            `${this.baseUrl}/api/rewards/generate-signature`,
            { ...requestData, nonce: 12346 } // Different nonce
        );

        const data1 = response1.data.data;
        const data2 = response2.data.data;

        // Same parameters should produce same message format (but different nonce)
        if (data1.message === data2.message) {
            throw new Error('Different nonces should produce different messages');
        }

        // Signatures should be different
        if (data1.signature === data2.signature) {
            throw new Error('Different messages should produce different signatures');
        }

        return { messageConsistency: true };
    }

    async runAllTests() {
        console.log('🚀 Starting Cedra GameFi Integration Tests');
        console.log('==========================================');

        try {
            // Basic connectivity tests
            await this.runTest('Health Check', () => this.testHealthCheck());
            await this.runTest('Treasury Info', () => this.testTreasuryInfo());
            await this.runTest('Config Endpoint', () => this.testConfigEndpoint());

            // Core functionality tests
            await this.runTest('Signature Generation', () => this.testSignatureGeneration());
            await this.runTest('Reward Status Check', () => this.testRewardStatus());
            await this.runTest('Test Wallet Signature', () => this.testTestWalletSignature());

            // Validation tests
            await this.runTest('Invalid Request Handling', () => this.testInvalidRequests());
            await this.runTest('Message Consistency', () => this.testMessageConsistency());

        } catch (error) {
            console.log(`\n💥 Test suite stopped due to error: ${error.message}`);
        }

        this.printSummary();
    }

    printSummary() {
        console.log('\n📊 Test Results Summary');
        console.log('========================');

        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }

        if (passed === total) {
            console.log('\n🎉 All tests passed! Integration is working correctly.');
            console.log('\n📋 Next Steps:');
            console.log('  1. Deploy smart contracts to Cedra network');
            console.log('  2. Update environment variables with real addresses');
            console.log('  3. Test with actual wallet integration');
            console.log('  4. Set up production monitoring');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the server and configuration.');
        }
    }
}

// ===================================================================
// RUN TESTS
// ===================================================================

async function main() {
    const tester = new IntegrationTester();

    // Check if server is running
    try {
        await axios.get(`${BASE_URL}/health`);
    } catch (error) {
        console.log('❌ Server is not running!');
        console.log('Please start the server first:');
        console.log('  npm start');
        console.log('  or');
        console.log('  node reward_integration_example.js');
        process.exit(1);
    }

    await tester.runAllTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

module.exports = IntegrationTester;