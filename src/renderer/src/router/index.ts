import { createRouter, createWebHashHistory } from 'vue-router'

import PlayersView from '../views/PlayersView.vue'
import TeamsView from '../views/TeamsView.vue'
import MatchesView from '../views/MatchesView.vue'
import MatchFormView from '../views/MatchFormView.vue'
import HudPanelView from '../views/HudPanelView.vue'
import LiveView from '../views/LiveView.vue'
import HudsView from '../views/HudsView.vue'
import SpectatorView from '../views/SpectatorView.vue'
import VmixView from '../views/VmixView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/huds' },
    { path: '/live', name: 'Live', component: LiveView },
    { path: '/players', name: 'Players', component: PlayersView },
    { path: '/teams', name: 'Teams', component: TeamsView },
    { path: '/matches', name: 'Matches', component: MatchesView },
    { path: '/matches/new', name: 'MatchCreate', component: MatchFormView },
    { path: '/matches/:id/edit', name: 'MatchEdit', component: MatchFormView },
    { path: '/huds', name: 'Huds', component: HudsView },
    { path: '/huds/:hudId/panel', name: 'HudPanel', component: HudPanelView },
    { path: '/spectator', name: 'Spectator', component: SpectatorView },
    { path: '/vmix', name: 'vMix', component: VmixView }
  ]
})

export default router
