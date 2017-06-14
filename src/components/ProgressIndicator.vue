<template>
    <svg :width="size" :height="size" :viewBox="viewBox">
        <circle 
            ref="circle"
            class="progress-indicator__circle"
            :class="{'progress-indicator__circle--no-ani' : noAni}"
            :transform="transform" 
            cx="0" 
            :r="r" 
            cy="0" 
            :stroke="color" 
            fill="none" 
            :stroke-width="strokeWidth" 
            :stroke-dashoffset="dashOffset" 
            :stroke-dasharray="dashArray"
            />
    </svg>
</template>

<script>
    export default {
        name : "progress-indicator",

        props : {
            color : {required : false, default : "#f00", type : String},
            size  : {required : false, default : 10, type : Number},
            value : {required : false, default : 0, type : Number}
        },

        data : () => ({
            noAni : false
        }),

        computed : {
            r() {
                return this.size/4;
            },

            transform() {
                return `translate(${this.size/2},${this.size/2}) rotate(-90)`;
            },

            viewBox() {
                return "0 0 " + this.size + " " + this.size;
            },

            dashArray() {
                return (this.size/4) * (Math.PI * 2);
            }, 

            dashOffset() {
                return this.dashArray * (1-this.value);
            },

            strokeWidth() {
                return this.size/2;
            }
        },

        watch : {
            value(val, oldValue) {
                if(val < oldValue) {
                    this.noAni = true;
                    this.$forceUpdate();
                    this.$nextTick(() => {
                        this.noAni = false;
                    });
                }
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    .progress-indicator {
        &__circle {transition: stroke-dashoffset .4s;
            &--no-ani {transition:none;}
        }
    }
</style>