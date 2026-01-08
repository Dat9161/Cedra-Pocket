/// Rewards module - Handles claim reward logic with signature verification
/// Integrates with Treasury to transfer coins to users on Cedra Network
module cedra_gamefi::rewards {
    use std::signer;
    use std::vector;
    use std::bcs;
    use std::ed25519;
    use cedra_framework::event;
    use cedra_framework::timestamp;
    use cedra_gamefi::treasury;
    use cedra_gamefi::errors;

    // ========== ERRORS ==========
    /// Error: Rewards not initialized
    const EREWARDS_NOT_INITIALIZED: u64 = 200;
    
    /// Error: Rewards already initialized
    const EREWARDS_ALREADY_INITIALIZED: u64 = 201;

    // ========== STRUCTS ==========

    /// Main configuration of Reward System
    struct RewardConfig has key {
        /// Server public key for signature verification
        server_public_key: vector<u8>,
        /// List of used nonces (prevent replay attack)
        processed_nonces: vector<u64>,
        /// System pause status
        is_paused: bool,
        /// Admin address with management rights
        admin: address,
    }

    // ========== EVENTS ==========

    #[event]
    /// Event emitted when user claims reward successfully
    struct RewardClaimed has drop, store {
        /// Recipient address
        recipient: address,
        /// Amount of coins claimed
        amount: u64,
        /// Nonce used
        nonce: u64,
        /// Transaction timestamp
        timestamp: u64,
    }

    #[event]
    /// Event emitted when admin changes configuration
    struct ConfigUpdated has drop, store {
        /// Type of change: "pause", "unpause", "public_key"
        action: vector<u8>,
        /// Admin performing the change
        admin: address,
        /// Change timestamp
        timestamp: u64,
    }

    // ========== ENTRY FUNCTIONS ==========

