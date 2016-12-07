import Vue from 'vue'
import createRouter from './router';
import createStore from './store';
import DbService from 'services/db';
import App from './App'
import config from 'config';
import {FocusDirective} from './directives';

if(process.env.NODE_ENV === "production") {
	require('offline-plugin/runtime').install();
}

import './style/style.scss';

//global mixin for database
const dbService = new DbService(config);
Vue.mixin({
	beforeCreate () {
		this.$dbService = dbService;
	}
});

//context for all store modules
const storeCtx = {dbService};

//register global directives
FocusDirective();

const router = createRouter(),
	  store = createStore(storeCtx);

/* eslint-disable no-new */
new Vue({
	el: '.app',
	render: h => h(App),
	router : router,
	store : store
});