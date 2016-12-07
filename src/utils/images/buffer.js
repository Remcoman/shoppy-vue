export const BIG_ENDIAN = "big_endian";
export const LITTLE_ENDIAN = "little_endian";

export class Buffer {
	constructor(src, offset = 0, length, endian = BIG_ENDIAN) {
		if(src instanceof Buffer) {
			endian = src.endian;
			this.view = new DataView(src.view.buffer, src.offset + offset, length);
		}
		else if(src instanceof ArrayBuffer) {
			this.view = new DataView(src, offset, length);
		}

		this._offset = offset;
		this._cursor = 0;
		this._endian = endian;
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
		return this.view.getInt8( this._moveCursor(1) );
	}

	getUint8() {
		return this.view.getUint8( this._moveCursor(1) );
	}

	getInt16() {
		return this.view.getInt16( this._moveCursor(2), this._endian === LITTLE_ENDIAN );
	}

	getUint16() {
		return this.view.getUint16( this._moveCursor(2), this._endian === LITTLE_ENDIAN );
	}

	getInt32() {
		return this.view.getInt32( this._moveCursor(4), this._endian === LITTLE_ENDIAN );
	}

	getUint32() {
		return this.view.getUint32( this._moveCursor(4), this._endian === LITTLE_ENDIAN );
	}
	
	getFloat32() {
		return this.view.getFloat32( this._moveCursor(4), this._endian === LITTLE_ENDIAN );
	}

	getFloat64() {
		return this.view.getFloat64( this._moveCursor(8), this._endian === LITTLE_ENDIAN );
	}

	read(length) {
		const data = new Buffer( this.view.buffer.slice(this._cursor, this._cursor + length) );
		this._cursor += length;
		return data;
	}

	readInt8(length) {
		const data = new Int8Array( this.view.buffer.slice(this._cursor, this._cursor + length) );
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