<template>
    <div class="page page-recipe-details" :class="{'page--loading' : loading, 'page--centered-content' : notFound}">

        <div class="header header--page page-recipe-details__header">
			<h1 class="header__title page-recipe-details__title">
                <input class="page-recipe-details__input" maxlength="100" type="text" v-if="editing" v-model="recipeName" @change="changeName">
                <span class="page-recipe-details__title-text" v-else>{{recipe.name}}</span>
            </h1>

			<div class="header__btns page-recipe-details__btns" v-if="found">
                <template v-if="editing">
                    <button class="icon-btn page-recipe-details__edit-btn primary-color" @click="setEditing({value : false})">
                        <i class="fa fa-check"></i>
                    </button>
                </template>

                <template v-else>
                    <button class="icon-btn page-recipe-details__edit-btn primary-color" @click="setEditing({value : true})">
                        <i class="fa fa-pencil"></i>
                    </button>
                </template>
			</div>
		</div>

        <div class="page-recipe-details__content" v-if="found">
            <div class="page-recipe-details__pic-wrap">
                <button v-if="editing" class="icon-btn page-recipe-details__image-btn primary-color" @click="setImage">
                    <i class="fa fa-camera"></li>
                </button>

                <image-frame class="page-recipe-details__pic" :src="'http://lorempixel.com/400/200/food'"></image-frame>
            </div>

            <div class="page-recipe-details__inner">

                <h2 class="h-border margin-bottom page-recipe-details__ingredients-header">
                    <span class="page-recipe-details__ingredients-header-text">Ingredi&euml;nten</span>

                    <button v-if="editing" class="icon-btn page-recipe-details__add-btn primary-color-bg" @click="newDummy">
                        <i class="fa fa-plus"></li>
                    </button>
                </h2>

                <product-list
                    v-show="!loading"

                    class="page-recipe-details__ingredients"

                    :products="productsWithDummy" 
                    :editing="editing" 
                    :focusId="focusId" 

                    @itemNameChanged="itemNameChanged"
                    @itemFocusInput="itemFocusInput"
                    @itemRemove="itemRemove"
                    @itemPasteBelow="itemPasteBelow">

                    <div slot="empty">Dit recept heeft geen ingredi&euml;nten</div>
                </product-list>

                <template v-if="recipe.preparation || editing">
                    <h2 class="h-border margin-bottom">Bereiding &amp; Tips</h2>

                    <rich-text-editor v-if="editing" class="page-recipe-details__preparation margin-bottom">{{recipe.preparation}}</rich-text-editor>
                    <p class="margin-bottom" v-else>{{recipe.preparation}}</p>
                    
                </template>

                <button v-if="editing" class="page-recipe-details__delete-btn button warning-color-bg button--fullwidth margin-bottom" @click="remove">
                    <i class="fa fa-warning"></i>
                    Verwijderen
                </button>
            </div>
        </div>

        <div class="page-recipe-details__not-found" v-if="notFound">
            Dit gerecht bestaat niet meer :-(
        </div>

    </div>
</template>

<script>
    import {actionTypes, mutationTypes} from './store';
    import {mapState, mapActions, mapGetters, mapMutations} from 'vuex';
    import {browseForImg, imgToCanvas, canvasToBlob} from '../../utils/images';

    import ImageFrame from '../../components/ImageFrame';
    import ProductList from '../../components/ProductList';
    import RichTextEditor from '../../components/RichTextEditor';

    export default {
        created() {
            const {slug} = this.$route.params;

            console.debug(`Editing: ${slug}`);

            this.$store.dispatch(actionTypes.RECIPE_DETAILS_LOAD, {slug})
                .then(doc => {
                    if(doc) {
                        this.recipeName = doc.name;
                    }
                })
        },

        data : () => ({
            recipeName : ""
        }),

        destroyed() {
            this.$store.dispatch(actionTypes.RECIPE_DETAILS_UNLOAD);
        },

        methods : {
            ...mapMutations({
                'setEditing'     : mutationTypes.RECIPE_DETAILS_SET_EDITING,
                'itemFocusInput' : mutationTypes.PRODUCTS_SET_FOCUS,
                'newDummy'       : mutationTypes.PRODUCTS_NEW_DUMMY,
                'toggleFilter'   : mutationTypes.SHOPPING_LIST_TOGGLE_FILTER
            }),

            ...mapActions({
                'itemNameChanged' : actionTypes.PRODUCTS_CHANGE_NAME,
                'itemRemove'      : actionTypes.PRODUCTS_REMOVE,
	            'itemPasteBelow'  : actionTypes.PRODUCTS_PASTE_BELOW
            }),

            setEditing({value}) {
                if(value) {
                    this.recipeName = this.recipe.name;
                }
            
                this.$store.commit(mutationTypes.RECIPE_DETAILS_SET_EDITING, {value});
            },

            changeName() {
                console.log(`New name ${this.recipeName}`);
                this.$store.dispatch(actionTypes.RECIPE_DETAILS_CHANGE_NAME, {name : this.recipeName});
            },

            async setImage() {
                const img = await browseForImg();

                if(!img) {
                    return;
                }

                const {canvas, ctx} = await imgToCanvas(img, {
                    targetSize : {width : 300, height : 300},
                    fixOrientation : true
                });

                canvas.style.position = "absolute";
                canvas.style.left = "0px";
                canvas.style.top = "0px";
                canvas.style.zIndex = 10000;

                document.body.appendChild(canvas);

                //const blob = await canvasToBlob(canvas);

                console.log(canvas);

                this.$store.dispatch(actionTypes.RECIPE_DETAILS_SET_IMAGE, {blob});
            },

            remove() {
                if(confirm("Weet je het zeker dat je dit recept wilt verwijderen?")) {
                    this.$store.dispatch(actionTypes.RECIPE_DETAILS_REMOVE);
                    this.$router.push('/recepten');
                }
            }
        },

        computed : {
            ...mapState({
                recipe(state) {
                    return state.recipeDetails.model;   
                },

                loading(state) { 
                    return state.recipeDetails.loading;
                },
                
                loaded(state) {
                    return state.recipeDetails.loaded;
                },

                editing(state) {
                    return state.recipeDetails.editing;
                },

                focusId(state) {
                    return state.recipeDetails.ingredients.focus;   
                }
            }),

            ...mapGetters([
                'found',
                'notFound',
                'productsWithDummy'
            ]),
            
        },

        components : {
            ImageFrame,
            ProductList,
            RichTextEditor
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import '~style/functions';
    @import '~style/variables';
    @import '~style/mixins';

    .page-recipe-details {

        &__not-found {
            text-align:center;
            width:100%;
        }

        &__ingredients-header {
            position:relative;
        }

        &__add-btn {
            color:#fff;
            position:absolute;
            right:0;
            bottom:px-rem(5px);
        }

        &__pic-wrap {
            position:relative;
            @include float-left;
            @include margin-bottom;
        }

        &__title-text {
            @include cropped-text;
        }

        &__image-btn {
            position:absolute;
            bottom:px-rem($verticalMargin);
            right:px-rem($horizontalMargin);
            font-size:1.5em;
            z-index:1;
            > .fa {font-size:.7em;}
        }
        
        &__pic {
            width: 100%;
            height: 30vh;
            min-height:150px;
            @include float-left;
        }

        &__input {
            font:inherit;
            color:inherit;
            text-align:center;
            background:transparent;
            border:0;
            border-top-left-radius:15px 50%;
            border-top-right-radius:15px 50%;
            border-bottom-left-radius:15px 50%;
            border-bottom-right-radius:15px 50%;
            background:rgba(0,0,0,.1);
            height:1.6em;
            padding:0 px-rem(10px);

            &:focus {outline:none;}
        }

        &__content {
            float:left;
            width:100%;
        }

        &__inner {
            clear:both;
            margin:0 px-rem($horizontalMargin);
        }

        &__preparation {
            @include float-left;
            @include margin-bottom(2);
            height:px-rem(200px);
        }

        &__ingredients {
            @include margin-bottom(2);
        }

        &__form {
            position:absolute;
            left:-9999px;
            top:-9999px;
        }

        .product-list__empty {text-align:left;}
    }
</style>