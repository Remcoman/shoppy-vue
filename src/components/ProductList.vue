<template>
	<div class="product-list" :class="{'product-list--empty' : empty}">
		<div class="product-list__empty" v-show="empty">
			<slot name="empty"></slot>
		</div>
		
		<draggable-list 
			:items="products" 
			:transition="transition"
			:classNames="{'target' : 'product--target', 'dragging' : 'product--dragging'}"
			:enabled="draggable && products.length > 1"
			@drop="handleDrop"
			>

			<!-- declare contents of draggable-list item slot -->
			<template slot="item" scope="props">
				<!-- include contents of slot -->
				<slot name="item" v-bind="props"></slot>
			</template>

		</draggable-list>

	</div>
</template>
	
<script>
	import DraggableList from '@/components/DraggableList';

	const productTransition = {
		name : 'product', 
		duration : {leave : 400, enter : 500}
	}

	export default {
		name : "product-list",

		props : {
			'products'   : {required : true, type : Array},
			'draggable'  : {required : false, default : false, type : Boolean}
		},

		data() {
			return {
				transition : this.products.length ? productTransition : null
			}
		},

		watch : {
			products(newValue) {
				this.transition = newValue.length ? productTransition : null;
			}
		},	

		computed : {
			empty() {
				return this.products.length === 0;
			}
		},

		methods : {
			handleDrop(args) {
				this.$emit('itemDrop', args);
			}
		},

		components : {
			DraggableList
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import '~@/style/functions';
	@import '~@/style/variables';
	@import '~@/style/fa/variables';
	@import '~@/style/mixins';

	.product-list {

		&--empty {
			@include centered-content();
			height:100%;
		}

		&__empty {
			width:100%; 
			text-align:center;
		}
	}
</style>