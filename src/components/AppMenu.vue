<template>
    <nav class="menu">
        <ul>
            <li>
                <router-link :to="{'name' : 'shoppinglist', 'params' : {fromMenu : true, disableTransition : true}}" class="menu__link">Boodschappen</router-link>
            </li>

            <li>
                <router-link :to="{'name' : 'recipes', 'params' : {fromMenu : true, disableTransition : true}}" class="menu__link">Recepten</router-link>
            </li>
        </ul>
    </nav>
</template>

<script>
    export default {
        name : 'menu'
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import '~@/style/functions';
    @import '~@/style/variables';

    .menu {
        position:fixed;
        left:0;
        top:0;
        width:100vw;
        background:#444;
        height:100vh;
        z-index:index($zIndexes, menu);
        text-align: center;
        display:flex;
        align-items: center;
        font-size:1.3em;

        ul {
            list-style: none; 
            text-align: center; 
            width:60vw;
            padding:0;
        }
        
        li {
            display:inline; 
            padding:0;
        }

        &__link {
            color:$whiteColor; 
            text-decoration: none; 
            display:block; 
            margin-bottom:5vh;
        }
    }

</style>