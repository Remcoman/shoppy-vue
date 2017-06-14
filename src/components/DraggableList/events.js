
function locateChild(from, to) {
    let c = from;
    while(c.parentNode !== to) {
        c = c.parentNode;
    }
    return c;
}

function getWindowPoint(e) {
    if(e instanceof TouchEvent) {
        const touch = e.changedTouches[0];
        return {x : touch.pageX, y : touch.pageY};
    }
    else {
        return {x : e.pageX, y : e.pageY};
    }
}

function getTarget(e) {
    if(e instanceof TouchEvent) {
        return e.changedTouches[0].target;
    }
    else {
        return e.target;
    }
}

function callListener(listeners, name, ...args) {
    for(let listener of listeners) {
        listener[name](...args);
    }
}

var supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true;
    }
  });
  window.addEventListener("test", null, opts);
} catch (e) {} //eslint-disable-line

function getScrollY() {
    return document.body.scrollTop;
}

function getElementVerticalBounds(el) {
    let {top, bottom} = el.getBoundingClientRect();
    const scrollY = getScrollY();
    top += scrollY;
    bottom += scrollY;
    return {top, bottom};
}

export default function (el) {
    let dragChild = null;
    let dragChildBounds = null;
    let dragStartPoint = null;
    let windowSize = [0,0];
    let contentHeight;
    let listeners = [];
    let enabled = false;

    return {
        addListener(listener) {
            listeners.push(listener);
        },

        onStart(e) {
            let target = getTarget(e);
            if(!("dragHandle" in target.dataset)) {
                return;
            }

            e.preventDefault();
            
            dragChild = locateChild(target, el);
            dragStartPoint = getWindowPoint(e);
            dragChildBounds = getElementVerticalBounds(dragChild);
            windowSize = [window.innerWidth, window.innerHeight];
            contentHeight = document.body.scrollHeight;
            
            callListener(listeners, 'dragStart', dragChild);

            document.body.addEventListener("mousemove", this, false);
            document.body.addEventListener("mouseup", this);
            document.body.addEventListener("touchmove", this, supportsPassive ? { passive: false } : false);
            document.body.addEventListener("touchend", this);
        },

        onMove(e) {
            e.preventDefault();

            let relativeDragPoint = getWindowPoint(e);
            relativeDragPoint.y -= dragStartPoint.y;

            const [windowWidth, windowHeight] = windowSize;
            const scrollY = getScrollY();
            const childBottom = Math.min(dragChildBounds.bottom + relativeDragPoint.y, contentHeight);
            const childTop = Math.max(dragChildBounds.top + relativeDragPoint.y, 0);
            const windowBottom = Math.min(windowHeight + scrollY, contentHeight);
            const windowTop = Math.max(scrollY, 0);
            
            if(childTop < windowTop) {
                window.scrollTo(0, scrollY - (windowTop - childTop));
            }
            else if(childBottom > windowBottom) {
                window.scrollTo(0, scrollY + (childBottom - windowBottom));
            }

            callListener(listeners, 'dragMove', relativeDragPoint);

            //update the position
            dragChild.style.transform = `translate(0, ${relativeDragPoint.y}px)`;
        },

        onEnd(e) {
            callListener(listeners, 'dragEnd');

            document.body.removeEventListener("touchmove", this);
            document.body.removeEventListener("touchend", this);
            document.body.removeEventListener("mousemove", this);
            document.body.removeEventListener("mouseup", this);
        },

        enable() {
            if(!enabled) {
                el.addEventListener("mousedown", this, false);
                el.addEventListener("touchstart", this, supportsPassive ? { passive: false } : false);
            }
        },

        disable() {
            if(enabled) {
                el.removeEventListener("touchstart", this);
                el.removeEventListener("mousedown", this);
            }
        },

        handleEvent(e) {
            switch(e.type) {
                case "mousedown" :
                case "touchstart" : {
                    this.onStart(e);
                    break;
                }

                case "mousemove" :
                case "touchmove" : {
                    this.onMove(e);
                    break;
                }

                case "mouseup" :
                case "touchend" : {
                    this.onEnd(e);
                    break;
                }
            }
        }
    }
}