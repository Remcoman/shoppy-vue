import DbChangeObserver from './DbChangeObserver';

export default class DbView {
    constructor({name, localDb, remoteDb, config}) {
        this.name     = name;
        this.localDb  = localDb;
        this.remoteDb = remoteDb;
        this.config   = config;
    }

    replicateFrom(opts = {}) {
        if(typeof opts.timeout === "undefined") {
            opts.timeout = 2000;
        }

        return Promise.race([
            this.localDb.replicate.from(this.remoteDb, {
                ...opts,

                view   : this.name,
                filter : "_view"
            }).catch(() => {}),

            new Promise((resolve) => window.setTimeout(resolve, opts.timeout))
        ]);
    }

    async load(opts = {}) {
        let results;
        try {
            results = await this.localDb.query(this.name, {...opts, include_docs : true})
        }
        catch(e) {
            results = await this.remoteDb.query(this.name, {...opts, include_docs : true})
        }
        return results.rows.map(x => x.doc);
    }

    observeChanges() {
        const {name,localDb} = this;
        const changes = new DbChangeObserver({filterOpts : {view : name}, db : this});
        changes.start();
        return changes;
    }
}