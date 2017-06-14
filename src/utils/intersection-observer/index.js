import NativeImplementation, {isSupported as isNativeSupported} from './native';
import FallbackImplementation from './fallback';

class IntersectionObserver {
    constructor(opts = {}) {
        this.init(opts);
    }

    init() {
        //stub
    }

    observe(el, callback) {
        //stub
    }

    unobserve(el) {
        //stub
    }

    disconnect() {
        //stub
    }
}

if(isNativeSupported()) {
    Object.assign(IntersectionObserver.prototype, NativeImplementation);
}
else {
    Object.assign(IntersectionObserver.prototype, FallbackImplementation);
}

export default IntersectionObserver;