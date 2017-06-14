
import events from './events';
import dragAndDrop from './dragAndDrop';
import Vue from 'vue';

export default {
    props : {
        items : {type : Array, required : true},
        enabled : {type : Boolean, default : false},
        transition : {type : Object, default : null},
        classNames : {type : Object, default : {target : 'item--target', dragging : 'item--dragging'}}
    },

    render(h) {
        const rootTag = this.transition ? "transition-group" : "div";
        const props = this.transition || {};

        const classNames = {
            'draggable-list' : true,
            'draggable-list--prevent-move' : this.preventAnimateMove
        };

        return h(rootTag, {props, 'class' : classNames}, this.itemsCopy.map(item => {
            return this.$scopedSlots.item({item});
        }));
    },

    data() {
        return {
            itemsCopy : this.items.concat(),
            preventAnimateMove : false
        }
    },
        
    mounted() {
        this.updateDragAndDropHandlers();
    },

    methods : {
        updateDragAndDropHandlers() {
            if(!this.items.length) {
                return;
            }
            Vue.nextTick(() => {
                this.dragAndDropHandler = dragAndDrop(this.$el);
                this.dragAndDropHandler.classNames = this.classNames;
                this.dragAndDropHandler.addListener(this);

                this.eventHandler = events(this.$el);
                this.eventHandler.addListener(this.dragAndDropHandler);
            });
        },

        drop(srcIndex, targetIndex) {
            this.preventAnimateMove = true;

            const srcItem = this.itemsCopy[srcIndex];
            const targetItem = this.itemsCopy[targetIndex];

            this.itemsCopy.splice(srcIndex, 1); //remove at src index
            this.itemsCopy.splice(targetIndex, 0, srcItem); //add at 

            setTimeout(() => {
                this.preventAnimateMove = false;
            }, 30);

            this.$emit('drop', {
                srcId    : srcItem.id, 
                targetId : targetItem.id
            });
        }
    },

    watch : {
        transition() {
            this.updateDragAndDropHandlers();
        },

        items(newValue) {
            this.itemsCopy = newValue.concat();
        },

        classNames(newValue) {
            if(this.dragAndDropHandler) {
                this.dragAndDropHandler.classNames = newValue;
            }
        },

        enabled(newValue) {
            if(newValue) {
                this.eventHandler.enable();
            }
            else {
                this.eventHandler.disable();
            }
        }
    }
}