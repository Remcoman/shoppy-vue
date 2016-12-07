import {ProductModel} from '../models';
import {insertIndex} from '../utils/couchdb';

let dummyId = -1;

const findProduct = (state, id, throwWhenNotFound=true) => {
	let product = state.items.find(product => product.id === id);

	if(throwWhenNotFound && !product) {
		throw new Error(`Can't find given product with id ${id}!`);
	}

	return product;
};

export const createState = () => ({
	items 	   : [],
	focus 	   : null,
	editing    : false,
	dummy 	   : null
});

export const createGetters = (stateSelector = state => state) => {
	const withStateSelector = function (obj) {
		let newObj = {};
		Object.keys(obj).forEach(key => {
			newObj[key] = (state) => obj[key]( stateSelector(state) )
		});
		return newObj;
	}

	return withStateSelector({
		productsWithDummy(state) {
			let {items, dummy} = state;
			return dummy 
				? [...items, dummy]
				: items;
		}
	}); 
};

export const createActions = (db, actionTypes, mutationTypes, productFactory = () => {}, stateSelector = state => state) => {
	const withStateSelector = function (obj) {
		let newObj = {};
		Object.keys(obj).forEach(key => {
			const fn = obj[key];
			newObj[key] = (ctx, payload) => {
				const rootState = ctx.state;
				const state = stateSelector(rootState);
				return fn({...ctx, state, rootState}, payload);
			}
		});
		return newObj;
	}

	return withStateSelector({
		[actionTypes.PRODUCTS_TOGGLE_DONE] : ({state, dispatch}, {id}) => {
			const product = findProduct(state, id);
			const done = !product.done;
			return dispatch(actionTypes.PRODUCTS_UPDATE, {id : id, data : {done}});
		},

		[actionTypes.PRODUCTS_PASTE_BELOW] : ({dispatch}, {id, names, recipeID}) => {

			//remove list indicators
			names = names.map(name => {
				return name.trim().replace(/^-\s*/, "");
			});

			dispatch(actionTypes.PRODUCTS_ADD, {names, afterId : id, recipeID});
		},

		[actionTypes.PRODUCTS_CHANGE_NAME] : ({state, dispatch, commit}, payload) => {
			const {id, name} = payload;

			if(state.dummy && state.dummy._id === id) { //we are editing the dummmy
				if(name.match(/\S/)) { //dummy name is not empty so lets add it as a real item
					dispatch(actionTypes.PRODUCTS_ADD, {names : [name]});
				}
				//else { //empty dummy is not allowed so lets remove it
					commit(mutationTypes.PRODUCTS_REMOVE_DUMMY);
				//}
			}
			else { //we are updating an existing item
				if(name.match(/\S/)) {
					dispatch(actionTypes.PRODUCTS_UPDATE, {id : id, data : {name}});
				}
				else {
					dispatch(actionTypes.PRODUCTS_REMOVE, {id});
				}
			}
		},

		[actionTypes.PRODUCTS_UPDATE] : ({state}, {id, data}) => {
			const product = findProduct(state, id),
				p = {...product, ...data};

			return db.update( p );
		},

		[actionTypes.PRODUCTS_ADD] : ({state, rootState}, payload) => {
			const lastProduct = state.items[state.items.length - 1];

			let {afterId} = payload;
			let isLast = true;
			if (!afterId) {
				afterId = lastProduct ? lastProduct._id : null;
			}
			else {
				isLast = !lastProduct || lastProduct._id === afterId;
			}

			let {products, idPrefix} = productFactory({state, rootState}, payload);

			const dateAdded = new Date();
			products.forEach(product => {
				product.dateAdded = dateAdded;
			});

			return db.add( products, {afterId, isLast, idPrefix} );
		},
		
		[actionTypes.PRODUCTS_CLEAR] : ({state}) => {
			db.remove(state.items);
		},

		[actionTypes.PRODUCTS_REMOVE] : ({state}, {id}) => {
			const product = findProduct(state, id);
			db.remove([product]);
		}
	});
};

export const createMutations = (mutationTypes, stateSelector = state => state) => {
	function withStateSelector(obj){
		let newObj = {};
		Object.keys(obj).forEach(key => {
			const fn = obj[key];
			newObj[key] = (state, payload) => {
				fn(stateSelector(state), payload);
			}
		});
		return newObj;
	}

	return withStateSelector({
		[mutationTypes.PRODUCTS_ADD_OR_UPDATE_SUCCESS] (state, {doc}) {
			const updatedProduct  = new ProductModel(doc);
			const existingProduct = findProduct(state, updatedProduct._id, null, false);

			let i;
			if(existingProduct) { //update existing
				i = state.items.findIndex(product => product._id === updatedProduct._id);
				state.items.splice(i, 1, updatedProduct);
			}
			else {
				i = insertIndex(state.items, updatedProduct._id);
				state.items.splice(i, 0, updatedProduct);
			}

			//state.dummy = null;
			//state.focus = null;
		},

		[mutationTypes.PRODUCTS_REMOVE_SUCCESS] (state, {doc}) {
			state.items = state.items.filter(product => product.id !== doc._id);
		},

		[mutationTypes.PRODUCTS_SET_ITEMS] (state, {docs}) {
			state.items = docs.map(raw => new ProductModel(raw));
		},

		[mutationTypes.PRODUCTS_SET_EDITING] (state, {value}) {
			state.editing = value;
		},

		[mutationTypes.PRODUCTS_NEW_DUMMY] (state) {
			const product = new ProductModel({id : (dummyId--).toString(), dummy : true});

			state.dummy = product;
			state.focus = product.id;
		},

		[mutationTypes.PRODUCTS_REMOVE_DUMMY] (state) {
			state.dummy = null;
		},

		[mutationTypes.PRODUCTS_SET_FOCUS] (state, {id}) {
			state.focus = id || null;
		}
	});
};

