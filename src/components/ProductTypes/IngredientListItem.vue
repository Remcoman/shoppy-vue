<template>
	<product-item 
		class="product--ingredient" 
		:class="{
			'product--added-to-shopping-list' : addedToShoppingList, 
			'product--show-flash-message' : showFlashMessage
		}" 
		v-bind="{product, focused, editable, dragHandle}" 
		v-on-all="proxyEvent"
		>

		<template slot="buttons">
			<icon-button key="addToShoppingList" v-if="!editable && !addedToShoppingList" icon="shopping-basket" :reverse="true" class="product__btn-shopping-list" @click="handleShoppingList"></icon-button>
		</template>

		<template slot="flash-message">
			<transition name="flash-message">
				<div class="product__flash-message" v-if="showFlashMessage">Toegevoegd aan het boodschappenlijstje</div>
			</transition>
		</template>

	</product-item>
</template>

<script>
	import ProductItem from './ProductItem';
	import IconButton from '@/components/IconButton';

	export default {
		name : "ingredient-list-item",

		props : ProductItem.props,

		data() {
			return {
				showFlashMessage : false
			}
		},

		computed : {
			addedToShoppingList() {
				return this.product.addedToShoppingList;
			}
		},

		watch : {
			addedToShoppingList(newValue, oldValue) {
				if(newValue) {
					this.showFlashMessage = true;
					setTimeout(() => {
						this.showFlashMessage = false;
					}, 700);
				}
			}
		},

		methods : {
			proxyEvent(name, event) {
				this.$emit(name, event);
			},

			handleShoppingList(e) {
				this.$emit('addToShoppingList', {id : this.product.id});
			}
		},

		components : {
			ProductItem,
			IconButton
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import '~@/style/variables';
	@import '~@/style/functions';
	@import '~@/style/mixins';
	@import '~@/style/easings';

	.flash-message {
		&-enter {
			opacity: 0;
			transform: translateX(130px);
		}
		&-enter-active {
			transition: transform .5s $easeOutCirc, opacity .3s $easeOutCubic;
		}

		&-leave-active {
			opacity: 0;
			transition: opacity .3s $easeOutCubic;
		}
	}

	.product--ingredient {
		.product__btn-shopping-list {
			position: relative;
			z-index: 2;
			font-size: 1.2em;

			> i {
				font-size: .8em;
			}
		}

		.product__flash-message { 
			position: absolute; 
			left: 0;
			top: 50%;
			margin-top: -.5em;
			line-height: 1;
			z-index: 1;
			color: darken($primaryColor, 10%); 
		}

		.product__name {
			transition: opacity .8s .5s $easeOutCubic;
		}

		&.product--show-flash-message {
			.product__name {
				opacity: 0;
				transform: translateX(-30px);
				transition: opacity .2s $easeOutCubic, transform .2s $easeOutCubic;
			}
		}
	}
</style>