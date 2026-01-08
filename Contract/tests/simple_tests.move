#[test_only]
module cedra_gamefi::simple_tests {
    use cedra_gamefi::errors;

    #[test]
    public fun test_error_codes() {
        // Test all error code getter functions
        assert!(errors::not_admin() == 1, 1);
        assert!(errors::invalid_signature() == 2, 2);
        assert!(errors::nonce_used() == 3, 3);
        assert!(errors::paused() == 4, 4);
        assert!(errors::insufficient_balance() == 5, 5);
        assert!(errors::player_not_exists() == 6, 6);
        assert!(errors::invalid_game_session() == 7, 7);
        assert!(errors::reward_not_available() == 8, 8);
        assert!(errors::nft_not_exists() == 9, 9);
        assert!(errors::nft_not_owned() == 10, 10);
    }

    #[test]
    public fun test_error_codes_uniqueness() {
        // Verify all error codes are unique
        let codes = vector[
            errors::not_admin(),
            errors::invalid_signature(),
            errors::nonce_used(),
            errors::paused(),
            errors::insufficient_balance(),
            errors::player_not_exists(),
            errors::invalid_game_session(),
            errors::reward_not_available(),
            errors::nft_not_exists(),
            errors::nft_not_owned(),
        ];
        
        // Check each code is different from others
        let i = 0;
        let len = std::vector::length(&codes);
        while (i < len) {
            let j = i + 1;
            while (j < len) {
                let code_i = *std::vector::borrow(&codes, i);
                let code_j = *std::vector::borrow(&codes, j);
                assert!(code_i != code_j, (i * 100 + j)); // Unique error for each pair
                j = j + 1;
            };
            i = i + 1;
        };
    }

    #[test]
    public fun test_error_codes_range() {
        // Verify error codes are in expected range (1-10)
        assert!(errors::not_admin() >= 1 && errors::not_admin() <= 10, 1);
        assert!(errors::invalid_signature() >= 1 && errors::invalid_signature() <= 10, 2);
        assert!(errors::nonce_used() >= 1 && errors::nonce_used() <= 10, 3);
        assert!(errors::paused() >= 1 && errors::paused() <= 10, 4);
        assert!(errors::insufficient_balance() >= 1 && errors::insufficient_balance() <= 10, 5);
        assert!(errors::player_not_exists() >= 1 && errors::player_not_exists() <= 10, 6);
        assert!(errors::invalid_game_session() >= 1 && errors::invalid_game_session() <= 10, 7);
        assert!(errors::reward_not_available() >= 1 && errors::reward_not_available() <= 10, 8);
        assert!(errors::nft_not_exists() >= 1 && errors::nft_not_exists() <= 10, 9);
        assert!(errors::nft_not_owned() >= 1 && errors::nft_not_owned() <= 10, 10);
    }
}