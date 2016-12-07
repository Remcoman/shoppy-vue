import {RecipeModel, ProductModel} from '../../models'; 
import * as productsStore from '../../store/products';
import config from 'config';

import {mutationTypes as appMutationTypes} from '../../store/app';

const pouchCollate = require('pouchdb-collate');

const ERROR_LOAD_FAILED = new Error("Er ging iets mis bij het laden van het recept");
const ERROR_LOAD_PRODUCTS_FAILED = new Error("Er ging iets mis bij het laden van de ingredienten");

export const mutationTypes = {
	RECIPE_DETAILS_SET  			  : "recipe-details/SET",
	RECIPE_DETAILS_LOAD_START  		  : "recipe-details/LOAD_START",
	RECIPE_DETAILS_LOAD_DONE  		  : "recipe-details/LOAD_DONE",
	RECIPE_DETAILS_SET_EDITING 		  : "recipe-details/SET_EDITING",

	PRODUCTS_SET_FOCUS 			  	  : "recipe-details/SET_FOCUS",
	PRODUCTS_SET_EDITING 	      	  : "recipe-details/SET_EDITING",
	PRODUCTS_NEW_DUMMY 			  	  : "recipe-details/NEW_DUMMY",
	PRODUCTS_REMOVE_DUMMY 		  	  : "recipe-details/REMOVE_DUMMY",
	PRODUCTS_REMOVE_SUCCESS 	  	  : "recipe-details/REMOVE_SUCCESS",
	PRODUCTS_ADD_OR_UPDATE_SUCCESS 	  : "recipe-details/ADD_OR_UPDATE_SUCCESS",
	PRODUCTS_SET_ITEMS		  		  : "recipe-details/SET_PRODUCTS"
};

export const actionTypes = {
	RECIPE_DETAILS_LOAD          : "recipe-details/LOAD",
	RECIPE_DETAILS_UNLOAD        : "recipe-details/UNLOAD",
	RECIPE_DETAILS_REMOVE        : "recipe-details/REMOVE",
	RECIPE_DETAILS_PRODUCTS_LOAD : "recipe-details/LOAD_PRODUCTS",
	RECIPE_DETAILS_RECIPE_LOAD   : "recipe-details/LOAD_RECIPE",
	RECIPE_DETAILS_CHANGE_NAME   : "recipe-details/CHANGE_NAME",
	RECIPE_DETAILS_SET_IMAGE     : "recipe-details/RECIPE_DETAILS_SET_IMAGE",

	PRODUCTS_ADD 		 		 : "recipe-details/PRODUCTS_ADD",
	PRODUCTS_CHANGE_NAME 		 : "recipe-details/PRODUCTS_CHANGE_NAME",
	PRODUCTS_CLEAR 		 		 : "recipe-details/PRODUCTS_CLEAR",
	PRODUCTS_REMOVE 	 		 : "recipe-details/PRODUCTS_REMOVE",
	PRODUCTS_UPDATE 	 		 : "recipe-details/PRODUCTS_UPDATE",
	PRODUCTS_PASTE_BELOW 		 : "recipe-details/PRODUCTS_PASTE_BELOW",
	PRODUCTS_TOGGLE_DONE 		 : "recipe-details/PRODUCTS_TOGGLE_DONE"
};

const createState = () => ({
	model : new RecipeModel(),

	loaded : false,
	loading : false,
	editing : false,
	
	ingredients : productsStore.createState()
});

const createMutations = () => ({
	...productsStore.createMutations(mutationTypes, state => state.ingredients),

	[mutationTypes.RECIPE_DETAILS_SET] (state, {doc}) {
		state.model = new RecipeModel(doc);
	},

	[mutationTypes.RECIPE_DETAILS_LOAD_START] (state) {
		state.loading = true;
		state.loaded  = false;
	},

	[mutationTypes.RECIPE_DETAILS_LOAD_DONE] (state) {
		state.loading = false;
		state.loaded  = true;
	},

	[mutationTypes.RECIPE_DETAILS_SET_EDITING] (state, {value}) {
		state.ingredients.editing = state.editing = value;
	}
});

