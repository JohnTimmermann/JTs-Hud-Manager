<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: any }>()
</script>

<template>
  <div class="bg-zinc-800 border border-zinc-600 rounded-lg p-3 min-w-[150px] shadow-lg shadow-black/50">
    <div class="text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-wider">Trigger</div>
    <select v-model="data.event" class="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-primary">
      <option value="round_end">Round End</option>
      <option value="ace">Player Ace</option>
      <option value="clutch">Clutch Detected</option>
    </select>
    <Handle type="source" :position="Position.Right" class="w-3 h-3 bg-primary border-2 border-zinc-800" />
  </div>
</template>
