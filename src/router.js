import Vue from 'vue'
import VueRouter from 'vue-router'

//init routes
import {ShoppingListComponent} from './modules/shopping-list'
import {RecipesComponent} from './modules/recipes'
import {RecipeDetailsComponent} from './modules/recipe-details'

const routes = [
	{
		path : '/', 
		component : ShoppingListComponent,
		name : 'shoppinglist',
		meta : {
			title : 'Boodschappen'
		}
	},
	
	{
		path : '/recepten', 
		component : RecipesComponent,
		name : 'recipes',
		meta : {
			title : 'Recepten'
		}
	},
	
	{
		path : '/recept/:slug', 
		component : RecipeDetailsComponent
	}
];

export const customTransitions = [
	{
		from : '/recepten', 
		to : '/recept/:slug',
		check(fromPageComponent) {
			return !!fromPageComponent.$selectedRecipe;
		}
	}
];

export const defaultTransition = {
	forward : {
		name : 'page',
		duration : 500
	},
	backward : {
		name : 'page-reverse',
		duration : 500
	}
}

export default function createRouter() {
	Vue.use(VueRouter);

	return new VueRouter({
		mode: 'history',
		routes
	});
}