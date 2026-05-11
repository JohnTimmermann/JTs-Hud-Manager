<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: any }>()
</script>

<template>
  <div class="bg-zinc-800 border border-zinc-500 rounded-lg p-3 min-w-[120px] shadow-lg shadow-black/50">
    <Handle type="target" :position="Position.Left" class="w-3 h-3 bg-zinc-400 border-2 border-zinc-800" />
    <div class="text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-1">
      ⏱️ Delay
    </div>
    <div class="flex items-center gap-1">
      <input v-model.number="data.delayMs" type="number" class="w-16 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-primary" />
      <span class="text-xs text-zinc-500">ms</span>
    </div>
    <Handle type="source" :position="Position.Right" class="w-3 h-3 bg-primary border-2 border-zinc-800" />
  </div>
</template>
