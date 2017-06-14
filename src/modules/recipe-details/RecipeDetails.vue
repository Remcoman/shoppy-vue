<template src="./RecipeDetails.html"></template>
<style src="./RecipeDetails.scss" lang="scss"></style>

<script>
	import {actionTypes, mutationTypes, imageProcessingState} from './store'; 
	import {mapState, mapActions, mapGetters, mapMutations} from 'vuex';
	import {productsWithDummy} from '@/store/partials/products';
	import {ProductModel} from '@/models'; 

	import IconButton from '@/components/IconButton';
	import EditableImageFrame from '@/components/EditableImageFrame';
	import ProductList from '@/components/ProductList';
	import IngredientListItem from '@/components/ProductTypes/IngredientListItem';
	import ProgressIndicator from '@/components/ProgressIndicator';
	import EditableHeader from '@/components/EditableHeader';
	import QuillPreview from '@/components/QuillPreview';
	import Page from '@/components/Page';

	let richTextEditorPromise;

	const RichTextEditor = () => richTextEditorPromise;

	export default {
		created() {
			const {slug} = this.$route.params;

			richTextEditorPromise = import('@/components/RichTextEditor');

			console.debug(`Editing: ${slug}`);

			this.$store.commit(mutationTypes.RESET);

			this.$store.dispatch(actionTypes.LOAD, {slug})
				.then(obj => {
					if(obj && obj.doc) {
						this.updateDocumentTitle();
					}
				});
		},

		destroyed() {
			this.$store.dispatch(actionTypes.UNLOAD);
		},

		data : () => ({
			uploadProgress : 0,
			show 		   : true,
			animateImage   : true
		}),

		watch : {
			recipe(newValue, oldValue) {
				if(typeof newValue._id !== "undefined") { //ignore init recipe
					if(newValue.slug !== oldValue.slug) {
						this.updateNavigatorLocation();
					}

					if(newValue.name !== oldValue.name) {
						this.updateDocumentTitle();
					}
				}
			}
		},

		methods : {
			...mapMutations({
				'setEditing'     : mutationTypes.SET_EDITING,
				'itemFocusInput' : mutationTypes.PRODUCTS_SET_FOCUS,
				'newDummy'       : mutationTypes.PRODUCTS_NEW_DUMMY,
				'toggleFilter'   : mutationTypes.SHOPPING_LIST_TOGGLE_FILTER
			}),

			...mapActions({
				'itemNameChanged' 		: actionTypes.PRODUCTS_CHANGE_NAME,
				'itemRemove'      		: actionTypes.PRODUCTS_REMOVE,
				'itemPasteBelow'  		: actionTypes.PRODUCTS_PASTE_BELOW,
				'itemDrop'  	  		: actionTypes.PRODUCTS_DROP
			}),

			updateNavigatorLocation() {
				this.$router.replace(`/recept/${this.recipe.slug}`);
			},

			updateDocumentTitle() {
				document.title = `Shoppy - ${this.recipe.name}`;
			},

			addItemToShoppingList({id}) {
				this.$store.dispatch(actionTypes.ADD_INGREDIENTS_TO_SHOPPING_LIST, {ids : [id]});
			},

			addAllToShoppingList() {
				this.$store.dispatch(actionTypes.ADD_INGREDIENTS_TO_SHOPPING_LIST, {ids : "all"});
			},

			handlePreparationChange(delta) {
				this.$store.dispatch(actionTypes.ADD_PREPARATION_CHANGE, {delta});
			},

			setEditing({value}) {
				this.$store.commit(mutationTypes.SET_EDITING, {value});
			},

			changeName(name) {
				console.log(`New name ${name}`);
				this.$store.dispatch(actionTypes.CHANGE_NAME, {name});
			},

			handleImageSelected({blob, placeholderURL}) {
				this.uploadProgress = 0;

				this.$store.dispatch(actionTypes.SET_IMAGE, {
					blob,
					placeholderURL, 
					onProgress : d => this.uploadProgress = d
				});
			},

			remove() {
				if(confirm("Weet je het zeker dat je dit recept wilt verwijderen?")) {
					this.$store.dispatch(actionTypes.REMOVE);
					this.$router.push('/recepten');
				}
			},

			routeEnter({from, to}, done) {
				if(from.path === "/recepten") {
					this.show = false;
					this.animateImage = false;
					this.$el.classList.add('page-recipe-details--from-recipe');
					setTimeout(() => {
						this.$el.classList.remove('page-recipe-details--from-recipe');
						this.show = true;
						done();
					}, 690);
				}
			}
		},

		computed : {

			...mapState({
				uploading 		: state => state.recipeDetails.uploading,
				recipe 			: state => state.recipeDetails.model,
				loading 		: state => state.recipeDetails.loading,
				loaded 			: state => state.recipeDetails.loaded,
				editing 		: state => state.recipeDetails.editing,
				focusId 		: state => state.recipeDetails.ingredients.focus,
				preparation     : state => state.recipeDetails.preparationIn,
				placeholder     : state => state.recipeDetails.placeholder,
				online 			: state => state.online,

				hasNonShoppingListItems({recipeDetails}) {
					const {ingredients, ingredientsInShoppingList} = recipeDetails;
					return ingredients.items.some(({_id}) => !(_id in ingredientsInShoppingList));
				},

				found({recipeDetails}) {
					return recipeDetails.loaded && typeof recipeDetails.model._id !== "undefined";
				},

				notFound({recipeDetails}) {
					return recipeDetails.loaded && typeof recipeDetails.model._id === "undefined";
				},

				imageProcessing({recipeDetails}) {
					const image = recipeDetails.model.image;

					if(!recipeDetails.model.hasImage() || recipeDetails.uploading || !recipeDetails.imageProcessingUUID) {
						return {state : imageProcessingState.NOT_STARTED, error : null};
					}

					//assume not ready	
					if(image.state.uuid !== recipeDetails.imageProcessingUUID) {
						return {state : imageProcessingState.STARTED, error : null};
					}

					if(image.state.code === "success") {
						return {state : imageProcessingState.SUCCESS, error : null};
					}
					else {
						return {state : imageProcessingState.FAIL, error : new Error(image.state.reason)};
					}
				},

				resolvedImages({recipeDetails}) {
					return recipeDetails.uploading ? [] : recipeDetails.model.resolvedImages();
				},

				ingredients({recipeDetails}) {
					return productsWithDummy(recipeDetails.ingredients).map(item => {
						if(item._id in recipeDetails.ingredientsInShoppingList) {
							return new ProductModel({...item, addedToShoppingList : true});
						}
						return item;
					});
				},

				hasPreparation({recipeDetails}) {
					return recipeDetails.model.hasPreparation();
				}
			}),

			imageProcessingStarted() {
				return this.imageProcessing.state === imageProcessingState.STARTED;
			},

			imageProcessingError() {
				return this.imageProcessing.error;
			}
		},

		components : {
			EditableImageFrame,
			IconButton,
			ProductList,
			RichTextEditor,
			ProgressIndicator,
			EditableHeader,
			IngredientListItem,
			QuillPreview,
			Page
		}
	}
</script>