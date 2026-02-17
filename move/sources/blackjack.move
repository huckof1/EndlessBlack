/// Pixel Blackjack - Web3     Endless
///
/// :
/// -     EDS 
/// - :  21    21  
/// -  = 1  11,  (J,Q,K) = 10
/// -  (>21) = 
module pixel_blackjack::blackjack {
    use std::signer;
    use std::vector;
    use endless_framework::timestamp;
    use endless_framework::event;
    use endless_framework::endless_coin;
    use endless_framework::account;
    use endless_framework::simple_map::{Self, SimpleMap};

    // ====================  ====================

    ///
    const E_GAME_NOT_FOUND: u64 = 1;
    ///
    const E_GAME_ALREADY_FINISHED: u64 = 2;
    ///
    const E_INSUFFICIENT_FUNDS: u64 = 3;
    ///
    const E_INVALID_BET: u64 = 4;
    ///
    const E_GAME_NOT_FINISHED: u64 = 5;
    ///
    const E_PLAYER_BUSTED: u64 = 6;
    ///
    const E_INSUFFICIENT_BANKROLL: u64 = 7;
    ///
    const E_NOT_OWNER: u64 = 8;
    ///
    const E_INVALID_FEE: u64 = 9;
    ///
    const E_PAYOUT_ALREADY_CLAIMED: u64 = 10;
    ///
    const E_INVALID_AMOUNT: u64 = 11;
    ///
    const E_INSUFFICIENT_BALANCE: u64 = 12;
    /// Room not found
    const E_ROOM_NOT_FOUND: u64 = 100;
    /// Room is not in waiting status
    const E_ROOM_NOT_WAITING: u64 = 101;
    /// Room is not in playing status
    const E_ROOM_NOT_PLAYING: u64 = 102;
    /// Not your turn
    const E_NOT_YOUR_TURN: u64 = 103;
    /// Cannot join your own room
    const E_CANNOT_JOIN_OWN_ROOM: u64 = 104;
    /// Only host can cancel
    const E_NOT_HOST: u64 = 105;
    /// Player already done (stood or busted)
    const E_PLAYER_ALREADY_DONE: u64 = 106;
    /// Timeout not reached yet
    const E_TIMEOUT_NOT_REACHED: u64 = 107;
    /// Room already finished
    const E_ROOM_ALREADY_FINISHED: u64 = 108;
    /// Not a participant
    const E_NOT_PARTICIPANT: u64 = 109;

    // ====================  ====================

    ///   (0.1 EDS)
    const MIN_BET: u128 = 10000000;
    ///   (10000 EDS)
    const MAX_BET: u128 = 1000000000000;
    ///  (21)
    const BLACKJACK: u64 = 21;
    ///    17
    const DEALER_STAND: u64 = 17;
    ///   (10%)
    const MAX_FEE_BPS: u128 = 1000;

    // Room status constants
    const ROOM_WAITING: u8 = 0;
    const ROOM_PLAYING: u8 = 1;
    const ROOM_FINISHED: u8 = 2;
    const ROOM_CANCELLED: u8 = 3;
    const ROOM_TIMEOUT: u8 = 4;
    // Room turn timeout: 5 minutes
    const ROOM_TURN_TIMEOUT: u64 = 300;

    // ====================  ====================

    /// 
    struct Card has store, copy, drop {
        /// : 0=, 1=, 2=, 3=
        suit: u8,
        /// : 1=, 2-10=, 11=, 12=, 13=
        rank: u8,
    }

    ///  
    struct Game has key, store {
        /// ID 
        game_id: u64,
        ///  
        player: address,
        /// 
        bet_amount: u128,
        ///   
        net_bet: u128,
        /// 
        fee_amount: u128,
        /// ,  
        payout_due: u128,
        ///  ?
        is_claimed: bool,
        ///  
        player_cards: vector<Card>,
        ///  
        dealer_cards: vector<Card>,
        ///  
        player_score: u64,
        ///  
        dealer_score: u64,
        ///  ?
        is_finished: bool,
        /// : 0= , 1= , 2= , 3=, 4=
        result: u8,
        ///  
        created_at: u64,
    }

    ///
    struct GameStore has key {
        ///
        game_counter: u64,
        ///
        games: vector<Game>,
        ///   ( )
        bankroll: u128,
        ///
        treasury: u128,
        ///
        owner: address,
        ///   bps (100 = 1%)
        fee_bps: u128,
        /// Resource account signer capability (holds player deposits)
        resource_signer_cap: account::SignerCapability,
        /// Player in-game balances (address -> octas)
        player_balances: SimpleMap<address, u128>,
    }

    /// Multiplayer room
    struct Room has store, copy, drop {
        room_id: u64,
        host: address,
        guest: address,
        bet_amount: u128,
        net_bet: u128,
        fee_amount: u128,
        status: u8,
        host_cards: vector<Card>,
        guest_cards: vector<Card>,
        host_score: u64,
        guest_score: u64,
        deck_index: u64,
        turn: u8,
        host_done: bool,
        guest_done: bool,
        result: u8,
        created_at: u64,
        last_action_at: u64,
    }

    /// RoomStore - separate from GameStore to avoid migration issues
    struct RoomStore has key {
        room_counter: u64,
        rooms: vector<Room>,
    }

