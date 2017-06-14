
function debounce(fn) {
    let requested = false;

    return function (arg) {
        if(requested) {
            return;
        }
        window.requestAnimationFrame(() => {
            requested = false;
            fn.call(this, arg);
        });
        requested = true;
    }
}

export default {
    init({axis = "xy"}) {
        this.observed = new Map();
        this.viewportSize = [0, 0];
        this.viewportDirty = true;
        this.axisY = axis.indexOf("y") > -1;
        this.axisX = axis.indexOf("x") > -1;

        window.addEventListener('resize', this, false);
        window.addEventListener('scroll', this, false);
    },

    handleEvent : debounce(function (e) {
        switch(e.type) {
            case 'resize' :
                this.viewportDirty = true;
            case 'scroll' :
                this.detectIntersections();
                break;
        }
    }),

    getViewportSize() {
        if(this.viewportDirty) {
            this.viewportSize[0] = window.innerWidth;
            this.viewportSize[1] = window.innerHeight;
            this.viewportDirty = false;
        }
        return this.viewportSize;
    },

    detectIntersections() {
        const [viewportWidth, viewportHeight] = this.getViewportSize();

        for(const [el, item] of this.observed.entries()) {
            const elBounds = el.getBoundingClientRect();
            const intersecting = (
               (!this.axisY || elBounds.bottom > 0 && elBounds.top < viewportHeight) && 
               (!this.axisX || elBounds.right > 0 && elBounds.left < viewportWidth)
            );
            
            if(item.intersecting !== intersecting) {
                item.intersecting = intersecting;
                item.callback(intersecting);
            }
        }
    },

    observe(el, callback) {
        this.observed.set(el, {callback, intersecting : undefined});
        this.detectIntersections();
    },

    unobserve(el) {
        this.observed.delete(el);
    },

    disconnect() {
        window.removeEventListener('resize', this, false);
        window.removeEventListener('scroll', this, false);
    }
}