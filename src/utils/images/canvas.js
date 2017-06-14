const rect = (x,y,width,height) => ({x,y,width,height});

export const FIT_COVER   = Symbol();
export const FIT_CONTAIN = Symbol();

const RADIAN = Math.PI/180;

const orientationHandlers = {
	0 : {
		rotate : 0, 
		handle : ctx => {}
	},
	1 : {
		rotate : 0, 
		handle : ctx => {}
	},
	2 : {
		rotate : 0, 
		handle : ctx => ctx.scale(-1,1)
	},
	3 : {
		rotate : 0, 
		handle : ctx => ctx.scale(-1,-1)
	},
	4 : {
		rotate : 0, 
		handle : ctx => ctx.scale(1,-1)
	},
	5 : {
		rotate : -90, 
		handle : ctx => ctx.scale(1,-1)
	},
	6 : {
		rotate : 90, 
		handle : ctx => {}
	},
	7 : {
		rotate : -90, 
		handle : ctx => ctx.scale(-1,1)
	},
	8 : {
		rotate : -90, 
		handle : ctx => {}
	}
}

const fitHandlers = {
	[FIT_COVER](srcSize, targetSize) {
		const a = srcSize.width/srcSize.height, b = targetSize.width/targetSize.height;

		if(a > b) {
			const w = targetSize.height * a;
			return rect(targetSize.width*.5 - w*.5, 0, w, targetSize.height);
		}
		else {
			const h = targetSize.width / a;
			return rect(0, targetSize.height*.5 - h*.5, targetSize.width, h);
		}
	},

	[FIT_CONTAIN](srcSize, targetSize) {
		const a = srcSize.width/srcSize.height, b = targetSize.width/targetSize.height;

		if(a > b) {
			const h = targetSize.width / a;
			return rect(0, targetSize.height*.5 - h*.5, targetSize.width, h);
		}
		else {
			const w = targetSize.width / a;
			return rect(targetSize.width*.5 - w*.5, 0, w, targetSize.height);
		}
	}
} 

/**
 * Flips the width, height and a rotation is present
 * @param {*} param0 
 * @param {*} rotate 
 */
function orientSize({width, height}, rotate) {
	if(rotate) {
		return {height : width, width : height};
	}
	return {width, height};
}

/**
 * Get the targetSize when given a srcSize and maxSize
 * @param {*} rotatedSrcSize 
 * @param {*} maxSize 
 * @param {Number} aspectRatio 
 */
function getTargetSize(rotatedSrcSize, maxSize, aspectRatio) {
	let targetSize = {};

	//Limit the width to the max width
	if(maxSize.width && maxSize.width < rotatedSrcSize.width) {
		targetSize.width  = maxSize.width;
	}

	//Limit the height to the max height
	if(maxSize.height && maxSize.height < rotatedSrcSize.height) {
		targetSize.height = maxSize.height;
	}

	if(!targetSize.width && !targetSize.height) { //no max size was given (or the image was smaller then the max size) so targetSize will equal src size
		targetSize = rotatedSrcSize;
	}
	else if(!targetSize.height) {
		targetSize.height = targetSize.width / aspectRatio;
	}
	else if(!targetSize.width) {
		targetSize.width  = targetSize.height * aspectRatio;
	}

	return targetSize;
}

/**
 * Use srcSize because we don't know if domImg width and height is rotated or not (depends on browser handling of orientation)
 */
async function drawToCanvas(img, {srcSize, maxSize, orientation = 0, fitMode = FIT_COVER}) {
	const rotate = orientationHandlers[orientation].rotate;
	const rotatedSrcSize = orientSize(srcSize, rotate);
	const aspectRatio = rotatedSrcSize.width / rotatedSrcSize.height;
	const targetSize = getTargetSize(rotatedSrcSize, maxSize, aspectRatio);
	const aspectRatioChanged = (targetSize.width/targetSize.height) !== aspectRatio;

	let drawable;
	if(supportsImageBitmap()) {
		drawable = await toDrawableImageBitmap(img);
	}
	else {
		drawable = await toDrawable(img);
	}
	
	const canvas = document.createElement("canvas");
	canvas.width  = targetSize.width;
	canvas.height = targetSize.height;

	const fitBox = fitHandlers[fitMode](rotatedSrcSize, targetSize);

	const ctx = canvas.getContext("2d");

	//final transform to move the image into location
	ctx.translate(fitBox.x, fitBox.y);

	//transform to rotate the image arounds its center
	ctx.translate(fitBox.width*.5, fitBox.height*.5);
	orientationHandlers[orientation].handle(ctx);
	ctx.translate(-fitBox.width*.5, -fitBox.height*.5);

	//scale the image according to its new determined size
	ctx.scale(fitBox.width/rotatedSrcSize.width, fitBox.height/rotatedSrcSize.height);

	//rotate the image if required
	if(rotate !== 0) {
		ctx.translate(rotatedSrcSize.width*.5, rotatedSrcSize.height*.5);
		ctx.rotate(RADIAN * rotate); //rotate using radians
		ctx.translate(-srcSize.width*.5, -srcSize.height*.5); //move the image so that its center is at 0,0
	}

	ctx.drawImage(drawable, 0, 0);

	drawable.close();

	return {canvas, ctx};
}

function supportsImageBitmap() {
	return !!window.ImageBitmap;
}

function createImageBitmap(src, targetSize = null) {
	return targetSize !== null 
			? window.createImageBitmap(src, 0, 0, targetSize.width, targetSize.height)
			: window.createImageBitmap(src);
}

/**
 * Converts the image into a ImageBitmap object
 * @param {Image} img 
 * @param {Object} targetSize 
 */
async function toDrawableImageBitmap(img, targetSize = null) {
	if(img.src instanceof Blob) {
		return createImageBitmap(img.src, targetSize);
	}
	else if(typeof img.src === "string") {
		const domImg = await toDrawable(img);
		return createImageBitmap(domImg, targetSize);
	}
}

/**
 * Converts the image into DOMElement
 * @param {*} img 
 */
function toDrawable(img) {
	return new Promise((resolve, reject) => {   
		const domImg = new Image();
		domImg.close = () => {}; //add fake close method to emulate ImageBitmap
		domImg.onload = () => resolve(domImg);
		domImg.onerror = e => reject(e);
		domImg.src = img.toURL();
	});
}

/**
 * Export the CanvasElement to a Blob
 * @param {*} canvas 
 */
export function canvasToBlob(canvas) {
	if(canvas.toBlob) { //some browsers support this method
		return new Promise(resolve => {
			canvas.toBlob(resolve, "image/jpeg", .9);
		});
	}
	else { //this method is really slow but supported in most browsers
		const dataURL = canvas.toDataURL("image/jpeg", .9);
		const byteString = window.atob( dataURL.substr("data:image/jpeg;base64,".length) );
		const byteArray = new Uint8Array(byteString.length);
		for(let x=0, l = byteString.length;x < l;x++) {
			byteArray[x] = byteString.charCodeAt(x);
		}
		return Promise.resolve( new Blob([byteArray], {type : "image/jpeg"}) );
	}
}

/**
 * Convert the image into a CanvasElement
 * @param {*} img 
 * @param {*} param1 
 */
export async function imgToCanvas(img, {maxSize, aspectRatio, fixOrientation = false}) {
	let orientation = 0;
	if(fixOrientation && img.exif) {
		orientation = img.exif.get('MainImage.Orientation');
	}

	const srcSize = {width : img.width, height : img.height};

	const canvas = await drawToCanvas(img, {orientation, srcSize, aspectRatio, maxSize});

	return canvas;
}