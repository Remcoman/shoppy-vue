import Vue from 'vue'
import VueRouter from 'vue-router'

//init routes
import {ShoppingListComponent} from './modules/shopping-list'
import {RecipesComponent} from './modules/recipes'
import {RecipeDetailsComponent} from './modules/recipe-details'

const routes = [
	{path : '/', component : ShoppingListComponent},
	{path : '/recepten', component : RecipesComponent},
	{path : '/recept/:slug', component : RecipeDetailsComponent}
]

export default function createRouter() {
	Vue.use(VueRouter);

	return new VueRouter({routes});
}