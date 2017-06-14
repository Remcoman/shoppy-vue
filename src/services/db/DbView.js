import dbChangeObserver from './dbChangeObserver';
import dbSyncer from './dbSyncer';

export default function ({name, db, config}) {
	return {
		get localDb() {
			return db.localDb;
		},

		get remoteDb() {
			return db.remoteDb;
		},

		sync(opts={}) {
			const syncer = dbSyncer({db : this, opts : {...opts, filter : '_view', view : name}});
			syncer.start();
			return syncer;
		},

		async load(opts = {}) {
			let results;
			try {
				results = await db.localDb.query(name, {...opts, include_docs : true});
			}
			catch(e) {
				results = await db.remoteDb.query(name, {...opts, include_docs : true});
			}
			return results.rows.map(x => x.doc);
		},

		observeChanges() {
			const changes = dbChangeObserver({opts : {view : name}, db});
			changes.start();
			return changes;
		}
	}
}