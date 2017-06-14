import db from './db';

const PouchDB = require('pouchdb');

export function disableDebug() {
	PouchDB.debug.disable('*');
}

export function dbService(config) {
	let dbs = {};

	return {
		db(name) {
			return dbs[name] ? 
				dbs[name] : 
				( dbs[name] = db({config : config, name}) );
		}
	}
}