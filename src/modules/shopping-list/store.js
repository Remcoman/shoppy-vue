import * as productPartials from '@/store/partials/products';
import {mutationTypes as appMutationTypes} from '@/modules/app/store';
import {ProductModel} from '@/models';
import Vue from 'vue';
import {insertOrder} from '@/services/db/ordering';

const ERROR_LOAD_FAILED = new Error("Er ging iets mis bij het laden van de producten");

export const mutationTypes = {
	RESET							  : "shopping-list/RESET",

	TOGGLE_FILTER  	  				  : "shopping-list/TOGGLE_FILTER",
	LOAD_START 		  				  : "shopping-list/LOAD_START",
	LOAD_SUCCESS 		  			  : "shopping-list/LOAD_SUCCESS",
	SET_RECIPE_ORIGINS  			  : "shopping-list/SET_RECIPE_ORIGINS",
	UPDATE_RECIPE_ORIGIN			  : "shopping-list/UPDATE_RECIPE_ORIGIN",

	PRODUCTS_SET_FOCUS 			  	  : "shopping-list/SET_FOCUS",
	PRODUCTS_SET_EDITING 	      	  : "shopping-list/SET_EDITING",
	PRODUCTS_NEW_DUMMY 			  	  : "shopping-list/NEW_DUMMY",
	PRODUCTS_REMOVE_DUMMY 		  	  : "shopping-list/REMOVE_DUMMY",
	PRODUCTS_REMOVE_SUCCESS 	  	  : "shopping-list/REMOVE_SUCCESS",
	PRODUCTS_ADD_OR_UPDATE_SUCCESS 	  : "shopping-list/ADD_OR_UPDATE_SUCCESS",
	PRODUCTS_SET_ITEMS		  		  : "shopping-list/SET_PRODUCTS"
};

export const actionTypes = {
	LOAD 	 			 : "shopping-list/LOAD",
	UNLOAD 				 : "shopping-list/UNLOAD",
	ADD_INGREDIENTS 	 : "shopping-list/ADD_INGREDIENTS",

	PRODUCTS_ADD 		 : "shopping-list/ADD",
	PRODUCTS_CHANGE_NAME : "shopping-list/CHANGE_NAME",
	PRODUCTS_CLEAR 		 : "shopping-list/CLEAR",
	PRODUCTS_REMOVE 	 : "shopping-list/REMOVE",
	PRODUCTS_UPDATE 	 : "shopping-list/UPDATE",
	PRODUCTS_PASTE_BELOW : "shopping-list/PASTE_BELOW",
	PRODUCTS_TOGGLE_DONE : "shopping-list/TOGGLE_DONE",
	PRODUCTS_DROP 		 : "shopping-list/PRODUCTS_DROP"
};

const extractProducts = docs => docs.filter(doc => doc.type === "product");
const extractRecipes  = docs => docs.filter(doc => doc.type === "recipe");

const createState = () => {
	return {
		...productPartials.createState(),

		recipeOrigins : {},
		
		filterTodo : false,
		loaded	   : false,
		loading	   : false
	}
};

const createActions = ({dbService}) => {
	const db 	 = dbService.db("shoppy");
	const dbView = db.view("products/shopping-list");

	let changesSubscription, syncer;

	return {
		...productPartials.createActions({
			db, 
			actionTypes, 
			mutationTypes, 
			
			productFactory : (state, products) => {
				return products.map(({name,id}) => new ProductModel({name, id, shoppingList : true}));
			}
		}),

		[actionTypes.UNLOAD] () {
			if(changesSubscription) {
				changesSubscription.stop();
				changesSubscription = null;
			}

			if(syncer) {
				syncer.stop();
				syncer = null;
			}
		},

		/**
		 * Adds the given recipe ingredient docs to the shopping list.
		 */
		async [actionTypes.ADD_INGREDIENTS] ({state, commit}, {docs}) {
			let afterId = state.items.length ? state.items[state.items.length-1]._id : null;
			let startOrder = insertOrder(state.items, afterId, null);
			
			return db.add( docs, {startOrder} );
		},

		async [actionTypes.LOAD] ({commit}) {

			commit(mutationTypes.LOAD_START);

			const {replicated, doc} = await db.ensureDesignDoc("products");
			if(!replicated) {
				db.localDb.replicate.from(db.remoteDb, {key : "_design/products"});
			}

			let productDocs;

			try {
				productDocs = await dbView.load();
			}
			catch(e) {
				if(e.status !== 404) {
					commit(appMutationTypes.SET_ERROR, ERROR_LOAD_FAILED);
					return;
				}
				
				productDocs = [];
			}

			commit(mutationTypes.LOAD_SUCCESS);

			commit(mutationTypes.SET_RECIPE_ORIGINS, {docs : extractRecipes(productDocs)});
			commit(mutationTypes.PRODUCTS_SET_ITEMS, {docs : extractProducts(productDocs)});

			changesSubscription = dbView.observeChanges()
				.on('change', ({doc}) => {
					console.log("got change", doc);

					if(doc.type === "recipe") {
						commit( mutationTypes.UPDATE_RECIPE_ORIGIN, {recipeDoc : doc} );
						return;
					}
					else {
						if(doc._deleted) {
							commit( mutationTypes.PRODUCTS_REMOVE_SUCCESS, {doc} );
						}
						else {
							commit( mutationTypes.PRODUCTS_ADD_OR_UPDATE_SUCCESS, {doc} );
						}
					}
				})
				.on('error', e => {
					console.warn(e);
				});

			syncer = dbView.sync();
		}
	}
};

const createMutations = () => {
	return {
		...productPartials.createMutations({mutationTypes}),

		[mutationTypes.RESET] (state) {
			Object.assign(state, createState());
		},

		[mutationTypes.SET_RECIPE_ORIGINS] (state, {docs}) {
			state.recipeOrigins = docs.reduce((obj, doc) => {
				obj[doc._id] = doc;
				return obj;
			}, {});
		},

		[mutationTypes.UPDATE_RECIPE_ORIGIN] (state, {recipeDoc}) {
			if(recipeDoc._deleted) {
				Vue.delete(state.recipeOrigins, recipeDoc._id);
			}
			else {
				Vue.set(state.recipeOrigins, recipeDoc._id, recipeDoc);
			}
		},

		[mutationTypes.LOAD_START] (state) {
			state.loading = true;
			state.loaded  = false;
			state.items   = [];
		},

		[mutationTypes.LOAD_SUCCESS] (state) {
			state.loading = false;
			state.loaded  = true;
		},

		[mutationTypes.TOGGLE_FILTER] (state) {
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
			shoppingListProducts(state) {
				let items = productPartials.productsWithDummy(state).map(item => {
					if(item.origin && item.origin.recipeID in state.recipeOrigins) {
						const {name, slug} = state.recipeOrigins[item.origin.recipeID];
						return new ProductModel({...item, recipe : {name, slug}}); //<-- TODO this can be optimized
					}
					return item;
				});

				return state.filterTodo
					? items.filter(item => !item.done)
					: items;
			}
		}
	}
}

