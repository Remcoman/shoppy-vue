import getSlug from 'speakingurl';
import RecipeModel from '../../models/RecipeModel';
import {insertIndex} from '../../utils/couchdb';
import {mutationTypes as appMutationTypes} from '../../store/app';

const ERROR_LOAD_FAILED = new Error("Er ging iets mis bij het laden van het recept");

export const mutationTypes = {
	RECIPES_LOAD_START 	            : "recipes/RECIPES_LOAD_START",
	RECIPES_LOAD_SUCCESS            : "recipes/RECIPES_LOAD_SUCCESS",
	RECIPES_REMOVE_SUCCESS          : "recipes/RECIPE_REMOVE_SUCCESS",
	RECIPES_ADD_OR_UPDATE_SUCCESS   : "recipes/RECIPE_ADD_OR_UPDATE_SUCCESS",
	RECIPES_SET_ITEMS               : "recipes/RECIPES_SET_ITEMS"
};

export const actionTypes = {
	RECIPES_LOAD          : "recipes/LOAD",
	RECIPES_UNLOAD        : "recipes/UNLOAD",
	RECIPES_ADD 	      : "recipes/ADD_RECIPE",
	RECIPES_REMOVE        : "recipes/REMOVE",
	RECIPES_CHANGE_NAME   : "recipes/CHANGE_NAME"
};

const createState = () => ({
	items : [],
	loading : false,
	loaded : false
});

const findRecipe = (state, id) => {
	const recipe = state.items.find(recipe => recipe.id === id);
	if(!recipe) {
		throw new Error(`Recipe with id ${id} does not exist`);
	}
	return recipe;
};

const createMutations = () => {
	return {
		[mutationTypes.RECIPES_LOAD_START] (state) {
			state.loading = true;
			state.loaded  = false;
		},

		[mutationTypes.RECIPES_LOAD_SUCCESS] (state) {
			state.loading = false;
			state.loaded  = true;
		},

		[mutationTypes.RECIPES_ADD_OR_UPDATE_SUCCESS] (state, {doc}) {
			const updatedRecipe  = new RecipeModel(doc);
			const existingRecipe = findRecipe(state, doc._id);

			let i;
			if(existingRecipe) { //update existing
				i = state.items.findIndex(product => product._id === updatedRecipe._id);
				state.items.splice(i, 1, updatedRecipe);
			}
			else {
				i = insertIndex(state.items, updatedRecipe._id);
				state.items.splice(i, 0, updatedRecipe);
			}
		},

		[mutationTypes.RECIPES_REMOVE_SUCCESS] (state, {doc}) {
			state.items = state.items.filter(recipe => recipe._id !== doc._id);
		},

		[mutationTypes.RECIPES_SET_ITEMS] (state, {docs}) {
			state.items = docs.map(data => new RecipeModel(data));
		}
	}
};

const createActions = (ctx) => {
	const {dbService} = ctx;
	const db = dbService.db("shoppy-recipes");

	let changesSubscription,
		syncer;

	return {
		[actionTypes.RECIPES_UNLOAD] () {
			if(changesSubscription) {
				changesSubscription.stop();
				changesSubscription = null;
			}
			
			if(syncer) {
				syncer.stop();
				syncer = null;
			}
		},

		async [actionTypes.RECIPES_LOAD] ({commit}) {
			commit(mutationTypes.RECIPES_LOAD_START);

			let docs;

			try {
				docs = await db.load();
			}
			catch(e) {
				if(e.status !== 404) {
					commit(appMutationTypes.SET_ERROR, ERROR_LOAD_FAILED);
					return;
				}
				
				docs = [];
			}

			commit(mutationTypes.RECIPES_LOAD_SUCCESS);

			commit(mutationTypes.RECIPES_SET_ITEMS, {docs});

			changesSubscription = db.observeChanges()
				.on('change', ({doc}) => {
					if(doc._deleted) {
						commit( mutationTypes.RECIPES_REMOVE_SUCCESS, doc );
					}
					else {
						commit( mutationTypes.RECIPES_ADD_OR_UPDATE_SUCCESS, doc );
					}
				})
				.on('error', () => {
					console.warn("noo");
				});

			syncer = db.sync();
		},

		async [actionTypes.RECIPES_ADD] ({state}, {name}) {
			const lastProduct = state.items[state.items.length-1];

			let isLast, afterId;
			if(lastProduct) {
				afterId = lastProduct._id;
				isLast = false;
			}
			else {
				afterId = null;
				isLast = true;
			}

			const recipe = new RecipeModel({
				name : name,
				slug : getSlug(name),
				dateAdded : new Date()
			});

			return await db.add([recipe], {afterId, isLast});
		},

		async [actionTypes.RECIPES_REMOVE] ({state}, {id}) {
			const recipe = findRecipe(state, id);
			await db.remove([recipe]);
		},

		async [actionTypes.RECIPES_CHANGE_NAME] ({state}, {id, name}) {
			const recipe = findRecipe(state, id);
			await db.update({...recipe, name});
		}
	}
};

export default (ctx) => {
	return {
		state 	  : createState(ctx),
		mutations : createMutations(ctx),
		actions   : createActions(ctx)
	}
}
