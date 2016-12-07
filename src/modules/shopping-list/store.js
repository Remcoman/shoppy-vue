import * as productsStore from '../../store/products';
import {mutationTypes as appMutationTypes} from '../../store/app';
import {ProductModel} from '../../models';

const ERROR_LOAD_FAILED = new Error("Er ging iets mis bij het laden van de producten");

export const mutationTypes = {
    SHOPPING_LIST_TOGGLE_FILTER  	  : "shopping-list/TOGGLE_FILTER",
	SHOPPING_LIST_LOAD_START 		  : "shopping-list/LOAD_START",
	SHOPPING_LIST_LOAD_SUCCESS 		  : "shopping-list/LOAD_SUCCESS",

	PRODUCTS_SET_FOCUS 			  	  : "shopping-list/SET_FOCUS",
	PRODUCTS_SET_EDITING 	      	  : "shopping-list/SET_EDITING",
	PRODUCTS_NEW_DUMMY 			  	  : "shopping-list/NEW_DUMMY",
	PRODUCTS_REMOVE_DUMMY 		  	  : "shopping-list/REMOVE_DUMMY",
	PRODUCTS_REMOVE_SUCCESS 	  	  : "shopping-list/REMOVE_SUCCESS",
	PRODUCTS_ADD_OR_UPDATE_SUCCESS 	  : "shopping-list/ADD_OR_UPDATE_SUCCESS",
	PRODUCTS_SET_ITEMS		  		  : "shopping-list/SET_PRODUCTS"
};

export const actionTypes = {
    SHOPPING_LIST_LOAD 	 : "shopping-list/LOAD",
	SHOPPING_LIST_UNLOAD : "shopping-list/UNLOAD",

	PRODUCTS_ADD 		 : "shopping-list/ADD",
	PRODUCTS_CHANGE_NAME : "shopping-list/CHANGE_NAME",
	PRODUCTS_CLEAR 		 : "shopping-list/CLEAR",
	PRODUCTS_REMOVE 	 : "shopping-list/REMOVE",
	PRODUCTS_UPDATE 	 : "shopping-list/UPDATE",
	PRODUCTS_PASTE_BELOW : "shopping-list/PASTE_BELOW",
	PRODUCTS_TOGGLE_DONE : "shopping-list/TOGGLE_DONE"
};

const createState = () => {
	return {
		...productsStore.createState(),
        
        filterTodo : false,
		loaded	   : false,
		loading	   : false
    }
};

const createActions = ({dbService}) => {
	const db 	 = dbService.db("shoppy-products");
	const dbView = db.view("shopping-list");

	let changesSubscription,
		syncer;

    return {
		...productsStore.createActions(
			db, 
			actionTypes, 
			mutationTypes, 
			
			(state, {names, originRecipeID}) => {
				let opts = {
					isInShoppingList : true
				};
				if(originRecipeID) {
					opts.originRecipeID = originRecipeID;
				}
				const products = names.map(name => new ProductModel({name, ...opts}));

				return {products, idPrefix : null};
			}
		),

		[actionTypes.SHOPPING_LIST_UNLOAD] () {
			if(changesSubscription) {
				changesSubscription.stop();
				changesSubscription = null;
			}

			if(syncer) {
				syncer.stop();
				syncer = null;
			}
		},

		async [actionTypes.SHOPPING_LIST_LOAD] ({commit}) {

			commit(mutationTypes.SHOPPING_LIST_LOAD_START);

			let docs;

            try {
                docs = await dbView.load();
            }
            catch(e) {
                if(e.status !== 404) {
                    commit(appMutationTypes.SET_ERROR, ERROR_LOAD_FAILED);
                    return;
                }
                
                docs = [];
            }

			commit(mutationTypes.SHOPPING_LIST_LOAD_SUCCESS);
			commit(mutationTypes.PRODUCTS_SET_ITEMS, {docs});

			changesSubscription = dbView.observeChanges()
				.on('change', ({doc}) => {
					if(doc._deleted) {
						commit( mutationTypes.PRODUCTS_REMOVE_SUCCESS, {doc} );
					}
					else {
						commit( mutationTypes.PRODUCTS_ADD_OR_UPDATE_SUCCESS, {doc} );
					}
				})
				.on('error', () => {
					console.warn("noo");
				});

			syncer = db.sync();
		}
    }
};

const createMutations = () => {
    return {
		...productsStore.createMutations(mutationTypes),

		[mutationTypes.SHOPPING_LIST_LOAD_START] (state) {
			state.loading = true;
			state.loaded  = false;
			state.items   = [];
		},

    	[mutationTypes.SHOPPING_LIST_LOAD_SUCCESS] (state) {
			state.loading = false;
			state.loaded  = true;
		},

		[mutationTypes.SHOPPING_LIST_TOGGLE_FILTER] (state) {
			state.filterTodo = !state.filterTodo;
		}
    }
}

export default (ctx) => {
    return {
        state 	  : createState(ctx),
        mutations : createMutations(ctx),
        actions   : createActions(ctx),

		getters : {
			filteredProducts(state) {
				if(state.filterTodo) {
					return state.items.filter(item => !item.done);
				}
				else {
					return state.items;
				}
			}
		}
    }
}

