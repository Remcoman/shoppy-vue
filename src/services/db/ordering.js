/**
 * Created by remco on 17/10/16.
 */

const pouchCollate = require('pouchdb-collate');

let base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function decode(str) {
	return str.split("").map(x => base62.indexOf(x));
}

function encode(a) {
	return a.map(x => base62[x]).join("");
}

function midString(prev = "", next = "") {
    let p, n, pos, str;
    
    next = decode(next);
    prev = decode(prev);

    for (pos = 0; p == n; pos++) {
        p = pos < prev.length ? prev[pos] : -1;
        n = pos < next.length ? next[pos] : 62;
    }
    str = prev.slice(0, pos - 1);
    
    if (p === -1) { //previous was shorter then next
        while (n === 0) { //keep pushing start char
            n = pos < next.length ? next[pos++] : 62; 
            str.push(0);
        }
        if (n === 1) {
            str.push(0);
            n = 62;
        }
    }
    else if (p + 1 == n) { //a,b or b,c...nothing fits between so lets push a and calculate midpoint between 0 and z
        str.push(p);
        n = 62;
        while ((p = pos < prev.length ? prev[pos++] : 0) == 61) { //for the cases were the are z's
            str.push(61);
        }
    }
    str.push(Math.ceil((p + n) / 2));

	const val = encode(str);

	return {
		incr() {
			return midString(val, "");
		},

		decr() {
			return midString("", val);
		},

		valueOf() {
			return val;
		}
	}
}

export function insertOrder(list, afterId = null, beforeId = null) {
	const beforeItemIndex = list.findIndex(item => item._id === beforeId),
		  afterItemIndex = list.findIndex(item => item._id === afterId),
		  beforeOrder = beforeItemIndex > -1 ? list[beforeItemIndex].order : "",
		  afterOrder = afterItemIndex > -1 ? list[afterItemIndex].order : "";

	return midString(afterOrder, beforeOrder);
}

export const FIRST_ORDER = midString("", "");
export const INSERT_BY_ID = doc => doc._id;
export const INSERT_BY_ORDER = doc => ([doc.order, doc._id]);

export function insertIndex(list, doc, keyFactory = INSERT_BY_ID) {
	const key = keyFactory(doc);

	const index = list.findIndex(doc => {
		return pouchCollate.collate(keyFactory(doc), key) === 1; //get the first item where the existing item id is higher then the new item id
	});

	//add at end
	return index !== -1
		? index
		: list.length;
}