const createActions = (ctx) => {
	const {dbService} = ctx;

	const recipesDb = dbService.db("shoppy-recipes"),
		  recipesBySlugView = recipesDb.view("recipes-by-slug"); //recipes indexed by slug

	const productsDb = dbService.db("shoppy-products");

	let detailsChangesSubscription, productsChangesSubscription;
	let productsSyncer, recipeSyncer;
	let productsFilter;

	function observeDbChanges(db, filterOpts, onAddOrUpdate, onDelete) {
		return db.observeChanges(filterOpts)
			.on('change', ({doc}) => {
				doc._deleted ? onDelete(doc) : onAddOrUpdate(doc);
			})
			.on('error', (e) => {
				if(e.status !== 404) {
					console.warn(e);
				}
			});
	}

	return {
		...productsStore.createActions(
			productsDb, 
			actionTypes,
			mutationTypes,
			
			({state, rootState}, {names}) => {
				const recipeID = rootState.model.id, products = names.map(name => new ProductModel({name, recipeID}));
				return {products, idPrefix : "recipe/" + rootState.model.slug};
			},

			state => state.ingredients
		),

		[actionTypes.RECIPE_DETAILS_SET_IMAGE] ({commit, state}, {blob}) {
			return new Promise((resolve, reject) => {
				const payload = new FormData();
				payload.append("file", blob);
				payload.append("recipeID", state.model.id);

				const xhr = new XMLHttpRequest();
				xhr.open("POST", config.uploadEndPoint);
				xhr.onreadystatechange = e => {
					if(xhr.status !== 200) {
						reject();
					}
					resolve();
				};
				xhr.send(payload);
			});
		},

		[actionTypes.RECIPE_DETAILS_UNLOAD] () {
			if(detailsChangesSubscription) {
				detailsChangesSubscription.stop();
				detailsChangesSubscription = null;
			}

			if(productsChangesSubscription) {
				productsChangesSubscription.stop();
				productsChangesSubscription = null;
			}

			if(recipeSyncer) {
				recipeSyncer.stop();
				recipeSyncer = null;
			}

			if(productsSyncer) {
				productsSyncer.stop();
				productsSyncer = null;
			}
		},

		async [actionTypes.RECIPE_DETAILS_CHANGE_NAME] ({state}, {name}) {
			return recipesDb.update( {...state.model, name} );
		},

		async [actionTypes.RECIPE_DETAILS_REMOVE] ({state}) {
			return recipesDb.remove(state.model);
		},

		/**
		 * Load the products for the recipe
		 */
		async [actionTypes.RECIPE_DETAILS_PRODUCTS_LOAD] ({state, commit}) {
			let docs = [];
			try {
				docs = await productsDb.load(productsFilter);
			}
			catch(e) {
				if(e.status !== 404) {
					throw ERROR_LOAD_PRODUCTS_FAILED;
				}
			}

			return docs;
		},

		/**
		 * Load the recipe details doc
		 */
		async [actionTypes.RECIPE_DETAILS_RECIPE_LOAD] ({commit}, {slug}) {
			let recipeDetailsDoc = null;
			try {
				let recipes = await recipesBySlugView.load({key : slug});
				recipeDetailsDoc = recipes[0];
			}
			catch(e) {
				if(e.status !== 404) {
					throw ERROR_LOAD_FAILED;
				}
			}

			return recipeDetailsDoc;
		},

		async [actionTypes.RECIPE_DETAILS_LOAD] ({dispatch, commit}, {slug}) {

			productsFilter = {
				startkey : pouchCollate.toIndexableString(["recipe/" + slug]),
				endkey   : pouchCollate.toIndexableString(["recipe/" + slug, "\u9999"])
			}; 

			commit(mutationTypes.RECIPE_DETAILS_LOAD_START);

			//load the recipe info
			let recipeDoc;
			try {
				recipeDoc = await dispatch(actionTypes.RECIPE_DETAILS_RECIPE_LOAD, {slug});
			}
			catch(e) {
				commit(appMutationTypes.SET_ERROR, e);
				commit(mutationTypes.RECIPE_DETAILS_LOAD_DONE);
				return;
			}

			//nothing found
			if(!recipeDoc) {
				commit(mutationTypes.RECIPE_DETAILS_LOAD_DONE);
				return;
			}

			commit(mutationTypes.RECIPE_DETAILS_SET, {doc : recipeDoc});

			//when its the first time to sync we will try to replicate from remote. 
			//This makes sure that we don't display the "geen ingredienten" text.
			const info = await productsDb.localDb.info();
			if(info.update_seq === 0) {
				console.debug("First time sync....");
				await productsDb.replicateFrom({timeout : 500});
			}

			//load the recipe products from the local db
			let productDocs;
			try {
				productDocs = await dispatch(actionTypes.RECIPE_DETAILS_PRODUCTS_LOAD);
			}
			catch(e) {
				commit(appMutationTypes.SET_ERROR, e);
				commit(mutationTypes.RECIPE_DETAILS_LOAD_DONE);
				return;
			}

			commit(mutationTypes.PRODUCTS_SET_ITEMS, {docs : productDocs});

			//observe changes for products from local db
			const recipeID = recipeDoc._id;
			productsChangesSubscription = observeDbChanges(productsDb, {
					filter : (doc) => !doc.isInShoppingList && doc.recipeID === recipeID
				},
				doc => commit( mutationTypes.PRODUCTS_ADD_OR_UPDATE_SUCCESS, {doc} ),
				doc => commit( mutationTypes.PRODUCTS_REMOVE_SUCCESS, {doc} )
			);

			//observe changes for recipe from local db
			detailsChangesSubscription = observeDbChanges(recipesDb, {doc_ids : [recipeDoc._id]},
				doc => commit( mutationTypes.RECIPE_DETAILS_SET, {doc} ),
				() => {}
			);

			//start live syncing of the recipe info
			recipeSyncer = recipesDb.sync({doc_ids : [recipeDoc._id]});

			//start live syncing the products for the recipe
			productsSyncer = productsDb.sync({filter : "filter-by-recipe", query_params : {recipeID}});

			commit(mutationTypes.RECIPE_DETAILS_LOAD_DONE);
			
			return recipeDoc;
		}
	}
};

const createGetters = () => ({
	found(state) {
		return state.loaded && typeof state.model._id !== "undefined";
	},

	notFound(state) {
		return state.loaded && typeof state.model._id === "undefined";
	},

	...productsStore.createGetters(state => state.ingredients)
});

export default (ctx) => {
	return {
		state 	  : createState(ctx),
		mutations : createMutations(ctx),
		actions   : createActions(ctx),
		getters   : createGetters()
	}
}
