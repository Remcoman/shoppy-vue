const PouchDB = require('pouchdb');

import {insertOrder, FIRST_ORDER} from './ordering';
import dbSyncer from './dbSyncer';
import dbView from './dbView';
import dbChangeObserver from './dbChangeObserver';
import generateId from './id';

export default function ({config, name}) {
	const {dbEndPoint} = config;
	
	const localDb  = new PouchDB({name});
	const remoteDb = new PouchDB({name : dbEndPoint + '/' + name, adapter : "http"});

	return {
		get localDb() {
			return localDb;
		},

		get remoteDb() {
			return remoteDb;
		},

		sync(opts={}) {
			const syncer = dbSyncer({db : this, opts});
			syncer.start();
			return syncer;
		},

		observeChanges(opts = {}) {
			const changes = dbChangeObserver({db : this, opts});
			changes.start();
			return changes;
		},

		async ensureDesignDoc(name) {
			try {
				const doc = await localDb.get(`_design/${name}`);
				return {replicated : false, doc};
			}
			catch(e) {
				if(e.status === 404) {
					await localDb.replicate.from(remoteDb, {key : `_design/${name}`});
					return {replicated : true, doc : await localDb.get(`_design/${name}`)};
				}
				else {
					throw e;
				}
			}
		},

		async load(opts = {}) {
			let results = await localDb.allDocs({...opts, include_docs : true});
			
			return results.rows
				.filter(row => row.id.indexOf("_design/") !== 0)
				.map(row => row.doc);
		},

		remove(docs) {
			if(!Array.isArray(docs)) {
				docs = [docs];
			}

			docs = docs.map(doc => {
				return {...doc, _deleted : true};
			});
			return localDb.bulkDocs(docs);
		},

		add(docs, {idPrefix = null, startOrder = FIRST_ORDER} = {}) {
			if(!Array.isArray(docs)) {
				docs = [docs];
			}

			let order = startOrder;

			const docsWithIds = docs.map((doc, index) => {
				order = order.incr();
				const id = doc._id ? doc._id : generateId(idPrefix);
				return {...doc, _id : id, order : order.valueOf()};
			});

			return this.update(docsWithIds);
		},

		async update(docs) {
			if(!Array.isArray(docs)) {
				docs = [docs];
			}

			const results = await localDb.bulkDocs(docs);

			//check if we have conflicts
			const conflictedResults = [];
			results.forEach((result, index) => {
				if(result.status === 409) {
					conflictedResults.push(docs[index]);
				}
				else if(result.ok) {
					docs[index] = Object.assign({}, docs[index], {_rev : result.rev});
				}
			});

			if(conflictedResults.length) {
				console.log("Conflict detected. Trying again with new revs", conflictedResults);

				return Promise.all(conflictedResults.map(doc  => {
						return localDb.get(doc._id, {revs : true, revs_info : true})
							.then(({_rev}) => Object.assign(doc, {_rev}))
							.catch(data => {
								//this means that the document was deleted?
								console.log(data);
							});
					}))
					.then(conflictedDocs => {
						const docMap = docs.reduce((prev, doc, index) => {
							prev[doc._id] = index;
							return prev;
						}, {});

						return this.update(conflictedDocs)
							.then(resolvedDocs => {
								resolvedDocs.forEach(doc => {
									docs[ docMap[doc._id] ] = doc;
								});
							});
					});
			}

			return docs;
		},

		view(name) {
			return dbView({name, db : this, config});
		}

	}
}