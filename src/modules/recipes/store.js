import {RecipeModel} from '@/models';
import {insertIndex, insertOrder, INSERT_BY_ID} from '@/services/db/ordering';
import generateID from '@/services/db/id';
import {mutationTypes as appMutationTypes} from '@/modules/app/store';
import config from 'config';

const ERROR_LOAD_FAILED = new Error("Er ging iets mis bij het laden van het recept");

export const mutationTypes = {
	RESET					: "recipes/RESET",
	LOAD_START 	            : "recipes/LOAD_START",
	LOAD_SUCCESS            : "recipes/LOAD_SUCCESS",
	REMOVE_SUCCESS          : "recipes/RECIPE_REMOVE_SUCCESS",
	ADD_OR_UPDATE_SUCCESS   : "recipes/RECIPE_ADD_OR_UPDATE_SUCCESS",
	SET_ITEMS               : "recipes/SET_ITEMS",
	PREVIEW_START		    : "recipes/PREVIEW_START",
	PREVIEW_ERROR		   	: "recipes/PREVIEW_ERROR",
	PREVIEW_SUCCESS		   	: "recipes/PREVIEW_SUCCESS",
	PREVIEW_CLEAR			: "recipes/PREVIEW_CLEAR",
	SHOW_ADD_FORM		   	: "recipes/SHOW_ADD_FORM",
	HIDE_ADD_FORM			: "recipes/HIDE_ADD_FORM",
	ADD_PENDING_SAVE		: "recipes/ADD_PENDING_SAVE"
};

export const actionTypes = {
	LOAD          : "recipes/LOAD",
	UNLOAD        : "recipes/UNLOAD",
	ADD_BY_NAME   : "recipes/ADD_BY_NAME",
	ADD_BY_URL    : "recipes/ADD_BY_URL",
	REMOVE        : "recipes/REMOVE",
	PREVIEW		  : "recipes/PREVIEW"
};

const defaultPreview = () => ({
	loading : false,
	last : null,
	error : null
})

const createState = () => ({
	pending : [],
	items : [],
	preview : defaultPreview(),
	loading : false,
	loaded : false,
	addFormShown : false
});

const findItem = (state, id) => {
	const item = state.items.find(recipe => recipe.id === id);
	if(!item) {
		throw new Error(`Recipe with id ${id} does not exist`);
	}
	return item;
};

const createMutations = ctx => {
	const {dbService} = ctx;
	const db = dbService.db("shoppy");

	function createRecipe(doc) {
		return new RecipeModel(doc);
	};

	return {
		[mutationTypes.ADD_PENDING_SAVE] (state, {id, name}) {
			const pendingRecipe = createRecipe({
				id, name
			});

			pendingRecipe.pendingSave = true;

			state.pending.push(pendingRecipe);
		},

		[mutationTypes.HIDE_ADD_FORM] (state) {
			state.addFormShown = false;
			state.preview = defaultPreview();
		},

		[mutationTypes.SHOW_ADD_FORM] (state) {
			state.addFormShown = true;
			state.preview = defaultPreview();
		},

		[mutationTypes.PREVIEW_CLEAR] (state) {
			state.preview = defaultPreview();
		},

		[mutationTypes.PREVIEW_START] (state) {
			state.preview.loading = true;
			state.preview.last = null;
			state.preview.error = null;
		},

		[mutationTypes.PREVIEW_ERROR] (state, {error}) {
			state.preview.loading = false;
			state.preview.last = null;
			state.preview.error = error;
		},

		[mutationTypes.PREVIEW_SUCCESS] (state, {result}) {
			state.preview.last = result;
			state.preview.loading = false;
		},

		[mutationTypes.RESET] (state) {
			Object.assign(state, createState());
		},

		[mutationTypes.LOAD_START] (state) {
			state.loading = true;
			state.loaded  = false;
		},

		[mutationTypes.LOAD_SUCCESS] (state) {
			state.loading = false;
			state.loaded  = true;
		},

		[mutationTypes.ADD_OR_UPDATE_SUCCESS] (state, doc) {
			const existingItem = findItem(state, doc._id);
			const updatedItem  = createItem(doc);

			let i;
			if(existingItem) { //update existing
				i = state.items.findIndex(recipe => recipe._id === doc._id);
				state.items.splice(i, 1, updatedItem);
			}
			else {
				i = insertIndex(state.items, doc._id, INSERT_BY_ID);
				state.items.splice(i, 0, updatedItem);
			}
		},

		[mutationTypes.REMOVE_SUCCESS] (state, {id}) {
			state.items = state.items.filter(recipe => recipe._id !== id);
		},

		[mutationTypes.SET_ITEMS] (state, docs) {
			state.items = docs.map(doc => createRecipe(doc));
		}
	}
};

