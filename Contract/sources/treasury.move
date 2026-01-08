module cedra_gamefi::treasury {
    use std::signer;
    use cedra_framework::account::{Self, SignerCapability};
    use cedra_framework::coin;
    use cedra_framework::cedra_coin::CedraCoin;
    use cedra_gamefi::errors;

    // ========== FRIEND MODULES ==========
    friend cedra_gamefi::rewards;

    // ========== ERRORS ==========
    const ETREASURY_NOT_INITIALIZED: u64 = 100;
    const ETREASURY_ALREADY_INITIALIZED: u64 = 101;

    // ========== STRUCTS ==========

    struct Treasury has key {
        signer_cap: SignerCapability,
        resource_account_address: address,
        admin: address,
    }

    // ========== ENTRY FUNCTIONS ==========
    public entry fun initialize(admin: &signer, seed: vector<u8>) {
        let admin_address = signer::address_of(admin);
        

        assert!(!exists<Treasury>(admin_address), ETREASURY_ALREADY_INITIALIZED);
        
        let (resource_signer, signer_cap) = account::create_resource_account(admin, seed);
        let resource_account_address = signer::address_of(&resource_signer);
        
        coin::register<CedraCoin>(&resource_signer);
        
        move_to(admin, Treasury {
            signer_cap,
            resource_account_address,
            admin: admin_address,
        });
    }

    public entry fun deposit(admin: &signer, amount: u64) acquires Treasury {
        let admin_address = signer::address_of(admin);
        
        assert!(exists<Treasury>(admin_address), ETREASURY_NOT_INITIALIZED);
        
        let treasury = borrow_global<Treasury>(admin_address);
        
        assert!(treasury.admin == admin_address, errors::not_admin());
        
        let coins = coin::withdraw<CedraCoin>(admin, amount);
        coin::deposit(treasury.resource_account_address, coins);
    }

    public entry fun emergency_withdraw(admin: &signer) acquires Treasury {
        let admin_address = signer::address_of(admin);
        
        assert!(exists<Treasury>(admin_address), ETREASURY_NOT_INITIALIZED);
        
        let treasury = borrow_global<Treasury>(admin_address);
        
        assert!(treasury.admin == admin_address, errors::not_admin());
        
        let resource_signer = account::create_signer_with_capability(&treasury.signer_cap);
        
        let balance = coin::balance<CedraCoin>(treasury.resource_account_address);
        
        if (balance > 0) {
            let coins = coin::withdraw<CedraCoin>(&resource_signer, balance);
            coin::deposit(admin_address, coins);
        };
    }

    // ========== PUBLIC FRIEND FUNCTIONS ==========

    public(friend) fun withdraw_to_user(
        admin_address: address,
        recipient: address,
        amount: u64
    ) acquires Treasury {
        assert!(exists<Treasury>(admin_address), ETREASURY_NOT_INITIALIZED);
        
        let treasury = borrow_global<Treasury>(admin_address);
        
        let balance = coin::balance<CedraCoin>(treasury.resource_account_address);
        assert!(balance >= amount, errors::insufficient_balance());
        
        let resource_signer = account::create_signer_with_capability(&treasury.signer_cap);
        
        let coins = coin::withdraw<CedraCoin>(&resource_signer, amount);
        
        if (!coin::is_account_registered<CedraCoin>(recipient)) {
            coin::register<CedraCoin>(&resource_signer); 
        };
        
        coin::deposit(recipient, coins);
    }

    // ========== VIEW FUNCTIONS ==========

    #[view]
    public fun get_balance(admin_address: address): u64 acquires Treasury {
        assert!(exists<Treasury>(admin_address), ETREASURY_NOT_INITIALIZED);
        let treasury = borrow_global<Treasury>(admin_address);
        coin::balance<CedraCoin>(treasury.resource_account_address)
    }

    #[view]
    public fun get_resource_account_address(admin_address: address): address acquires Treasury {
        assert!(exists<Treasury>(admin_address), ETREASURY_NOT_INITIALIZED);
        let treasury = borrow_global<Treasury>(admin_address);
        treasury.resource_account_address
    }

    #[view]
    public fun is_initialized(admin_address: address): bool {
        exists<Treasury>(admin_address)
    }

    #[view]
    public fun get_admin(admin_address: address): address acquires Treasury {
        assert!(exists<Treasury>(admin_address), ETREASURY_NOT_INITIALIZED);
        let treasury = borrow_global<Treasury>(admin_address);
        treasury.admin
    }

    // ========== INTERNAL FUNCTIONS ==========

    public(friend) fun get_resource_signer(admin_address: address): signer acquires Treasury {
        assert!(exists<Treasury>(admin_address), ETREASURY_NOT_INITIALIZED);
        let treasury = borrow_global<Treasury>(admin_address);
        account::create_signer_with_capability(&treasury.signer_cap)
    }
}