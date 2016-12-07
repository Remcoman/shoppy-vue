<template>
    <div class="product" :class="{'product--focused' : focused}">
        <button :disabled="product.dummy" :class="{'product__remove-btn--enabled' : editable}" @click="remove" class="product__remove-btn">
            <i class="fa fa-minus-circle"></i>
        </button>

        <div class="product__wrap">
            <div class="product__name" v-if="!editable" :class="{'product__name--done' : product.done}" @click="clickItem">{{product.name}}</div>

            <form @submit.prevent="submitChange" class="product__form" v-if="editable">
                <multiline-text-input ref="name" class="product__input"
                    :maxlength="100"
                    :value="product.name" :focus="focused"
                    @focus="handleFocus" @blur="changeName" @paste="handlePaste">
            </form>
        </div>
    </div>
</template>

<script>
    import MultilineTextInput from './MultilineTextInput'

    export default {
        name : "product-list-item", 

        props : {
            'product'    : {type : Object, required : true},
            'focused'    : {type : Boolean, required : false, default : false},
            'editable'   : {type : Boolean, required : false, default : false},
            'eventProxy' : {type : Object, required : false, default : null}
        },

        methods : {
            $emitProxy(name, ...args) {
                this.$emit(name, ...args);
                if(this.eventProxy) {
                    this.eventProxy.$emit('proxy', ...[name].concat(args));
                }
            },

            changeName(e) {
                this.$emitProxy('nameChanged', {id : this.product.id, name : e.target.value});
            },

            handleFocus() {
                this.$emitProxy('focusInput', {id : this.product.id});
            },

            handlePaste(event) {
                event.preventDefault();

                const input = this.$refs.name;
                const text = event.clipboardData.getData("text/plain");
                const lines = text.split(/[\r\n]+/).filter(line => line !== "");
                const firstLine = lines.shift();

                input.value = input.value.substring(0, input.selectionStart) + firstLine + input.value.substring(input.selectionEnd);
                this.submitChange();

                //for remaining lines an pasteBelow is triggered
                this.$emitProxy('pasteBelow', {id : this.product.id, names : lines});
            },

            submitChange() {
                this.$refs.name.blur(); //this will trigger a blur which will trigger an changeName
            },

            clickItem() {
                if(!this.editable) {
                    this.$emitProxy('done', {id : this.product.id});
                }
            },

            remove() {
                this.$emitProxy('remove', {id : this.product.id});
            }
        },

        components : {
            MultilineTextInput
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import '~style/functions';

    @keyframes appear-item {
        0% {opacity:0;}
        100% {opacity:1;}
    }

    @keyframes disappear-item {
        0% {height:40px; overflow:hidden;}
        100% {height:0; overflow:hidden;}
    }

    .product { 
        display:flex; 
        padding:0; 
        border-bottom:1px solid #ececec; 
        transition:background-color .2s ease-out;

        $itemHeight:px-rem(40px);

        &--enter-active {animation: appear-item .5s;}
        &--leave-active {animation: disappear-item .3s ease-out;}

        &.product--focused { position:relative;
            &:before {
                content:""; 
                position:absolute; 
                z-index:-1; 
                left:-15px; 
                right:-15px; 
                height:100%; 
                background-color:#f7f7f7;
            }
        }

        &__remove-btn {
            display:block; 
            padding:0; 
            overflow:hidden; 
            width:0; 
            opacity:0; 
            font-size:px-rem(18px); 
            color:#f00; 
            text-align: left; 
            transition:width .3s ease-out, opacity .4s ease-out, transform .3s ease-out;

            &[disabled] {opacity:0 !important; transition:none;}

            &--enabled {opacity:1; width:px-rem(30px); }
        }

        &__wrap {
            display:flex; 
            flex:2; 
            padding:px-rem(9px) 0;
        }

        &__name, &__form {
            display:block; 
            width:100%;
        }
        
        &__name, &__input { letter-spacing: 1px; }

        &__name {cursor:default; 
            &--done:not(&--editing) {
                text-decoration: line-through; 
                opacity:.5;
            }
        }

        &__input {
            border:0; 
            background:transparent; 
            padding:0; 
            width:100%;
            
            &:focus {outline:none;}
        }
    }
</style>