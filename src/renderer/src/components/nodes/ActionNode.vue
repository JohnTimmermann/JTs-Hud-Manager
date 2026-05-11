<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: any }>()
</script>

<template>
  <div class="bg-zinc-800 border border-emerald-600/50 rounded-lg p-3 min-w-[180px] shadow-lg shadow-black/50">
    <Handle type="target" :position="Position.Left" class="w-3 h-3 bg-zinc-400 border-2 border-zinc-800" />
    <div class="text-[10px] font-bold text-emerald-500 mb-2 uppercase tracking-wider">vMix Action</div>

    <div class="flex flex-col gap-2">
      <input v-model="data.function" placeholder="Function (e.g. Cut)" class="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-primary" />
      <input v-model="data.input" placeholder="Input (Optional)" class="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-primary" />
      <input v-model="data.value" placeholder="Value (Optional)" class="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-primary" />
    </div>

    <Handle type="source" :position="Position.Right" class="w-3 h-3 bg-primary border-2 border-zinc-800" />
  </div>
</template>
