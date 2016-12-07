const EventEmitter = require('events').EventEmitter;

export default class DbChangeObserver extends EventEmitter {
	constructor({filterOpts = {}, db}) {
		super();

		this._changes = null;

		this.db = db;
		this.filterOpts = filterOpts;
	}

	onChange(change) {
		this.emit('change', change);
	}

	onError(e) {
		this.emit('error', e);
	}

	start() {
		if(this._changes) {
			return;
		}

		let opts = {};

		if(this.filterOpts.view) {
			opts.filter = "_view";
			opts.view = this.filterOpts.view;
		}
		else if(this.filterOpts.doc_ids) {
			opts.doc_ids = this.filterOpts.doc_ids;
		}
		else if(this.filterOpts.filter) {
			opts.filter = this.filterOpts.filter;
			opts.query_params = this.filterOpts.query_params || {};
		}

		this._changes = this.db.localDb.changes({
			...opts, //options for filtered view replication

			//required options
			include_docs : true,
            live         : true,
            since        : 'now'
        });

		this._changes
			.on('change', change => this.onChange(change))
			.on('error',  error => this.onError(error));
	}

	stop() {
		if(!this._changes) {
			return;
		}

		this._changes.cancel();
		this._changes = null;
	}
}