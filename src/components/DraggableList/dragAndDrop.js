function getScrollPos() {
    return {
        x : document.documentElement.scrollLeft,
        y : document.documentElement.scrollTop
    }
}

function getBounds(target) {
    const targetBounds = target.getBoundingClientRect();
    const scrollPos = getScrollPos();
    return {
        x      : targetBounds.left + scrollPos.x, 
        y      : targetBounds.top + scrollPos.y,
        width  : targetBounds.width,
        height : targetBounds.height
    };
}

function getChilds(el) {
    return Array.from(el.childNodes).filter(child => child.nodeType === child.ELEMENT_NODE);
}

function getDropIndex(searchBounds, childList) {
    let centerY = searchBounds.y + searchBounds.height/2;

    for(let i=0, l = childList.length;i < l;i++) {
        let {bounds : otherBounds} = childList[i];

        let intersects = 
            searchBounds.y + searchBounds.height > otherBounds.y && 
            searchBounds.y < otherBounds.y + otherBounds.height;

        if(!intersects) {
            continue;
        }

        if(searchBounds.y > otherBounds.y && centerY < otherBounds.y + otherBounds.height) { //going up
            return i;
        }

        if(searchBounds.y < otherBounds.y && centerY > otherBounds.y) { //going down
            return i;
        }
        
    }

    return -1;
}

function callListener(listeners, name, ...args) {
    for(let listener of listeners) {
        listener[name](...args);
    }
}

export default function (el) {
    let listeners = [];
    let childs = null;
    let dragIndex = -1;
    let dragBounds = null;
    let dropIndex = -1;
    let classNames = {
        'target' : 'item--target',
        'moving' : 'item--moving'
    };

    return {
        set classNames(value) {
            classNames = value;
        },

        addListener(listener) {
            listeners.push(listener);
        },

        dragStart(dragChild) {
            childs = getChilds(el).map(child => ({el : child, bounds : getBounds(child)}));
            dragIndex = childs.findIndex(({el}) => dragChild === el);
            dragBounds = Object.assign({}, childs[dragIndex].bounds);

            for(let {el} of childs) {
                if(el !== dragChild) {
                    el.classList.add(classNames.target);
                }
            }

            dragChild.classList.add(classNames.dragging);
        },

        dragMove(relativeDragPoint) {
            let {el : dragChild, bounds : initDragBounds} = childs[dragIndex];

            //update the dragBounds
            dragBounds.y = relativeDragPoint.y + initDragBounds.y;

            dropIndex = getDropIndex(dragBounds, childs);

            if(dropIndex === -1) {
                return;
            }

            for(let i=0; i < childs.length; i++) {
                let {el : childEl, bounds : childBounds} = childs[i];

                if(dragIndex > dropIndex && i >= dropIndex && i < dragIndex) {
                    childEl.style.transform = `translate(0, ${dragBounds.height}px)`;
                }
                else if(dragIndex < dropIndex && i > dragIndex && i <= dropIndex) {
                    childEl.style.transform = `translate(0, ${-dragBounds.height}px)`;
                }
                else if(i !== dragIndex) {
                    childEl.style.transform = '';
                }
            }

        },

        dragEnd() {
            let {el : dragChild} = childs[dragIndex];

            for(let {el} of childs) {
                el.style.transform = '';
                el.classList.remove(classNames.target);
            }

            dragChild.classList.remove(classNames.dragging);

            if(dropIndex === -1 || dragIndex === dropIndex) {
                return;
            }

            callListener(listeners, 'drop', dragIndex, dropIndex);
        }
    }
}