    /// Initialize Reward System
    /// Can only be called once
    public entry fun initialize(
        admin: &signer, 
        server_public_key: vector<u8>
    ) {
        let admin_address = signer::address_of(admin);
        
        // Check not initialized yet
        assert!(!exists<RewardConfig>(admin_address), EREWARDS_ALREADY_INITIALIZED);
        
        // Create RewardConfig
        move_to(admin, RewardConfig {
            server_public_key,
            processed_nonces: vector::empty<u64>(),
            is_paused: false,
            admin: admin_address,
        });

        // Emit event
        event::emit(ConfigUpdated {
            action: b"initialize",
            admin: admin_address,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Claim reward with Ed25519 signature verification
    public entry fun claim_reward(
        user: &signer,
        admin_address: address,
        amount: u64,
        nonce: u64,
        signature: vector<u8>
    ) acquires RewardConfig {
        let user_address = signer::address_of(user);
        
        // Check RewardConfig initialized
        assert!(exists<RewardConfig>(admin_address), EREWARDS_NOT_INITIALIZED);
        
        let config = borrow_global_mut<RewardConfig>(admin_address);
        
        // Check system not paused
        assert!(!config.is_paused, errors::paused());
        
        // Check nonce not used
        assert!(!vector::contains(&config.processed_nonces, &nonce), errors::nonce_used());
        
        // Create message for signature verification
        let message = create_message(user_address, amount, nonce);
        
        // Create public key object from bytes
        let public_key = ed25519::new_unvalidated_public_key_from_bytes(config.server_public_key);
        
        // Create signature object from bytes
        let signature_obj = ed25519::new_signature_from_bytes(signature);
        
        // Verify signature
        let is_valid = ed25519::signature_verify_strict(&signature_obj, &public_key, message);
        assert!(is_valid, errors::invalid_signature());
        
        // Call Treasury to transfer coins to user
        treasury::withdraw_to_user(admin_address, user_address, amount);
        
        // Save used nonce
        vector::push_back(&mut config.processed_nonces, nonce);
        
        // Emit RewardClaimed event
        event::emit(RewardClaimed {
            recipient: user_address,
            amount,
            nonce,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Pause reward system
    /// Only Admin allowed
    public entry fun set_pause(admin: &signer, admin_address: address, paused: bool) acquires RewardConfig {
        let caller_address = signer::address_of(admin);
        
        // Check RewardConfig initialized
        assert!(exists<RewardConfig>(admin_address), EREWARDS_NOT_INITIALIZED);
        
        let config = borrow_global_mut<RewardConfig>(admin_address);
        
        // Check admin permission
        assert!(config.admin == caller_address, errors::not_admin());
        
        // Update pause status
        config.is_paused = paused;
        
        // Emit event
        let action = if (paused) b"pause" else b"unpause";
        event::emit(ConfigUpdated {
            action,
            admin: caller_address,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Update server public key
    /// Only Admin allowed
    public entry fun update_public_key(
        admin: &signer, 
        admin_address: address,
        new_public_key: vector<u8>
    ) acquires RewardConfig {
        let caller_address = signer::address_of(admin);
        
        // Check RewardConfig initialized
        assert!(exists<RewardConfig>(admin_address), EREWARDS_NOT_INITIALIZED);
        
        let config = borrow_global_mut<RewardConfig>(admin_address);
        
        // Check admin permission
        assert!(config.admin == caller_address, errors::not_admin());
        
        // Update public key
        config.server_public_key = new_public_key;
        
        // Emit event
        event::emit(ConfigUpdated {
            action: b"public_key",
            admin: caller_address,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Clean up old nonces to save storage (Admin only)
    public entry fun cleanup_old_nonces(
        admin: &signer,
        admin_address: address,
        keep_last_n: u64
    ) acquires RewardConfig {
        let caller_address = signer::address_of(admin);
        
        // Check RewardConfig initialized
        assert!(exists<RewardConfig>(admin_address), EREWARDS_NOT_INITIALIZED);
        
        let config = borrow_global_mut<RewardConfig>(admin_address);
        
        // Check admin permission
        assert!(config.admin == caller_address, errors::not_admin());
        
        let nonces_len = vector::length(&config.processed_nonces);
        
        if (nonces_len > keep_last_n) {
            let remove_count = nonces_len - keep_last_n;
            let i = 0;
            while (i < remove_count) {
                vector::remove(&mut config.processed_nonces, 0);
                i = i + 1;
            };
        };
    }

    // ========== VIEW FUNCTIONS ==========

    #[view]
    /// Check if nonce is used
    public fun is_nonce_used(admin_address: address, nonce: u64): bool acquires RewardConfig {
        if (!exists<RewardConfig>(admin_address)) {
            return false
        };
        
        let config = borrow_global<RewardConfig>(admin_address);
        vector::contains(&config.processed_nonces, &nonce)
    }

    #[view]
    /// Get pause status
    public fun is_paused(admin_address: address): bool acquires RewardConfig {
        assert!(exists<RewardConfig>(admin_address), EREWARDS_NOT_INITIALIZED);
        let config = borrow_global<RewardConfig>(admin_address);
        config.is_paused
    }

    #[view]
    /// Get current public key
    public fun get_public_key(admin_address: address): vector<u8> acquires RewardConfig {
        assert!(exists<RewardConfig>(admin_address), EREWARDS_NOT_INITIALIZED);
        let config = borrow_global<RewardConfig>(admin_address);
        config.server_public_key
    }

    #[view]
    /// Get number of processed nonces
    public fun get_processed_nonces_count(admin_address: address): u64 acquires RewardConfig {
        assert!(exists<RewardConfig>(admin_address), EREWARDS_NOT_INITIALIZED);
        let config = borrow_global<RewardConfig>(admin_address);
        vector::length(&config.processed_nonces)
    }

    #[view]
    /// Check if RewardConfig is initialized
    public fun is_initialized(admin_address: address): bool {
        exists<RewardConfig>(admin_address)
    }

    // ========== INTERNAL FUNCTIONS ==========

    /// Create message for signature verification
    /// Format: user_address + amount + nonce (all serialized with BCS)
    fun create_message(user_address: address, amount: u64, nonce: u64): vector<u8> {
        let message = vector::empty<u8>();
        
        // Serialize user address
        let user_bytes = bcs::to_bytes(&user_address);
        vector::append(&mut message, user_bytes);
        
        // Serialize amount
        let amount_bytes = bcs::to_bytes(&amount);
        vector::append(&mut message, amount_bytes);
        
        // Serialize nonce
        let nonce_bytes = bcs::to_bytes(&nonce);
        vector::append(&mut message, nonce_bytes);
        
        message
    }

    // ========== TEST HELPERS ==========
    
    #[test_only]
    /// Helper function for testing - create message
    public fun create_test_message(user_address: address, amount: u64, nonce: u64): vector<u8> {
        create_message(user_address, amount, nonce)
    }
}