import {Buffer, BIG_ENDIAN, LITTLE_ENDIAN} from './buffer';

class Exif {
	constructor(exifGenerator) {
		this._exifGenerator = exifGenerator;
		this._cached = {};
	}

	_find(needle) {
		needle = needle.toLowerCase()

		for(let {key, value} of this._exifGenerator) {
			key = key.toLowerCase();
			this._cached[key] = value;

			if(key === needle) {
				return value;
			}
		}

		return null;
	}

	toJS() {
		let map = {...this._cached};
		for(let {key, value} of this._exifGenerator) {
			this._cached[key.toLowerCase()] = value;
			map[key] = value.value;
		}
		return map;
	}

	item(key) {
		return this._cached[key.toLowerCase()] || this._find(key);
	}

	type(key) {
		const item = this.item(key);
		return item ? item.type : null;	
	}

	get(key) {
		const item = this.item(key);
		return item ? item.value : null; 
	}
}

/*
	Because of an bug in babel i have to nest generators in another object
*/
const readers = {
	exifGenerator : function* (buffer) {
		const byteAlign = buffer.getUint16();

		if(byteAlign === 0x4949) { //Intel
			buffer.endian = LITTLE_ENDIAN;
		}
		else if(byteAlign === 0x4d4d) { //Motorola
			buffer.endian = BIG_ENDIAN;
		}
		else {
			throw new Error("Unknown byte align");
		}

		buffer.cursor += 2;

		const offsetToIFD = buffer.getUint32();
		
		buffer.cursor += offsetToIFD - 8;

		yield* readers.ifdGenerator("MainImage", buffer.cursor, buffer);
	},

	ifdGenerator : function* (type, offset, buffer) {
		buffer.cursor = offset;

		//console.debug(`Reading ${type} from offset ${offset}`);

		switch(type) {
			case "MainImage" : {
				const result = readers.directoryGenerator("MainImage", buffer);

				for(let entry of result) {
					if(entry.key === "MainImage.ExifOffset") {
						yield* readers.ifdGenerator("ExifSubIFD", entry.value.value, new Buffer(buffer));
					}
					else {
						yield entry;
					}
				}

				const nextOffset = buffer.getUint32();
				if(nextOffset) {
					yield* readers.ifdGenerator("Thumbnail", nextOffset, buffer);
				}

				break;
			}

			default : {
				yield* readers.directoryGenerator(type, buffer);
				break;
			}
		}
	},

	directoryGenerator : function* (type, buffer) {
		const entryCount = buffer.getUint16();

		//console.debug(`Entry count ${entryCount}`);

		for(let entryIndex = 0; entryIndex < entryCount;entryIndex++) {
			if(buffer.eof) {
				return;
			}

			//console.debug(`${entryIndex}`);

			const tagNumber = buffer.getUint16();

			if(!(tagNumber in Tags[type])) {
				buffer.cursor += 10;
				//console.debug(`Unknown tagNumber: ${tagNumber}`);
				continue;
			}

			const key = Tags[type][tagNumber];

			const dataFormat = buffer.getUint16();
			if(!(dataFormat in types)) {
				throw new Error(`Unknown data format: ${dataFormat}`);
			}

			//console.debug(`Found key: ${key}`);

			const componentCount = buffer.getUint32();
			const dataOrOffset = buffer.getUint32();
			const totalLength = componentCount * types[dataFormat].bytesPerComponent;

			let value;
			if(totalLength <= 4) { //total length exceeds 4 bytes
				buffer.cursor -= 4; //rewind cursor to start of value

				value = types[dataFormat].read(buffer, componentCount);

				//not all bytes might have been read so we shift the offset by the difference 
				buffer.cursor += 4 - totalLength;
			}
			else {
				//offset from start of tiff header
				const valueBuffer = new Buffer(buffer, dataOrOffset, totalLength);
				value = types[dataFormat].read(valueBuffer, componentCount);
			}

			//console.debug(`Found value: ${value.value}`);

			yield {key : type + "." + key, value}
		}	
	}
}



function getTiffHeader(buffer) {
	const id = buffer.getASCIIString(4);
	if(id !== "Exif") {
		throw new Error("Invalid exif");
	}
	buffer.cursor += 2; //skip 2 bytes

	return new Buffer(buffer, buffer.cursor); //new buffer from remaining contents
}

export function readExif(buffer) {
	const tiffBuffer = getTiffHeader(buffer);
	return new Exif( readers.exifGenerator(tiffBuffer) );
}

/*

//https://www.media.mit.edu/pia/Research/deepview/exif.html

var data = {}; Array.from($0.rows).slice(2).forEach(row => {
   console.log(row.cells[0].textContent);data[parseInt(row.cells[0].textContent, 16)] = {key : row.cells[1].textContent, type : row.cells[2].textContent};
});

Object.keys(data).forEach(key => {data[key]["key"] = data[key]["key"].slice(0,-1);});

JSON.stringify(data).replace(/"(\d+)"/g, "$1").replace(/"(\w+)":/g, "$1:");

*/

