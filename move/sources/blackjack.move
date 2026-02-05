/// Pixel Blackjack - Web3 карточная игра на блокчейне Endless
///
/// Правила:
/// - Игрок делает ставку в EDS токенах
/// - Цель: набрать 21 или ближе к 21 чем дилер
/// - Туз = 1 или 11, Картинки (J,Q,K) = 10
/// - Перебор (>21) = проигрыш
module pixel_blackjack::blackjack {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use endless_framework::timestamp;
    use endless_framework::coin;
    use endless_framework::endless_coin::EndlessCoin;
    use endless_framework::event;
    use endless_framework::account;
    use endless_framework::randomness;

    // ==================== ОШИБКИ ====================

    /// Игра не найдена
    const E_GAME_NOT_FOUND: u64 = 1;
    /// Игра уже завершена
    const E_GAME_ALREADY_FINISHED: u64 = 2;
    /// Недостаточно средств
    const E_INSUFFICIENT_FUNDS: u64 = 3;
    /// Неверная ставка
    const E_INVALID_BET: u64 = 4;
    /// Игра ещё не завершена
    const E_GAME_NOT_FINISHED: u64 = 5;
    /// Игрок уже перебрал
    const E_PLAYER_BUSTED: u64 = 6;
    /// Недостаточно средств у казино
    const E_INSUFFICIENT_BANKROLL: u64 = 7;
    /// Нет прав владельца
    const E_NOT_OWNER: u64 = 8;
    /// Неверная комиссия
    const E_INVALID_FEE: u64 = 9;
    /// Выплата уже получена
    const E_PAYOUT_ALREADY_CLAIMED: u64 = 10;

    // ==================== КОНСТАНТЫ ====================

    /// Минимальная ставка (0.1 EDS)
    const MIN_BET: u64 = 10000000;
    /// Максимальная ставка (100 EDS)
    const MAX_BET: u64 = 10000000000;
    /// Блэкджек (21)
    const BLACKJACK: u64 = 21;
    /// Дилер останавливается на 17
    const DEALER_STAND: u64 = 17;
    /// Максимальная комиссия (10%)
    const MAX_FEE_BPS: u64 = 1000;

    // ==================== СТРУКТУРЫ ====================

    /// Карта
    struct Card has store, copy, drop {
        /// Масть: 0=Пики, 1=Черви, 2=Бубны, 3=Трефы
        suit: u8,
        /// Ранг: 1=Туз, 2-10=число, 11=Валет, 12=Дама, 13=Король
        rank: u8,
    }

    /// Состояние игры
    struct Game has key, store {
        /// ID игры
        game_id: u64,
        /// Адрес игрока
        player: address,
        /// Ставка
        bet_amount: u64,
        /// Ставка после комиссии
        net_bet: u64,
        /// Комиссия
        fee_amount: u64,
        /// Выплата, ожидающая запроса
        payout_due: u64,
        /// Выплата запрошена?
        is_claimed: bool,
        /// Карты игрока
        player_cards: vector<Card>,
        /// Карты дилера
        dealer_cards: vector<Card>,
        /// Очки игрока
        player_score: u64,
        /// Очки дилера
        dealer_score: u64,
        /// Игра завершена?
        is_finished: bool,
        /// Результат: 0=в процессе, 1=победа игрока, 2=победа дилера, 3=ничья, 4=блэкджек
        result: u8,
        /// Время создания
        created_at: u64,
    }

    /// Хранилище игр
    struct GameStore has key {
        /// Счётчик игр
        game_counter: u64,
        /// Активные игры
        games: vector<Game>,
        /// Баланс банка (для выплат)
        bankroll: coin::Coin<EndlessCoin>,
        /// Комиссия казино
        treasury: coin::Coin<EndlessCoin>,
        /// Владелец
        owner: address,
        /// Комиссия в bps (100 = 1%)
        fee_bps: u64,
    }

    /// Статистика игрока
    struct PlayerStats has key {
        /// Всего игр
        total_games: u64,
        /// Побед
        wins: u64,
        /// Поражений
        losses: u64,
        /// Ничьих
        draws: u64,
        /// Блэкджеков
        blackjacks: u64,
        /// Всего выиграно
        total_won: u64,
        /// Всего проиграно
        total_lost: u64,
    }

    // ==================== СОБЫТИЯ ====================

    #[event]
    struct GameStarted has drop, store {
        game_id: u64,
        player: address,
        bet_amount: u64,
        fee_amount: u64,
        net_bet: u64,
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
        payout: u64,
    }

    #[event]
    struct PayoutClaimed has drop, store {
        game_id: u64,
        player: address,
        payout: u64,
    }

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================

    /// Инициализация модуля (вызывается при деплое)
    fun init_module(admin: &signer) {
        let treasury = coin::zero<EndlessCoin>();
        let bankroll = coin::zero<EndlessCoin>();
        let owner = signer::address_of(admin);
        move_to(admin, GameStore {
            game_counter: 0,
            games: vector::empty(),
            bankroll,
            treasury,
            owner,
            fee_bps: 200, // 2%
        });
    }

    // ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

