import { createApp, onMounted } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/css/app.css';
import { useSideMenuStore } from './stores/side-menu';


const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize the side menu store and update the menu
const sideMenuStore = useSideMenuStore();
sideMenuStore.updateMenu();


app.mount('#app');
