<template>
	<div class="page page-recipes" :class="{'page--loading' : loading, 'page-recipes--adding' : adding}" @click="stopAdding">
		<div class="header header--page page-recipes__header">
			<h1 class="header__title page-recipes__title">Recepten</h1>

			<div class="header__btns page-recipes__btns">
				<button class="icon-btn page-recipes__add-btn primary-color" @click="add">
					<i class="fa fa-plus"></i>
				</button>
			</div>
		</div>

		<transition name="new-form-transition">
			<form v-show="adding" class="page-recipes__new" @click="clickForm" @submit.prevent="commitAdd">
				<input type="text" v-model="enteredRecipeName" class="page-recipes__new-input" tabindex="0" v-focus="adding" autofocus placeholder="Gerecht naam">
				<input type="submit" :disabled="!hasValidRecipeName" value="toevoegen" class="button button--white page-recipes__new-btn">
			</form>
		</transition>

		<recipe-list 
			v-show="!loading"
			class="page-recipes__list" 
			:recipes="recipes" 
			@clickRecipe="clickRecipe"
			>

			<div slot="empty">Geen recepten :-(</div>
		</recipe-list>
	</div>
</template>

<script>
	import RecipeList from 'components/RecipeList';
	import {mapState} from 'vuex';
	import {actionTypes} from './store';

	export default {
		name : "shoppy-recipes",

		created() {
			this.$store.dispatch( actionTypes.RECIPES_LOAD );
		},

		destroyed() {
			this.$store.dispatch( actionTypes.RECIPES_UNLOAD );
		},

		data : () => {
			return {
				adding : false,
				enteredRecipeName : ""
			}
		},

		computed : {
			hasValidRecipeName() {
				return this.enteredRecipeName.match(/\S/);
			},

			...mapState({
				recipes : state => state.recipes.items,
				loading : state => state.recipes.loading,
				loaded  : state => state.recipes.loaded
			})
		},

		methods : {
			add(e) {
				this.adding = true;
				e.stopPropagation();
			},

			commitAdd() {
				const $router = this.$router;

				this.$store.dispatch(actionTypes.RECIPES_ADD, {name : this.enteredRecipeName})
					.then(recipes => {
						$router.push(`/recept/${recipes[0].slug}`);
					});
			},

			clickForm(e) {
				if(this.adding) {
					e.stopPropagation();
				}
			},

			clickRecipe(recipe) {
				this.$router.push(`/recept/${recipe.slug}`);
			},

			stopAdding() {
				if(this.adding) {
					this.adding = false;
				}
			}
		},

		components : {
			RecipeList
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import '~style/variables';
	@import '~style/animations';
	@import '~style/fa/variables';
	@import '~style/functions';

	.new-form-transition {
		@keyframes enter-new-form {
			0% {transform:translateY(-100%);}
			100% {transform:translateY(0);}
		}

		@keyframes leave-new-form {
			0% {transform:translateY(0);}
			100% {transform:translateY(-100%);}
		}

		&-leave-active {
			animation:leave-new-form .4s ease-out; 	
		}

		&-enter-active {
			animation:enter-new-form .4s ease-out; 
		}
	}

	.page-recipes {

		&:after {
			content:"";  
			position:absolute; 
			left:0;
			top:px-rem($headerHeight);
			width:100%;
			bottom:0;
			background:rgba(0,0,0,.05);
			@include fadeOut;
		}

		&--adding:after {
			@include fadeIn;
		}

		&__add-btn {
			@include fadeIn;
			.page-recipes--adding & {
				@include fadeOut;
			}
		}

		&__list {
			padding-bottom:20px;
			min-height:calc(100vh - #{$headerHeight});
		}

		&__new {
			position:absolute;
			width:100%;
			top:$headerHeight;
			left:0;
            display:flex;            
            background-color:#ddd;
			align-items:center;
			z-index:1;
            padding:px-rem(10px) px-rem(15px);
        }

        &__new-input {
            width:100%;
            height:px-rem(40px);
            border:0;
            font-size:1.3em;
            border-radius:5px;
            background-color:$whiteColor;
            padding:0 px-rem(10px);
			margin-right:px-rem(20px);
            color:$primaryColor;

            &:focus {outline:none;}
        }

		&__new-btn {
			height:px-rem(40px);
		}
	}
	
</style>