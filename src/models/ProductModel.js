/**
 * Created by remco on 07/10/16.
 */

import createFactory from './factory';

const ProductModel = createFactory(() => ({
	_id : undefined,
	_rev : undefined,
	_deleted : false,
	type : "product",
	name : "",
	done : false,
	dateAdded : null,
	dummy : false,
	order : null,
	shoppingList : false,
	recipeID : null,
	origin : {}
}))

export default ProductModel;