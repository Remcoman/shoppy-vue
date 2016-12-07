<template>
	<picture class="image-frame">
		<img ref="img" :src="lowSrc" class="image-frame__img" :class="{'image-frame__img--loaded' : loaded}" @load="onImgLoad">
	</picture>
</template>

<script>
	export default {
		props : {
			src : {required : false}
		},

		data : () => ({
			loaded : false
		}),

		methods : {
			onImgLoad() {
				this.loaded = true;
			}
		},

		watch : {
			src() {
				this.loaded = false;
			}
		},

		computed : {
			lowSrc() {
				return this.src;
			}
		} 
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	.image-frame {
		overflow: hidden;
		float:left;
		background:#f1f1f1;

		&__img {
			width:100%;
			height:100%;
			visibility:hidden;
			opacity:0;
			object-fit: cover;
			float:left;

			&--loaded {
				visibility:visible;
				opacity:1;
				transition:opacity 1s ease-out;
			}
		}
	}
</style>