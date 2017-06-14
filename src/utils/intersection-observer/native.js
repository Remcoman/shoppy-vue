let id = 0;

export default {
    init(opts) {
        this.nativeObserver = new window.IntersectionObserver( this.handleIntersections.bind(this) );
        this.callbacks = Object.create(null);
    },

    handleIntersections(intersections) {
        for(let intersection of intersections) {
            this.callbacks[intersection.target.dataset.observeId](intersection.isIntersecting);
        }
    },

    observe(el, callback) {
        el.dataset.observeId = id++;
        this.callbacks[el.dataset.observeId] = callback;
        this.nativeObserver.observe(el);
    },

    unobserve(el) {
        this.nativeObserver.unobserve(el);
    },

    disconnect() {
        this.nativeObserver.disconnect();
    }
}

export function isSupported() {
    return !!window.IntersectionObserver;
}