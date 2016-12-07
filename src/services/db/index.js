import Db from './Db';

export default class DBService {
    constructor(config) {
        this.config = config;
        this.dbs = {};
    }

    db(name) {
        return this.dbs[name] ? this.dbs[name] : ( this.dbs[name] = new Db({config : this.config, name}) );
    }
}