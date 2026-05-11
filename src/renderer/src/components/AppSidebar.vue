<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { socket } from '../socket'
import twitchLogo from '../assets/icon.jpg'
import SettingsModal from './base/SettingsModal.vue'
import SidebarNavLink from './SidebarNavLink.vue'
import BaseButton from './base/BaseButton.vue'

const settingsOpen = ref(false)
const hasLiveData = ref(false)
const updateAvailable = ref<string | null>(null)
let liveDataTimeout: ReturnType<typeof setTimeout> | null = null

// Sidebar collapsed state — persisted across sessions
const collapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
watch(collapsed, (v) => localStorage.setItem('sidebarCollapsed', String(v)))

const onUpdate = () => {
  hasLiveData.value = true
  if (liveDataTimeout) clearTimeout(liveDataTimeout)
  liveDataTimeout = setTimeout(() => {
    hasLiveData.value = false
  }, 5000)
}

onMounted(() => {
  socket.on('update', onUpdate)
  window.api.onUpdateAvailable((version) => {
    updateAvailable.value = version
  })
})
onUnmounted(() => {
  socket.off('update', onUpdate)
  if (liveDataTimeout) clearTimeout(liveDataTimeout)
})

function openReleasesPage() {
  window.api.openExternal('https://github.com/JohnTimmermann/JTs-Hud-Manager/releases/latest')
}

function openDiscord() {
  window.api.openExternal('https://discord.gg/XPYdZ8KNWn')
}
function openGithub() {
  window.api.openExternal('https://github.com/JohnTimmermann/JTs-Hud-Manager')
}
function openTwitch() {
  window.api.openExternal('https://twitch.tv/jtmythic')
}
</script>

