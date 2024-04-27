/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from './plugins'

// Components
import App from './App.vue'
import Visualize from './components/Visualize'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

registerPlugins(app)

app.component('Visualize', Visualize)

app.mount('#app')
