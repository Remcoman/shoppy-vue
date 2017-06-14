<template>
	<div class="image-frame" :class="{'image-frame--no-animation' : !animation}">
		<img 
			v-if="load"
			v-show="hasPlaceholder" 
			:src="placeholderURL" 
			class="image-frame__img image-frame__img--placeholder" 
			@load="onPlaceholderLoad">

		<picture v-if="load">
			<source v-for="source in sources" sizes="100vw" :type="source.type" :srcset="source.srcSet"></source>

			<img 
				v-show="loaded" 
				ref="img" 
				:src="fallbackSrc" 
				class="image-frame__img" 
				:class="{'image-frame__img--loaded' : loaded}" 
				@load="onImgLoad">
		</picture>
	</div>
</template>

<script>
	const preferredTypeOrder = [
		"webp",
		"jpg"
	];

	const extensionToType = {
		"webp" : "image/webp",
		"jpg"  : "image/jpeg"
	}

	export default {
		name : "image-frame",

		props : {
			src : {required : false, type : Array, default : null},
			placeholder : {required : false, default : null},
			load : {required : false, type : Boolean, default : true},
			animation : {required : false, type : Boolean, default : true}
		},

		data : () => ({
			loaded : false,
			placeholderURL : null
		}),

		mounted() {
			this.loaded = false;
			this.loadPlaceholderBlob();
		},

		methods : {
			onImgLoad() {
				this.loaded = true;
				this.$emit('loaddone');
			},

			onPlaceholderLoad() {
				if(this.placeholderURL.indexOf("blob://") === 0) {
					window.URL.revokeObjectURL(this.placeholderURL);
				}
			},

			loadPlaceholderBlob() {
				if(this.placeholderURL && this.placeholderURL.indexOf("blob://") === 0) {
					window.URL.revokeObjectURL(this.placeholderURL);
				}

				this.placeholderURL = null;

				if(typeof this.placeholder === "function") {
					this.placeholder().then(blob => {
						if(blob) {
							this.placeholderURL = window.URL.createObjectURL(blob);
						}
						else {
							console.warn('no thumbnail found!');
						}
					});
				}
				else if(this.placeholder instanceof Blob) {
					this.placeholderURL = window.URL.createObjectURL(this.placeholder);
				}
			}
		},

		watch : {
			src(newValue, oldValue) {
				if(JSON.stringify(newValue) === JSON.stringify(oldValue)) {
					return;
				}

				this.loaded = false;

				this.$emit('loadstart');
			},

			placeholder(newValue, oldValue) {
				if(typeof newValue === "string") {
					this.placeholderURL = newValue;
				}
				else {
					this.loadPlaceholderBlob();
				}
			}
		},

		computed : {
			hasPlaceholder() {
				return !!this.placeholderURL;
			},

			hasSrc() {
				return this.src && this.src.length > 0;
			},

			sources() {
				if(!this.hasSrc) {
					return "";
				}

				if(!Array.isArray(this.src)) {
					return "";
				}

				const srcOrdered = this.src.slice(0).sort((a,b) => {
					const extA = a.url.substr(a.url.lastIndexOf(".")+1);
					const extB = b.url.substr(b.url.lastIndexOf(".")+1);
					return preferredTypeOrder.indexOf(extA) - preferredTypeOrder.indexOf(extB);
				});

				//group the sources by extension
				const sourcesByExt = {}, sources = [];

				for(let src of srcOrdered) {
					const ext = src.url.substr(src.url.lastIndexOf(".")+1);
					let source = sourcesByExt[ext];
					if(!source) {
						source = sourcesByExt[ext] = {srcSet : [], type : extensionToType[ext]};
						sources.push(source);
					}
					source.srcSet.push(src.url + " " + src.width.toString() + "w");
				}

				return sources;
			},

			fallbackSrc() {
				if(!this.hasSrc) {
					return "";
				}

				const defaultImg = this.src.filter(item => {
					return item.default;
				});

				return defaultImg.length ? defaultImg[0].url : "";
			} 
		} 
	}
</script>

<style lang="scss" rel="stylesheet/scss">
	@import '~@/style/easings';

	@keyframes showImage {
		0% {opacity:0;}
		100% {opacity:1;}
	}

	.image-frame {
		overflow: hidden;
		float:left;
		background:#f1f1f1;
		position:relative;

		&__img {
			width:100%;
			height:100%;
			object-fit: cover;
			float:left;
			position:absolute;
			left:0;
			top:0;

			.image-frame:not(.image-frame--no-animation) & {
				animation:showImage 1s $easeInOutCubic 0s 1 both;
			}

			&--placeholder {
				position:relative;
				-webkit-filter:blur(30px);
				filter:blur(30px);
				animation:none;
			}
		}
	}
</style>