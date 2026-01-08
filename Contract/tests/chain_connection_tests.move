#[test_only]
module cedra_gamefi::chain_connection_tests {
    use std::signer;
    use cedra_framework::account;
    use cedra_gamefi::treasury;
    use cedra_gamefi::rewards;

    // Test constants
    const SERVER_PUBLIC_KEY: vector<u8> = x"d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";

    #[test(admin = @0x123)]
    public fun test_wallet_address_validation(admin: &signer) {
        // Test basic wallet address functionality
        let admin_addr = signer::address_of(admin);
        
        // Verify address is valid format
        assert!(admin_addr == @0x123, 1);
        
        // Test account creation for testing
        account::create_account_for_test(admin_addr);
        
        // Verify account exists after creation
        assert!(account::exists_at(admin_addr), 2);
    }

    #[test(admin = @0x123, user = @0x456)]
    public fun test_multiple_wallet_addresses(admin: &signer, user: &signer) {
        // Test multiple wallet addresses interaction
        let admin_addr = signer::address_of(admin);
        let user_addr = signer::address_of(user);
        
        // Verify addresses are different
        assert!(admin_addr != user_addr, 1);
        
        // Create accounts for both
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(user_addr);
        
        // Verify both accounts exist
        assert!(account::exists_at(admin_addr), 2);
        assert!(account::exists_at(user_addr), 3);
    }

    #[test]
    public fun test_address_format_validation() {
        // Test different address formats
        let addr1 = @0x1;
        let addr2 = @0x123;
        let addr3 = @0xabcdef123456;
        
        // All should be valid addresses and different
        assert!(addr1 != addr2, 1);
        assert!(addr2 != addr3, 2);
        assert!(addr1 != addr3, 3);
        
        // Test address comparison
        assert!(addr1 == @0x1, 4);
        assert!(addr2 == @0x123, 5);
    }

    #[test]
    public fun test_uninitialized_chain_queries() {
        // Test querying uninitialized addresses (simulates chain queries)
        let random_addr1 = @0x999999;
        let random_addr2 = @0xabcdef;
        let random_addr3 = @0x0;
        
        // Should return false for uninitialized addresses
        assert!(!treasury::is_initialized(random_addr1), 1);
        assert!(!treasury::is_initialized(random_addr2), 2);
        assert!(!treasury::is_initialized(random_addr3), 3);
        
        assert!(!rewards::is_initialized(random_addr1), 4);
        assert!(!rewards::is_initialized(random_addr2), 5);
        assert!(!rewards::is_initialized(random_addr3), 6);
        
        assert!(!rewards::is_nonce_used(random_addr1, 12345), 7);
        assert!(!rewards::is_nonce_used(random_addr2, 67890), 8);
    }

    #[test(wallet1 = @0x111, wallet2 = @0x222, wallet3 = @0x333)]
    public fun test_multi_wallet_connection(
        wallet1: &signer,
        wallet2: &signer, 
        wallet3: &signer
    ) {
        // Test connection simulation with multiple wallets
        let addr1 = signer::address_of(wallet1);
        let addr2 = signer::address_of(wallet2);
        let addr3 = signer::address_of(wallet3);
        
        // Verify all addresses are unique
        assert!(addr1 != addr2, 1);
        assert!(addr2 != addr3, 2);
        assert!(addr1 != addr3, 3);
        
        // Simulate wallet connections by creating accounts
        account::create_account_for_test(addr1);
        account::create_account_for_test(addr2);
        account::create_account_for_test(addr3);
        
        // Verify all wallets are "connected" (accounts exist)
        assert!(account::exists_at(addr1), 4);
        assert!(account::exists_at(addr2), 5);
        assert!(account::exists_at(addr3), 6);
        
        // Test that each wallet can query chain state independently
        assert!(!treasury::is_initialized(addr1), 7);
        assert!(!treasury::is_initialized(addr2), 8);
        assert!(!treasury::is_initialized(addr3), 9);
    }

    #[test]
    public fun test_address_encoding_formats() {
        // Test various address encoding formats that wallets might use
        
        // Short format
        let short_addr = @0x1;
        
        // Medium format  
        let medium_addr = @0x123456;
        
        // Verify they are treated as different addresses
        assert!(short_addr != medium_addr, 1);
        
        // Test specific wallet-like addresses
        let wallet_addr1 = @0xace1;
        let wallet_addr2 = @0xface;
        
        assert!(wallet_addr1 != wallet_addr2, 2);
        assert!(wallet_addr1 != short_addr, 3);
        
        // Test that same addresses are equal
        assert!(short_addr == @0x1, 4);
        assert!(medium_addr == @0x123456, 5);
    }

