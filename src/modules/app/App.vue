<template src="./App.html"></template>
<style src="./App.scss" lang="scss"></style>

<script>
	import {mapState} from 'vuex';
	import {mutationTypes} from '@/modules/app/store';
	import TransitionRouterView from '@/components/TransitionRouterView';
	import AppMenu from '@/components/AppMenu';
	import {customTransitions, defaultTransition} from '@/router';

	export default {
		name : "shoppy",

		created() {
			this.handleOnline = this.handleOnline.bind(this);
			this.handleOffline = this.handleOffline.bind(this);

			window.addEventListener("online", this.handleOnline, false);
			window.addEventListener("offline", this.handleOffline, false);

			//close menu when going to a new route
			this.$router.beforeEach((to, from, next) => {
				if(to.meta.title) {
					document.title = to.meta.title;
				}

				if(this.$store.state.menuOpened) {
					this.$store.commit(mutationTypes.TOGGLE_MENU_OPENED, false);
				}
				
				//delay the menu animation because of safari
				if(to.params.fromMenu) {
					setTimeout(next, 300);
					return;
				}

				next();
			});
		},

		destroyed() {
			window.removeEventListener("online", this.handleOnline, false);
			window.removeEventListener("offline", this.handleOffline, false);
		},

		data() {
			return {
				errorTooltipShown : false, 
				preventOverflow : false,
				customTransitions,
				defaultTransition
			}
		},

		methods : {
			closeMenu() {
				this.$store.commit( mutationTypes.TOGGLE_MENU_OPENED, false );
			},

			toggleMenu() {
				this.$store.commit( mutationTypes.TOGGLE_MENU_OPENED );
			},

			handleOnline() {
				this.$store.commit( mutationTypes.SET_ONLINE, true );
			},

			handleOffline() {
				this.$store.commit( mutationTypes.SET_ONLINE, false );
			}
		},

		computed : mapState({
			menuOpened(state) {
				return state.menuOpened;
			},

			online(state) {
				return state.online;
			},

			errorText(state) {
				return state.error !== null ? state.error.toString().replace(/^Error: /, "") : "";
			}
		}),

		watch : {
			menuOpened(val, oldVal) {
				if(val) {
					window.scrollTo(0,0);
					
					clearTimeout(this.removeOverflowTimeout);
					this.preventOverflow = true;
				}
				else if(oldVal) {
					this.removeOverflowTimeout = setTimeout(() => {
						this.preventOverflow = false;
					}, 1000);
				}
			},

			errorText(val) {
				if(val !== "") {
					this.errorTooltipShown = true;
					setTimeout(() => {
						this.errorTooltipShown = false;
					}, 3000);
				}
			}
		},

		components : {
			TransitionRouterView,
			AppMenu
		}
	}
</script>