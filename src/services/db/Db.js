const PouchDB = require('pouchdb');

import {createInsertionOrder, generateID} from '../../utils/couchdb';
import DbSyncer from './DbSyncer';
import DbView from './DbView';
import DbChangeObserver from './DbChangeObserver';

export default class Db {
    constructor({config, name}) {
        this.config  = config;
        this.name    = name;
    
        const {dbEndPoint} = config;

        this.localDb  = new PouchDB(name);
        this.remoteDb = new PouchDB({name : dbEndPoint + '/' + name, adapter : "http"});
    }

    sync(filterOpts={}) {
        const syncer = new DbSyncer({db : this, filterOpts});
        syncer.start();
        return syncer;
    }

    observeChanges(filterOpts = {}) {
        const changes = new DbChangeObserver({db : this, filterOpts});
        changes.start();
        return changes;
    }

    /**
     * This function does not currently work because remote database requires admin rights for view creation
     */
    createDesignDoc(name, map) {
        var doc = {
            _id : "_design/" + name,
            views : {
                [name] : {
                    map : map.toString()
                }
            }
        };
        return this.localDb.put(doc);
    }

    async load(opts = {}) {
        let results = await this.localDb.allDocs({...opts, include_docs : true});
        
        return results.rows
            .filter(row => row.id.indexOf("_design/") !== 0)
            .map(row => row.doc);
    }

    remove(docs) {
        if(!Array.isArray(docs)) {
            docs = [docs];
        }

        docs = docs.map(doc => {
            return {...doc, _deleted : true};
        });
        return this.localDb.bulkDocs(docs);
    }

    add(docs, opts) {
        if(!Array.isArray(docs)) {
            docs = [docs];
        }

        if(!opts) {
            throw new Error("options are required for db service add");
        }

        const order = createInsertionOrder(opts);

        let {idPrefix} = opts;

        const docsWithIds = docs.map(doc => {
            order[order.length-1]++;
            return Object.assign({}, doc, {_id : generateID({idPrefix, order})});
        });

        return this.localDb.bulkDocs(docsWithIds).then(() => docsWithIds);
    }

    update(docs) {
        if(!Array.isArray(docs)) {
            docs = [docs];
        }

        return this.localDb.bulkDocs(docs);
    }

    replicateFrom(opts = {}) {
        if(typeof opts.timeout === "undefined") {
            opts.timeout = 2000;
        }

        return Promise.race([
            this.localDb.replicate.from(this.remoteDb, opts).catch(() => {}),

            new Promise((resolve) => window.setTimeout(resolve, opts.timeout))
        ]);
    }

    view(name) {
        return new DbView({name, localDb : this.localDb, remoteDb : this.remoteDb, config : this.config});
    }
}