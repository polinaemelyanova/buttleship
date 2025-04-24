<template>
  <div class="game-container">
    <h1>Морской бой</h1>

    <div class="hit-notification" v-if="showHitNotification">
      Попадание!
    </div>

    <!-- Фаза расстановки кораблей -->
    <SetupPhase
        v-if="gamePhase === 'setup'"
        :game-phase="gamePhase"
        :active-player="activePlayer"
        :player1-ships="player1Ships"
        :player2-ships="player2Ships"
        :current-ship="currentShip"
        :player1-board="player1Board"
        :player2-board="player2Board"
        :BOARD_SIZE="BOARD_SIZE"
        :is-vertical="isVertical"
        :can-start-game="canStartGame"
        @start-game="startGame"
        @select-ship="selectShip"
        @setup-click="handleSetupClick"
    />

    <!-- Фаза боя -->
    <div v-else-if="gamePhase === 'battle'" class="battle-phase">
      <div class="boards-container">

        <div class="opponent-ships" v-if="gamePhase === 'battle'">
          <h3>Оставшиеся корабли противника:</h3>
          <ul>
            <li v-for="ship in getRemainingEnemyShips" :key="ship.id">
              {{ ship.name }}: {{ ship.remaining }} из {{ ship.count }}
            </li>
          </ul>
        </div>

        <GameBoard
            :board="inactivePlayer.id === 1 ? player1Board : player2Board"
            :board-size="BOARD_SIZE"
            :title="`${inactivePlayer.name} (Ваши выстрелы)`"
            :game-phase="gamePhase"
            :active-player="activePlayer"
            :is-active="true"
            :show-ships="false"
            :current-ship="null"
            :is-vertical="false"
            @cell-click="handleBattleClick"
            :class="{ disabled: isBoardLocked }"
        />

        <GameBoard
            :board="activePlayer.id === 1 ? player1Board : player2Board"
            :board-size="BOARD_SIZE"
            :title="`${activePlayer.name} (Ваши корабли)`"
            :game-phase="gamePhase"
            :active-player="activePlayer"
            :is-active="false"
            :show-ships="true"
            :current-ship="null"
            :is-vertical="false"
        />


      </div>

      <div v-if="showEndTurn">
        <button class="" @click="endTurn">Завершить ход</button>
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
  showEndTurn,
  isBoardLocked,
  showHitNotification,
  getRemainingEnemyShips,

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
  closeTurnPopup,
  endTurn
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
        showEndTurn.value = true;
        isBoardLocked.value = true;
      }
      // При уничтожении корабля не меняем ход
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


<style lang="scss" scoped>

* {
  font-family: 'Lora', sans-serif;
}

.opponent-ships {
  margin-top: 20px;
  text-align: center;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  background: #f8f8f8;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  h3 {
    margin-bottom: 10px;
    color: #333;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      background: #fff;
      padding: 8px 12px;
      margin-bottom: 8px;
      border-radius: 4px;
      border-left: 3px solid #f44336;
      font-size: 14px;
    }
  }
}

.game-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

.battle-phase,
.gameover-phase {
  margin-top: 20px;
}

.boards-container {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-restart {
  background-color: #2196F3;
  color: white;
  margin-top: 20px;

  &:hover {
    background-color: #0b7dda;
  }
}

input[type="text"],
input[type="color"] {
  border: 1px solid #ddd;
  border-radius: 4px;
}

input[type="text"] {
  padding: 5px 10px;
}

input[type="color"] {
  width: 30px;
  height: 30px;
  padding: 0;
}

.disabled {
  pointer-events: none;
  opacity: 0.5;
}

.hit-notification {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: #f44336;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 100;
  animation: fade 2s;
}

.opponent-ships {
  margin-top: 20px;
  text-align: left;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;

  h3 {
    margin-bottom: 10px;
  }

  ul {
    list-style: none;
    padding: 0;

    li {
      background: #f0f0f0;
      padding: 6px 12px;
      margin-bottom: 6px;
      border-radius: 5px;
    }
  }
}

</style>