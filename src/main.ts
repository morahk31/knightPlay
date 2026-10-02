import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useCharactersStore } from './stores/characters'
import './styles/base.css'
import './styles/components.css'

const app = createApp(App)
app.use(createPinia())

const characters = useCharactersStore()
characters.init()
// Sauvegarde immédiate à la fermeture, pour ne rien perdre du dernier délai de regroupement.
window.addEventListener('beforeunload', () => characters.flush())

app.mount('#app')
