<template src="./Recipes.html"></template>
<style src="./Recipes.scss" lang="scss"></style>

<script>
	import RecipeList from '@/components/RecipeList';
	import RecipeListItem from '@/components/RecipeTypes/RecipeListItem';
	import PendingRecipeListItem from '@/components/RecipeTypes/PendingRecipeListItem';
	import IconButton from '@/components/IconButton';
	import RecipeAddForm from '@/components/RecipeAddForm';
	import Page from '@/components/Page';

	import {mapState, mapGetters} from 'vuex';
	import {actionTypes, mutationTypes} from './store';

	const createRecipeURL = recipe => `/recept/${recipe.slug}`;

	export default {
		name : "shoppy-recipes",

		created() {
			this.$store.commit( mutationTypes.RESET );

			this.$store.dispatch( actionTypes.LOAD );
		},

		destroyed() {
			this.$selectedRecipe = null;
			this.$store.dispatch( actionTypes.UNLOAD );
		},

		data : () => {
			return {
				$selectedRecipe : null
			}
		},

		computed : {
			...mapState({
				loading : state => state.recipes.loading,
				loaded  : state => state.recipes.loaded,
				preview : state => state.recipes.preview,
				addFormShown : state => state.recipes.addFormShown,
				offline : state => !state.online
			}),

			...mapGetters([
				'recipePlaceholderLoader',
				'recipesIncludingPending'
			]),

			linkTemplate() {
				return createRecipeURL;
			}
		},

		methods : {
			add(e) {
				this.$store.commit(mutationTypes.SHOW_ADD_FORM);
				e.stopPropagation();
			},

			stopAdding(e) {
				if( this.$refs.addForm && this.$refs.addForm.$el.contains(e.target) ) {
					return;
				}
				this.$store.commit(mutationTypes.HIDE_ADD_FORM);
			},

			handleClearPreview() {
				//slight delay to prevent closing when clicking the clear button
				setTimeout(() => {
					this.$store.commit(mutationTypes.PREVIEW_CLEAR);
				}, 10);
			},

			handleAddFormPasteURL(url) {
				this.$store.dispatch(actionTypes.PREVIEW, {url});
			},

			handleAddFormSubmit({type, value}) {
				if(type === "name") {
					this.$store.dispatch(actionTypes.ADD_BY_NAME, {name : value})
						.then(recipes => {
							this.$router.push( createRecipeURL(recipes[0]) );
						});
				}
				else {
					this.$store.dispatch(actionTypes.ADD_BY_URL, {preview : value});
					this.$store.commit(mutationTypes.HIDE_ADD_FORM);
				}
			},

			routeLeave({from, to}, done) {
				if(!this.$selectedRecipe) {
					return done();
				}

				this.$el.classList.add("page-recipes--to-details");

				const $recipe = this.$selectedRecipe;
				$recipe.classList.add("recipe--selected");

				const headerHeight = document.getElementById("header").offsetHeight;
				const recipeTop = $recipe.getBoundingClientRect().top;
				const offset = headerHeight - recipeTop;

				$recipe.style.transform = `translateY(${offset}px)`;

				setTimeout(() => {
					window.scrollTo(0,0);
					done();
				}, 700);
			},

			clickRecipe({recipe, $el}) {
				this.$selectedRecipe = $el;

				this.$router.push( createRecipeURL(recipe) );
			}
		},

		components : {
			RecipeList,
			IconButton,
			Page,
			RecipeListItem,
			PendingRecipeListItem,
			RecipeAddForm
		}
	}
</script>