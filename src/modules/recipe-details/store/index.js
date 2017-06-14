import {createMutations} from './mutations';
import {createActions} from './actions';
import {createState} from './state';

export {mutationTypes} from './mutations';
export {actionTypes} from './actions';

export const imageProcessingState = {
	NOT_STARTED : Symbol(),
	STARTED 	: Symbol(),
	SUCCESS 	: Symbol(),
	FAIL 		: Symbol()
}

export default (ctx) => {
	return {
		state 	  : createState(ctx),
		mutations : createMutations(ctx),
		actions   : createActions(ctx)
	}
}