const createActions = (ctx) => {
	const {dbService} = ctx;
	const db = dbService.db("shoppy");
	const dbView = db.view('recipes/all');

	let changesSubscription,
		syncer;

	return {
		async [actionTypes.PREVIEW] ({commit}, {url}) {
			let parsedURL;
			try {
				parsedURL = new URL(url);
			}
			catch(e) {
				commit(mutationTypes.PREVIEW_ERROR, {
					error : new Error("Het opgegeven adres is ongeldig")
				});
				return;
			}
			
			commit(mutationTypes.PREVIEW_START);

			const params = new URLSearchParams();
			params.append("url", url);

			let result;
			try {
				result = await fetch(config.scrapeEndPoint + "?" + params.toString())
					.then(res => {
						if(!res.ok) {
							return res.json().then(data => {
								let error = new Error(data.message);
								error.code = data.code;
								throw error;
							});
						}
						return res.json();
					});
			}
			catch(error) {
				commit(mutationTypes.PREVIEW_ERROR, {
					error : new Error("Er is geen verbinding")
				});
				return;
			}

			commit(mutationTypes.PREVIEW_SUCCESS, {result});
		},

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

		async [actionTypes.LOAD] ({commit}) {
			commit(mutationTypes.LOAD_START);

			const {replicated, doc} = await db.ensureDesignDoc("recipes");
			if(!replicated) {
				db.localDb.replicate.from(db.remoteDb, {key : `_design/recipes`});
			}

			let docs = [];

			try {
				docs = await dbView.load({attachments : true, descending : true});
			}
			catch(e) {
				if(e.status !== 404) {
					commit(appMutationTypes.SET_ERROR, ERROR_LOAD_FAILED);
					return;
				}
			}

			commit(mutationTypes.LOAD_SUCCESS);
			commit(mutationTypes.SET_ITEMS, docs);

			changesSubscription = dbView.observeChanges()
				.on('change', ({doc}) => {
					if(doc._deleted) {
						commit( mutationTypes.REMOVE_SUCCESS, {id : doc._id} );
					}
					else {	
						commit( mutationTypes.ADD_OR_UPDATE_SUCCESS, doc );
					}
				})
				.on('error', () => {});

			syncer = dbView.sync();
		},

		[actionTypes.ADD_BY_NAME] ({state, commit}, {name}) {
			const lastProduct = state.items[state.items.length-1];

			let afterId = lastProduct ? lastProduct._id : null;
			let startOrder = insertOrder(state.items, afterId, null);

			const recipe = new RecipeModel({
				name : value,
				slug : RecipeModel.generateSlug(value),
				dateAdded : new Date()
			});

			return db.add(recipe.toJSON(), {startOrder});
		},

		[actionTypes.ADD_BY_URL] ({state, commit}, {preview}) {
			const {name} = preview;
			const id = generateID();

			commit(mutationTypes.ADD_PENDING_SAVE, {id, name});
		},

		[actionTypes.REMOVE] ({state}, {id}) {
			const recipe = findRecipe(state, id);
			return db.remove(recipe.toJSON());
		}
	}
};

const createGetters = ctx => {
	const {dbService} = ctx;
	const db = dbService.db("shoppy");

	return {
		recipesIncludingPending(state) {
			return state.pending.concat(state.items);
		},

		recipePlaceholderLoader() {
			return function (doc) {
				return db.localDb.getAttachment(doc._id, "placeholder")
					.catch(e => null)
					.then(blob => blob);
			}
		}
	}
}

export default (ctx) => {
	return {
		state 	  : createState(ctx),
		mutations : createMutations(ctx),
		actions   : createActions(ctx),
		getters	  : createGetters(ctx)
	}
}
