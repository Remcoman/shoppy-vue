<template>
	<div class="recipe" @click="click">
		<image-frame class="recipe__pic" :src="'http://lorempixel.com/400/200/food'"></image-frame>

		<div class="recipe__name">{{recipe.name}}</div>
	</div>
</template>

<script>
	import ImageFrame from './ImageFrame';

	export default {
		name : "recipe-list-item",

		props : {
			'recipe' : {type : Object, required : true}
		},

		methods : {
			click() {
				this.$emit('click', this.recipe);
			}
		},

		components : {
			ImageFrame
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import "~style/variables";

	.recipe {
		float:left;
		width:100%;
		position: relative;
		margin-top:20px;
		text-align: center;

		&--enter {
			opacity:0;
		}

		&--enter-active {
			transition:opacity .6s ease-out;
		}

		&__name {
			margin-top: -1.25em;
			font-size: 1.2em;
			position: relative;
			max-width:80%;
			bottom: 0;
			height: 2.5em;
			background: $primaryColor;
			color: $whiteColor;
			display:inline-block;
			vertical-align: middle;
			line-height: 2.5em;
			padding: 0 15px;
			text-transform: capitalize;
			box-shadow:0 3px 10px rgba(0,0,0,.2);
		}

		&__pic {
			width: 100%;
			height: 20vh;
			min-height:150px;
		}
	}
</style>