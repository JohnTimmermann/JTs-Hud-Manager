<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="p-3 bg-zinc-800 border-2 border-amber-600/50 rounded-xl min-w-[150px]">
    <Handle type="target" :position="Position.Left" />

    <div class="text-xs font-bold text-amber-500 mb-2">Condition</div>

    <select
      v-model="data.conditionType"
      class="w-full bg-zinc-900 text-zinc-300 border border-zinc-700 rounded p-1 text-xs mb-2 outline-none"
    >
      <option value="winner">Winner (CT / T)</option>
      <option value="win_type">Win Type</option>
      <option value="match_point">Match Point?</option>
    </select>

    <div v-if="data.conditionType === 'winner'" class="flex flex-col gap-2 mt-3">
      <div class="relative text-right text-[10px] font-bold text-blue-400">
        CT
        <Handle type="source" :position="Position.Right" id="CT" class="!bg-blue-500" />
      </div>
      <div class="relative text-right text-[10px] font-bold text-amber-400">
        T
        <Handle type="source" :position="Position.Right" id="T" class="!bg-amber-500" />
      </div>
    </div>

    <div v-if="data.conditionType === 'win_type'" class="flex flex-col gap-2 mt-3">
      <div class="relative text-right text-[10px] text-zinc-400">
        Elimination
        <Handle type="source" :position="Position.Right" id="elimination" />
      </div>
      <div class="relative text-right text-[10px] text-zinc-400">
        Bomb
        <Handle type="source" :position="Position.Right" id="bomb" />
      </div>
      <div class="relative text-right text-[10px] text-zinc-400">
        Defuse
        <Handle type="source" :position="Position.Right" id="defuse" />
      </div>
      <div class="relative text-right text-[10px] text-zinc-400">
        Time
        <Handle type="source" :position="Position.Right" id="time" />
      </div>
    </div>

    <div v-if="data.conditionType === 'match_point'" class="flex flex-col gap-2 mt-3">
      <div class="relative text-right text-[10px] font-bold text-emerald-400">
        Yes
        <Handle type="source" :position="Position.Right" id="yes" class="!bg-emerald-500" />
      </div>
      <div class="relative text-right text-[10px] font-bold text-rose-400">
        No
        <Handle type="source" :position="Position.Right" id="no" class="!bg-rose-500" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* tira aquele padrao esquisito dos handles pra eles alinharem com o texto pai */
.vue-flow__handle {
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
