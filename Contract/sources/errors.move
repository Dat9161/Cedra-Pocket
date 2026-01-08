/// Error codes module for GameFi Mini App
/// Contains all error constants used throughout the project
module cedra_gamefi::errors {
    
    // ========== ADMIN ERRORS ==========
    /// Error: Caller is not admin
    const ENOT_ADMIN: u64 = 1;
    
    // ========== SIGNATURE ERRORS ==========
    /// Error: Invalid signature
    const EINVALID_SIGNATURE: u64 = 2;
    
    // ========== NONCE ERRORS ==========
    /// Error: Nonce already used (prevent replay attack)
    const ENONCE_USED: u64 = 3;
    
    // ========== SYSTEM ERRORS ==========
    /// Error: System is paused
    const EPAUSED: u64 = 4;
    
    // ========== BALANCE ERRORS ==========
    /// Error: Insufficient balance
    const EINSUFFICIENT_BALANCE: u64 = 5;
    
    // ========== GAME SPECIFIC ERRORS ==========
    /// Error: Player does not exist
    const EPLAYER_NOT_EXISTS: u64 = 6;
    
    /// Error: Invalid game session
    const EINVALID_GAME_SESSION: u64 = 7;
    
    /// Error: Reward not available
    const EREWARD_NOT_AVAILABLE: u64 = 8;
    
    /// Error: NFT does not exist
    const ENFT_NOT_EXISTS: u64 = 9;
    
    /// Error: NFT not owned
    const ENFT_NOT_OWNED: u64 = 10;
    
    // ========== PUBLIC GETTER FUNCTIONS ==========
    
    /// Get ENOT_ADMIN error code
    public fun not_admin(): u64 { ENOT_ADMIN }
    
    /// Get EINVALID_SIGNATURE error code
    public fun invalid_signature(): u64 { EINVALID_SIGNATURE }
    
    /// Get ENONCE_USED error code
    public fun nonce_used(): u64 { ENONCE_USED }
    
    /// Get EPAUSED error code
    public fun paused(): u64 { EPAUSED }
    
    /// Get EINSUFFICIENT_BALANCE error code
    public fun insufficient_balance(): u64 { EINSUFFICIENT_BALANCE }
    
    /// Get EPLAYER_NOT_EXISTS error code
    public fun player_not_exists(): u64 { EPLAYER_NOT_EXISTS }
    
    /// Get EINVALID_GAME_SESSION error code
    public fun invalid_game_session(): u64 { EINVALID_GAME_SESSION }
    
    /// Get EREWARD_NOT_AVAILABLE error code
    public fun reward_not_available(): u64 { EREWARD_NOT_AVAILABLE }
    
    /// Get ENFT_NOT_EXISTS error code
    public fun nft_not_exists(): u64 { ENFT_NOT_EXISTS }
    
    /// Get ENFT_NOT_OWNED error code
    public fun nft_not_owned(): u64 { ENFT_NOT_OWNED }
}