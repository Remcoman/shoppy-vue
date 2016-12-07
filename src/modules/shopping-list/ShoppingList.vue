<template>
    <div class="page page-shopping-list" :class="{'page--loading' : loading, 'page-shopping-list--editing' : editing}">
        <div class="header header--page page-shopping-list__header">
            <h1 class="header__title page-shopping-list__title">Boodschapjes</h1>

	        <div class="header__btns page-shopping-list__btns">
		        <template v-if="editing">
			        <button class="icon-btn page-shopping-list__clear-btn primary-color" @click="clear">
				        <i class="fa fa-trash"></i>
			        </button>

			        <button class="icon-btn page-shopping-list__ready-btn primary-color" @click="setEditing({value : false})">
				        <i class="fa fa-check"></i>
			        </button>
		        </template>

		        <template v-else>
			        <button class="page-shopping-list__filter-btn icon-btn primary-color" @click="toggleFilter" :class="{'page-shopping-list__filter-btn--filtering' : filterTodo}">
				        <i class="fa fa-filter"></i>
				        <span class="icon-btn page-shopping-list__filter-cancel">
					        <i class="fa fa-times"></i>
				        </span>
			        </button>

			        <button class="icon-btn page-shopping-list__edit-btn primary-color" @click="setEditing({value : true})">
				        <i class="fa fa-pencil"></i>
			        </button>
		        </template>
	        </div>
        </div>

	    <product-list
            v-show="!loading"

            class="page-shopping-list__list"

            :products="products" 
            :editing="editing" 
            :focusId="focusId" 

            @itemNameChanged="itemNameChanged"
            @itemFocusInput="itemFocusInput"
            @itemDone="itemDone"
            @itemRemove="itemRemove"
	        @itemPasteBelow="itemPasteBelow">

            <div slot="empty">Geen boodschapjes :-(</div>
        </product-list>

	    <button class="primary-color-bg page-shopping-list__add-btn" :class="{'page-shopping-list__add-btn--show' : editing}" @click="newDummy">
		    <i class="fa fa-plus"></i>
	    </button>
    </div>
</template>

<script>
	import ProductList from 'components/ProductList'
	import {mapState, mapActions, mapMutations} from 'vuex'
	import {actionTypes, mutationTypes} from './store'

	export default {
	    name : "page-shopping-list",

        created() {
            this.$store.dispatch( actionTypes.SHOPPING_LIST_LOAD );
        },

        destroyed() {
	        this.$store.dispatch( actionTypes.SHOPPING_LIST_UNLOAD );
        },

	    computed : {
            ...mapState({
                loaded(state) {
                    return state.shoppingList.loaded;
                },

                loading(state) {
                    return state.shoppingList.loading;
                },

                products(state) {
                    let products = this.$store.getters.filteredProducts;

                    if(state.shoppingList.dummy) {
                        products = [...products, state.shoppingList.dummy];
                    }

                    return products;
                },

                editing(state) {
                    return state.shoppingList.editing;
                },

                filterTodo(state) {
                    return state.shoppingList.filterTodo;
                },

                focusId(state) {
                    return state.shoppingList.focus;
                }
            })
        },

		methods : {
            ...mapActions({
                'itemNameChanged' : actionTypes.PRODUCTS_CHANGE_NAME,
                'itemDone'        : actionTypes.PRODUCTS_TOGGLE_DONE,
                'itemRemove'      : actionTypes.PRODUCTS_REMOVE,
	            'itemPasteBelow'  : actionTypes.PRODUCTS_PASTE_BELOW
            }),

            ...mapMutations({
                'itemFocusInput' : mutationTypes.PRODUCTS_SET_FOCUS,
                'newDummy'       : mutationTypes.PRODUCTS_NEW_DUMMY,
                'setEditing'     : mutationTypes.PRODUCTS_SET_EDITING,
                'toggleFilter'   : mutationTypes.SHOPPING_LIST_TOGGLE_FILTER
            }),

	        clear() {
                if(confirm("Weet je het zeker dat je alle producten wilt verwijderen?")) {
                    this.$store.dispatch(actionTypes.CLEAR);
                }
	        }
		},

	    components : {
	        ProductList
	    }
	}
</script>

<style lang="scss" rel="stylesheet/scss">
    @import '~style/functions';
    @import '~style/variables';

    .page-shopping-list { 
        
        &__list { 
            min-height:calc(100vh - #{$headerHeight});
            padding:px-rem(10px) px-rem($horizontalMargin) 0 px-rem($horizontalMargin);
        }

        &__filter-btn, &__clear-btn {margin-right:px-rem(15px);}

        &__filter-btn { position:relative;}

        &__filter-cancel { 
            
            position:absolute; 
            right:px-rem(-7px); 
            bottom:px-rem(-5px); 
            font-size:.6em; 
            line-height:1.6em; 
            visibility: hidden;
	        opacity:0;
	        transform:scale(0);
	        transform-origin:5px 5px;
	        transition:transform .3s ease-out, opacity .3s ease-out, visibility 0s .3s;

            .page-shopping-list__filter-btn--filtering & {
	            visibility: visible;
	            transform:none;
	            opacity:1;
	            transition:transform .3s ease-out, opacity .3s ease-out;
            }
        }

        &__add-btn {
            border-radius:50%; 
            font-size:1.7em;
            width:2.3em; 
            height:2.3em; 
            position:fixed; 
            bottom: px-rem(20px); 
            right:px-rem(20px); 
            box-shadow:0 5px 8px rgba(#000, .4);
            visibility:hidden;
            opacity:0;
            transform:scale(.9);
            transition:visibility 0s .4s, transform .4s ease-out, opacity .2s ease-out;
            color:$whiteColor;

            &--show {
                visibility: visible; 
                opacity:1; 
                transform:scale(1);
                transition:transform .3s ease-out, opacity .2s ease-out, background-color .4s ease-out;
            }

        }
    }
</style>
