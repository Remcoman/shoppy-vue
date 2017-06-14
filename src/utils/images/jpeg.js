import {readExif} from './exif';
import {Buffer} from './buffer';
import Image from './img';

class MarkerReader {
	constructor(buffer) {
		this.buffer = buffer;
	}

	[Symbol.iterator]() {
		const buffer = new Buffer(this.buffer);

		function isStandalone(marker) {
			return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9);
		}

		function getLength() {
			return buffer.getUint16() - 2;
		}

		let prevHadPayload = false;

		return {
			next : () => {
				
				if(prevHadPayload) {
					const length = getLength();
					console.debug(`Found length ${length}`);
					buffer.cursor += length;
					prevHadPayload = false;
				}
				
				if(buffer.eof) {
					return {done : true};
				}

				const marker = buffer.getUint16() & 0xff;
				console.debug(`Found marker 0x${marker.toString(16)}`);

				if(!isStandalone(marker)) {
					prevHadPayload = true;
				}

				return {value : {
					marker, 
					readPayload : () => {
						prevHadPayload = false;
						const length = getLength();
						return buffer.read( length ); 
					} 
				}, done : false};
			}
		}
	}
}

function extractInfo(buffer) {
	let first = true;
	let r = new MarkerReader(buffer);

	let info = {};

	mainLoop : for(let {marker, readPayload} of r) {
		if(first && marker !== 0xd8) {
			throw new Error("Invalid file!");
		}

		switch(marker) {
			case 0xe1 : {
				try {
					info.exif = readExif( readPayload() );
				}
				catch(e) { //eslint ignore no-empty
					console.warn('Problem reading exif', e);
				}				
				break;
			}

			case 0xC0 : {
				const data = readPayload();
				data.cursor++; //skip bits/sample

				info.height = data.getUint16();
				info.width = data.getUint16();

				break;
			}

			case 0xda : {
				break mainLoop;
			}
		}

		first = false;
	}

	return info;
}

async function loadSlice(file, byteLength) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve( new Buffer(reader.result) );
		reader.onerror = () => reject();
		reader.readAsArrayBuffer( file.slice(0, byteLength) );
	});
}

export async function load(src) {
	const buffer = await loadSlice(src, 1024 * 64);
	return new Image({src, ...extractInfo(buffer)});
}