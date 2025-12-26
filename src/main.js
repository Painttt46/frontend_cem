/* eslint-disable */
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import axios from './utils/axiosConfig';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Calendar from 'primevue/calendar';
import Chart from 'primevue/chart';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import FloatLabel from 'primevue/floatlabel';
import IconField from 'primevue/iconfield';
import InputText from 'primevue/inputtext';
import InputSwitch from 'primevue/inputswitch';
import AutoComplete from 'primevue/autocomplete';
import MultiSelect from 'primevue/multiselect';
import InputIcon from 'primevue/inputicon';
import Badge from 'primevue/badge';
import ConfirmPopup from 'primevue/confirmpopup';
import ConfirmDialog from 'primevue/confirmdialog';
import OverlayPanel from 'primevue/overlaypanel';
import Toast from 'primevue/toast';
import ScrollPanel from 'primevue/scrollpanel';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Textarea from 'primevue/textarea';
import Tooltip from 'primevue/tooltip';
import ProgressBar from 'primevue/progressbar';

import {nextTick} from 'vue';

window.axios = axios;

const DEFAULT_TITLE = "Vue SOC Application";
router.afterEach((to) => {
    nextTick(() => {
        document.title = to.meta.title || DEFAULT_TITLE;
    });
});


const app = createApp(App);
app.use(store);
app.use(router);
app.use(PrimeVue, {
    // unstyled: false,
    ripple: true,
});
app.component('Button', Button);
app.component('Card', Card);
app.component('Calendar', Calendar);
app.component('Chart', Chart);
app.component('Column', Column);
app.component('DataTable', DataTable);
app.component('Dialog', Dialog);
app.component('Divider', Divider);
app.component('Dropdown', Dropdown);
app.component('FloatLabel', FloatLabel);
app.component('IconField', IconField);
app.component('InputIcon', InputIcon);
app.component('Badge', Badge);
app.component('ConfirmPopup', ConfirmPopup);
app.component('ConfirmDialog', ConfirmDialog);
app.component('InputText', InputText);
app.component('InputSwitch', InputSwitch);
app.component('AutoComplete', AutoComplete);
app.component('MultiSelect', MultiSelect);
app.component('OverlayPanel', OverlayPanel);
app.component('ScrollPanel', ScrollPanel);
app.component('Toast', Toast);
app.component('TabView', TabView);
app.component('TabPanel', TabPanel);
app.component('Textarea', Textarea);
app.component('ProgressBar', ProgressBar);
app.directive('Tooltip', Tooltip);
app.use(ConfirmationService);
app.use(ToastService);

app.config.globalProperties.$http = axios;

app.mount("#app");
