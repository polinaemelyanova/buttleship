<template>
  <div class="setup-phase">
    <div class="player-info">
      <h2 :style="{ color: activePlayer.color, minHeight: '40px' }">{{ activePlayer.name }}</h2>
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
          @click="$emit('start-game')"
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
          @select-ship="$emit('select-ship', $event)"
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
          @cell-click="$emit('setup-click', $event)"
      />
    </div>

    <div class="hint">
      <p>Нажмите ПРОБЕЛ, чтобы изменить ориентацию корабля</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Player, ShipType, CellState, GamePhase } from '@/types/game';

const props = defineProps<{
  gamePhase: GamePhase;
  activePlayer: Player;
  player1Ships: ShipType[];
  player2Ships: ShipType[];
  currentShip: ShipType | null;
  player1Board: CellState[][];
  player2Board: CellState[][];
  BOARD_SIZE: number;
  isVertical: boolean;
  canStartGame: boolean;
}>();

const emit = defineEmits(['start-game', 'select-ship', 'setup-click']);
</script>

<style lang="scss" scoped>
.setup-phase {
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

  label {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.setup-content {
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

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background-color: #45a049;
  }
}
</style>