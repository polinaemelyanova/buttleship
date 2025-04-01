<template>
  <div v-if="show" class="turn-popup">
    <div class="popup-content">
      <h2>Ход игрока</h2>
      <div class="player-info" :style="{ color: player.color }">
        {{ player.name }}
      </div>
      <button @click="close">Начать ход</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  show: Boolean,
  player: Object
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};
</script>

<style scoped>
.turn-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(19, 19, 19, 0.99);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  max-width: 500px;
  width: 90%;

}

.player-info {
  font-size: 24px;
  margin: 20px 0;
  font-weight: bold;
}

button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  max-width: 60%;
}

button:hover {
  background-color: #45a049;
}
</style>