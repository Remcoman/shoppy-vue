
export default class DbSyncer {
	constructor({db, filterOpts}) {
		this.db = db;
		this.filterOpts = filterOpts;
		this.pouchDbSyncer = null;
	}

	get started() {
		return this.pouchDbSyncer !== null;
	}

	start() {
		if(this.started) {
			return;
		}

		this.pouchDbSyncer = this.db.localDb.sync(this.db.remoteDb, {
			...this.filterOpts,

			live : true, 
			retry : true
		}).on('change' , (e) => {
			console.debug("Incoming change", e);
		});
	}

	stop() {
		if(!this.started) {
			return;
		}

		this.pouchDbSyncer.cancel();
		this.pouchDbSyncer = null;
	}
}