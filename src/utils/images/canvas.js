const rect = (x,y,width,height) => ({x,y,width,height});

export const FIT_COVER   = Symbol();
export const FIT_CONTAIN = Symbol();

const orientationHandlers = {
    1 : {
        rotate : false, 
        handle : (ctx, srcSize) => {

        }
    },
    2 : {
        rotate : false, 
        handle : (ctx, srcSize) => {
            
        }
    },
    3 : {
        rotate : false, 
        handle : (ctx, srcSize) => {
            
        }
    },
    4 : {
        rotate : false, 
        handle : (ctx, srcSize) => {
            
        }
    },
    5 : {
        rotate : true, 
        handle : (ctx, srcSize) => {
            
        }
    },
    6 : {
        rotate : true, 
        handle : (ctx, srcSize) => {
            
        }
    },
    7 : {
        rotate : true, 
        handle : (ctx, srcSize) => {
            
        }
    },
    8 : {
        rotate : true, 
        handle : (ctx, srcSize) => {
            
        }
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
 * Use srcSize because we don't know if domImg width and height is rotated or not (depends on browser handling of orientation)
 */
async function drawToCanvas(img, {orientation = 0, srcSize, targetSize, fitMode = FIT_COVER}) {
    let drawable;

    if(supportsImageBitmap()) {
        if(targetSize.width / targetSize.height === srcSize.width / srcSize.height) {
            console.debug("Draw image bitmap resize");
            drawable = await toDrawableImageBitmap(img, targetSize);
            srcSize = targetSize;
        }
        else {
            console.debug("Draw image bitmap");
            drawable = await toDrawableImageBitmap(img);
        }
    }
    else {
        drawable = await toDrawable(img, targetSize);
    }

    if(orientationHandlers[orientation].rotate) {
        srcSize = {width : srcSize.height, height : srcSize.width};
    }

    const aspectRatio = srcSize.width / srcSize.height;

    if(!targetSize.width && !targetSize.height) {
        throw new Error("No target size given");
    }

    if(!targetSize.height) {
        targetSize.height = targetSize.width / aspectRatio;
    }
    else if(!targetSize.width) {
        targetSize.width = targetSize.height * aspectRatio;   
    }

    const canvas = document.createElement("canvas");
    canvas.width  = targetSize.width;
    canvas.height = targetSize.height;

    const r = fitHandlers[fitMode](srcSize, targetSize);
    console.debug(r, srcSize, targetSize);

    const ctx = canvas.getContext("2d");
    //debugger;

    orientationHandlers[orientation].handle(ctx, srcSize);

    ctx.scale(r.width/srcSize.width, r.height/srcSize.height);
    ctx.translate(r.x, r.y);
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

async function toDrawableImageBitmap(img, targetSize = null) {
    if(img.src instanceof Blob) {
        return createImageBitmap(img.src, targetSize);
    }
    else if(typeof img.src === "string") {
        const domImg = await toDrawable(img);
        return createImageBitmap(domImg, targetSize);
    }
}

function toDrawable(img) {
    return new Promise((resolve, reject) => {   
        const domImg = new Image();
        domImg.close = () => {}; //add fake close method to emulate ImageBitmap
        domImg.onload = () => resolve(img);
        domImg.onerror = () => reject();
        domImg.src = img.toURL();
    });
}

export function canvasToBlob(canvas) {
    if(canvas.toBlob) {
        return new Promise(resolve => {
            canvas.toBlob(resolve, "image/jpeg", .9);
        });
    }
    else {
        const dataURL = canvas.toDataURL("image/jpeg", .9);
        const byteString = window.atob( dataURL.substr("data:image/jpeg;base64,".length) );
        const byteArray = new Uint8Array(byteString.length);
        for(let x=0, l = byteString.length;x < l;x++) {
            byteArray[x] = byteString.charCodeAt(x);
        }
        return Promise.resolve( new Blob([byteArray], {type : "image/jpeg"}) );
    }
}

export async function imgToCanvas(img, {targetSize, fixOrientation = false}) {
    let orientation = 0;
    if(fixOrientation) {
        orientation = img.exif.get('MainImage.Orientation');
    }

    const srcSize = {width : img.width, height : img.height};

    const canvas = await drawToCanvas(img, {orientation, srcSize, targetSize});

    return canvas;
}