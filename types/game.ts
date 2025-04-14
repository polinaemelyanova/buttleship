// Состояние клетки поля
export type CellState =
    | 'empty'    // Пустая
    | 'ship'     // Корабль
    | 'hit'      // Попадание
    | 'miss'     // Промах
    | 'forbidden' // Запрещенная для размещения
    | 'sunk';    // Уничтоженный корабль

// Тип корабля
export interface ShipType {
    id: string;
    name: string;
    length: number;
    count: number; // Сколько таких кораблей нужно разместить
}

// Игрок
export interface Player {
    id: number;
    name: string;
    color: string;
    isActive: boolean;
}

// Фазы игры
export type GamePhase =
    | 'setup'    // Расстановка кораблей
    | 'battle'   // Фаза боя
    | 'gameover'; // Конец игры

// Координаты
export interface Position {
    x: number;
    y: number;
}