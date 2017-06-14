import * as productPartials from '@/store/partials/products';
import {RecipeModel} from '@/models'; 
import {createState} from './state';
import Vue from 'vue';
import Delta from 'quill-delta';

export const mutationTypes = {
	RESET				 : "recipe-details/RESET",

	SET  			  	 : "recipe-details/SET",
	LOAD_START  		 : "recipe-details/LOAD_START",
	LOAD_DONE  		  	 : "recipe-details/LOAD_DONE",
	SET_EDITING 		 : "recipe-details/SET_EDITING",
	SET_UPLOAD_START   	 : "recipe-details/SET_UPLOAD_START",
	SET_UPLOAD_ERROR  	 : "recipe-details/SET_UPLOAD_ERROR",
	SET_UPLOAD_DONE    	 : "recipe-details/SET_UPLOAD_DONE",
	SET_SHOPPING_LIST 	 : "recipe-details/SET_SHOPPING_LIST",
	UPDATE_SHOPPING_LIST : "recipe-details/UPDATE_SHOPPING_LIST",
	OUTGOING_PREPARATION_CHANGE : "recipe-details/OUTGOING_PREPARATION_CHANGE",
	INCOMING_PREPARATION_CHANGE : "recipe-details/INCOMING_PREPARATION_CHANGE",

	PRODUCTS_SET_FOCUS 			  	  : "recipe-details/SET_FOCUS",
	PRODUCTS_SET_EDITING 	      	  : "recipe-details/SET_EDITING",
	PRODUCTS_NEW_DUMMY 			  	  : "recipe-details/NEW_DUMMY",
	PRODUCTS_REMOVE_DUMMY 		  	  : "recipe-details/REMOVE_DUMMY",
	PRODUCTS_REMOVE_SUCCESS 	  	  : "recipe-details/REMOVE_SUCCESS",
	PRODUCTS_ADD_OR_UPDATE_SUCCESS 	  : "recipe-details/ADD_OR_UPDATE_SUCCESS",
	PRODUCTS_SET_ITEMS		  		  : "recipe-details/SET_PRODUCTS"
};

export function createMutations() {
	return {
		...productPartials.createMutations({
			mutationTypes, 
			stateSelector   : state => state.ingredients,
			idPrefixFactory : ({state, rootState}) => `recipe/${rootState.model.slug}`
		}),

		[mutationTypes.RESET] (state) {
			Object.assign(state, createState());
		},

		/**
		 * The outgoing preparation changes are not yet confirmed
		 * These changes are always the most recent!!!
		 * @param {*} state 
		 * @param {*} param1 
		 */
		[mutationTypes.OUTGOING_PREPARATION_CHANGE] (state, {delta}) {
			state.preparationOut = state.preparationOut.compose(delta);
		},

		/**
		 * The incoming preparation change is a confirmed change from other clients
		 * A change to the incoming preparation is reflected visually
		 * @param {*} state 
		 * @param {*} param1 
		 */
		[mutationTypes.INCOMING_PREPARATION_CHANGE] (state, {delta, isComposed}) {
			if(isComposed) {
				state.preparationIn = state.preparationOut = delta;
			}
			else {
				state.preparationIn = state.preparationOut = state.preparationOut.compose(delta);
			}
		},

		[mutationTypes.SET_SHOPPING_LIST] (state, {docs}) {
			state.ingredientsInShoppingList = docs.reduce((obj, doc) => {
				obj[doc.origin.ingredientID] = true;
				return obj;
			}, {});
		},

		[mutationTypes.UPDATE_SHOPPING_LIST] (state, {shoppingListDoc}) {
			if(shoppingListDoc._deleted) {
				Vue.delete(state.ingredientsInShoppingList, shoppingListDoc.origin.ingredientID);
			}
			else {
				Vue.set(state.ingredientsInShoppingList, shoppingListDoc.origin.ingredientID, true);
			}
		},

		[mutationTypes.SET_UPLOAD_START] (state, {placeholderURL}) {
			state.placeholder = placeholderURL;
			state.uploading = true;
			state.imageProcessingUUID = null;
		},

		[mutationTypes.SET_UPLOAD_ERROR] (state) {
			state.placeholder = null;
			state.uploading = false;
		},

		[mutationTypes.SET_UPLOAD_DONE] (state, {uuid}) {
			state.uploading = false;
			state.imageProcessingUUID = uuid;
		},

		[mutationTypes.SET] (state, {doc, placeholderBlob}) {
			state.model = new RecipeModel({...doc});
			state.placeholder = placeholderBlob;
		},

		[mutationTypes.LOAD_START] (state) {
			state.loading = true;
			state.loaded  = false;
		},

		[mutationTypes.LOAD_DONE] (state) {
			state.loading = false;
			state.loaded  = true;
		},

		[mutationTypes.SET_EDITING] (state, {value}) {
			state.ingredients.editing = state.editing = value;

			//if you leave editing mode the preparation in should always match the preparation out
			if(!value) {
				state.preparationIn = state.preparationOut;
			}
		}
	}	
}