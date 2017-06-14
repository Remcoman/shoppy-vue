<template>
	<div>
		<div ref="editor"></div> 
	</div>
</template>

<script>
	import Quill from 'quill';
	import Delta from 'quill-delta';

	export default {
		name : "rich-text-editor",

		props : {
			value : {type : Object, required : false, default : null}
		},

		mounted() {
			this.editor = new Quill(this.$refs.editor, {
				theme : 'snow',

				modules : {
					toolbar : [
						['bold', 'italic', 'underline', 'strike'],

						 [{ 'color': [] }],

						[{ 'list': 'ordered'}, { 'list': 'bullet' }],

						['clean']
					]
				}
			});

			this.editor.on('text-change', change => {
				this.$emit('input', change);
			});

			this.editor.setContents(this.value, 'silent');
		},

		watch : {
			value(newValue) {
				this.editor.setContents(newValue, 'silent');
			}
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