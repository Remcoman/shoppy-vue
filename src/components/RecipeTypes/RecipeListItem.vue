<template>
	<a :href="link" class="recipe" @click="handleClick">
		<image-frame 
			class="recipe__pic" 
			@loaddone="handleImgLoadDone"
			@loadstart="handleImgLoadStart"
			:load="load" 
			:src="src"
			:placeholder="boundPlaceholderLoader"
		></image-frame>

		<div class="primary-color-bg recipe__name">{{recipe.name}}</div>
	</a>
</template>

<script>
	import ImageFrame from '@/components/ImageFrame';

	export default {
		name : "recipe-list-item",

		props : {
			'recipe' : {type : Object, required : true},
			'linkTemplate' : {type : Function, required : true},
			'placeholderLoader' : {type : Function, required : false},
			'intersectionObserver' : {type : Object, required : false},
			'offline' : {type : Boolean, required : false, default : false}
		},

		data() {
			return {
				imgLoaded : false,
				load : false,
				boundPlaceholderLoader : null
			}
		},

		mounted() {
			this.updateInteractionObserver(this.intersectionObserver, null);
			this.updateBoundPlaceholderLoader(this.placeholderLoader, null);
		},

		destroyed() {
			this.updateInteractionObserver(null, this.intersectionObserver);
		},

		watch : {
			placeholderLoader(newValue, oldValue) {
				this.updateBoundPlaceholderLoader(newValue, oldValue);
			},

			intersectionObserver(newValue, oldValue) {
				this.updateInteractionObserver(newValue, oldValue);
			}
		},

		methods : {
			handleImgLoadDone() {
				this.imgLoaded = true;
			},

			handleImgLoadStart() {
				this.imgLoaded = false;
			},

			updateInteractionObserver(newObserver, oldObserver) {
				if(oldObserver) {
					oldObserver.unobserve(this.$el);
				}

				if(newObserver) {
					newObserver.observe(this.$el, this.handleIntersection.bind(this));
				}
			},

			updateBoundPlaceholderLoader(newLoader, oldLoader) {
				this.boundPlaceholderLoader = null;

				if(newLoader) {
					this.boundPlaceholderLoader = this.recipe.hasImage() && newLoader ? newLoader.bind(null, this.recipe) : null;
				}
			},

			handleIntersection(intersecting) {
				//we are not unloading (for now)
				if(intersecting) {
					this.load = true;
				}
			},

			handleClick(e) {
				e.preventDefault();
				const {recipe} = this;
				this.$emit('click', {recipe, $el : e.currentTarget});
			}
		},

		computed : {
			link() {
				return this.linkTemplate(this.recipe);
			},

			src() {
				if(this.imgLoaded) {
					return this.recipe.resolvedImages();
				}
				else if(!this.offline && this.load) {
					return this.recipe.resolvedImages();
				}
				else {
					return null;
				}
			}
		},

		components : {
			ImageFrame
		}
	}
</script>

<style lang="scss" rel="stylesheet/scss" src="./RecipeListItem.scss"></style>