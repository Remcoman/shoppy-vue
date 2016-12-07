
export default class RecipeModel {
	constructor(data) {

		//reserved pouch db props
		this._id = undefined;
		this._rev = undefined;
		this._deleted = false;

		this.type = "recipe";
		this.name = "";
		this.preparation = "";
		this.dateAdded = null;
		this.image = {
			high : null,
			med : null,
			low : null
		}

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