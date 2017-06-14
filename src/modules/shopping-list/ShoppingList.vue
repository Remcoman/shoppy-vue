<template src="./ShoppingList.html"></template>
<style src="./ShoppingList.scss" lang="scss"></style>

<script>
	import ProductList from '@/components/ProductList'
	import ShoppingListItem from '@/components/ProductTypes/ShoppingListItem'
	import IconButton from '@/components/IconButton'
	import Page from '@/components/Page';

	import {mapState, mapActions, mapGetters, mapMutations} from 'vuex'
	import {actionTypes, mutationTypes} from './store'

	export default {
		name : "page-shopping-list",

		created() {
			this.$store.commit( mutationTypes.RESET );

			this.$store.dispatch( actionTypes.LOAD );
		},

		destroyed() {
			this.$store.dispatch( actionTypes.UNLOAD );
		},

		computed : {
			...mapGetters([
				'shoppingListProducts'
			]),
			
			...mapState({
				loaded 	   : state => state.shoppingList.loaded,
				loading    : state => state.shoppingList.loading,
				editing    : state => state.shoppingList.editing,
				filterTodo : state => state.shoppingList.filterTodo,
				focusId    : state => state.shoppingList.focus
			})
		},

		methods : {
			...mapActions({
				'itemDone'        : actionTypes.PRODUCTS_TOGGLE_DONE,
				'itemRemove'      : actionTypes.PRODUCTS_REMOVE,
				'itemPasteBelow'  : actionTypes.PRODUCTS_PASTE_BELOW,
				'itemDrop'  	  : actionTypes.PRODUCTS_DROP
			}),

			...mapMutations({
				'itemFocusInput' : mutationTypes.PRODUCTS_SET_FOCUS,
				'newDummy'       : mutationTypes.PRODUCTS_NEW_DUMMY,
				'setEditing'     : mutationTypes.PRODUCTS_SET_EDITING,
				'toggleFilter'   : mutationTypes.TOGGLE_FILTER
			}),

			itemNameChanged({id, name, blur}) {
				const doc = {id, name};
				
				this.$store.dispatch(actionTypes.PRODUCTS_CHANGE_NAME, doc);
				
				if(!blur) {
					this.$store.commit(mutationTypes.PRODUCTS_NEW_DUMMY);
				}
			},

			clear() {
				if(confirm("Weet je het zeker dat je alle producten wilt verwijderen?")) {
					this.$store.dispatch(actionTypes.PRODUCTS_CLEAR);
				}
			}
		},

		components : {
			ProductList,
			ShoppingListItem,
			IconButton,
			Page
		}
	}
</script>
