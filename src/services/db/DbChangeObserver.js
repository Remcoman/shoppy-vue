const EventEmitter = require('events').EventEmitter;

export default function ({opts = {}, db}) {

	let changes = null;

	let o = Object.create(EventEmitter.prototype);
	opts = Object.assign({}, opts);

	if(opts.view) {
		opts.filter = "_view";
	}

	return Object.assign(o, {
		onChange(change) {
			this.emit('change', change);
		},

		onError(e) {
			this.emit('error', e);
		},

		start() {
			if(changes) {
				return;
			}

			changes = db.localDb.changes({
				...opts, //options for filtered view replication

				//required options
				include_docs : true,
				live         : true,
				since        : 'now'
			});

			changes
				.on('change', change => this.onChange(change))
				.on('error',  error => this.onError(error));
		},

		stop() {
			if(!changes) {
				return;
			}

			changes.cancel();
			changes = null;
		}
	});
}