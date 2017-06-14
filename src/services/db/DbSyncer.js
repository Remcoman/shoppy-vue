
export default function ({db, opts}) {
	let pouchDbSyncer = null;
	let started = false;
	
	return {
		get started() {
			return pouchDbSyncer !== null;
		},

		start() {
			if(this.started) {
				return;
			}

			pouchDbSyncer = db.localDb.sync(db.remoteDb, {
				...opts,

				live : true, 
				retry : true
			}).on('change' , (e) => {
				console.debug("Incoming change", e);
			}).on('complete', (e) => {
				console.error(e);
			});
		},

		stop() {
			if(!this.started) {
				return;
			}

			pouchDbSyncer.cancel();
			pouchDbSyncer = null;
		}
	}
}