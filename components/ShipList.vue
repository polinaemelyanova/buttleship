<template>
  <div class="ship-list">
    <h3>Корабли</h3>
    <div
        v-for="ship in ships"
        :key="ship.id"
        class="ship-item"
        :class="{
        'selected': ship === currentShip,
        'disabled': ship.count <= 0
      }"
        @click="selectShip(ship)"
    >
      <div class="ship-info">
        <span>{{ ship.name }} ({{ ship.length }} клетки)</span>
        <span>Осталось: {{ ship.count }}</span>
      </div>
      <div
          class="ship-preview"
          :style="{
          width: `${ship.length * 30}px`,
          backgroundColor: 'var(--player-color)'
        }"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ShipType } from '@/types/game';

const props = defineProps({
  ships: {
    type: Array as () => ShipType[],
    required: true
  },
  currentShip: Object,
  gamePhase: String
});

const emit = defineEmits(['select-ship']);

const selectShip = (ship: ShipType) => {
  if (props.gamePhase === 'setup' && ship.count > 0) {
    emit('select-ship', ship);
  }
};
</script>

<style scoped>
.ship-list {
  margin: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  min-width: 200px;
}

.ship-item {
  margin: 10px 0;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.ship-item:hover {
  background-color: #f5f5f5;
}

.ship-item.selected {
  border-color: var(--player-color);
  background-color: rgba(var(--player-color-rgb), 0.1);
}

.ship-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ship-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
}

.ship-preview {
  height: 20px;
  border-radius: 3px;
  transition: all 0.2s;
}

.ship-item.selected .ship-preview {
  box-shadow: 0 0 0 2px var(--player-color);
}
</style>