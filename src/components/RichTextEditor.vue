<template>
    <div>
        <div ref="editor"></div> 
    </div>
</template>

<script>
    import Quill from 'quill';

    export default {
        mounted() {
            this.editor = new Quill(this.$refs.editor, {
                theme : 'snow'
            });
        },

        destroyed() {
            this.editor = null;
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import '~quill/dist/quill.core.css';
    @import '~quill/dist/quill.snow.css';

    .ql-container {height:calc(100% - 66px);}
</style>