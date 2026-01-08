#[test_only]
module cedra_gamefi::view_functions_tests {
    use cedra_gamefi::treasury;
    use cedra_gamefi::rewards;

    #[test]
    public fun test_treasury_view_functions_uninitialized() {
        // Test view functions with uninitialized address
        let uninitialized_addr = @0x999;
        
        // Should return false for uninitialized treasury
        assert!(!treasury::is_initialized(uninitialized_addr), 1);
    }

    #[test]
    public fun test_rewards_view_functions_uninitialized() {
        // Test view functions with uninitialized address
        let uninitialized_addr = @0x999;
        let test_nonce = 12345;
        
        // Should return false for uninitialized rewards
        assert!(!rewards::is_initialized(uninitialized_addr), 1);
        assert!(!rewards::is_nonce_used(uninitialized_addr, test_nonce), 2);
    }

    #[test]
    public fun test_message_creation() {
        // Test message creation helper function
        let user_addr = @0x456;
        let amount = 100000;
        let nonce = 12345;
        
        let message = rewards::create_test_message(user_addr, amount, nonce);
        
        // Verify message is not empty
        assert!(std::vector::length(&message) > 0, 1);
        
        // Message should contain serialized data
        // BCS serialization: address(32 bytes) + u64(8 bytes) + u64(8 bytes) = minimum 48 bytes
        assert!(std::vector::length(&message) >= 48, 2);
    }

    #[test]
    public fun test_message_consistency() {
        // Test that same inputs produce same message
        let user_addr = @0x456;
        let amount = 100000;
        let nonce = 12345;
        
        let message1 = rewards::create_test_message(user_addr, amount, nonce);
        let message2 = rewards::create_test_message(user_addr, amount, nonce);
        
        // Same inputs should produce identical messages
        assert!(message1 == message2, 1);
        
        // Different inputs should produce different messages
        let message3 = rewards::create_test_message(user_addr, amount + 1, nonce);
        assert!(message1 != message3, 2);
        
        let message4 = rewards::create_test_message(user_addr, amount, nonce + 1);
        assert!(message1 != message4, 3);
    }
}