const repeat = (count, fn) => {
	let values = [];
	for(let i=0;i < count;i++) {
		values.push( fn() );
	}
	return values.length > 1
		? {type : Array, value : values}
		: {type : Number, value : values[0]};
}

const types = {
	1 : {
		read(buffer, componentCount) {
			return repeat(componentCount, () => buffer.getUint8());
		}, 
		bytesPerComponent : 1
	},
	
	2 : {
		read(buffer, componentCount) {
			return {type : String, value : buffer.getASCIIString(componentCount)};
		}, 
		bytesPerComponent : 1
	},

	3 : {
		read(buffer, componentCount) {
			return repeat(componentCount, () => buffer.getUint16());
		}, 
		bytesPerComponent : 2
	},

	4 :{
		read(buffer, componentCount) {
			return repeat(componentCount, () => buffer.getUint32());
		}, 
		bytesPerComponent : 4
	},

	5 : {
		read(buffer, componentCount) {
			return repeat(componentCount, () => {
				return buffer.getUint32() / buffer.getUint32();
			});
		}, 
		bytesPerComponent : 8
	},

	6 : {
		read(buffer, componentCount) {
			return repeat(componentCount, () => buffer.getInt8());
		},
		bytesPerComponent : 1
	},

	7 : {
		read(buffer, componentCount) {
			if(componentCount === 1) {
				return {type : Number, value : buffer.getInt8()};
			}
			return {type : Uint8Array, value : buffer.readInt8(componentCount)};
		},
		bytesPerComponent : 1
	},

	8 : {
		read(buffer, componentCount) {
			return repeat(componentCount, () => buffer.getInt16());
		},
		bytesPerComponent : 2
	},

	9 : {
		read(buffer, componentCount) {
			return repeat(componentCount, () => buffer.getInt32());
		},
		bytesPerComponent : 4
	},

	10 : {
		read(buffer, componentCount) {
			return repeat(componentCount, () => {
				const num = buffer.getInt32(), den = buffer.getInt32();
				return den > 0 ? num / den : 0;
			});
		}, 
		bytesPerComponent : 8
	},

	11 : {
		read(buffer, componentCount) {
			return repeat(componentCount, () => buffer.getFloat32());
		},
		bytesPerComponent : 4
	},

	12 : {
		read(buffer, componentCount) {
			return repeat(componentCount, () => buffer.getFloat64());
		}, 
		bytesPerComponent : 8
	}
}

//main image
const Tags = {
	MainImage : {
		270 : "ImageDescription",
		271 : "Make",
		272 : "Model",
		274 : "Orientation",
		282 : "XResolution",
		283 : "YResolution",
		296 : "ResolutionUnit",
		305 : "Software",
		306 : "DateTime",
		318 : "WhitePoint",
		319 : "PrimaryChromaticities",
		529 : "YCbCrCoefficients",
		531 : "YCbCrPositioning",
		532 : "ReferenceBlackWhite",
		33432 : "Copyright",
		34665 : "ExifOffset",
		34853 : "GPSInfo"
	},

	ExifSubIFD : {
		33434:"ExposureTime",
		33437:"FNumber",
		34850:"ExposureProgram",
		34855:"ISOSpeedRatings",
		36864:"ExifVersion",
		36867:"DateTimeOriginal",
		36868:"DateTimeDigitized",
		37121:"ComponentConfiguration",
		37122:"CompressedBitsPerPixel",
		37377:"ShutterSpeedValue",
		37378:"ApertureValue",
		37379:"BrightnessValue",
		37380:"ExposureBiasValue",
		37381:"MaxApertureValue",
		37382:"SubjectDistance",
		37383:"MeteringMode",
		37384:"LightSource",
		37385:"Flash",
		37386:"FocalLength",
		37500:"MakerNote",
		37510:"UserComment",
		40960:"FlashPixVersion",
		40961:"ColorSpace",
		40962:"ImageWidth",
		40963:"ImageHeight",
		40964:"RelatedSoundFile",
		40965:"ExifInteroperabilityOffset",
		41486:"FocalPlaneXResolution",
		41487:"FocalPlaneYResolution",
		41488:"FocalPlaneResolutionUnit",
		41495:"SensingMethod",
		41728:"FileSource",
		41729:"SceneType"
	},


	Thumbnail : {
		256:"ImageWidth",
		257:"ImageLength",
		258:"BitsPerSample",
		259:"Compression",
		262:"PhotometricInterpretation",
		273:"StripOffsets",
		277:"SamplesPerPixel",
		278:"RowsPerStrip",
		279:"StripByteConunts",
		282:"XResolution",
		283:"YResolution",
		284:"PlanarConfiguration",
		296:"ResolutionUnit",
		513:"JpegIFOffset",
		514:"JpegIFByteCount",
		529:"YCbCrCoefficients",
		530:"YCbCrSubSampling",
		531:"YCbCrPositioning",
		532:"ReferenceBlackWhite"
	}
     
};