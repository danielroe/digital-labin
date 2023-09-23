<script setup lang="ts">
import '@picocss/pico'
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <div class="container">
    👋 hi digital labin with HMR?
    <br />
    {{ count }}
    <button @click="count++">Client side reactivity</button>
  </div>
</template>
