<script setup lang="ts">
import { ref } from 'vue';
import BaseButton from './BaseButton.vue';

export interface VmixTimelineAction {
  id: string;
  function: string;
  input?: string;
  value?: string;
  delay: number;
}

export interface VmixMapping {
  id: string;
  event: string;
  condition: string;
  actions: VmixTimelineAction[];
}

const props = defineProps<{
  modelValue: VmixMapping[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: VmixMapping[]): void;
}>();

const activeRuleId = ref<string | null>(null);

const emitUpdate = (newRules: VmixMapping[]) => {
  emit('update:modelValue', newRules);
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const addRule = () => {
  const newRules = [...props.modelValue];
  const newRule: VmixMapping = {
    id: generateId(),
    event: 'round_end',
    condition: 'ANY',
    actions: []
  };
  newRules.push(newRule);
  emitUpdate(newRules);
  activeRuleId.value = newRule.id;
};

const removeRule = (id: string) => {
  const newRules = props.modelValue.filter(r => r.id !== id);
  emitUpdate(newRules);
  if (activeRuleId.value === id) {
    activeRuleId.value = newRules.length > 0 ? newRules[0].id : null;
  }
};

const updateRule = (id: string, key: keyof VmixMapping, value: any) => {
  const newRules = [...props.modelValue];
  const index = newRules.findIndex(r => r.id === id);
  if (index !== -1) {
    newRules[index] = { ...newRules[index], [key]: value };
    emitUpdate(newRules);
  }
};

const addAction = (ruleId: string) => {
  const newRules = [...props.modelValue];
  const rule = newRules.find(r => r.id === ruleId);
  if (rule) {
    rule.actions.push({
      id: generateId(),
      function: 'Cut',
      input: '',
      value: '',
      delay: 0
    });
    // Sort actions by delay
    rule.actions.sort((a, b) => a.delay - b.delay);
    emitUpdate(newRules);
  }
};

const updateAction = (ruleId: string, actionId: string, key: keyof VmixTimelineAction, value: any) => {
  const newRules = [...props.modelValue];
  const rule = newRules.find(r => r.id === ruleId);
  if (rule) {
    const action = rule.actions.find(a => a.id === actionId);
    if (action) {
      (action as any)[key] = value;
      // Re-sort if delay changed
      if (key === 'delay') {
        rule.actions.sort((a, b) => a.delay - b.delay);
      }
      emitUpdate(newRules);
    }
  }
};

const removeAction = (ruleId: string, actionId: string) => {
  const newRules = [...props.modelValue];
  const rule = newRules.find(r => r.id === ruleId);
  if (rule) {
    rule.actions = rule.actions.filter(a => a.id !== actionId);
    emitUpdate(newRules);
  }
};

</script>

<template>
  <div class="flex h-full gap-6 min-h-0">
    <!-- Sidebar List -->
    <div class="w-64 flex flex-col gap-3 border-r border-zinc-800 pr-6 overflow-y-auto custom-scrollbar">
      <div class="flex items-center justify-between sticky top-0 bg-surface z-10 pb-2">
        <h3 class="text-sm font-semibold text-zinc-300">Rules</h3>
        <BaseButton @click="addRule" variant="secondary" size="xs">+ New</BaseButton>
      </div>

      <div v-if="modelValue.length === 0" class="text-xs text-zinc-500 italic text-center py-4">No rules created yet.</div>

      <div
        v-for="rule in modelValue"
        :key="rule.id"
        @click="activeRuleId = rule.id"
        class="p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 group relative"
        :class="activeRuleId === rule.id ? 'bg-zinc-800 border-primary' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-zinc-200 uppercase">{{ rule.event.replace('_', ' ') }}</span>
          <button @click.stop="removeRule(rule.id)" class="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
        </div>
        <span class="text-[10px] text-zinc-500">Condition: <strong class="text-zinc-400">{{ rule.condition }}</strong></span>
        <span class="text-[10px] text-zinc-500 mt-1">{{ rule.actions?.length || 0 }} actions</span>
      </div>
    </div>

    <!-- Timeline Editor Canvas -->
    <div class="flex-1 flex flex-col min-h-0 bg-zinc-900/50 rounded-lg border border-zinc-800 p-6 overflow-y-auto custom-scrollbar relative">
      <template v-if="activeRuleId">
        <template v-for="rule in modelValue" :key="`editor-${rule.id}`">
          <div v-if="rule.id === activeRuleId" class="flex flex-col h-full relative">

            <!-- Rule Setup Header -->
            <div class="flex gap-4 mb-8 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
              <div class="flex flex-col gap-1.5 flex-1">
                <label class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Trigger Event</label>
                <select :value="rule.event" @change="updateRule(rule.id, 'event', ($event.target as HTMLSelectElement).value)" class="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:border-primary focus:outline-none">
                  <option value="round_end">Round End</option>
                  <option value="clutch">Clutch Detected</option>
                  <option value="ace">Player Ace</option>
                </select>
              </div>
              <div class="flex flex-col gap-1.5 flex-1">
                <label class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Condition / Winner</label>
                <select :value="rule.condition" @change="updateRule(rule.id, 'condition', ($event.target as HTMLSelectElement).value)" class="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:border-primary focus:outline-none">
                  <option value="ANY">Any / All</option>
                  <option value="CT">Counter-Terrorists</option>
                  <option value="T">Terrorists</option>
                </select>
              </div>
            </div>

            <!-- Timeline visualization -->
            <div class="flex-1 relative pl-8 pb-10">
              <!-- Timeline vertical line -->
              <div class="absolute left-10 top-0 bottom-0 w-0.5 bg-zinc-800"></div>

              <!-- T=0 Start Node -->
              <div class="relative flex items-center gap-4 mb-8 group">
                <div class="w-5 h-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center z-10 shadow-[0_0_15px_rgba(var(--color-primary),0.3)]">
                  <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
                </div>
                <div class="bg-zinc-800/80 border border-zinc-700 px-4 py-2 rounded-lg">
                  <span class="text-xs font-bold text-zinc-200 uppercase tracking-wide">Event Occurs (T=0)</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-6 relative z-10">
                <div v-for="(action, index) in rule.actions" :key="action.id" class="relative flex gap-4 group">
                  <!-- Connector line/dot -->
                  <div class="absolute left-[8px] top-4 w-4 h-[2px] bg-zinc-700"></div>
                  <div class="w-4 h-4 rounded-full bg-zinc-800 border-2 border-zinc-600 absolute left-[2px] top-[10px] group-hover:border-zinc-400 transition-colors"></div>

                  <!-- Action Block -->
                  <div class="ml-10 bg-surface border border-zinc-700 rounded-xl p-4 shadow-xl flex-1 flex flex-col gap-3 relative transition-all hover:border-zinc-600">
                    <button @click="removeAction(rule.id, action.id)" class="absolute top-3 right-3 text-zinc-600 hover:text-red-400 transition-colors">✕</button>

                    <div class="flex items-center gap-2 mb-1">
                       <span class="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider border border-zinc-700">ACTION {{ index + 1 }}</span>
                    </div>

                    <div class="grid grid-cols-12 gap-3">
                      <div class="col-span-4 flex flex-col gap-1">
                        <label class="text-[10px] text-zinc-500">Delay (ms)</label>
                        <div class="flex items-center gap-2">
                           <span class="text-xs font-mono text-zinc-400">T +</span>
                           <input :value="action.delay" @change="updateAction(rule.id, action.id, 'delay', Number(($event.target as HTMLInputElement).value))" type="number" class="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5 w-20 focus:border-primary focus:outline-none" />
                        </div>
                      </div>

                      <div class="col-span-3 flex flex-col gap-1">
                        <label class="text-[10px] text-zinc-500">vMix Function</label>
                        <input :value="action.function" @input="updateAction(rule.id, action.id, 'function', ($event.target as HTMLInputElement).value)" placeholder="e.g. Cut" class="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5 w-full focus:border-primary focus:outline-none" />
                      </div>

                      <div class="col-span-3 flex flex-col gap-1">
                        <label class="text-[10px] text-zinc-500">Input (Opt)</label>
                        <input :value="action.input || ''" @input="updateAction(rule.id, action.id, 'input', ($event.target as HTMLInputElement).value)" placeholder="e.g. 1" class="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5 w-full focus:border-primary focus:outline-none" />
                      </div>

                      <div class="col-span-2 flex flex-col gap-1">
                        <label class="text-[10px] text-zinc-500">Value (Opt)</label>
                        <input :value="action.value || ''" @input="updateAction(rule.id, action.id, 'value', ($event.target as HTMLInputElement).value)" placeholder="" class="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5 w-full focus:border-primary focus:outline-none" />
                      </div>
                    </div>

                  </div>
                </div>

                <!-- Add Action Button -->
                <div class="ml-[42px] mt-2">
                  <BaseButton @click="addAction(rule.id)" variant="secondary" size="sm" class="border-dashed border-zinc-600 bg-transparent hover:bg-zinc-800 text-zinc-400">+ Add Timeline Action</BaseButton>
                </div>
              </div>

            </div>
          </div>
        </template>
      </template>

      <div v-else class="flex items-center justify-center h-full text-zinc-500 italic">
        Select a rule from the sidebar to edit its timeline.
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #52525b;
}
</style>