    #[test(user = @0xabcdef123456789)]
    public fun test_wallet_state_isolation(user: &signer) {
        // Test that wallet state is isolated per address
        let user_addr = signer::address_of(user);
        let other_addr = @0x987654321;
        
        account::create_account_for_test(user_addr);
        
        // User's wallet exists
        assert!(account::exists_at(user_addr), 1);
        
        // State queries return different results for different addresses
        assert!(!treasury::is_initialized(user_addr), 2);
        assert!(!treasury::is_initialized(other_addr), 3);
        
        // Both should return false but for different reasons
        // user_addr: account exists but treasury not initialized
        // other_addr: account doesn't exist
    }

    #[test]
    public fun test_chain_query_consistency() {
        // Test that chain queries are consistent across calls
        let test_addr = @0x999888777;
        
        // Multiple calls should return same result
        assert!(!treasury::is_initialized(test_addr), 1);
        assert!(!treasury::is_initialized(test_addr), 2);
        assert!(!treasury::is_initialized(test_addr), 3);
        
        assert!(!rewards::is_initialized(test_addr), 4);
        assert!(!rewards::is_initialized(test_addr), 5);
        
        // Nonce queries should also be consistent
        assert!(!rewards::is_nonce_used(test_addr, 111), 6);
        assert!(!rewards::is_nonce_used(test_addr, 111), 7);
        assert!(!rewards::is_nonce_used(test_addr, 222), 8);
    }

    #[test]
    public fun test_address_boundary_values() {
        // Test boundary address values
        let zero_addr = @0x0;
        let max_addr = @0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        let one_addr = @0x1;
        
        // All should be valid and different
        assert!(zero_addr != one_addr, 1);
        assert!(zero_addr != max_addr, 2);
        assert!(one_addr != max_addr, 3);
        
        // Chain queries should work for all
        assert!(!treasury::is_initialized(zero_addr), 4);
        assert!(!treasury::is_initialized(max_addr), 5);
        assert!(!treasury::is_initialized(one_addr), 6);
    }

    #[test]
    public fun test_specific_wallet_address() {
        // Test specific wallet address: 13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1
        let wallet_addr = @0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1;
        
        // Test that this address is valid and can be used
        assert!(wallet_addr != @0x0, 1);
        assert!(wallet_addr != @0x1, 2);
        
        // Test chain queries for this specific address
        assert!(!treasury::is_initialized(wallet_addr), 3);
        assert!(!rewards::is_initialized(wallet_addr), 4);
        assert!(!rewards::is_nonce_used(wallet_addr, 12345), 5);
        
        // Test that we can compare with other addresses
        let other_addr = @0x456;
        assert!(wallet_addr != other_addr, 6);
        
        // Test address format consistency
        let same_addr = @0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1;
        assert!(wallet_addr == same_addr, 7);
    }

    #[test(test_wallet = @0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1)]
    public fun test_specific_wallet_with_signer(test_wallet: &signer) {
        // Test the specific wallet address with signer functionality
        let wallet_addr = signer::address_of(test_wallet);
        
        // Verify the address matches expected value
        assert!(wallet_addr == @0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1, 1);
        
        // Create account for this wallet (simulates wallet connection)
        account::create_account_for_test(wallet_addr);
        
        // Verify account exists (wallet is "connected")
        assert!(account::exists_at(wallet_addr), 2);
        
        // Test chain state queries for this wallet
        assert!(!treasury::is_initialized(wallet_addr), 3);
        assert!(!rewards::is_initialized(wallet_addr), 4);
        
        // Test that this wallet can interact with chain state
        // (In real scenario, this wallet could initialize treasury/rewards)
    }

    #[test]
    public fun test_wallet_address_validation_comprehensive() {
        // Test the specific wallet address format validation
        let target_wallet = @0x13680acd8f83485c81d517247a5722f0316795353d7e5965346bb6ccb9f0c9b1;
        
        // Verify it's a valid 32-byte address (64 hex characters)
        // This is implicit in Move - if it compiles, the address format is valid
        
        // Test against common address patterns
        let zero_addr = @0x0;
        let one_addr = @0x1;
        let max_addr = @0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        
        // Verify uniqueness
        assert!(target_wallet != zero_addr, 1);
        assert!(target_wallet != one_addr, 2);
        assert!(target_wallet != max_addr, 3);
        
        // Test that the address can be used in all chain operations
        assert!(!treasury::is_initialized(target_wallet), 4);
        assert!(!rewards::is_initialized(target_wallet), 5);
        
        // Test multiple nonce queries
        assert!(!rewards::is_nonce_used(target_wallet, 1), 6);
        assert!(!rewards::is_nonce_used(target_wallet, 999), 7);
        assert!(!rewards::is_nonce_used(target_wallet, 123456), 8);
    }
}