<template>
  <SettingsModal :open="settingsOpen" @close="settingsOpen = false" />

  <aside
    :class="[collapsed ? 'w-16' : 'w-56']"
    class="transition-all duration-200 ease-in-out bg-surface border-r border-border flex flex-col overflow-hidden shrink-0"
  >
    <!-- Logo -->
    <div
      class="relative border-b border-border flex flex-col items-center shrink-0 justify-center font-[Caveat_Brush]"
      :class="collapsed ? 'px-3 py-3' : 'px-4 py-4'"
    >
      <!-- Expanded view -->
      <div
        @click="openTwitch"
        title="Open Twitch channel"
        class="cursor-pointer hover:bg-surface-hover rounded-lg px-2 py-1 flex items-center gap-2"
      >
        <img v-if="!collapsed" :src="twitchLogo" alt="Logo" class="size-8 rounded-lg" />
        <span v-if="!collapsed" class="text-3xl min-w-0">
          <span class="text-text-main">JTs</span><span class="text-primary">Hud</span>
        </span>
        <!-- Collapsed view -->
        <span v-else class="text-3xl">
          <span class="text-text-main">JT</span><span class="text-primary">H</span>
        </span>
      </div>
      <!-- Collapse button — only visible when expanded -->
      <button
        v-if="!collapsed"
        @click.stop="collapsed = true"
        class="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-zinc-800"
        title="Collapse sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Nav -->
    <nav
      class="flex-1 py-3 flex flex-col gap-0.5 overflow-hidden"
      :class="collapsed ? 'px-2' : 'px-3'"
    >
      <!-- Expand button — only visible when collapsed -->
      <button
        v-if="collapsed"
        @click="collapsed = false"
        class="flex items-center justify-center py-2 mb-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        title="Expand sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <p v-if="!collapsed" class="px-3 pb-1 text-xs font-semibold capitalize text-zinc-600">
        Application Data
      </p>

      <SidebarNavLink to="/huds" label="HUDs" :collapsed="collapsed">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path
            d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm200-120h240q17 0 28.5-11.5T640-400v-160q0-17-11.5-28.5T600-600H360q-17 0-28.5 11.5T320-560v160q0 17 11.5 28.5T360-360ZM160-240v-480 480Z"
          />
        </svg>
      </SidebarNavLink>

      <SidebarNavLink to="/players" label="Players" :collapsed="collapsed">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path
            d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-240v-32q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v32q0 33-23.5 56.5T720-160H240q-33 0-56.5-23.5T160-240Zm80 0h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"
          />
        </svg>
      </SidebarNavLink>

      <SidebarNavLink to="/teams" label="Teams" :collapsed="collapsed">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path
            d="M40-240q-17 0-28.5-11.5T0-280v-23q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H40Zm240 0q-17 0-28.5-11.5T240-280v-25q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v25q0 17-11.5 28.5T680-240H280Zm500 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v23q0 17-11.5 28.5T920-240H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z"
          />
        </svg>
      </SidebarNavLink>

      <SidebarNavLink to="/matches" label="Matches" :collapsed="collapsed">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path
            d="M620-360q-17 0-28.5-11.5T580-400v-160q0-17 11.5-28.5T620-600h100q17 0 28.5 11.5T760-560v160q0 17-11.5 28.5T720-360H620Zm20-60h60v-120h-60v120Zm-380 0h90q13 0 21.5 8.5T380-390q0 13-8.5 21.5T350-360H240q-17 0-28.5-11.5T200-400v-60q0-17 11.5-28.5T240-500h80v-40h-90q-13 0-21.5-8.5T200-570q0-13 8.5-21.5T230-600h110q17 0 28.5 11.5T380-560v60q0 17-11.5 28.5T340-460h-80v40ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h120v-40q0-17 11.5-28.5T320-880q17 0 28.5 11.5T360-840v40h240v-40q0-17 11.5-28.5T640-880q17 0 28.5 11.5T680-840v40h120q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h290v-30q0-13 8.5-21.5T480-300q13 0 21.5 8.5T510-270v30h290v-480H510v30q0 13-8.5 21.5T480-660q-13 0-21.5-8.5T450-690v-30H160v480Zm0 0v-480 480Z"
          />
        </svg>
      </SidebarNavLink>

      <div class="my-1.5 border-t border-border"></div>

      <p v-if="!collapsed" class="px-3 pb-1 text-xs font-semibold capitalize text-zinc-600">
        Game Data
      </p>

      <SidebarNavLink to="/live" label="Live Game Data" :collapsed="collapsed" :badge="hasLiveData">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path
            d="M182-200q-51 0-79-35.5T82-322l42-300q9-60 53.5-99T282-760h396q60 0 104.5 39t53.5 99l42 300q7 51-21 86.5T778-200q-21 0-39-7.5T706-230l-90-90H344l-90 90q-15 15-33 22.5t-39 7.5Zm16-86 114-114h336l114 114q2 2 16 6 11 0 17.5-6.5T800-304l-44-308q-4-29-26-48.5T678-680H282q-30 0-52 19.5T204-612l-44 308q-2 11 4.5 17.5T182-280q2 0 16-6Zm510.5-165.5Q720-463 720-480t-11.5-28.5Q697-520 680-520t-28.5 11.5Q640-497 640-480t11.5 28.5Q663-440 680-440t28.5-11.5Zm-80-120Q640-583 640-600t-11.5-28.5Q617-640 600-640t-28.5 11.5Q560-617 560-600t11.5 28.5Q583-560 600-560t28.5-11.5ZM480-480Zm-170-30v40q0 13 8.5 21.5T340-440q13 0 21.5-8.5T370-470v-40h40q13 0 21.5-8.5T440-540q0-13-8.5-21.5T410-570h-40v-40q0-13-8.5-21.5T340-640q-13 0-21.5 8.5T310-610v40h-40q-13 0-21.5 8.5T240-540q0 13 8.5 21.5T270-510h40Z"
          />
        </svg>
      </SidebarNavLink>

      <SidebarNavLink to="/spectator" label="Spectator Binds" :collapsed="collapsed">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path
            d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"
          />
        </svg>
      </SidebarNavLink>

      <SidebarNavLink to="/vmix" label="vMix Integration" :collapsed="collapsed">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="currentColor"
        >
          <path
            d="m136-240-56-56 296-298 160 160 208-206H640v-80h240v240h-80v-104L536-320 376-480 136-240Z"
          />
        </svg>
      </SidebarNavLink>
    </nav>

    <div>
      <!-- Footer — expanded -->
      <div
        v-if="!collapsed"
        class="px-5 py-3 border-t border-border flex items-center justify-center gap-1"
      >
        <button
          v-if="updateAvailable"
          @click="openReleasesPage"
          class="hover:cursor-pointer relative text-amber-400 hover:text-amber-300 transition-colors"
          :title="`Update ${updateAvailable} available — click to download`"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            <path
              d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"
            />
          </svg>
          <span
            class="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
          ></span>
        </button>
        <BaseButton @click="settingsOpen = true" variant="ghost" size="sm" title="Settings">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </BaseButton>
        <BaseButton @click="openDiscord" variant="ghost" size="sm" title="Discord">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.385-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.294.075.075 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.009c.12.098.246.198.373.295a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.77 1.364 1.225 1.994a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-4.718-.838-8.812-3.549-12.456a.06.06 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.97-2.157 2.157-2.157 1.194 0 2.157.964 2.157 2.157 0 1.19-.963 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.97-2.157 2.157-2.157 1.194 0 2.157.964 2.157 2.157 0 1.19-.962 2.156-2.157 2.156Z"
            />
          </svg>
        </BaseButton>
        <BaseButton @click="openGithub" variant="ghost" size="sm" title="GitHub">
          <svg class="size-4" viewBox="0 0 98 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_730_27126)">
              <path
                d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z"
                fill="currentColor"
              />
            </g>
            <defs>
              <clipPath id="clip0_730_27126">
                <rect width="98" height="96" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </BaseButton>
      </div>

      <!-- Footer — collapsed (icons only) -->
      <div v-else class="py-3 border-t border-border flex flex-col items-center gap-1">
        <button
          v-if="updateAvailable"
          @click="openReleasesPage"
          class="relative text-amber-400 hover:text-amber-300 transition-colors"
          :title="`Update ${updateAvailable} available — click to download`"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            <path
              d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"
            />
          </svg>
          <span
            class="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
          ></span>
        </button>
        <BaseButton @click="settingsOpen = true" variant="ghost" size="sm" title="Settings">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </BaseButton>
        <BaseButton @click="openDiscord" variant="ghost" size="sm" title="Discord">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.385-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.294.075.075 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.009c.12.098.246.198.373.295a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.77 1.364 1.225 1.994a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-4.718-.838-8.812-3.549-12.456a.06.06 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.97-2.157 2.157-2.157 1.194 0 2.157.964 2.157 2.157 0 1.19-.963 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.97-2.157 2.157-2.157 1.194 0 2.157.964 2.157 2.157 0 1.19-.962 2.156-2.157 2.156Z"
            />
          </svg>
        </BaseButton>
        <BaseButton @click="openGithub" variant="ghost" size="sm" title="GitHub">
          <svg class="size-4" viewBox="0 0 98 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_730_27126)">
              <path
                d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z"
                fill="currentColor"
              />
            </g>
            <defs>
              <clipPath id="clip0_730_27126">
                <rect width="98" height="96" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </BaseButton>
      </div>
    </div>
  </aside>
</template>
