import { ref, computed, watch } from 'vue';
import type { CellState, ShipType, Player, GamePhase, Position } from '@/types/game';

// Константы игры
const BOARD_SIZE = 10;
const SHIP_TYPES: ShipType[] = [
    { id: 'carrier', name: 'Авианосец', length: 4, count: 1 },
    { id: 'battleship', name: 'Линкор', length: 3, count: 2 },
    { id: 'cruiser', name: 'Крейсер', length: 2, count: 3 },
    { id: 'submarine', name: 'Катер', length: 1, count: 4 }
];

export default function useGame() {
    // Текущая фаза игры
    const gamePhase = ref<GamePhase>('setup');

    // Игроки
    const players = ref<Player[]>([
        { id: 1, name: 'Игрок 1', color: '#2196F3', isActive: true },
        { id: 2, name: 'Игрок 2', color: '#F44336', isActive: false }
    ]);

    // Показать попап смены хода
    const showTurnPopup = ref(false);

    // Победитель
    const winner = ref<Player | null>(null);

    // Игровые поля
    const player1Board = ref<CellState[][]>([]);
    const player2Board = ref<CellState[][]>([]);

    // Корабли игроков (для отслеживания размещенных)
    const player1Ships = ref<ShipType[]>(JSON.parse(JSON.stringify(SHIP_TYPES)));
    const player2Ships = ref<ShipType[]>(JSON.parse(JSON.stringify(SHIP_TYPES)));

    // Текущий выбранный корабль для размещения
    const currentShip = ref<ShipType | null>(null);

    // Ориентация корабля (вертикальная/горизонтальная)
    const isVertical = ref(false);

    // Инициализация пустого поля
    const initBoard = (): CellState[][] => {
        return Array(BOARD_SIZE).fill(null).map(() =>
            Array(BOARD_SIZE).fill('empty') as CellState[]
        );
    };

    // Проверка возможности размещения корабля
    const canPlaceShip = (
        x: number,
        y: number,
        length: number,
        vertical: boolean,
        board: CellState[][]
    ): boolean => {
        // Проверка границ поля
        if (vertical) {
            if (x + length > BOARD_SIZE) return false;
        } else {
            if (y + length > BOARD_SIZE) return false;
        }

        // Проверка клеток и соседей
        for (let i = 0; i < length; i++) {
            const nx = vertical ? x + i : x;
            const ny = vertical ? y : y + i;

            // Если клетка уже занята или помечена как запрещенная
            if (board[nx][ny] !== 'empty') return false;

            // Проверка соседних клеток (включая диагонали)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const tx = nx + dx;
                    const ty = ny + dy;
                    if (tx >= 0 && tx < BOARD_SIZE && ty >= 0 && ty < BOARD_SIZE) {
                        if (board[tx][ty] === 'ship') return false;
                    }
                }
            }
        }
        return true;
    };

    // Размещение корабля на поле
    const placeShip = (
        x: number,
        y: number,
        length: number,
        vertical: boolean,
        board: CellState[][]
    ): boolean => {
        if (!canPlaceShip(x, y, length, vertical, board)) return false;

        // Размещаем корабль
        for (let i = 0; i < length; i++) {
            const nx = vertical ? x + i : x;
            const ny = vertical ? y : y + i;
            board[nx][ny] = 'ship';
        }

        // Помечаем соседние клетки как запрещенные
        for (let i = 0; i < length; i++) {
            const nx = vertical ? x + i : x;
            const ny = vertical ? y : y + i;

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const tx = nx + dx;
                    const ty = ny + dy;
                    if (tx >= 0 && tx < BOARD_SIZE && ty >= 0 && ty < BOARD_SIZE && board[tx][ty] === 'empty') {
                        board[tx][ty] = 'forbidden';
                    }
                }
            }
        }

        // Возвращаем корабль на место (убираем временные запреты)
        for (let i = 0; i < length; i++) {
            const nx = vertical ? x + i : x;
            const ny = vertical ? y : y + i;
            board[nx][ny] = 'ship';
        }

        return true;
    };

    // Инициализация новой игры
    const initGame = () => {
        player1Board.value = initBoard();
        player2Board.value = initBoard();
        player1Ships.value = JSON.parse(JSON.stringify(SHIP_TYPES));
        player2Ships.value = JSON.parse(JSON.stringify(SHIP_TYPES));
        gamePhase.value = 'setup';
        currentShip.value = null;
        isVertical.value = false;
        winner.value = null;
        players.value[0].isActive = true;
        players.value[1].isActive = false;
        showTurnPopup.value = false;
    };

    // Выбор корабля для размещения
    const selectShip = (ship: ShipType) => {
        if (gamePhase.value === 'setup') {
            currentShip.value = ship;
        }
    };

    // Смена ориентации корабля (по пробелу)
    const toggleShipDirection = () => {
        if (gamePhase.value === 'setup') {
            isVertical.value = !isVertical.value;
        }
    };

    // Проверка, все ли корабли размещены
    const canStartGame = computed(() => {
        const activePlayerShips = activePlayer.value.id === 1 ? player1Ships.value : player2Ships.value;
        return activePlayerShips.every(ship => ship.count === 0);
    });

    // Начало фазы боя
    const startGame = () => {
        if (canStartGame.value) {
            // Если оба игрока разместили корабли
            if (players.value[1].isActive) {
                gamePhase.value = 'battle';
                players.value[0].isActive = true;
                players.value[1].isActive = false;
                showTurnPopup.value = true;
            } else {
                // Передаем ход второму игроку для расстановки
                switchTurn();
            }
        }
    };

    // Выстрел по полю противника
    const makeShot = (x: number, y: number): 'hit' | 'miss' | null => {
        const opponentBoard = inactivePlayer.value.id === 1 ? player1Board.value : player2Board.value;

        if (opponentBoard[x][y] === 'ship') {
            opponentBoard[x][y] = 'hit';
            return 'hit';
        } else if (opponentBoard[x][y] === 'empty') {
            opponentBoard[x][y] = 'miss';
            return 'miss';
        }
        return null;
    };

    // Проверка победы
    const checkWin = (board: CellState[][]): boolean => {
        return !board.flat().some(cell => cell === 'ship');
    };

    // Смена активного игрока
    const switchTurn = () => {
        players.value.forEach(player => {
            player.isActive = !player.isActive;
        });

        if (gamePhase.value === 'battle') {
            showTurnPopup.value = true;
        }
    };

    // Закрытие попапа смены хода
    const closeTurnPopup = () => {
        showTurnPopup.value = false;
    };

    // Активный и неактивный игроки (вычисляемые свойства)
    const activePlayer = computed(() => players.value.find(p => p.isActive)!);
    const inactivePlayer = computed(() => players.value.find(p => !p.isActive)!);

    // Инициализация игры при первом запуске
    initGame();

    return {
        // Константы
        BOARD_SIZE,
        SHIP_TYPES,

        // Состояние
        gamePhase,
        players,
        showTurnPopup,
        winner,
        player1Board,
        player2Board,
        player1Ships,
        player2Ships,
        currentShip,
        isVertical,
        canStartGame,

        // Игроки
        activePlayer,
        inactivePlayer,

        // Методы
        initGame,
        selectShip,
        toggleShipDirection,
        placeShip,
        startGame,
        makeShot,
        checkWin,
        switchTurn,
        closeTurnPopup
    };
}
