<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: any }>()
</script>

<template>
  <div class="bg-zinc-800 border border-amber-600/50 rounded-lg p-3 min-w-[150px] shadow-lg shadow-black/50">
    <Handle type="target" :position="Position.Left" class="w-3 h-3 bg-zinc-400 border-2 border-zinc-800" />
    <div class="text-[10px] font-bold text-amber-500 mb-2 uppercase tracking-wider">Check Winner</div>

    <div class="flex flex-col gap-2 mt-3">
      <div class="flex items-center justify-end relative h-6">
        <span class="text-[10px] text-zinc-300 mr-2">CT</span>
        <Handle type="source" :position="Position.Right" id="CT" class="w-3 h-3 bg-blue-500 border-2 border-zinc-800 !top-1/2" style="right: -18px" />
      </div>
      <div class="flex items-center justify-end relative h-6">
        <span class="text-[10px] text-zinc-300 mr-2">T</span>
        <Handle type="source" :position="Position.Right" id="T" class="w-3 h-3 bg-amber-500 border-2 border-zinc-800 !top-1/2" style="right: -18px" />
      </div>
    </div>
  </div>
</template>
