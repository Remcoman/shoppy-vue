<template>
	<div class="app" :class="{'app--online' : online, 'app--show-error' : errorTooltipShown, 'app--show-menu' : menuOpened, 'app--prevent-overflow' : preventOverflow}">
		<div class="app__error-tooltip">
			<span>{{errorText}}</span>
		</div>

		<nav class="app__menu">
			<ul>
				<li>
					<router-link to="/" class="app__menu-link">Boodschappen</router-link>
				</li>

				<li>
					<router-link to="/recepten" class="app__menu-link">Recepten</router-link>
				</li>
			</ul>
		</nav>

		<div class="app__page-container" @click="closeMenu">
			<div class="header primary-color-bg">
				<button class="app__menu-btn" @click.stop="toggleMenu">
					<span class="app__menu-hamburger"></span>
				</button>
			</div>

			<router-view></router-view>
		</div>
	</div>
</template>

<script>
	import {mapState} from 'vuex';
	import {mutationTypes} from './store/app';

	export default {
		name : "shoppy",

		created() {
			this.handleOnline = this.handleOnline.bind(this);
			this.handleOffline = this.handleOffline.bind(this);

			window.addEventListener("online", this.handleOnline, false);
			window.addEventListener("offline", this.handleOffline, false);

			//close menu when going to a new route
			this.$router.beforeEach((to, from, next) => {
				this.$store.commit(mutationTypes.TOGGLE_MENU_OPENED, false);
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
				preventOverflow : false
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
				return state.error !== null ? state.error.toString() : "";
			}
		}),

		watch : {
			menuOpened(val, oldVal) {
				if(val) {
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
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import '~style/functions';
	@import '~style/variables';
	@import '~sass-burger';

	.app { float:left; width:100%; 
		&--show-menu { overflow:hidden; }
		&--prevent-overflow {overflow:hidden;}

		&:not(.app--online) {
			.primary-color {color:desaturate($color: $primaryColor, $amount: 40%);}
			.primary-color-bg {background-color:desaturate($color: $primaryColor, $amount: 40%);}
		}

		&__page-container {
			transition:transform .4s ease-out;
			float:left;
			position:relative;
			width:100%;
			min-height:100vh;
			background-color:$whiteColor;
			z-index:index($zIndexes, page-container);

			.app.app--show-error & {transform:translateY($errorTooltipHeight); height:calc(100% - #{$errorTooltipHeight});}
			.app.app--show-menu & {transform:perspective(1500px) translateX(50vw) rotate3d(0, 1, 0, -45deg); }
		}

		&__menu {
			position:fixed;
			left:0;
			top:0;
			width:100vw;
			background:#444;
			height:100vh;
			z-index:index($zIndexes, menu);
			text-align: center;
			display:flex;
			align-items: center;
			font-size:1.3em;

			ul {
				list-style: none; 
				text-align: center; 
				width:60vw;
				padding:0;
			}
			
			li {
				display:inline; 
				padding:0;
			}
		}

		&__menu-link {color:$whiteColor; text-decoration: none; display:block; margin-bottom:5vh;}

		&__menu-btn {font-size:1.5em; width:20px; height:20px; margin-left:px-rem($horizontalMargin); }

		&__menu-hamburger {
			@include burger(20px, 3px, 4px, $whiteColor);
			.app.app--show-menu & {@include burger-to-cross;}
		}

		&__error-tooltip {
			display:block;
			position:fixed;
			top:0;
			background:#444;
			color:$whiteColor;
			width:100%;
			height:$errorTooltipHeight;
			line-height:$errorTooltipHeight;
			visibility: hidden;
			padding:0 15px;

			.app.app--show-error & {visibility: visible;}
		}
	}


</style>