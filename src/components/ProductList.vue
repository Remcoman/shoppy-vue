<template>
	<div class="product-list" :class="{'product-list--empty' : empty}">
		<div class="product-list__empty" v-show="empty">
			<slot name="empty"></slot>
		</div>
		
		<transition-group 
			name="product-list" 
			tag="div"
			enter-active-class="product--enter-active"
			leave-active-class="product--leave-active" 
			v-show="!empty"
			>
			<product-list-item
				v-for="product in products"

				:key="product._id"
				:product="product"
				:editable="editing"
				:focused="focusId === product._id"
				:event-proxy="eventProxy"
			></product-list-item>
		</transition-group>
	</div>
</template>
	
<script>
	import ProductListItem from 'components/ProductListItem';
	import Vue from 'vue';

	export default {
		name : "product-list",

		props : {
			'products'   : {required : true, type : Array},
			'editing'    : {required : false, default : false, type : Boolean},
			'focusId'    : {required : false, default : null, type : String}
		},

		data : function () {
			const eventProxy = new Vue();

			eventProxy.$on('proxy', (name, ...args) => {
				this.$emit('item' + name.charAt(0).toUpperCase() + name.substr(1), ...args);
			});

			return {eventProxy};
		},

		computed : {
			empty() {
				return this.products.length === 0;
			}
		},

		components : {
			ProductListItem
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import '~style/functions';
	@import '~style/variables';
	@import '~style/fa/variables';
	@import '~style/animations';

	.product-list {

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