    ///
    struct PlayerStats has key {
        ///  
        total_games: u64,
        /// 
        wins: u64,
        /// 
        losses: u64,
        /// 
        draws: u64,
        /// 
        blackjacks: u64,
        ///  
        total_won: u128,
        ///  
        total_lost: u128,
    }

    // ====================  ====================

    #[event]
    struct GameStarted has drop, store {
        game_id: u64,
        player: address,
        bet_amount: u128,
        fee_amount: u128,
        net_bet: u128,
        player_cards: vector<Card>,
        dealer_visible_card: Card,
        player_score: u64,
    }

    #[event]
    struct CardDealt has drop, store {
        game_id: u64,
        player: address,
        card: Card,
        new_score: u64,
        is_busted: bool,
    }

    #[event]
    struct GameFinished has drop, store {
        game_id: u64,
        player: address,
        result: u8,
        player_score: u64,
        dealer_score: u64,
        payout: u128,
    }

    #[event]
    struct PayoutClaimed has drop, store {
        game_id: u64,
        player: address,
        payout: u128,
    }

    #[event]
    struct Deposited has drop, store {
        player: address,
        amount: u128,
        new_balance: u128,
    }

    #[event]
    struct Withdrawn has drop, store {
        player: address,
        amount: u128,
        new_balance: u128,
    }

    #[event]
    struct BalanceUpdated has drop, store {
        player: address,
        delta: u128,
        is_win: bool,
        new_balance: u128,
    }

    // ==================== ROOM EVENTS ====================

    #[event]
    struct RoomCreated has drop, store {
        room_id: u64,
        host: address,
        bet_amount: u128,
    }

    #[event]
    struct RoomJoined has drop, store {
        room_id: u64,
        guest: address,
    }

    #[event]
    struct RoomCardDealt has drop, store {
        room_id: u64,
        player: address,
        card: Card,
        new_score: u64,
    }

    #[event]
    struct RoomStandEvent has drop, store {
        room_id: u64,
        player: address,
    }

    #[event]
    struct RoomFinished has drop, store {
        room_id: u64,
        result: u8,
        host_score: u64,
        guest_score: u64,
        winner: address,
    }

    #[event]
    struct RoomCancelled has drop, store {
        room_id: u64,
        host: address,
    }

    #[event]
    struct RoomTimeoutEvent has drop, store {
        room_id: u64,
        claimer: address,
    }

    // ====================  ====================

    ///   (  )
    fun init_module(admin: &signer) {
        let owner = signer::address_of(admin);
        // Create resource account to hold player deposits
        let (resource_signer, resource_signer_cap) = account::create_resource_account(admin, b"blackjack_bank");
        // Register resource account for EDS coin
        endless_coin::register(signer::address_of(&resource_signer));
        move_to(admin, GameStore {
            game_counter: 0,
            games: vector::empty(),
            bankroll: 0,
            treasury: 0,
            owner,
            fee_bps: 200, // 2%
            resource_signer_cap,
            player_balances: simple_map::create<address, u128>(),
        });
    }

    // ====================   ====================

    ///   
    public entry fun start_game(
        player: &signer,
        bet_amount: u128,
    ) acquires GameStore, PlayerStats {
        let player_addr = signer::address_of(player);

        //  
        assert!(bet_amount >= MIN_BET, E_INVALID_BET);
        assert!(bet_amount <= MAX_BET, E_INVALID_BET);

        // Use player's in-game deposited balance (on-chain vault accounting)
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(simple_map::contains_key(&game_store.player_balances, &player_addr), E_INSUFFICIENT_BALANCE);
        let player_balance = simple_map::borrow_mut(&mut game_store.player_balances, &player_addr);
        assert!(*player_balance >= bet_amount, E_INSUFFICIENT_BALANCE);

        //     
        let fee_amount = bet_amount * game_store.fee_bps / 10000;
        assert!(fee_amount < bet_amount, E_INVALID_FEE);
        let net_bet = bet_amount - fee_amount;

        //  :  +  >= .  (2.5x)
        let bankroll_value = game_store.bankroll;
        let max_payout = bet_amount * 5 / 2;
        assert!(bankroll_value + net_bet >= max_payout, E_INSUFFICIENT_BANKROLL);

        // Lock stake from player's in-game balance into bankroll/treasury accounting
        *player_balance = *player_balance - bet_amount;
        game_store.treasury = game_store.treasury + fee_amount;
        game_store.bankroll = game_store.bankroll + net_bet;

        //  ID 
        let game_id = game_store.game_counter + 1;
        game_store.game_counter = game_id;

        //  
        let player_cards = vector::empty<Card>();
        let dealer_cards = vector::empty<Card>();

        // 2  
        vector::push_back(&mut player_cards, draw_card(game_id, 0));
        vector::push_back(&mut player_cards, draw_card(game_id, 1));

        // 2  
        vector::push_back(&mut dealer_cards, draw_card(game_id, 2));
        vector::push_back(&mut dealer_cards, draw_card(game_id, 3));

        //  
        let player_score = calculate_score(&player_cards);
        let dealer_score = calculate_score(&dealer_cards);

        //  
        let game = Game {
            game_id,
            player: player_addr,
            bet_amount,
            net_bet,
            fee_amount,
            player_cards,
            dealer_cards,
            player_score,
            dealer_score,
            is_finished: false,
            result: 0,
            payout_due: 0,
            is_claimed: false,
            created_at: timestamp::now_seconds(),
        };

        //   
        if (player_score == BLACKJACK) {
            game.is_finished = true;
            game.result = 4; // !

            //  2.5x  ( ,   )
            let payout = bet_amount * 5 / 2;
            game.payout_due = payout;

            //  
            update_stats(player_addr, 4, payout, 0);

            event::emit(GameFinished {
                game_id,
                player: player_addr,
                result: 4,
                player_score,
                dealer_score,
                payout,
            });
        } else {
            //   
            let dealer_visible = *vector::borrow(&game.dealer_cards, 0);
            event::emit(GameStarted {
                game_id,
                player: player_addr,
                bet_amount,
                fee_amount,
                net_bet,
                player_cards: game.player_cards,
                dealer_visible_card: dealer_visible,
                player_score,
            });
        };

        //  
        vector::push_back(&mut game_store.games, game);

        //    
        if (!exists<PlayerStats>(player_addr)) {
            move_to(player, PlayerStats {
                total_games: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                blackjacks: 0,
                total_won: 0,
                total_lost: 0,
            });
        };
    }

