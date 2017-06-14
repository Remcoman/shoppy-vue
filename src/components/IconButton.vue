<template>
    <button class="icon-btn" :class="clz" @click="handleClick">
        <i class="fa" :class="'fa-' + icon"></i>

        <slot></slot>
    </button>
</template>

<script>
    export default {
        props : {
            icon : {type : String, required : true},
            reverse : {type : Boolean, required : false, default : false},
            excludeColor : {type : Boolean, required : false, default : false}
        },

        methods : {
            handleClick(e) {
                this.$emit('click', e);
            }
        },

        computed : {
            clz() {
                let clz = [];

                if(this.reverse) {
                    if(!this.excludeColor) {
                        clz.push('primary-color-bg');
                    }
                    clz.push('icon-btn--reverse');
                }
                else {
                    if(!this.excludeColor) {
                        clz.push('primary-color');
                    }
                }

                return clz;
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import '~@/style/variables';

    .icon-btn {
        vertical-align: middle;
        width:1.5em;
        height:1.5em;
        line-height:1.5em;
        border-radius:50%;
        transition:transform .4s ease-out;
        display:flex;
        align-items: center;
        align-content: center;

        > .fa {
            width:100%;
        }

        &:active {
            transform:scale(.9);
        }

        &.primary-color {
            background:$whiteColor;
        }

        &--reverse {
            color:$whiteColor;
        }
    }
</style>