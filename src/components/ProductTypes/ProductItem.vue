<template src="./ProductItem.html"></template>
<style lang="scss" src="./ProductItem.scss"></style>

<script>
	import MultilineTextInput from '@/components/MultilineTextInput';
	import IconButton from '@/components/IconButton';
	import Vue from 'vue';

	export default {
		props : {
			'product'    : {type : Object, required : true},
			'focused'    : {type : Boolean, required : false, default : false},
			'editable'   : {type : Boolean, required : false, default : false},
			'dragHandle' : {type : Boolean, required : false, default : false}
		},

		data() {
			return {
				name  : this.product.name,
				submittedName : this.product.dummy ? null : this.product.name,
				flashHighlight : false
			}
		},

		methods : {
			handleChange(blur) {
				if(this.submittedName !== this.name) {
					this.submittedName = this.name;
					this.$emit('nameChanged', {id : this.product.id, name : this.name, blur});
				}
			},

			handleFocus() {
				this.$emit('focusInput', {id : this.product.id});
			},

			handlePaste(event) {
				event.preventDefault();

				const text = event.clipboardData.getData("text/plain");
				const lines = text.split(/[\r\n]+/).filter(line => line !== "");
				const firstLine = lines.shift();

				this.name = this.name.substring(0, event.target.selectionStart) + firstLine + this.name.substring(event.target.selectionEnd);
				
				this.changeName();

				//for remaining lines an pasteBelow is triggered
				if(lines.length) {
					this.$emit('pasteBelow', {id : this.product.id, names : lines});
				}
			},

			clickItem() {
				if(!this.editable) {
					this.flashHighlight = true;
					setTimeout(() => {
						this.flashHighlight = false;
					}, 400);

					this.$emit('done', {id : this.product.id});
				}
			},

			remove() {
				this.$emit('remove', {id : this.product.id});
			}
		},

		components : {
			MultilineTextInput,
			IconButton
		}
	}
</script>