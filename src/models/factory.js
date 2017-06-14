
export default function (props, proto = {}, statics = {}) {
	const propKeys = Object.keys(props());

	const Model = function (data = null) {
		Object.assign(this, props(), data || {});
		if(typeof this.init === "function") {
			this.init();
		}
	} 

	Object.assign(Model, statics);
	
	Model.prototype = {

		/**
		 * Returns the json representation which only contains the props
		 */
		toJSON() {
			return propKeys.reduce((obj, key) => {
				obj[key] = this[key];
				return obj;
			}, {});
		},

		copy() {
			let data = {...this.toJSON(), _id : undefined, _rev : undefined, dateAdded : null};
			return new Model(data);
		},

		get id() {
			return this._id;
		},

		set id(value) {
			this._id = value;
		},

		...proto
	}

	return Model;
}