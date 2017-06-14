<template>
	<product-item 
		v-bind="{product, focused, editable, dragHandle}" 
		v-on-all="proxyEvent"
		>
		<div v-if="product.recipe" slot="footer" class="product__recipe-name" @click.stop>
			<router-link :to="recipeLink" class="product__recipe-link">{{product.recipe.name}}</router-link>
		</div>
	</product-item>
</template>

<script>
	import ProductItem from './ProductItem';

	export default {
		name : "shopping-list-item",

		props : ProductItem.props,

		computed : {
			recipeLink() {
				return `/recept/${this.product.recipe.slug}`;
			}
		},

		methods : {
			proxyEvent(name, event) {
				this.$emit(name, event);
			}
		},

		components : {
			ProductItem
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import '~@/style/variables';
	@import '~@/style/functions';
	@import '~@/style/mixins';

	.product {
		&__recipe-name {
			@include margin-top(.5);
			font-size:$xsFontSize;

			.product--done & {
				opacity: .4;
			}
		}

		&__recipe-link {
			float: left;
		    background: rgba($warningColor, .3);
		    padding: .13rem .5em;
		    color:#fff;
		    text-decoration:none;

		    $radiusX:8px;
		    $radiusY:50%;

		    border-top-left-radius:$radiusX $radiusY;
		    border-bottom-left-radius:$radiusX $radiusY;
		    border-top-right-radius:$radiusX $radiusY;
		    border-bottom-right-radius:$radiusX $radiusY;
		}
	}
</style>