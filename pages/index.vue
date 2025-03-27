<template>
  <div class="game-container">
    <h1>Морской бой</h1>

    <!-- Фаза расстановки кораблей -->
    <div v-if="gamePhase === 'setup'" class="setup-phase">
      <div class="player-info">
        <h2 :style="{ color: activePlayer.color }">{{ activePlayer.name }}</h2>
        <div class="player-controls">
          <label>
            Имя:
            <input v-model="activePlayer.name" type="text">
          </label>
          <label>
            Цвет:
            <input v-model="activePlayer.color" type="color">
          </label>
        </div>
        <button
            @click="startGame"
            :disabled="!canStartGame"
            class="btn-start"
        >
          {{ activePlayer.id === 1 ? 'Готово' : 'Начать игру' }}
        </button>
      </div>

      <div class="setup-content">
        <ShipList
            :ships="activePlayer.id === 1 ? player1Ships : player2Ships"
            :current-ship="currentShip"
            :game-phase="gamePhase"
            @select-ship="selectShip"
        />

        <GameBoard
            :board="activePlayer.id === 1 ? player1Board : player2Board"
            :board-size="BOARD_SIZE"
            :title="`${activePlayer.name} (Ваши корабли)`"
            :game-phase="gamePhase"
            :current-ship="currentShip"
            :is-vertical="isVertical"
            :active-player="activePlayer"
            :is-active="true"
            :show-ships="true"
            @cell-click="handleSetupClick"
        />
      </div>

      <div class="hint">
        <p>Нажмите ПРОБЕЛ, чтобы изменить ориентацию корабля</p>
      </div>
    </div>

    <!-- Фаза боя -->
    <div v-else-if="gamePhase === 'battle'" class="battle-phase">
      <div class="boards-container">
        <GameBoard
            :board="inactivePlayer.id === 1 ? player1Board : player2Board"
            :board-size="BOARD_SIZE"
            :title="`${inactivePlayer.name} (Ваши выстрелы)`"
            :game-phase="gamePhase"
            :active-player="activePlayer"
            :is-active="true"
            @cell-click="handleBattleClick"
        />

        <GameBoard
            :board="activePlayer.id === 1 ? player1Board : player2Board"
            :board-size="BOARD_SIZE"
            :title="`${activePlayer.name} (Ваши корабли)`"
            :game-phase="gamePhase"
            :active-player="activePlayer"
            :is-active="false"
            :show-ships="true"
        />
      </div>
    </div>

    <!-- Конец игры -->
    <div v-else-if="gamePhase === 'gameover'" class="gameover-phase">
      <h2 :style="{ color: winner?.color }">Победил {{ winner?.name }}!</h2>
      <button @click="initGame" class="btn-restart">Новая игра</button>
    </div>

    <!-- Попап смены хода -->
    <TurnPopup
        v-if="showTurnPopup"
        :show="showTurnPopup"
        :player="activePlayer"
        @close="closeTurnPopup"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import useGame from '@/composables/useGame';

const {
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
} = useGame();

// Обработка клика по клетке в фазе расстановки
const handleSetupClick = ({ x, y }: { x: number, y: number }) => {
  if (gamePhase.value === 'setup' && currentShip.value) {
    const board = activePlayer.value.id === 1 ? player1Board.value : player2Board.value;
    const ships = activePlayer.value.id === 1 ? player1Ships.value : player2Ships.value;
    const shipType = ships.find(s => s.id === currentShip.value?.id);

    if (shipType && placeShip(x, y, shipType.length, isVertical.value, board)) {
      shipType.count--;

      // Если корабли этого типа закончились
      if (shipType.count <= 0) {
        currentShip.value = null;
      }
    }
  }
};

// Обработка клика по клетке в фазе боя
const handleBattleClick = ({ x, y }: { x: number, y: number }) => {
  if (gamePhase.value === 'battle') {
    const result = makeShot(x, y);

    if (result) {
      const opponentBoard = inactivePlayer.value.id === 1 ? player1Board.value : player2Board.value;

      // Проверка победы
      if (checkWin(opponentBoard)) {
        winner.value = activePlayer.value;
        gamePhase.value = 'gameover';
      }
      // Смена хода при промахе
      else if (result === 'miss') {
        switchTurn();
      }
    }
  }
};

// Обработка нажатия клавиш
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    toggleShipDirection();
    e.preventDefault();
  }
};

// Установка обработчиков при монтировании
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

// Удаление обработчиков при размонтировании
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.game-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

.setup-phase, .battle-phase, .gameover-phase {
  margin-top: 20px;
}

.player-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.player-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 15px 0;
}

.player-controls label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.setup-content {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.boards-container {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.hint {
  margin-top: 20px;
  color: #666;
  font-style: italic;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-start {
  background-color: #4CAF50;
  color: white;
}

.btn-start:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-start:not(:disabled):hover {
  background-color: #45a049;
}

.btn-restart {
  background-color: #2196F3;
  color: white;
  margin-top: 20px;
}

.btn-restart:hover {
  background-color: #0b7dda;
}

input[type="text"] {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

input[type="color"] {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>