import {ProductModel} from '@/models';
import {insertIndex, insertOrder, INSERT_BY_ORDER} from '@/services/db/ordering';
import generateId from '@/services/db/id';
import {selectActionState, selectMutationState} from '@/utils/select-state';

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

export const productsWithDummy = state => {
	let {items, dummy} = state;
	return dummy 
		? [...items, dummy]
		: items;
}

export const createActions = ({db, actionTypes, mutationTypes, productFactory = () => {}, stateSelector = state => state}) => {
	
	return selectActionState(stateSelector, {
		[actionTypes.PRODUCTS_DROP] ({state, dispatch}, {srcId, targetId}) {
			let srcIndex    = state.items.findIndex(item => item._id === srcId);
			let targetIndex = state.items.findIndex(item => item._id === targetId);
			let afterIndex, beforeIndex;

			if(targetIndex === 0) {
				afterIndex = -1;
				beforeIndex = 0;
			}
			else if(targetIndex > srcIndex) {
				afterIndex = targetIndex;
				beforeIndex = targetIndex+1;
			}
			else {
				afterIndex = targetIndex-1;
				beforeIndex = targetIndex;
			}

			const afterId = state.items[afterIndex] ? state.items[afterIndex].id : null;
			const beforeId = state.items[beforeIndex] ? state.items[beforeIndex].id : null;

			const order = insertOrder(state.items, afterId, beforeId).valueOf();
			const product = state.items[srcIndex];

			return dispatch(actionTypes.PRODUCTS_UPDATE, {id : product.id, data : {order}});
		},

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

		[actionTypes.PRODUCTS_CHANGE_NAME] : ({state, dispatch, commit}, {id, name}) => {
			
			if(state.dummy && state.dummy._id === id) { //we are editing the dummmy
				if(name.match(/\S/)) { //dummy name is not empty so lets add it as a real item
					const doc = {id, name};
					const afterId = state.items.length ? state.items[state.items.length-1]._id : null;

					commit(mutationTypes.PRODUCTS_ADD_OR_UPDATE_SUCCESS, {doc : {id, name}});
					commit(mutationTypes.PRODUCTS_REMOVE_DUMMY);

					dispatch(actionTypes.PRODUCTS_ADD, {products : [doc], afterId});
					return true;
				}
				else {
					commit(mutationTypes.PRODUCTS_REMOVE_DUMMY);
					return false;
				}
			}
			else { //we are updating an existing item
				if(name.match(/\S/)) {
					dispatch(actionTypes.PRODUCTS_UPDATE, {id : id, data : {name}});
					return true;
				}
				else {
					dispatch(actionTypes.PRODUCTS_REMOVE, {id});
					return false;
				}
			}
		},

		[actionTypes.PRODUCTS_UPDATE] : ({state}, {id, data}) => {
			const product = findProduct(state, id),
				p = {...product.toJSON(), ...data};

			return db.update( p );
		},

		[actionTypes.PRODUCTS_ADD] : ({state, rootState}, payload) => {
			let {afterId = null, products} = payload;

			let startOrder = insertOrder(state.items, afterId, null);
			
			let productModels = productFactory({state, rootState}, products);

			const dateAdded = new Date();

			return db.add( productModels.map(product => ({...product.toJSON(), dateAdded})), {startOrder} );
		},
		
		[actionTypes.PRODUCTS_CLEAR] : ({state}) => {
			db.remove(state.items.map(product => product.toJSON()));
		},

		[actionTypes.PRODUCTS_REMOVE] : ({state}, {id}) => {
			const product = findProduct(state, id);
			db.remove(product.toJSON());
		}
	});
};

export const createMutations = ({mutationTypes, stateSelector = state => state, idPrefixFactory = () => {}}) => {
	
	return selectMutationState(stateSelector, {
		[mutationTypes.PRODUCTS_ADD_OR_UPDATE_SUCCESS] ({state}, {doc}) {
			const updatedProduct  = new ProductModel(doc);
			const existingProduct = findProduct(state, updatedProduct._id, null, false);

			let i;
			if(existingProduct) { //update existing
				i = state.items.findIndex(product => product._id === updatedProduct._id);
				
				//order might have changed
				if(updatedProduct.order !== existingProduct.order) {
					state.items.splice(i, 1); //remove the item

					i = insertIndex(state.items, updatedProduct, INSERT_BY_ORDER); //determine new position

					state.items.splice(i, 0, updatedProduct); //reinsert the item
				}
				else {
					state.items.splice(i, 1, updatedProduct); //just replace the existing item
				}
			}
			else {
				i = insertIndex(state.items, updatedProduct, INSERT_BY_ORDER);
				state.items.splice(i, 0, updatedProduct);
			}

		},

		[mutationTypes.PRODUCTS_REMOVE_SUCCESS] ({state}, {doc}) {
			state.items = state.items.filter(product => product.id !== doc._id);
		},

		[mutationTypes.PRODUCTS_SET_ITEMS] ({state}, {docs}) {
			state.items = docs.map(raw => new ProductModel(raw));
		},

		[mutationTypes.PRODUCTS_SET_EDITING] ({state}, {value}) {
			state.editing = value;
		},

		[mutationTypes.PRODUCTS_NEW_DUMMY] ({state, rootState}) {
			let idPrefix = idPrefixFactory({state, rootState});
			if(typeof idPrefix !== "string") {
				idPrefix = "";
			}

			const id = generateId(idPrefix);
			const product = new ProductModel({id, dummy : true});

			state.dummy = product;
			state.focus = product.id;
		},

		[mutationTypes.PRODUCTS_REMOVE_DUMMY] ({state}) {
			state.dummy = null;
		},

		[mutationTypes.PRODUCTS_SET_FOCUS] ({state}, {id}) {
			state.focus = id || null;
		}
	});
};

