import Vue from 'vue'
import Vuex from 'vuex'

//domain specific stores
import {createShoppingListStore} from 'modules/shopping-list';
import {createRecipesStore} from 'modules/recipes';
import {createRecipeDetailsStore} from 'modules/recipe-details';
import {createMutations, createState} from './app';

export default function (ctx) {
	Vue.use(Vuex);

	return new Vuex.Store({
		strict: process.env.NODE_ENV !== "production",
		
		state : createState(),

		modules : {
			shoppingList : createShoppingListStore(ctx),
			recipes : createRecipesStore(ctx),
			recipeDetails : createRecipeDetailsStore(ctx)
		},

		mutations : createMutations()
	});
}