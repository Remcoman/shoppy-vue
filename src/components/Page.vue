<template>
    <div class="page" :class="{'page--loading' : loading, 'page--notice' : showNotice}" @click="$emit('click', $event)">
        <header class="page__header">
            <h1 class="page__header-title">
                <slot name="header-title"></slot>
            </h1>

            <transition appear name="fade">
                <div class="page__header-btns" v-if="!loading">
                    <slot name="header-btns"></slot>
                </div>
            </transition>
        </header>

        <section class="page__main">
            <slot name="content" v-if="!loading && !showNotice"></slot>

            <div class="page__notice" v-if="!loading && showNotice">
                <slot name="notice"></slot>
            </div>
        </section>
    </div>
</template>

<script>
export default {
    name : 'page', 

    props : {
        'loading'    : {required : false, default : false},
        'showNotice' : {required : false, default : false}
    }
}
</script>

<style lang="scss" rel="stylesheet/scss">
    @import '~@/style/functions';
    @import '~@/style/variables';
    @import '~@/style/mixins';
    @import '~@/style/easings';
    @import "~@/style/fa/variables";

    .page {
        @include float-left;
        padding-top: px-rem($headerHeight);

        &-leave-active, &-reverse-leave-active {
            position: absolute;
        }
    }

    .page__notice {
        text-align: center;
        width: 100%;
    }

    .page__main {
        float: left;
        width: 100%;
        background: $whiteColor;
        position: relative;
        min-height: calc(100vh - #{$headerHeight});

        .page--loading & {
            &:before {
                content: $fa-var-cog; 
                font: 30px 'FontAwesome'; 
                color: $primaryColor; 
                text-align: center; 
                animation: spin-centered 2s infinite linear;
                z-index:3;
                position: absolute;
                left: 50%;
                top: 50%;
            }
        }

        .page--notice & {
            @include centered-content;
        }

        .page-leave-active &, .page-reverse-leave-active & {
            position: absolute;
            top: $headerHeight;
            left: 0;
        }

        .page-leave-active & {
            @keyframes page-leave-to-left {
                0% {transform: translateX(0); }
                100% {transform: translateX(-20%); }
            }
            animation: page-leave-to-left .5s $easeInOutCubic 0s 1 normal both;
        }

        .page-reverse-leave-active & {
            @keyframes page-leave-to-right {
                0% {transform: translateX(0); }
                100% {transform: translateX(100%); }
            }
            animation: page-leave-to-right  .5s $easeInOutCubic 0s 1 normal both;
            z-index: 5;
        }

        .page-enter-active & {
            @keyframes page-enter-from-right {
                0% {transform: translateX(100%); }
                100% {transform: translateX(0); }
            }
            animation: page-enter-from-right .5s $easeOutCubic 0s 1 normal both;
            overflow: hidden;
            z-index: 5;
        }

        .page-reverse-enter-active & {
            @keyframes page-enter-from-left {
                0% {transform: translateX(-20%); }
                100% {transform: translateX(0); }
            }
            animation: page-enter-from-left .5s $easeOutCubic 0s 1 normal both;
            overflow: hidden;
            z-index: 4;
        }
    }

    .page__header {
        left: px-rem(40px); 
        top:0;
        right: 0; 
        width: auto;
        height: px-rem($headerHeight);
        z-index: index($zIndexes, header);
        display: flex;
        align-items: center;
        position: fixed;
        color: $whiteColor;

        .page-enter & {
            transform: translateX(30%);
            opacity: 0;
        }

        .page-reverse-enter & {
            transform: translateX(-30%);
            opacity: 0;
        }

        .page-enter-active &, .page-reverse-enter-active & {
            transition: transform .5s $easeOutCubic, opacity .5s $easeOutCubic;
        }

        .page-leave-active &, .page-reverse-leave-active & {
            position: absolute;
            opacity: 0;
            transition: transform .5s $easeOutCubic, opacity .5s $easeOutCubic;
        }

        .page-leave-active & {
            transform: translateX(-30%);
        }

        .page-reverse-leave-active & {
            transform: translateX(30%);
        }
    }

    .page__header-title { 
        padding-right: px-rem(40px); 
        display: flex; 
        flex: 2; 
        flex-direction: column; 
        align-items: center; 
        color: #fff; 
    }

    .page__header-btns {
        position: absolute; 
        right: px-rem($horizontalMargin); 
        top: 0; 
        height: 100%; 
        display: flex; 
        align-items: center; 
        font-size: 1.5em; 

        .page--loading & {
            display: none;
        }
    }
</style>