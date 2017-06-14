export const BIG_ENDIAN = "big_endian";
export const LITTLE_ENDIAN = "little_endian";

export class Buffer {
	constructor(src, offset = 0, length, endian = BIG_ENDIAN) {
		if(src instanceof Buffer) {
			if(typeof length === "undefined") {
				length = src.length - offset;
			}
			endian = src.endian;
			this._view = new DataView(src.view.buffer, src.offset + offset, length);
		}
		else if(src instanceof ArrayBuffer) {
			if(typeof length === "undefined") {
				length = src.byteLength - offset;
			}
			this._view = new DataView(src, offset, length);
		}

		this._offset = offset;
		this._cursor = 0;
		this._endian = endian;
	}

	get view() {
		return this._view;
	}

	get length() {
		return this._view.buffer.byteLength;
	}

	get endian() {
		return this._endian;
	}

	set endian(value) {
		this._endian = value;
	}

	get offset() {
		return this._offset;
	}

	get cursor() {
		return this._cursor;
	}

	set cursor(v) {
		this._cursor = v;
	}

	get eof() {
		return this._cursor === this.view.byteLength;
	}

	_moveCursor(x) {
		const oldCursor = this._cursor;
		this._cursor += x;
		return oldCursor;
	}

	getInt8() {
		return this._view.getInt8( this._moveCursor(1) );
	}

	getUint8() {
		return this._view.getUint8( this._moveCursor(1) );
	}

	getInt16() {
		return this._view.getInt16( this._moveCursor(2), this._endian === LITTLE_ENDIAN );
	}

	getUint16() {
		return this._view.getUint16( this._moveCursor(2), this._endian === LITTLE_ENDIAN );
	}

	getInt32() {
		return this._view.getInt32( this._moveCursor(4), this._endian === LITTLE_ENDIAN );
	}

	getUint32() {
		return this._view.getUint32( this._moveCursor(4), this._endian === LITTLE_ENDIAN );
	}
	
	getFloat32() {
		return this._view.getFloat32( this._moveCursor(4), this._endian === LITTLE_ENDIAN );
	}

	getFloat64() {
		return this._view.getFloat64( this._moveCursor(8), this._endian === LITTLE_ENDIAN );
	}

	read(length) {
		const data = new Buffer( this._view.buffer.slice(this._cursor, this._cursor + length) );
		this._cursor += length;
		return data;
	}

	readInt8(length) {
		const data = new Int8Array( this._view.buffer.slice(this._cursor, this._cursor + length) );
		this._cursor += length;
		return data;
	}

	getASCIIString(length) {
		let str = "";
		while(!this.eof && str.length < length) {
			let b = this.getUint8();
			if(b !== 0) { //null terminator
				str += String.fromCharCode( b );
			}
		}
		return str;
	}
}