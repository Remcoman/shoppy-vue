import * as productsPartials from '@/store/partials/products';
import {RecipeModel} from '@/models'; 
import Delta from 'quill-delta';

export const INIT_MODEL = new RecipeModel();

export const createState = () => ({
	model : INIT_MODEL,

	placeholder : null,
	uploading : false,
	imageProcessingUUID : null,

	loaded : false,
	loading : false,
	editing : false,

	preparationOut : new Delta(),
	preparationIn  : new Delta(),

	ingredientsInShoppingList : {},
	
	ingredients : productsPartials.createState()
});