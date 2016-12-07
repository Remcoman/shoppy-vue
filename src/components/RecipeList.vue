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
			
			<recipe-list-item
				v-for="recipe in recipes"
				:key="recipe.id"
				:recipe="recipe"
				@click="clickRecipe"
				>
			</recipe-list-item>
			
		</transition-group>

	</div>
</template>

<script>
	import RecipeListItem from './RecipeListItem';

	export default {
		name : "recipe-list",

		props : {
			recipes : {type : Array, required : true}
		},

		methods : {
			clickRecipe(recipe) {
				this.$emit('clickRecipe', recipe);
			}
		},

		computed : {
            empty() {
                return this.recipes.length === 0;
            }
        },

		components : {
			RecipeListItem
		}
	}
</script>

<style lang="scss">
	@import '~style/variables';
	@import '~style/fa/variables';

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