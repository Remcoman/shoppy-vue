<template>
    <form class="recipe-add-form" @submit.prevent="submitForm">
        <transition mode="out-in" name="mode">

            <div key="url" class="recipe-add-form__preview" v-if="urlMode" :class="{
                'recipe-add-form__preview--loading' : urlPreviewLoading,
                'recipe-add-form__preview--error'   : urlPreviewError
            }">

                <transition appear mode="out-in" name="preview-content" :duration="{enter : 600, leave : 0}">
                    <div key="previewResult" class="recipe-add-form__preview-info" v-if="urlPreview || urlPreviewLoading">
                        <span class="recipe-add-form__preview-line1">{{urlPreview ? urlPreview.name : "recept"}}</span>
                        <span class="recipe-add-form__preview-line2">{{urlPreview ? urlPreview.source : "name"}}</span>
                    </div>

                    <div key="previewError" class="recipe-add-form__preview-info" v-else-if="urlPreviewError">
                        <span class="recipe-add-form__preview-line1"><i class="fa fa-exclamation-triangle"></i>&nbsp;&nbsp;Fout bij opvragen recept</span>
                        <span class="recipe-add-form__preview-line2">{{urlPreviewError.message}}</span>
                    </div>
                </transition>

                <icon-button v-if="urlPreview || urlPreviewError" :excludeColor="true" icon="times" class="recipe-add-form__preview-clear-btn" @click="handleClickClearPreview"></icon-button>
                <div class="recipe-add-form__preview-loading-icon" v-else-if="urlPreviewLoading"></div>
            </div>

            <input key="name" v-else autocomplete="off" type="text" maxlength="60" v-model="enteredRecipeName" @paste="handlePaste" class="recipe-add-form__input" tabindex="0" v-focus="focus" placeholder="Gerecht naam">
        </transition>

        <input type="submit" :disabled="error || !hasValidRecipe || urlPreviewLoading" value="Toevoegen" class="button button--white recipe-add-form__btn">

        <transition name="recipe-add-form__error" :duration="{enter : 400, leave : 400}">
            <div v-if="error" class="recipe-add-form__error">
                <i class="fa fa-exclamation-triangle"></i>&nbsp;&nbsp;{{error.message}}
            </div>
        </transition>
    </form>
</template>

<script>
    import IconButton from '@/components/IconButton';

    const offlineError = new Error("Je bent offline. Dus je kan geen recept toevoegen.");
    const invalidCharactersError = new Error("Naam van recept bevat ongeldige karakters.");

    export default {
        
        props : {
            focus : {type : Boolean, required : false, default : false},
            urlPreview : {type : Object, required : false, default : null},
            urlPreviewError : {type : Error, required : false, default : null},
            urlPreviewLoading : {type : Boolean, required : false, default : false},
            offline : {type : Boolean, required : false, default : true}
        },

        data() {
			return {
				enteredRecipeName : "",
                error : null
			}
		},

        watch : {
            value(newValue) {
                this.enteredRecipeName = newValue;
            },

            urlPreview(newValue) {
                this.enteredRecipeName = "";
            },

            offline(newValue) {
                this.updateErrorMessage();
            },

            enteredRecipeName(newValue) {
                this.updateErrorMessage();
            }
        },

        methods : {
            updateErrorMessage() {
                if(this.urlPreview && this.offline) {
                    this.error = offlineError;
                }
                else if(this.invalidRecipeName(this.enteredRecipeName)) {
                    this.error = invalidCharactersError;
                }
                else {
                    this.error = null;
                }
            },

            invalidRecipeName(name) {
                return name.match(/[\/!@$?&*()<>\[\]{}+%^|\\]/);
            },

            submitForm() {
                if(this.urlPreview) {
                    this.$emit('submit', {
                        type : "url",
                        value : this.urlPreview
                    });    
                }
                else {
                    this.$emit('submit', {
                        type : "name",
                        value : this.enteredRecipeName
                    });
                }
            },

            handleClickClearPreview(e) {
                e.preventDefault();
                this.error = null;
                this.$emit('clearPreview');
            },

            handlePaste(e) {
				let text = event.clipboardData.getData("text/plain");
                text = text.trim();
                if(text.match(/^http(s)?:\/\//)) {
                    e.preventDefault();
                    this.$emit('pasteURL', text);
                }
            }
        },

        computed : {
			hasValidRecipe() { 
				return this.urlPreview || this.enteredRecipeName.match(/\S/);
			},

            urlMode() {
                return this.urlPreviewLoading || this.urlPreview || this.urlPreviewError
            }
        },

        components : {
            IconButton
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import '~@/style/variables';
    @import '~@/style/easings';
    @import '~@/style/functions';
    @import '~@/style/fa/variables';
    @import '~@/style/fa/mixins';

    .recipe-add-form {
        width: 100%;
        display: flex;            
        background-color: #e8e8e8;
        align-items: center;
        z-index: 1;
        padding: px-rem(15px) px-rem(15px);

        .mode.recipe-add-form__preview {
            &-enter {
                background-color: $whiteColor;
            }

            &-enter-active {
                transition: background-color .2s ease-out;
            }
        }

        .preview-content {
            &-enter > * {
                opacity: 0;
            }

            &-enter-active > * {
                transition: opacity .4s .2s ease-out;
            }
        }

        &__error {
            position: absolute;
            top: 100%;
            left: 0;
            overflow: hidden;
            width: 100%;
            padding: px-rem(5px) px-rem(15px);
            color: #fff;
            background-color: $warningColor;
            transform-origin: 0 0;

            &-enter {
                transform: scaleY(0);
            }

            &-enter-active {
                transition: transform .4s $easeOutQuint;
            }

            &-leave-active {
                transform: scaleY(0);
                transition: transform .4s $easeOutQuint;
            }
        }

        &__input, &__preview {
            height: px-rem(50px);
            border: 0;
            font-size: 1.3em;
            border-radius: 5px;
            background-color: $whiteColor;
            padding: 0 px-rem(10px);
            margin-right: px-rem(20px);
            color: $primaryColor;
            flex: 2;

            &:focus {
                outline: none;
            }
        }

        &__preview { 
            background-color: #9992ab;
            color: #fff;
            font-size: 1rem;
            overflow: hidden;
            padding: 0 .7rem;
            display: flex;
            align-items: center;

            &--error {
                background-color: $warningColor;
            }
        }

        &__preview-loading-icon { 
            &:before {
                @include fa-icon;
                content: $fa-var-cog;
                font-size:  1.3em;
                animation: spin 2s infinite linear;
            }
        }

        &__preview-info {
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
            flex-basis: 100%;
            margin-right: .5em;
        }

        &__preview-line1 {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            display: block;
            margin-bottom: .1em;

            .recipe-add-form__preview--loading & {
                height: .9em;
                margin-bottom: .4em;
                width: 11em;
                color: #8274a7;
                background: currentColor;
                border-radius: 4px;
            }
        }

        &__preview-line2 {
            display: block;
            color: #3d2746;
            font-size: .9em;

            .recipe-add-form__preview--error & {
                color: #925414;
            }

            .recipe-add-form__preview--loading & {
                height: .8em;
                width: 6em;
                color: #8274a7;
                background: currentColor;
                border-radius: 4px;
            }
        }

        .icon-btn.recipe-add-form__preview-clear-btn {
            flex-shrink: 0;
            background: rgba(#000, .2);
            color: $whiteColor;
        }

        &__btn {
            height: px-rem(50px);
        }
    }
</style>