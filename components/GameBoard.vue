<template>
  <div class="game-board" :style="{'--player-color': activePlayer.color}">
    <h3>{{ title }}</h3>

    <!-- Буквы колонок сверху -->
    <div class="column-letters">
      <div v-for="col in boardSize" :key="'col-' + col" class="coordinate">
        {{ getColumnLetter(col - 1) }}
      </div>
    </div>

    <div class="grid-with-numbers">
      <!-- Цифры строк слева -->
      <div class="row-numbers">
        <div v-for="row in boardSize" :key="'row-' + row" class="coordinate">
          {{ row }}
        </div>
      </div>



    <div class="grid" :style="{'--size': boardSize}">
      <div
          v-for="(row, x) in board"
          :key="x"
          class="row"
      >
        <div
            v-for="(cell, y) in row"
            :key="y"
            class="cell"
            :class="[
        getCellClass(cell, x, y),
        {
          'preview': showPreview && isPreviewCell(x, y),
          'invalid-preview': showPreview && isPreviewCell(x, y) && !canPlacePreview
        }
      ]"
            @click="handleCellClick(x, y)"
            @mouseover="handleCellHover(x, y)"
        >
          <span v-if="cell === 'hit'">✖</span>
          <span v-else-if="cell === 'miss'">•</span>
          <span v-else-if="cell === 'sunk'">☠</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CellState, Position, ShipType } from '@/types/game';

const props = withDefaults(defineProps<{
  board: CellState[][]
  boardSize?: number
  title: string
  gamePhase: string
  currentShip: ShipType | null
  isVertical: boolean
  activePlayer: any
  isActive: boolean
  showShips: boolean
}>(), {
  boardSize: 10
});

const getColumnLetter = (index: number): string => {
  // Русский алфавит
  const russianLetters = 'абвгдежзик';
  return russianLetters[index] || '';
};

const emit = defineEmits(['cell-click', 'cell-hover']);

// Позиция для превью корабля
const hoverPosition = ref<Position | null>(null);

// Показывать ли превью корабля
const showPreview = computed(() => {
  return props.gamePhase === 'setup' &&
      props.currentShip &&
      hoverPosition.value !== null;
});

// Является ли клетка частью превью
const isPreviewCell = (x: number, y: number): boolean => {
  if (!showPreview.value || !props.currentShip || !hoverPosition.value) return false;

  const { x: hx, y: hy } = hoverPosition.value;
  const length = props.currentShip.length;

  if (props.isVertical) {
    return x >= hx && x < hx + length && y === hy;
  } else {
    return y >= hy && y < hy + length && x === hx;
  }
};

// Можно ли разместить корабль в текущей позиции превью
const canPlacePreview = computed(() => {
  if (!showPreview.value || !props.currentShip || !hoverPosition.value) return false;

  const { x, y } = hoverPosition.value;
  return canPlaceShip(x, y, props.currentShip.length, props.isVertical, props.board);
});

// Проверка возможности размещения
const canPlaceShip = (
    x: number,
    y: number,
    length: number,
    vertical: boolean,
    board: CellState[][]
): boolean => {
  if (vertical) {
    if (x + length > props.boardSize) return false;
  } else {
    if (y + length > props.boardSize) return false;
  }

  for (let i = 0; i < length; i++) {
    const nx = vertical ? x + i : x;
    const ny = vertical ? y : y + i;

    if (board[nx][ny] !== 'empty') return false;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tx = nx + dx;
        const ty = ny + dy;
        if (tx >= 0 && tx < props.boardSize && ty >= 0 && ty < props.boardSize) {
          if (board[tx][ty] === 'ship') return false;
        }
      }
    }
  }
  return true;
};

// Обработка клика по клетке
const handleCellClick = (x: number, y: number) => {
  emit('cell-click', { x, y });
};

// Обработка наведения на клетку
const handleCellHover = (x: number, y: number) => {
  hoverPosition.value = { x, y };
  emit('cell-hover', { x, y });
};

// Получение класса ячейки
const getCellClass = (cell: CellState, x: number, y: number): string => {
  if (cell === 'ship' && !props.showShips) {
    return 'empty'; // Скрыть корабли если showShips равно false
  }
  return cell;
};
</script>

<style lang="scss" scoped>

.game-board {
  margin: 20px;
  --player-color-rgb: 33, 150, 243;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.column-letters {
  display: flex;
  margin-left: 30px; // Отступ для цифр слева
  margin-bottom: 5px;

  .coordinate {
    width: 30px;
    text-align: center;
    font-weight: bold;
  }
}

.grid-with-numbers {
  display: flex;
}

.row-numbers {
  display: flex;
  flex-direction: column;
  margin-right: 5px;

  .coordinate {
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(var(--size), 30px);
  grid-template-rows: repeat(var(--size), 30px);
  gap: 1px;
  background-color: #333;
  border: 2px solid #333;
}

.row {
  display: contents;
}

.cell {
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;

  &.ship {
    background-color: var(--player-color);
  }

  &.hit {
    background-color: #f00;
    span {
      color: white;
      font-size: 18px;
    }
  }

  &.sunk {
    background-color: #900;
    span {
      color: white;
      font-size: 18px;
      font-weight: bold;
    }
  }

  &.miss {
    background-color: #aaa;
    span {
      color: #333;
      font-size: 20px;
    }
  }

  &.forbidden {
    background-color: #f5f5f5;
  }

  &.preview {
    background-color: rgba(var(--player-color-rgb), 0.5);
    z-index: 2;
  }

  &.invalid-preview {
    background-color: rgba(255, 0, 0, 0.5);
  }
}
</style>