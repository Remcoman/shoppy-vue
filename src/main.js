import Vue from 'vue'
import createRouter from './router';
import createStore from './store';
import {dbService, disableDebug} from '@/services/db';
import {App} from './modules/app'
import config from 'config';
import {FocusDirective, OnAllDirective} from './directives';

disableDebug();

if(process.env.NODE_ENV === "production") {
	require('offline-plugin/runtime').install();
}

import './style/style.scss';

//global mixin for database
const globalDbService = dbService(config);
Vue.mixin({
	beforeCreate () {
		this.$dbService = globalDbService;
	}
});

//context for all store modules
const storeCtx = {dbService : globalDbService};

//register global directives
FocusDirective();
OnAllDirective();

const router = createRouter(),
	  store  = createStore(storeCtx);

/* eslint-disable no-new */
new Vue({
	el: '.app',
	render: h => h(App),
	router : router,
	store : store
});