    /// Начать новую игру
    public entry fun start_game(
        player: &signer,
        bet_amount: u64,
    ) acquires GameStore, PlayerStats {
        let player_addr = signer::address_of(player);

        // Проверка ставки
        assert!(bet_amount >= MIN_BET, E_INVALID_BET);
        assert!(bet_amount <= MAX_BET, E_INVALID_BET);

        // Проверка баланса
        assert!(coin::balance<EndlessCoin>(player_addr) >= bet_amount, E_INSUFFICIENT_FUNDS);

        // Списание ставки
        let bet_coin = coin::withdraw<EndlessCoin>(player, bet_amount);

        // Получение хранилища
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);

        // Комиссия и ставка после комиссии
        let fee_amount = bet_amount * game_store.fee_bps / 10000;
        assert!(fee_amount < bet_amount, E_INVALID_FEE);
        let net_bet = bet_amount - fee_amount;

        // Проверка банка: банк + ставка >= макс. выплата (2.5x)
        let bankroll_value = coin::value(&game_store.bankroll);
        let max_payout = net_bet * 5 / 2;
        assert!(bankroll_value + net_bet >= max_payout, E_INSUFFICIENT_BANKROLL);

        // Разделяем монету ставки на комиссию и банк
        let fee_coin = coin::extract(&mut bet_coin, fee_amount);
        coin::merge(&mut game_store.treasury, fee_coin);
        coin::merge(&mut game_store.bankroll, bet_coin);

        // Генерация ID игры
        let game_id = game_store.game_counter + 1;
        game_store.game_counter = game_id;

        // Раздача карт
        let player_cards = vector::empty<Card>();
        let dealer_cards = vector::empty<Card>();

        // 2 карты игроку
        vector::push_back(&mut player_cards, draw_card(game_id, 0));
        vector::push_back(&mut player_cards, draw_card(game_id, 1));

        // 2 карты дилеру
        vector::push_back(&mut dealer_cards, draw_card(game_id, 2));
        vector::push_back(&mut dealer_cards, draw_card(game_id, 3));

        // Подсчёт очков
        let player_score = calculate_score(&player_cards);
        let dealer_score = calculate_score(&dealer_cards);

        // Создание игры
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

