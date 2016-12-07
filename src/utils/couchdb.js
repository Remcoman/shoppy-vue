/**
 * Created by remco on 17/10/16.
 */

const pouchCollate = require('pouchdb-collate');

export function createInsertionOrder({afterId, isLast}) {
	if(!afterId && !isLast) {
		throw new Error("Either afterId or isLast should be defined");
	}

	let order = [0];

	if(afterId) {
		let parsedId = pouchCollate.parseIndexableString(afterId);
		order = parsedId.slice(0, -1); //remove the date component
		if(!isLast) {
			order.push(0); //go one level deeper
		}
	}

	return order;
}

export function generateID({idPrefix, order}) {
	let o = [...order, (new Date()).toJSON()];
	if(idPrefix) {
		o.unshift(idPrefix);
	}
	return pouchCollate.toIndexableString(o);
		//.replace(/\u0000/g, '\u0001');
}

export function insertIndex(list, id) {
	const index = list.findIndex(item => {
		return pouchCollate.collate(item._id, id) === 1; //get the first item where the existing item id is higher then the new item id
	});

	//add at end
	return index !== -1
		? index
		: list.length;
}