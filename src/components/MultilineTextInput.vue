<template>
	<div class="ml-textinput">
		<pre class="ml-textinput__mirror"><span >{{dataValue}}</span><br></pre>
		<textarea ref="textarea" :maxlength="maxlength" v-focus="focus" class="ml-textinput__input" v-model="dataValue"
		 @keydown="handleKeydown" @input="handleInput" @paste="handlePaste" @focus="handleFocus" @blur="handleBlur"></textarea>
	</div>
</template>

<script>
	export default {
		name : "multiline-text-input",

		props : {
			value : {type : String, required :  false, default : ""},
			focus : {type : Boolean, required : false, default : false},
			maxlength : {type : Number, required : false}
		},

		data() {
			return {
				dataValue : this.value 
			}
		},

		watch : {
			value(newValue) {
				this.dataValue = newValue;
			}
		},

		methods : {
			handleInput(e) {
				this.$emit('input', e.target.value);
			},

			handleKeydown(e) {
				if(e.keyCode === 13) {
					e.preventDefault();
					this.$emit('enter');
				}
			},

			handleFocus(e) {
				this.$emit('focus', e);
			},

			handleBlur(e) {
				this.$emit('blur', e);
			},

			handlePaste(e) {
				this.$emit('paste', e);
			}
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	.ml-textinput { 
		position:relative;

		&__mirror, &__input {
			margin:0; 
			padding:0; 
			outline:0; 
			border:0;
			white-space: pre-wrap;
			word-wrap: break-word;
			font:inherit;
			letter-spacing:inherit;
			line-height:inherit;
		}

		&__input {
			overflow:hidden;
			position:absolute;
			left:0;
			top:0;
			width:100%;
			height:100%;
			resize:none;
			background:transparent;
		}

		&__mirror {
			display:block;
			visibility:hidden;
		}
	}
</style>