        // Проверка на блэкджек
        if (player_score == BLACKJACK) {
            game.is_finished = true;
            game.result = 4; // Блэкджек!

            // Выплата 2.5x ставки
            let payout = net_bet * 5 / 2;
            game.payout_due = payout;

            // Обновление статистики
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
            // Событие начала игры
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

        // Сохранение игры
        vector::push_back(&mut game_store.games, game);

        // Инициализация статистики если нужно
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

    /// Взять карту (Hit)
    public entry fun hit(
        player: &signer,
        game_id: u64,
    ) acquires GameStore, PlayerStats {
        let player_addr = signer::address_of(player);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);

        // Поиск игры
        let game_idx = find_game_index(&game_store.games, game_id);
        let game = vector::borrow_mut(&mut game_store.games, game_idx);

        // Проверки
        assert!(game.player == player_addr, E_GAME_NOT_FOUND);
        assert!(!game.is_finished, E_GAME_ALREADY_FINISHED);
        assert!(game.player_score < BLACKJACK, E_PLAYER_BUSTED);

        // Взять карту
        let card_index = (vector::length(&game.player_cards) + vector::length(&game.dealer_cards)) as u64;
        let new_card = draw_card(game_id, card_index);
        vector::push_back(&mut game.player_cards, new_card);

        // Пересчёт очков
        game.player_score = calculate_score(&game.player_cards);

        let is_busted = game.player_score > BLACKJACK;

        // Событие
        event::emit(CardDealt {
            game_id,
            player: player_addr,
            card: new_card,
            new_score: game.player_score,
            is_busted,
        });

        // Если перебор - игра завершена
        if (is_busted) {
            game.is_finished = true;
            game.result = 2; // Победа дилера
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

    /// Остановиться (Stand)
    public entry fun stand(
        player: &signer,
        game_id: u64,
    ) acquires GameStore, PlayerStats {
        let player_addr = signer::address_of(player);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);

        // Поиск игры
        let game_idx = find_game_index(&game_store.games, game_id);
        let game = vector::borrow_mut(&mut game_store.games, game_idx);

        // Проверки
        assert!(game.player == player_addr, E_GAME_NOT_FOUND);
        assert!(!game.is_finished, E_GAME_ALREADY_FINISHED);

        // Ход дилера - берёт карты пока < 17
        let card_index = (vector::length(&game.player_cards) + vector::length(&game.dealer_cards)) as u64;
        while (game.dealer_score < DEALER_STAND) {
            let new_card = draw_card(game_id, card_index);
            vector::push_back(&mut game.dealer_cards, new_card);
            game.dealer_score = calculate_score(&game.dealer_cards);
            card_index = card_index + 1;
        };

        // Определение победителя
        let (result, payout) = determine_winner(
            game.player_score,
            game.dealer_score,
            game.net_bet
        );

        game.is_finished = true;
        game.result = result;
        game.payout_due = payout;
        game.is_claimed = false;

        // Выплата выигрыша
        // Выплата по запросу игрока

        // Обновление статистики
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

    // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

    /// Генерация карты (псевдослучайная)
    fun draw_card(game_id: u64, card_index: u64): Card {
        let seed = timestamp::now_microseconds() + game_id * 1000 + card_index * 13;
        let suit = ((seed % 4) as u8);
        let rank = (((seed / 4) % 13) as u8) + 1;
        Card { suit, rank }
    }

    /// Подсчёт очков руки
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

        // Тузы: если перебор, считаем туз за 1 вместо 11
        while (aces > 0 && score > BLACKJACK) {
            score = score - 10;
            aces = aces - 1;
        };

        score
    }

    /// Значение карты
    fun card_value(rank: u8): u64 {
        if (rank == 1) {
            11 // Туз (может стать 1)
        } else if (rank >= 10) {
            10 // Картинки
        } else {
            (rank as u64)
        }
    }

    /// Определение победителя
    fun determine_winner(player_score: u64, dealer_score: u64, bet: u64): (u8, u64) {
        if (dealer_score > BLACKJACK) {
            // Дилер перебрал - победа игрока
            (1, bet * 2)
        } else if (player_score > dealer_score) {
            // Игрок ближе к 21
            (1, bet * 2)
        } else if (player_score < dealer_score) {
            // Дилер ближе к 21
            (2, 0)
        } else {
            // Ничья - возврат ставки
            (3, bet)
        }
    }

    /// Поиск игры по ID
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

    /// Обновление статистики игрока
    fun update_stats(player: address, result: u8, won: u64, lost: u64) acquires PlayerStats {
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

    // ==================== VIEW ФУНКЦИИ ====================

    #[view]
    /// Получить игру по ID
    public fun get_game(game_id: u64): (
        address, u64, u64, u64, vector<Card>, vector<Card>, u64, u64, bool, u8, u64, bool
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
    /// Получить статистику игрока
    public fun get_player_stats(player: address): (u64, u64, u64, u64, u64, u64, u64) acquires PlayerStats {
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
    /// Баланс казны
    public fun get_treasury_balance(): u64 acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        coin::value(&game_store.treasury)
    }

    #[view]
    /// Баланс банка (для выплат)
    public fun get_bankroll_balance(): u64 acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        coin::value(&game_store.bankroll)
    }

    #[view]
    /// Комиссия в bps
    public fun get_fee_bps(): u64 acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        game_store.fee_bps
    }

    #[view]
    /// Владелец контракта
    public fun get_owner(): address acquires GameStore {
        let game_store = borrow_global<GameStore>(@pixel_blackjack);
        game_store.owner
    }

    // ==================== ВЫПЛАТЫ ПО ЗАПРОСУ ====================

    /// Запросить выплату по завершённой игре
    public entry fun claim_payout(player: &signer, game_id: u64) acquires GameStore {
        let player_addr = signer::address_of(player);
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        let game_idx = find_game_index(&game_store.games, game_id);
        let game = vector::borrow_mut(&mut game_store.games, game_idx);

        assert!(game.player == player_addr, E_GAME_NOT_FOUND);
        assert!(game.is_finished, E_GAME_NOT_FINISHED);
        assert!(game.payout_due > 0, E_INVALID_BET);
        assert!(!game.is_claimed, E_PAYOUT_ALREADY_CLAIMED);

        let payout = game.payout_due;
        let payout_coin = coin::extract(&mut game_store.bankroll, payout);
        coin::deposit(player_addr, payout_coin);

        game.is_claimed = true;

        event::emit(PayoutClaimed {
            game_id,
            player: player_addr,
            payout,
        });
    }

    // ==================== АДМИН ФУНКЦИИ ====================

    /// Пополнить банк
    public entry fun fund_bankroll(owner: &signer, amount: u64) acquires GameStore {
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(signer::address_of(owner) == game_store.owner, E_NOT_OWNER);
        let coin_in = coin::withdraw<EndlessCoin>(owner, amount);
        coin::merge(&mut game_store.bankroll, coin_in);
    }

    /// Вывести комиссию
    public entry fun withdraw_fees(owner: &signer, amount: u64, recipient: address) acquires GameStore {
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(signer::address_of(owner) == game_store.owner, E_NOT_OWNER);
        let payout_coin = coin::extract(&mut game_store.treasury, amount);
        coin::deposit(recipient, payout_coin);
    }

    /// Изменить комиссию
    public entry fun set_fee_bps(owner: &signer, fee_bps: u64) acquires GameStore {
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(signer::address_of(owner) == game_store.owner, E_NOT_OWNER);
        assert!(fee_bps <= MAX_FEE_BPS, E_INVALID_FEE);
        game_store.fee_bps = fee_bps;
    }

    /// Сменить владельца
    public entry fun set_owner(owner: &signer, new_owner: address) acquires GameStore {
        let game_store = borrow_global_mut<GameStore>(@pixel_blackjack);
        assert!(signer::address_of(owner) == game_store.owner, E_NOT_OWNER);
        game_store.owner = new_owner;
    }

    #[view]
    /// Последняя игра игрока
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
}
