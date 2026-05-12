<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettings } from '../features/settings/composables/useSettings'
import BaseInput from '../components/base/BaseInput.vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import TriggerNode from '../components/nodes/TriggerNode.vue'
import ConditionNode from '../components/nodes/ConditionNode.vue'
import DelayNode from '../components/nodes/DelayNode.vue'
import ActionNode from '../components/nodes/ActionNode.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const { settings, isLoading, fetchSettings, saveSettings } = useSettings()

const nodes = ref<any[]>([])
const edges = ref<any[]>([])
const { onConnect, project } = useVueFlow()

let saveTimeout: any
const saveAllSettings = () => {
  settings.value.vmixMappings = JSON.stringify({ nodes: nodes.value, edges: edges.value })
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveSettings(settings.value)
  }, 500)
}

onMounted(() => {
  fetchSettings().then(() => {
    try {
      const graph = JSON.parse(settings.value.vmixMappings || '{"nodes":[],"edges":[]}')
      // migrate from old array format to graph format if necessary
      if (Array.isArray(graph)) {
        nodes.value = []
        edges.value = []
      } else {
        nodes.value = graph.nodes || []
        edges.value = graph.edges || []
      }
    } catch (e) {
      nodes.value = []
      edges.value = []
    }
  })
})

onConnect((params) => {
  edges.value.push(params)
  saveAllSettings()
})

const generateId = () => Math.random().toString(36).substring(2, 9)

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  const type = event.dataTransfer?.getData('application/vueflow')
  if (!type) return

  // Approximate position based on mouse drop
  const bounds = (event.target as HTMLElement).getBoundingClientRect()
  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  })

  const newNode = {
    id: generateId(),
    type,
    position,
    data: getInitialDataForType(type)
  }

  nodes.value.push(newNode)
  saveAllSettings()
}

const getInitialDataForType = (type: string) => {
  switch (type) {
    case 'trigger':
      return { event: 'round_end' }
    case 'condition':
      return { conditionType: 'winner' }
    case 'delay':
      return { delayMs: 1000 }
    case 'action':
      return { function: 'Cut', input: '', value: '' }
    default:
      return {}
  }
}

const onDragStart = (event: DragEvent, nodeType: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
}

watch(nodes, () => saveAllSettings(), { deep: true })
watch(edges, () => saveAllSettings(), { deep: true })
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
    <div class="mb-6 flex flex-col gap-2">
      <h1 class="text-3xl font-bold text-text-main">vMix Integration</h1>
      <p class="text-sm text-zinc-400">
        Configure connection settings and visual node-based automation rules for vMix.
      </p>
    </div>

    <div v-if="isLoading" class="text-zinc-400 text-sm">Loading settings...</div>

    <template v-else>
      <!-- Connection Settings -->
      <div
        class="mb-6 p-5 bg-surface border border-zinc-800 rounded-xl flex gap-6 items-end shrink-0"
      >
        <div class="flex-1">
          <BaseInput
            v-model="settings.vmixHost"
            label="vMix Host IP"
            placeholder="127.0.0.1"
            @input="saveAllSettings"
          />
        </div>
        <div class="w-32">
          <BaseInput
            v-model.number="settings.vmixPort"
            label="Port"
            type="number"
            placeholder="8088"
            @input="saveAllSettings"
          />
        </div>
      </div>

      <!-- Node Editor -->
      <div class="flex-1 min-h-0 flex gap-4">
        <!-- Palette Sidebar -->
        <div
          class="w-48 bg-surface border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shrink-0"
        >
          <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Node Palette
          </h3>
          <div class="text-xs text-zinc-500 mb-2 italic">Drag nodes onto the canvas</div>

          <div
            class="bg-zinc-800 border border-zinc-600 rounded p-2 text-xs text-zinc-300 cursor-grab text-center hover:bg-zinc-700"
            draggable="true"
            @dragstart="onDragStart($event, 'trigger')"
          >
            Trigger
          </div>
          <div
            class="bg-zinc-800 border border-amber-600/50 rounded p-2 text-xs text-amber-500 cursor-grab text-center hover:bg-zinc-700"
            draggable="true"
            @dragstart="onDragStart($event, 'condition')"
          >
            Condition (Winner)
          </div>
          <div
            class="bg-zinc-800 border border-zinc-500 rounded p-2 text-xs text-zinc-400 cursor-grab text-center hover:bg-zinc-700"
            draggable="true"
            @dragstart="onDragStart($event, 'delay')"
          >
            Delay
          </div>
          <div
            class="bg-zinc-800 border border-emerald-600/50 rounded p-2 text-xs text-emerald-500 cursor-grab text-center hover:bg-zinc-700"
            draggable="true"
            @dragstart="onDragStart($event, 'action')"
          >
            vMix Action
          </div>

          <div class="mt-auto text-[10px] text-zinc-600 text-center">
            Select node/edge and press Backspace to delete
          </div>
        </div>

        <!-- Canvas -->
        <div
          class="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative"
          @dragover="onDragOver"
          @drop="onDrop"
        >
          <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            class="h-full w-full"
            :default-viewport="{ zoom: 1 }"
          >
            <template #node-trigger="props">
              <TriggerNode :data="props.data" />
            </template>
            <template #node-condition="props">
              <ConditionNode :data="props.data" />
            </template>
            <template #node-delay="props">
              <DelayNode :data="props.data" />
            </template>
            <template #node-action="props">
              <ActionNode :data="props.data" />
            </template>

            <Background pattern-color="#3f3f46" :gap="20" />
            <Controls />
          </VueFlow>
        </div>
      </div>
    </template>
  </div>
</template>

<style>
/* Vue Flow custom overrides */
.vue-flow__node {
  border-radius: 8px;
}
.vue-flow__edge-path {
  stroke: #a1a1aa;
  stroke-width: 2;
}
.vue-flow__connection-path {
  stroke: #a1a1aa;
  stroke-width: 2;
}
</style>
