import {RecipeModel, ProductModel} from '@/models'; 
import {canvasToBlob} from '@/utils/images';
import config from 'config';
import {mutationTypes as appMutationTypes} from '@/modules/app/store';
import {actionTypes as shoppingListActionTypes} from '@/modules/shopping-list/store';
import {mutationTypes} from './mutations';
import * as productPartials from '@/store/partials/products';
import collabClient from '@/services/preparationCollabClient';
import Delta from 'quill-delta';

const ERROR_LOAD_FAILED 		 = new Error("Er ging iets mis bij het laden van het recept");
const ERROR_LOAD_PRODUCTS_FAILED = new Error("Er ging iets mis bij het laden van de ingredienten");
const ERROR_UPLOAD_FAILED 		 = new Error("Er ging iets mis bij het uploaden van de afbeelding");

export const actionTypes = {
	LOAD          						: "recipe-details/LOAD",
	UNLOAD        						: "recipe-details/UNLOAD",
	REMOVE        						: "recipe-details/REMOVE",
	PRODUCTS_LOAD 						: "recipe-details/LOAD_PRODUCTS",
	RECIPE_LOAD   						: "recipe-details/LOAD_RECIPE",
	CHANGE_NAME   						: "recipe-details/CHANGE_NAME",
	SET_IMAGE     						: "recipe-details/SET_IMAGE",
	ADD_INGREDIENTS_TO_SHOPPING_LIST 	: "recipe-details/ADD_INGREDIENTS_TO_SHOPPING_LIST",
	START_SYNC 							: "recipe-details/START_SYNC",
	START_PREPARATION_COLLAB			: "recipe-details/START_PREPARATION_COLLAB",
	ADD_PREPARATION_CHANGE				: "recipe-details/ADD_PREPARATION_CHANGE",

	PRODUCTS_ADD 		 		 		: "recipe-details/PRODUCTS_ADD",
	PRODUCTS_CHANGE_NAME 		 		: "recipe-details/PRODUCTS_CHANGE_NAME",
	PRODUCTS_CLEAR 		 		 		: "recipe-details/PRODUCTS_CLEAR",
	PRODUCTS_REMOVE 	 		 		: "recipe-details/PRODUCTS_REMOVE",
	PRODUCTS_UPDATE 	 		 		: "recipe-details/PRODUCTS_UPDATE",
	PRODUCTS_PASTE_BELOW 		 		: "recipe-details/PRODUCTS_PASTE_BELOW",
	PRODUCTS_TOGGLE_DONE 		 		: "recipe-details/PRODUCTS_TOGGLE_DONE",
	PRODUCTS_DROP 		 		 		: "recipe-details/PRODUCTS_DROP"
};

const extractIngredients 	   = docs => docs.filter(doc => doc.type === "product" && doc.recipeID);
const extractShoppingListItems = docs => docs.filter(doc => doc.type === "product" && doc.shoppingList);

