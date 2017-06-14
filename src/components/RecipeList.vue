<template>
	<div class="recipe-list" :class="{'recipe-list--empty' : recipes.length === 0}">
		<div class="recipe-list__empty" v-show="empty">
			<slot name="empty"></slot>
		</div>

		<transition-group 
			tag="div" 
			name="recipe"
			enter-class="recipe--enter"
			enter-active-class="recipe--enter-active"
			v-show="!empty">

			<slot name="item" 
				v-for="recipe in recipes"
				:recipe="recipe"
				:intersectionObserver="intersectionObserver"
				>
			</slot>
			
		</transition-group>
	</div>
</template>

<script>
	import IntersectionObserver from '@/utils/intersection-observer';

	export default {
		name : "recipe-list",

		created() {
			this.intersectionObserver = new IntersectionObserver({
				axis : "x"
			});
		},

		destroyed() {
			this.intersectionObserver.disconnect();
		},

		props : {
			recipes : {type : Array, required : true}
		},

		data() {
			return {
				intersectionObserver : null
			}
		},

		methods : {
			clickRecipe(event) {
				this.$emit('clickRecipe', event);
			}
		},

		computed : {
			empty() {
				return this.recipes.length === 0;
			}
		}
	}
</script>

<style lang="scss">
	@import '~@/style/variables';
	@import '~@/style/fa/variables';

	.recipe-list {
		float:left;
		width:100%;

		&--empty {
			display:flex; 
			align-content: center; 
			align-items: center; 
			height:100%;
		}

		&__empty {
			width:100%; 
			text-align:center;
		}
	}
</style>