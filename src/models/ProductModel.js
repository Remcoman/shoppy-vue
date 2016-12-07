/**
 * Created by remco on 07/10/16.
 */

export default class ProductModel {
	constructor(data) {

		//reserved pouch db props
		this._id = undefined;
		this._rev = undefined;
		this._deleted = false;

		this.type = "product";
		this.name = "";
		this.done = false;
		this.dateAdded = null;
		this.dummy = false;

		this.isInShoppingList = false;
		this.recipeID = null;
		this.originRecipeID = null;

		if(data) {
			Object.assign(this, data);
		}
	}

	get id() {
		return this._id;
	}

	set id(value) {
		this._id = value;
	}
}