    ///   (Hit)
    public entry fun hit(
        player: &signer,
        game_id: u64,
    ) acquires GameStore, PlayerStats {
        let player_addr = signer::address_of(player);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);

        //  
        let game_idx = find_game_index(&game_store.games, game_id);
        let game = vector::borrow_mut(&mut game_store.games, game_idx);

        // 
        assert!(game.player == player_addr, E_GAME_NOT_FOUND);
        assert!(!game.is_finished, E_GAME_ALREADY_FINISHED);
        assert!(game.player_score < BLACKJACK, E_PLAYER_BUSTED);

        //  
        let card_index = vector::length(&game.player_cards) + vector::length(&game.dealer_cards);
        let new_card = draw_card(game_id, card_index);
        vector::push_back(&mut game.player_cards, new_card);

        //  
        game.player_score = calculate_score(&game.player_cards);

        let is_busted = game.player_score > BLACKJACK;

        // 
        event::emit(CardDealt {
            game_id,
            player: player_addr,
            card: new_card,
            new_score: game.player_score,
            is_busted,
        });

        //   -  
        if (is_busted) {
            game.is_finished = true;
            game.result = 2; //  
            game.payout_due = 0;
            game.is_claimed = false;

            update_stats(player_addr, 2, 0, game.bet_amount);

            event::emit(GameFinished {
                game_id,
                player: player_addr,
                result: 2,
                player_score: game.player_score,
                dealer_score: game.dealer_score,
                payout: 0,
            });
        };
    }

    ///  (Stand)
    public entry fun stand(
        player: &signer,
        game_id: u64,
    ) acquires GameStore, PlayerStats {
        let player_addr = signer::address_of(player);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);

        //  
        let game_idx = find_game_index(&game_store.games, game_id);
        let game = vector::borrow_mut(&mut game_store.games, game_idx);

        // 
        assert!(game.player == player_addr, E_GAME_NOT_FOUND);
        assert!(!game.is_finished, E_GAME_ALREADY_FINISHED);

        //   -    < 17
        let card_index = vector::length(&game.player_cards) + vector::length(&game.dealer_cards);
        while (game.dealer_score < DEALER_STAND) {
            let new_card = draw_card(game_id, card_index);
            vector::push_back(&mut game.dealer_cards, new_card);
            game.dealer_score = calculate_score(&game.dealer_cards);
            card_index = card_index + 1;
        };

        //  
        let (result, payout) = determine_winner(
            game.player_score,
            game.dealer_score,
            game.bet_amount
        );

        game.is_finished = true;
        game.result = result;
        game.payout_due = payout;
        game.is_claimed = false;

        //  
        //    

        //  
        let lost = if (result == 2) { game.bet_amount } else { 0 };
        update_stats(player_addr, result, payout, lost);

        event::emit(GameFinished {
            game_id,
            player: player_addr,
            result,
            player_score: game.player_score,
            dealer_score: game.dealer_score,
            payout,
        });
    }

    // ====================   ====================

    ///   ()
    fun draw_card(game_id: u64, card_index: u64): Card {
        let seed = timestamp::now_microseconds() + game_id * 1000 + card_index * 13;
        let suit = ((seed % 4) as u8);
        let rank = (((seed / 4) % 13) as u8) + 1;
        Card { suit, rank }
    }

    ///   
    fun calculate_score(cards: &vector<Card>): u64 {
        let score: u64 = 0;
        let aces: u64 = 0;
        let i = 0;
        let len = vector::length(cards);

        while (i < len) {
            let card = vector::borrow(cards, i);
            let value = card_value(card.rank);

            if (card.rank == 1) {
                aces = aces + 1;
            };

            score = score + value;
            i = i + 1;
        };

        // :  ,    1  11
        while (aces > 0 && score > BLACKJACK) {
            score = score - 10;
            aces = aces - 1;
        };

        score
    }

    ///  
    fun card_value(rank: u8): u64 {
        if (rank == 1) {
            11 //  (  1)
        } else if (rank >= 10) {
            10 // 
        } else {
            (rank as u64)
        }
    }

    ///  
    fun determine_winner(player_score: u64, dealer_score: u64, bet: u128): (u8, u128) {
        if (dealer_score > BLACKJACK) {
            //   -  
            (1, bet * 2)
        } else if (player_score > dealer_score) {
            //    21
            (1, bet * 2)
        } else if (player_score < dealer_score) {
            //    21
            (2, 0)
        } else {
            //  -  
            (3, bet)
        }
    }

    ///    ID
    fun find_game_index(games: &vector<Game>, game_id: u64): u64 {
        let i = 0;
        let len = vector::length(games);
        while (i < len) {
            let game = vector::borrow(games, i);
            if (game.game_id == game_id) {
                return i
            };
            i = i + 1;
        };
        abort E_GAME_NOT_FOUND
    }

    ///   
    fun update_stats(player: address, result: u8, won: u128, lost: u128) acquires PlayerStats {
        if (!exists<PlayerStats>(player)) {
            return
        };

        let stats = borrow_global_mut<PlayerStats>(player);
        stats.total_games = stats.total_games + 1;

        if (result == 1) {
            stats.wins = stats.wins + 1;
        } else if (result == 2) {
            stats.losses = stats.losses + 1;
        } else if (result == 3) {
            stats.draws = stats.draws + 1;
        } else if (result == 4) {
            stats.blackjacks = stats.blackjacks + 1;
            stats.wins = stats.wins + 1;
        };

        stats.total_won = stats.total_won + won;
        stats.total_lost = stats.total_lost + lost;
    }

    // ==================== DEPOSIT / WITHDRAW ====================

    /// Player deposits EDS into their in-game balance
    public entry fun deposit(player: &signer, amount: u128) acquires GameStore {
        let player_addr = signer::address_of(player);
        assert!(amount > 0, E_INVALID_AMOUNT);
        assert!(endless_coin::balance(player_addr) >= amount, E_INSUFFICIENT_FUNDS);

        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let resource_signer = account::create_signer_with_capability(&game_store.resource_signer_cap);
        let _resource_addr = signer::address_of(&resource_signer);

        // Transfer EDS from player to resource account
        endless_coin::transfer(player, signer::address_of(&resource_signer), amount);

        // Update player balance
        if (simple_map::contains_key(&game_store.player_balances, &player_addr)) {
            let balance = simple_map::borrow_mut(&mut game_store.player_balances, &player_addr);
            *balance = *balance + amount;
        } else {
            simple_map::add(&mut game_store.player_balances, player_addr, amount);
        };

        let new_balance = *simple_map::borrow(&game_store.player_balances, &player_addr);
        event::emit(Deposited {
            player: player_addr,
            amount,
            new_balance,
        });
    }

    /// Web-wallet friendly wrapper (u64 args)
    public entry fun deposit_u64(player: &signer, amount: u64) acquires GameStore {
        deposit(player, amount as u128);
    }

    /// Player withdraws EDS from their in-game balance back to wallet
    public entry fun withdraw(player: &signer, amount: u128) acquires GameStore {
        let player_addr = signer::address_of(player);
        assert!(amount > 0, E_INVALID_AMOUNT);

        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(simple_map::contains_key(&game_store.player_balances, &player_addr), E_INSUFFICIENT_BALANCE);

        let balance = simple_map::borrow_mut(&mut game_store.player_balances, &player_addr);
        assert!(*balance >= amount, E_INSUFFICIENT_BALANCE);
        *balance = *balance - amount;

        // Transfer EDS from resource account to player
        let resource_signer = account::create_signer_with_capability(&game_store.resource_signer_cap);
        endless_coin::transfer(&resource_signer, player_addr, amount);

        let new_balance = *simple_map::borrow(&game_store.player_balances, &player_addr);
        event::emit(Withdrawn {
            player: player_addr,
            amount,
            new_balance,
        });
    }

    /// Web-wallet friendly wrapper (u64 args)
    public entry fun withdraw_u64(player: &signer, amount: u64) acquires GameStore {
        withdraw(player, amount as u128);
    }

    /// Owner updates a player's balance after a local game result
    /// is_win=true: player won, balance increases by delta
    /// is_win=false: player lost, balance decreases by delta (goes to bankroll)
    public entry fun update_balance(
        owner: &signer,
        player_addr: address,
        delta: u128,
        is_win: bool,
    ) acquires GameStore {
        let owner_addr = signer::address_of(owner);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(owner_addr == game_store.owner, E_NOT_OWNER);
        assert!(delta > 0, E_INVALID_AMOUNT);

        if (!simple_map::contains_key(&game_store.player_balances, &player_addr)) {
            simple_map::add(&mut game_store.player_balances, player_addr, 0);
        };

        let balance = simple_map::borrow_mut(&mut game_store.player_balances, &player_addr);
        if (is_win) {
            // Player won: add to balance, deduct from bankroll
            assert!(game_store.bankroll >= delta, E_INSUFFICIENT_BANKROLL);
            *balance = *balance + delta;
            game_store.bankroll = game_store.bankroll - delta;
        } else {
            // Player lost: deduct from balance, add to bankroll
            assert!(*balance >= delta, E_INSUFFICIENT_BALANCE);
            *balance = *balance - delta;
            game_store.bankroll = game_store.bankroll + delta;
        };

        let new_balance = *simple_map::borrow(&game_store.player_balances, &player_addr);
        event::emit(BalanceUpdated {
            player: player_addr,
            delta,
            is_win,
            new_balance,
        });
    }

    // ==================== VIEW  ====================

    #[view]
    ///    ID
    public fun get_game(game_id: u64): (
        address, u128, u128, u128, vector<Card>, vector<Card>, u64, u64, bool, u8, u128, bool
    ) acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        let game_idx = find_game_index(&game_store.games, game_id);
        let game = vector::borrow(&game_store.games, game_idx);

        (
            game.player,
            game.bet_amount,
            game.net_bet,
            game.fee_amount,
            game.player_cards,
            game.dealer_cards,
            game.player_score,
            game.dealer_score,
            game.is_finished,
            game.result,
            game.payout_due,
            game.is_claimed
        )
    }

    #[view]
    ///   
    public fun get_player_stats(player: address): (u64, u64, u64, u64, u64, u128, u128) acquires PlayerStats {
        if (!exists<PlayerStats>(player)) {
            return (0, 0, 0, 0, 0, 0, 0)
        };

        let stats = borrow_global<PlayerStats>(player);
        (
            stats.total_games,
            stats.wins,
            stats.losses,
            stats.draws,
            stats.blackjacks,
            stats.total_won,
            stats.total_lost
        )
    }

    #[view]
    /// Get player's in-game balance
    public fun get_player_balance(player_addr: address): u128 acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        if (simple_map::contains_key(&game_store.player_balances, &player_addr)) {
            *simple_map::borrow(&game_store.player_balances, &player_addr)
        } else {
            0
        }
    }

    #[view]
    ///
    public fun get_treasury_balance(): u128 acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        game_store.treasury
    }

    #[view]
    ///   ( )
    public fun get_bankroll_balance(): u128 acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        game_store.bankroll
    }

    #[view]
    ///   bps
    public fun get_fee_bps(): u128 acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        game_store.fee_bps
    }

    #[view]
    ///  
    public fun get_owner(): address acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        game_store.owner
    }

    // ====================    ====================

    ///     
    public entry fun claim_payout(owner: &signer, player_addr: address, game_id: u64) acquires GameStore {
        let owner_addr = signer::address_of(owner);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let game_idx = find_game_index(&game_store.games, game_id);
        let game = vector::borrow_mut(&mut game_store.games, game_idx);

        assert!(owner_addr == game_store.owner, E_NOT_OWNER);
        assert!(game.player == player_addr, E_GAME_NOT_FOUND);
        assert!(game.is_finished, E_GAME_NOT_FINISHED);
        assert!(game.payout_due > 0, E_INVALID_BET);
        assert!(!game.is_claimed, E_PAYOUT_ALREADY_CLAIMED);

        let payout = game.payout_due;
        assert!(game_store.bankroll >= payout, E_INSUFFICIENT_BANKROLL);
        let resource_signer = account::create_signer_with_capability(&game_store.resource_signer_cap);
        endless_coin::transfer(&resource_signer, player_addr, payout);
        game_store.bankroll = game_store.bankroll - payout;

        game.is_claimed = true;

        event::emit(PayoutClaimed {
            game_id,
            player: player_addr,
            payout,
        });
    }

    // ====================   ====================

    ///  
    public entry fun fund_bankroll(owner: &signer, amount: u128) acquires GameStore {
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let owner_addr = signer::address_of(owner);
        assert!(owner_addr == game_store.owner, E_NOT_OWNER);
        assert!(amount > 0, E_INVALID_AMOUNT);
        assert!(endless_coin::balance(owner_addr) >= amount, E_INSUFFICIENT_FUNDS);
        // Real funding: move EDS from owner wallet to the game resource account.
        let resource_signer = account::create_signer_with_capability(&game_store.resource_signer_cap);
        endless_coin::transfer(owner, signer::address_of(&resource_signer), amount);
        game_store.bankroll = game_store.bankroll + amount;
    }

    /// Web-wallet friendly wrapper (u64 args)
    public entry fun fund_bankroll_u64(owner: &signer, amount: u64) acquires GameStore {
        fund_bankroll(owner, amount as u128);
    }

    ///  
    public entry fun withdraw_fees(owner: &signer, amount: u128, recipient: address) acquires GameStore {
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let owner_addr = signer::address_of(owner);
        assert!(owner_addr == game_store.owner, E_NOT_OWNER);
        assert!(amount > 0, E_INVALID_AMOUNT);
        assert!(game_store.treasury >= amount, E_INSUFFICIENT_FUNDS);
        let resource_signer = account::create_signer_with_capability(&game_store.resource_signer_cap);
        endless_coin::transfer(&resource_signer, recipient, amount);
        game_store.treasury = game_store.treasury - amount;
    }

    ///  
    public entry fun set_fee_bps(owner: &signer, fee_bps: u128) acquires GameStore {
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(signer::address_of(owner) == game_store.owner, E_NOT_OWNER);
        assert!(fee_bps <= MAX_FEE_BPS, E_INVALID_FEE);
        game_store.fee_bps = fee_bps;
    }

    ///  
    public entry fun set_owner(owner: &signer, new_owner: address) acquires GameStore {
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(signer::address_of(owner) == game_store.owner, E_NOT_OWNER);
        game_store.owner = new_owner;
    }

    #[view]
    ///
    public fun get_latest_game_id(player: address): u64 acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        let i = 0;
        let len = vector::length(&game_store.games);
        let latest: u64 = 0;
        while (i < len) {
            let game = vector::borrow(&game_store.games, i);
            if (game.player == player) {
                latest = game.game_id;
            };
            i = i + 1;
        };
        latest
    }

    // ==================== MULTIPLAYER ROOMS ====================

    /// Initialize RoomStore (call once after upgrade)
    public entry fun init_rooms(owner: &signer) acquires GameStore {
        let owner_addr = signer::address_of(owner);
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        assert!(owner_addr == game_store.owner, E_NOT_OWNER);
        move_to(owner, RoomStore {
            room_counter: 0,
            rooms: vector::empty(),
        });
    }

    /// Host creates a room, locking bet from player_balances
    public entry fun create_room(
        host: &signer,
        bet_amount: u128,
    ) acquires GameStore, RoomStore {
        let host_addr = signer::address_of(host);
        assert!(bet_amount >= MIN_BET, E_INVALID_BET);
        assert!(bet_amount <= MAX_BET, E_INVALID_BET);

        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(simple_map::contains_key(&game_store.player_balances, &host_addr), E_INSUFFICIENT_BALANCE);
        let host_balance = simple_map::borrow_mut(&mut game_store.player_balances, &host_addr);
        assert!(*host_balance >= bet_amount, E_INSUFFICIENT_BALANCE);

        let fee_amount = bet_amount * game_store.fee_bps / 10000;
        assert!(fee_amount < bet_amount, E_INVALID_FEE);
        let net_bet = bet_amount - fee_amount;

        // Deduct bet from host balance
        *host_balance = *host_balance - bet_amount;
        game_store.treasury = game_store.treasury + fee_amount;

        let room_store = borrow_global_mut<RoomStore>(@pixel_blackjack);
        let room_id = room_store.room_counter + 1;
        room_store.room_counter = room_id;

        let now = timestamp::now_seconds();
        let room = Room {
            room_id,
            host: host_addr,
            guest: @0x0,
            bet_amount,
            net_bet,
            fee_amount,
            status: ROOM_WAITING,
            host_cards: vector::empty(),
            guest_cards: vector::empty(),
            host_score: 0,
            guest_score: 0,
            deck_index: 0,
            turn: 0,
            host_done: false,
            guest_done: false,
            result: 0,
            created_at: now,
            last_action_at: now,
        };
        vector::push_back(&mut room_store.rooms, room);

        event::emit(RoomCreated { room_id, host: host_addr, bet_amount });
    }

    /// Guest joins a room, locking their bet
    public entry fun join_room(
        guest: &signer,
        room_id: u64,
    ) acquires GameStore, RoomStore {
        let guest_addr = signer::address_of(guest);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let room_store = borrow_global_mut<RoomStore>(@pixel_blackjack);

        let room_idx = find_room_index(&room_store.rooms, room_id);
        let room = vector::borrow_mut(&mut room_store.rooms, room_idx);

        assert!(room.status == ROOM_WAITING, E_ROOM_NOT_WAITING);
        assert!(guest_addr != room.host, E_CANNOT_JOIN_OWN_ROOM);

        // Check and deduct guest balance
        assert!(simple_map::contains_key(&game_store.player_balances, &guest_addr), E_INSUFFICIENT_BALANCE);
        let guest_balance = simple_map::borrow_mut(&mut game_store.player_balances, &guest_addr);
        assert!(*guest_balance >= room.bet_amount, E_INSUFFICIENT_BALANCE);

        let fee_amount = room.bet_amount * game_store.fee_bps / 10000;
        *guest_balance = *guest_balance - room.bet_amount;
        game_store.treasury = game_store.treasury + fee_amount;

        room.guest = guest_addr;
        room.status = ROOM_PLAYING;

        // Deal initial cards: 2 for host, 2 for guest
        let base_seed = room_id * 1000;
        room.host_cards = vector::empty();
        room.guest_cards = vector::empty();

        vector::push_back(&mut room.host_cards, draw_card(base_seed, 0));
        vector::push_back(&mut room.host_cards, draw_card(base_seed, 1));
        vector::push_back(&mut room.guest_cards, draw_card(base_seed, 2));
        vector::push_back(&mut room.guest_cards, draw_card(base_seed, 3));

        room.host_score = calculate_score(&room.host_cards);
        room.guest_score = calculate_score(&room.guest_cards);
        room.deck_index = 4;
        room.turn = 0; // host goes first
        room.last_action_at = timestamp::now_seconds();

        // Check for immediate blackjacks
        let host_bj = room.host_score == BLACKJACK;
        let guest_bj = room.guest_score == BLACKJACK;
        if (host_bj && guest_bj) {
            room.host_done = true;
            room.guest_done = true;
            finalize_room(room, game_store);
        } else if (host_bj) {
            room.host_done = true;
            room.turn = 1; // skip to guest
            if (guest_bj) {
                room.guest_done = true;
                finalize_room(room, game_store);
            };
        } else if (guest_bj) {
            room.guest_done = true;
            // host still plays first
        };

        event::emit(RoomJoined { room_id, guest: guest_addr });
    }

    /// Player takes a card (hit)
    public entry fun room_hit(
        player: &signer,
        room_id: u64,
    ) acquires GameStore, RoomStore {
        let player_addr = signer::address_of(player);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let room_store = borrow_global_mut<RoomStore>(@pixel_blackjack);

        let room_idx = find_room_index(&room_store.rooms, room_id);
        let room = vector::borrow_mut(&mut room_store.rooms, room_idx);

        assert!(room.status == ROOM_PLAYING, E_ROOM_NOT_PLAYING);

        let is_host = player_addr == room.host;
        let is_guest = player_addr == room.guest;
        assert!(is_host || is_guest, E_NOT_PARTICIPANT);

        if (is_host) {
            assert!(room.turn == 0, E_NOT_YOUR_TURN);
            assert!(!room.host_done, E_PLAYER_ALREADY_DONE);

            let new_card = draw_card(room.room_id * 1000, room.deck_index);
            room.deck_index = room.deck_index + 1;
            vector::push_back(&mut room.host_cards, new_card);
            room.host_score = calculate_score(&room.host_cards);
            room.last_action_at = timestamp::now_seconds();

            event::emit(RoomCardDealt {
                room_id, player: player_addr, card: new_card, new_score: room.host_score,
            });

            if (room.host_score >= BLACKJACK) {
                room.host_done = true;
                if (room.guest_done) {
                    finalize_room(room, game_store);
                } else {
                    room.turn = 1;
                };
            };
        } else {
            assert!(room.turn == 1, E_NOT_YOUR_TURN);
            assert!(!room.guest_done, E_PLAYER_ALREADY_DONE);

            let new_card = draw_card(room.room_id * 1000, room.deck_index);
            room.deck_index = room.deck_index + 1;
            vector::push_back(&mut room.guest_cards, new_card);
            room.guest_score = calculate_score(&room.guest_cards);
            room.last_action_at = timestamp::now_seconds();

            event::emit(RoomCardDealt {
                room_id, player: player_addr, card: new_card, new_score: room.guest_score,
            });

            if (room.guest_score >= BLACKJACK) {
                room.guest_done = true;
                if (room.host_done) {
                    finalize_room(room, game_store);
                } else {
                    room.turn = 0;
                };
            };
        };
    }

    /// Player stands
    public entry fun room_stand(
        player: &signer,
        room_id: u64,
    ) acquires GameStore, RoomStore {
        let player_addr = signer::address_of(player);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let room_store = borrow_global_mut<RoomStore>(@pixel_blackjack);

        let room_idx = find_room_index(&room_store.rooms, room_id);
        let room = vector::borrow_mut(&mut room_store.rooms, room_idx);

        assert!(room.status == ROOM_PLAYING, E_ROOM_NOT_PLAYING);

        let is_host = player_addr == room.host;
        let is_guest = player_addr == room.guest;
        assert!(is_host || is_guest, E_NOT_PARTICIPANT);

        if (is_host) {
            assert!(room.turn == 0, E_NOT_YOUR_TURN);
            assert!(!room.host_done, E_PLAYER_ALREADY_DONE);
            room.host_done = true;
            room.last_action_at = timestamp::now_seconds();

            event::emit(RoomStandEvent { room_id, player: player_addr });

            if (room.guest_done) {
                finalize_room(room, game_store);
            } else {
                room.turn = 1;
            };
        } else {
            assert!(room.turn == 1, E_NOT_YOUR_TURN);
            assert!(!room.guest_done, E_PLAYER_ALREADY_DONE);
            room.guest_done = true;
            room.last_action_at = timestamp::now_seconds();

            event::emit(RoomStandEvent { room_id, player: player_addr });

            if (room.host_done) {
                finalize_room(room, game_store);
            } else {
                room.turn = 0;
            };
        };
    }

    /// Cancel a waiting room (host only, before guest joins)
    public entry fun cancel_room(
        host: &signer,
        room_id: u64,
    ) acquires GameStore, RoomStore {
        let host_addr = signer::address_of(host);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let room_store = borrow_global_mut<RoomStore>(@pixel_blackjack);

        let room_idx = find_room_index(&room_store.rooms, room_id);
        let room = vector::borrow_mut(&mut room_store.rooms, room_idx);

        assert!(host_addr == room.host, E_NOT_HOST);
        assert!(room.status == ROOM_WAITING, E_ROOM_NOT_WAITING);

        room.status = ROOM_CANCELLED;

        // Refund full bet (including fee) to host
        let refund = room.bet_amount;
        let fee = room.fee_amount;
        if (simple_map::contains_key(&game_store.player_balances, &host_addr)) {
            let balance = simple_map::borrow_mut(&mut game_store.player_balances, &host_addr);
            *balance = *balance + refund;
        } else {
            simple_map::add(&mut game_store.player_balances, host_addr, refund);
        };
        // Return fee from treasury
        game_store.treasury = game_store.treasury - fee;

        event::emit(RoomCancelled { room_id, host: host_addr });
    }

    /// Claim win if opponent AFK > 5 min
    public entry fun claim_timeout(
        player: &signer,
        room_id: u64,
    ) acquires GameStore, RoomStore {
        let player_addr = signer::address_of(player);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let room_store = borrow_global_mut<RoomStore>(@pixel_blackjack);

        let room_idx = find_room_index(&room_store.rooms, room_id);
        let room = vector::borrow_mut(&mut room_store.rooms, room_idx);

        assert!(room.status == ROOM_PLAYING, E_ROOM_NOT_PLAYING);
        let is_host = player_addr == room.host;
        let is_guest = player_addr == room.guest;
        assert!(is_host || is_guest, E_NOT_PARTICIPANT);

        let now = timestamp::now_seconds();
        assert!(now - room.last_action_at >= ROOM_TURN_TIMEOUT, E_TIMEOUT_NOT_REACHED);

        // The player whose turn it is has timed out, so the OTHER player wins
        if (is_host) {
            // Host is claiming — must be guest's turn (guest timed out)
            assert!(room.turn == 1, E_NOT_YOUR_TURN);
        } else {
            // Guest is claiming — must be host's turn (host timed out)
            assert!(room.turn == 0, E_NOT_YOUR_TURN);
        };

        room.status = ROOM_TIMEOUT;
        // Winner gets the full pot (net_bet * 2)
        let payout = room.net_bet * 2;
        if (simple_map::contains_key(&game_store.player_balances, &player_addr)) {
            let balance = simple_map::borrow_mut(&mut game_store.player_balances, &player_addr);
            *balance = *balance + payout;
        } else {
            simple_map::add(&mut game_store.player_balances, player_addr, payout);
        };

        if (is_host) {
            room.result = 1; // host wins
        } else {
            room.result = 2; // guest wins
        };

        event::emit(RoomTimeoutEvent { room_id, claimer: player_addr });
    }

    /// Internal: finalize room when both players are done
    fun finalize_room(room: &mut Room, game_store: &mut GameStore) {
        room.status = ROOM_FINISHED;

        let host_bust = room.host_score > BLACKJACK;
        let guest_bust = room.guest_score > BLACKJACK;

        let (result, host_payout, guest_payout) = if (host_bust && guest_bust) {
            // Both bust → draw, return net_bet each
            (3u8, room.net_bet, room.net_bet)
        } else if (host_bust) {
            // Host bust → guest wins
            (2u8, 0u128, room.net_bet * 2)
        } else if (guest_bust) {
            // Guest bust → host wins
            (1u8, room.net_bet * 2, 0u128)
        } else if (room.host_score > room.guest_score) {
            (1u8, room.net_bet * 2, 0u128)
        } else if (room.guest_score > room.host_score) {
            (2u8, 0u128, room.net_bet * 2)
        } else {
            // Draw
            (3u8, room.net_bet, room.net_bet)
        };

        room.result = result;

        // Credit payouts to player balances
        if (host_payout > 0) {
            if (simple_map::contains_key(&game_store.player_balances, &room.host)) {
                let balance = simple_map::borrow_mut(&mut game_store.player_balances, &room.host);
                *balance = *balance + host_payout;
            } else {
                simple_map::add(&mut game_store.player_balances, room.host, host_payout);
            };
        };
        if (guest_payout > 0) {
            if (simple_map::contains_key(&game_store.player_balances, &room.guest)) {
                let balance = simple_map::borrow_mut(&mut game_store.player_balances, &room.guest);
                *balance = *balance + guest_payout;
            } else {
                simple_map::add(&mut game_store.player_balances, room.guest, guest_payout);
            };
        };

        let winner = if (result == 1) { room.host } else if (result == 2) { room.guest } else { @0x0 };
        event::emit(RoomFinished {
            room_id: room.room_id,
            result,
            host_score: room.host_score,
            guest_score: room.guest_score,
            winner,
        });
    }

    /// Find room by ID
    fun find_room_index(rooms: &vector<Room>, room_id: u64): u64 {
        let i = 0;
        let len = vector::length(rooms);
        while (i < len) {
            let room = vector::borrow(rooms, i);
            if (room.room_id == room_id) {
                return i
            };
            i = i + 1;
        };
        abort E_ROOM_NOT_FOUND
    }

    // ==================== ROOM VIEW FUNCTIONS ====================

    #[view]
    /// Get room details by ID
    public fun get_room(room_id: u64): (
        u64, address, address, u128, u128, u128, u8,
        vector<Card>, vector<Card>, u64, u64,
        u8, bool, bool, u8, u64, u64
    ) acquires RoomStore {
        let room_store = borrow_global<RoomStore>(@pixel_blackjack);
        let room_idx = find_room_index(&room_store.rooms, room_id);
        let room = vector::borrow(&room_store.rooms, room_idx);
        (
            room.room_id,
            room.host,
            room.guest,
            room.bet_amount,
            room.net_bet,
            room.fee_amount,
            room.status,
            room.host_cards,
            room.guest_cards,
            room.host_score,
            room.guest_score,
            room.turn,
            room.host_done,
            room.guest_done,
            room.result,
            room.created_at,
            room.last_action_at
        )
    }

    #[view]
    /// Get latest room ID
    public fun get_latest_room_id(): u64 acquires RoomStore {
        let room_store = borrow_global<RoomStore>(@pixel_blackjack);
        room_store.room_counter
    }
}
