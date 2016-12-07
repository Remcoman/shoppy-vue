
export default class Image {
	constructor({src, exif = null, width, height}) {
		this._src = src;
		this._exif = exif;
		this._width = width;
		this._height = height;
	}

	get src() {
		return this._src;
	}

	get exif() {
		return this._exif;
	}

	get width() {
		return this._width;
	}

	get height() {
		return this._height;
	}

	toURL() {
		if(this._src instanceof File) {
			return window.URL.createObjectURL(this._src);
		}
		else {
			return this._src;
		}
	}
}