export function createActions(ctx) {
	const {dbService} = ctx;

	const db   = dbService.db("shoppy"),
		  view = db.view('recipe-details');

	let changesSubscription, syncer, productsFilter, collabClientInstance;

	return {

		/**
		* Inherit the actions from the product store
		*/
		...productPartials.createActions({
			db, 
			actionTypes,
			mutationTypes,
			
			productFactory : ({state, rootState}, products) => {
				const recipeID = rootState.model.id;
				return products.map(({id, name}) => new ProductModel({name, id, recipeID}));
			},

			stateSelector : state => state.ingredients
		}),

		/**
		* Adds the ingredient with the given id to the shopping list
		*/
		[actionTypes.ADD_INGREDIENTS_TO_SHOPPING_LIST] ({dispatch, state}, {ids}) {
			const ingredientsById = state.ingredients.items.reduce((obj, item) => {
				obj[item._id] = item;
				return obj;
			}, {});

			if(ids === "all") {
				ids = Object.keys(ingredientsById);
			}

			const docs = ids.map(id => {
				const ingredientItem = ingredientsById[id];

				return Object.assign(ingredientItem.copy(), {
					_id : "shoppingList_" + ingredientItem._id, 

					recipeID : null, 
					shoppingList : true,

					origin : {
						recipeID 	 : ingredientItem.recipeID,
						ingredientID : ingredientItem._id
					}
				}).toJSON();
			});

			dispatch(shoppingListActionTypes.ADD_INGREDIENTS, {docs});
		},

		/**
		* Uploads the image to the remote service
		*/
		async [actionTypes.SET_IMAGE] ({commit, state}, {blob, placeholderURL, onProgress}) {
			//set an thumbnail which is shown before the upload ends
			commit(mutationTypes.SET_UPLOAD_START, {placeholderURL});

			//setup the payload
			const payload = new FormData();
			payload.append("file", blob);
			payload.append("recipeID", state.model.id);

			const xhr = new XMLHttpRequest();
			xhr.open("POST", config.uploadEndPoint + "/recipe");
			xhr.upload.onprogress = e => {
				if(e.lengthComputable) {
					onProgress(e.loaded / e.total);
				}
			}
			xhr.onreadystatechange = e => {
				if(xhr.readyState !== xhr.DONE) {
					return;
				}

				//fail!
				if(xhr.status !== 200) {
					commit(mutationTypes.SET_UPLOAD_ERROR);
					commit(appMutationTypes.SET_ERROR, ERROR_UPLOAD_FAILED);
					return;
				}

				const {uuid} = JSON.parse(xhr.responseText);

				console.log('debug:got_uuid', uuid);

				commit(mutationTypes.SET_UPLOAD_DONE, {uuid});
			};
			xhr.send(payload);
		},

		/**
		* Updates the name for the recipe
		* This should also update the slug in the url
		*/
		[actionTypes.CHANGE_NAME] ({state}, {name}) {
			const slug = RecipeModel.generateSlug(name);
			return db.update( {...state.model.toJSON(), name, slug} );
		},

		/**
		* Remove the recipe
		*/
		async [actionTypes.REMOVE] ({state}) {
			//also remove all the ingredients
			let docs = state.ingredients.items.map(item => item.toJSON());

			return db.remove([...docs, state.model.toJSON()]);
		},

		/**
		 * Load the products for the recipe
		 */
		async [actionTypes.PRODUCTS_LOAD] ({state, commit}) {
			let docs = [];
			try {
				docs = await view.load(productsFilter);
			}
			catch(e) {
				if(e.status !== 404) {
					throw ERROR_LOAD_PRODUCTS_FAILED;
				}
			}

			return docs;
		},

		/**
		 * Load the recipe details doc for the given slug 
		 */
		async [actionTypes.RECIPE_LOAD] ({commit}, {slug}) {
			let doc = null, placeholderBlob = null;

			console.log('load recipe');

			try {
				let recipes = await view.load({key : ["recipe", slug], attachments : true});

				if(recipes.length) {
					doc = recipes[0];
					placeholderBlob = await db.localDb.getAttachment(doc._id, "placeholder");
				}				
			}
			catch(e) {
				console.log(e);
				if(e.status !== 404) {
					throw ERROR_LOAD_FAILED;
				}
			}

			return {doc, placeholderBlob}
		},

		/**
		 * Adds a preparation change for the current recipe.
		 * The change should be a quill-delta
		 */
		[actionTypes.ADD_PREPARATION_CHANGE] ({state, commit}, {delta}) {
			commit(mutationTypes.OUTGOING_PREPARATION_CHANGE, {delta});
			
			collabClientInstance.addChange(delta);
		},

		/**
		 * Start the preparation collaboration 
		 */
		async [actionTypes.START_PREPARATION_COLLAB] ({state, commit}, {recipeID}) {
			collabClientInstance = collabClient({
			 	 host : config.collabEndPoint,
			 	 recipeID,
				 dbService
		  	});

			//expose collab instance for debugging
			if(process.env.NODE_ENV === "development") {
				window.collab = collabClientInstance;
			}

			//load cached changes  
			await collabClientInstance.load(state.model.preparation);

			//merge cached changes with latest local preparation
			let delta = collabClientInstance.delta();

			commit(mutationTypes.INCOMING_PREPARATION_CHANGE, {delta, isComposed : true});

			collabClientInstance.on('snapshot', delta => {
				commit(mutationTypes.INCOMING_PREPARATION_CHANGE, {delta, isComposed : true});
			});

			collabClientInstance.on('change', delta => {
				commit(mutationTypes.INCOMING_PREPARATION_CHANGE, {delta, isComposed : false});
			});
		},

		/**
		* Start the sync process for the given recipe
		*/
		[actionTypes.START_SYNC] ({commit}, {recipeID}) {
			
			changesSubscription = view.observeChanges({
				filter : doc => {
					if(doc.type === "product") {
						if(doc.shoppingList) {
							return doc.origin.recipeID === recipeID;
						}
						else {
							return doc.recipeID === recipeID;
						}
					}
					else if(doc.type === "recipe") {
						return doc._id === recipeID;
					}

					return false;
				},

				attachments : true
			});

			changesSubscription.on('change', ({doc}) => {
				if(doc.type === "product") { //ingredients
					if(doc.shoppingList) {
						commit( mutationTypes.UPDATE_SHOPPING_LIST, {shoppingListDoc : doc} );
					}
					else if(doc._deleted) {
						commit( mutationTypes.PRODUCTS_REMOVE_SUCCESS, {doc} );
					}
					else {
						commit( mutationTypes.PRODUCTS_ADD_OR_UPDATE_SUCCESS, {doc} );
					}	
				}
				else { //recipe
					console.log('load attachment');

					db.localDb.getAttachment(doc._id, "placeholder")
						.then(placeholderBlob => commit( mutationTypes.SET, {doc, placeholderBlob} ))
						.catch(e => commit( mutationTypes.SET, {doc, placeholderBlob : null} ));
				}
			});

			//start live syncing the docs which passed 
			syncer = view.sync();
		},

		/**
		* Unsubscribes for the change subscriptions and cancels the sync
		*/
		[actionTypes.UNLOAD] ({commit}) {
			if(changesSubscription) {
				changesSubscription.stop();
				changesSubscription = null;
			}

			if(syncer) {
				syncer.stop();
				syncer = null;
			}

			if(collabClientInstance) {
				collabClientInstance.stop();
				collabClientInstance = null;
			}

			commit(mutationTypes.SET_EDITING, {value : false});
		},

		/**
		* Load the recipe details and ingredients for the given slug	
		*/
		async [actionTypes.LOAD] ({dispatch, commit}, {slug}) {

			commit(mutationTypes.LOAD_START);

			const {replicated, doc} = await db.ensureDesignDoc("recipe-details");
			if(!replicated) {
				db.localDb.replicate.from(db.remoteDb, {key : "_design/recipe-details"});
			}

			//load the recipe info
			let recipe = {doc : null, placeholder : null};
			try {
				recipe = await dispatch(actionTypes.RECIPE_LOAD, {slug});
			}
			catch(e) {
				commit(appMutationTypes.SET_ERROR, e);
				commit(mutationTypes.LOAD_DONE);
				return;
			}

			//nothing found
			if(!recipe.doc) {
				commit(mutationTypes.LOAD_DONE);
				return;
			}

			commit(mutationTypes.SET, recipe);

			const recipeID = recipe.doc._id;

			productsFilter = {
				startkey : ["ingredient", recipeID, "\u0001"],
				endkey   : ["ingredient", recipeID, "\u9999"]
			}; 

			//load the recipe products from the local db
			let productDocs;
			try {
				productDocs = await dispatch(actionTypes.PRODUCTS_LOAD);
			}
			catch(e) {
				commit(appMutationTypes.SET_ERROR, e);
				commit(mutationTypes.LOAD_DONE);
				return;
			}

			commit(mutationTypes.SET_SHOPPING_LIST, {docs : extractShoppingListItems(productDocs)});
			commit(mutationTypes.PRODUCTS_SET_ITEMS, {docs : extractIngredients(productDocs)});

			dispatch(actionTypes.START_SYNC, {recipeID});
			dispatch(actionTypes.START_PREPARATION_COLLAB, {recipeID});

			commit(mutationTypes.LOAD_DONE);
			
			return recipe;
		}
	}
}