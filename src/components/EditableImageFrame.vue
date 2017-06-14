<template>
    <div @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
        <image-frame 
            class="editable-image-frame__image" 
            v-bind="{'src' : imageFrameSrc, load, animation}"
            :placeholder="placeholder"
            :src="imageFrameSrc">
        </image-frame>

        <slot
            :error="errorMessage"
            :notice="notice"
            :allowSelectImage="allowSelectImage" 
            :browseImage="browseImage"
        ></slot>
    </div>
</template>

<script>
    import {browseForImg, imgToCanvas, canvasToBlob, imgFromFile} from '@/utils/images';
    import ImageFrame from './ImageFrame';

    export default {
        name : "editable-image-frame",

        props : {
            ...ImageFrame.props,

            online : {type : Boolean, required : false, default : false},
            editable : {type : Boolean, required : false, default : false},
            busy : {type : Boolean, required : false, default : false},
            error : {type : Error, required : false, default : null}
        },

        data : () => ({
            dragOver : false,
            errorMessage : null
        }),

        computed : {
            notice() {
                if(this.busy) {
                    return 'busy';
                }
                else if(this.error !== null) {
                    return 'error';
                }
                else if(this.editable && !this.online) {
                    return 'offline';
                }
                else if(this.dragOver) {
                    return 'drag_over';
                }
                else if(!this.src || Object.keys(this.src).every(key => !this.src[key])) {
                    return 'no_src';
                } 
                else {
                    return null;
                }
            },

            imageFrameSrc() {
                if(this.src && ['offline', 'error', 'drag_over', 'busy'].indexOf(this.notice) > -1) {
                    return [];
                }
                return this.src;
            },

            allowSelectImage() {
                return this.editable && this.online && !this.busy;
            }
        },

        watch : {
            error(value) {
                this.errorMessage = value ? value.message : null;
            }
        },

        methods : {
            handleDragOver(e) {
                if(!this.allowSelectImage) {
                    return;
                }

                e.preventDefault();
                this.dragOver = true;
            },

            handleDragLeave(e) {
                if(!this.allowSelectImage) {
                    return;
                }

                e.preventDefault();
                this.dragOver = false;
            },

            async handleDrop(e) {
                if(!this.allowSelectImage) {
                    return;
                }

                e.preventDefault();

                this.dragOver = false;
                
                const file = e.dataTransfer.files[0];

                let img;

                try {
                    img = await imgFromFile(file)
                }
                catch(e) {
                    this.errorMessage = "Het bestand kan niet worden verwerkt";
                    return;
                }

                await this.handleImg( img );
            },

            async handleImg(img) {
                const {canvas} = await imgToCanvas(img, {
					maxSize : {width : 1080},
					fixOrientation : true
				});

                const blob = await canvasToBlob(canvas);

                //temp thumbnail canvas
                const placeholderCanvas  = document.createElement("canvas");
                placeholderCanvas.width  = 40;
                placeholderCanvas.height = placeholderCanvas.width / (canvas.width / canvas.height);
                placeholderCanvas.getContext("2d").drawImage(canvas, 0, 0, placeholderCanvas.width, placeholderCanvas.height);
                const placeholderURL = placeholderCanvas.toDataURL("image/jpeg", .9);

                this.$emit('imageSelected', {blob, placeholderURL});
            },

            async browseImage() {
                let img;

                try {
                    img = await browseForImg();
                }
                catch(e) {
                    this.invalidImage = true;
                    return;
                }

				if(!img) {
					return;
				}

				await this.handleImg(img);
            }
        },

        components : {
            ImageFrame
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    .editable-image-frame {
        position:relative;

        &__image {
            position:absolute;
            left:0;
            top:0;
            width:100%;
            height:100%;

            &--blurry {
                filter:blur(30px);
            }
        }
    }
</style>