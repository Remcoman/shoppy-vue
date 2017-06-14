import RPCClient, {RPCConnector} from 'ws-json-rpc';
import Delta from 'quill-delta';
const EventEmitter = require('events').EventEmitter;

export default function ({host, recipeID, dbService}) {
	const db = dbService.db("preparation_deltas");
	const events = Object.create(EventEmitter.prototype);

	let offline = true;
	let stopped = false;
	let dbRev;
	let rev = 0;
	let changesDelta = new Delta();
	let baseDelta = new Delta();
	let flushQueue = Promise.resolve();
	let initPromise = null;
	let ws;
	let rpc;
	let realm;
	let loaded;

	function outgoingChange({rev, delta}) {
		return {rev, delta : delta.ops};
	}

	function incomingChange({rev, delta}) {
		rev = parseInt(rev, 10);

		if(isNaN(rev)) {
			throw new Error(`Invalid rev expected number got ${JSON.stringify(rev)}`);
		}

		if(!Array.isArray(delta)) {
			throw new Error(`Invalid delta expected array got ${JSON.stringify(delta)}`);
		}

		return {rev, delta : new Delta(delta)};
	}

	function connect() {
		ws = new RPCConnector(host);
		rpc = new RPCClient(ws);
		realm = rpc.realm(`recipe.${recipeID}`);

		realm.subscribe('change', change => {
			change = incomingChange(change);

			//we should accept any change but only process them after initializement has completed
			initPromise = initPromise.then(() => {
				//if might occur that the change was for a older rev which was later processed in the init call
				if(change.rev <= rev) { 
					console.warn("got out of date rev " + change.rev);
					return;
				}

				console.log("incoming change", change);

				baseDelta = baseDelta.compose(change.delta);
				rev = change.rev;

				events.emit('change', change.delta);
			});
		});

		ws.onopen = evt => {
			if (changesDelta.length()) {
				console.log("init with buffer");

				initPromise = realm.call("init", outgoingChange({rev, delta : changesDelta}))
					.then(change => {
						change = incomingChange(change);

						console.log("Got incoming change from init", change);

						//remove offline buffered changes from the database
						db.localDb.remove({_id : recipeID, _rev : dbRev})
							.catch(e => {
								console.log(e);
							});

						dbRev = undefined;
						rev = change.rev;
						changesDelta = new Delta();
					})
					.catch(e => {
						console.log(e);
					})
			}
			else {
				console.log("init and waiting for snapshot");

				//init without any buffered changes. We should get a snapshot
				initPromise = realm.call("init", null)
					.then(change => {
						change = incomingChange(change);

						console.log("Got snapshot!", change);

						rev = change.rev;
						baseDelta = change.delta;

						events.emit('snapshot', baseDelta);
					})
					.catch(e => {
						console.log(e);
					});
			}

			offline = false;
		} 

		ws.onclose = () => { 
			offline = true;
			console.log("offline");
		}  
	}

	function flushChanges() {
		const sendDelta = changesDelta;

		flushQueue = flushQueue.then(() => {
			return new Promise((resolve, reject) => {
				console.log("send change", sendDelta);

				realm.call('change', outgoingChange({rev, delta : sendDelta}))
					.then(change => {
						change = incomingChange(change);

						console.log("confirmed change", change);

						baseDelta = baseDelta.compose(change.delta);
						rev = change.rev;

						resolve();
					})
					.catch(() => {
						console.log('error when sending change');
						changesDelta = sendDelta.compose(changesDelta);
					});

				changesDelta = new Delta();
			});
		});
	}

	let debug = {};
	if(process.env.NODE_ENV === "development") {
		debug = {
			pause() {
				ws.close();
			},

			continue() {
				connect();
			}
		}
	}

	return Object.assign(events, debug, {
		stop() {
			if(loaded) {
				ws.close();
			}

			stopped = true;
		},

		delta() {
			return baseDelta.compose(changesDelta);
		},

		load(existingPreparation) {
			if(stopped) {
				return Promise.resolve();
			}
			
			return db.localDb.get(recipeID)
				.then(doc => {
					dbRev = doc._rev;
					baseDelta = new Delta(doc.baseDelta);
					changesDelta = new Delta(doc.changesDelta);
					rev = doc.rev;

					console.log("Got cached data from local db", changesDelta);
				})
				.catch(e => {
					baseDelta = new Delta(existingPreparation.delta);
					changesDelta = new Delta();
					rev = existingPreparation.rev;
				})
				.then(() => connect())
				.then(() => {
					loaded = true;
				});
		},

		addChange(delta) {
			//What todo when connection is not yet done

			if(!loaded) {
				throw new Error("Can only add delta to loaded client");
			}

			if(stopped) {
				throw new Error("Can't add change to closed collab client");
			}

			if(!delta.length()) {
				console.warn("Empty change detected!");
				return;
			}

			changesDelta = changesDelta.compose(delta);

			if(!offline) {
				flushChanges();	
			}
			else {
				db.update({
					_rev : dbRev, 
					_id : recipeID, 
					changesDelta : changesDelta.ops, 
					rev, 
					baseDelta : baseDelta.ops
				}).then(items => {
					console.log('updated offline change');
					dbRev = items[0]._rev;
				});
			}
		}
	});
}