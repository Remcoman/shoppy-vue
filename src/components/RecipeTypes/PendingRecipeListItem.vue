<template>
	<div class="recipe recipe--pending">
		<div class="recipe__pic">
			<div class="recipe__pending-message">
			
			</div>
		</div>
		<div class="primary-color-bg recipe__name">{{recipe.name}}</div>
	</div>
</template>

<script>
	export default {
		name : "pending-recipe-list-item",

		props : {
			'recipe' : {type : Object, required : true}
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import "./RecipeListItem";
	@import "~@/style/mixins";

	.recipe--pending {
		.recipe__pic {
			background: #f1f1f1;

		}

		.recipe__pending-message {
			
		}
	}
</style>