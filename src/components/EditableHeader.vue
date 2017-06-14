<template>
	<transition 
		mode="out-in"
		name="editable-text"
		>
		<span key="input" v-if="enabled" class="editable-text__input-wrap">
			<div class="editable-text__bg"></div>
			<input class="editable-text__input" maxlength="100" type="text" v-model="enteredValue" @change="handleChange">
		</span>
		<span key="static" class="editable-text__static" v-else>{{value}}</span>
	</transition>
</template>

<script>
	export default {
		name : "editable-header",

		data() {
			return {
				enteredValue : ""
			}
		},

		props : {
			value   : {type : String, required : false, default : ""},
			enabled : {type : Boolean, required : false, default : false}
		},

		watch : {
			value(newValue) {
				this.enteredValue = newValue;
			}
		},

		methods : {
			handleChange() {
				this.$emit('input', this.enteredValue);
			}
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import '~@/style/functions';
	@import '~@/style/mixins';
	@import '~@/style/easings';
 
	.editable-text {
		color: inherit;

		&-enter-active {
			transition: visibility 0s .5s;
		}
		
		&__bg {
			content: "";
			position: absolute;
			z-index: -1;
			left: 0;
			top: 0;
			width: 100%;
			height: 100%;
			background: rgba(0,0,0,.1);
			border-top-left-radius: 15px 50%;
			border-top-right-radius: 15px 50%;
			border-bottom-left-radius: 15px 50%;
			border-bottom-right-radius: 15px 50%;

			.editable-text-enter & {
				transform: scaleX(0);
			}
			
			.editable-text-enter-active & {
				transition: transform .5s $easeOutExpo;
			}

			.editable-text-leave-active & {
				transform: scaleX(0);
				transition: transform .5s $easeOutExpo;
			}
		}

		&__input {
			background: transparent;
			font: inherit;
			color: inherit;
			text-align: center;
			border: 0;
			height: 1.6em;
			padding: 0 px-rem(10px);

			&:focus {
				outline: none;
			}
		}

		&__input-wrap {
			position: relative;
		}

		&__static {
			@include cropped-text;
			text-transform: capitalize;
		}
	}
</style>