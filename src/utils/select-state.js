export function selectActionState (stateSelector, obj) {
    let newObj = {};
    Object.keys(obj).forEach(key => {
        const fn = obj[key];
        newObj[key] = (ctx, payload) => {
            const rootState = ctx.state;
            const state = stateSelector(rootState);
            return fn({...ctx, state, rootState}, payload);
        }
    });
    return newObj;
}

export function selectMutationState(stateSelector, obj){
    let newObj = {};
    Object.keys(obj).forEach(key => {
        const fn = obj[key];
        newObj[key] = (state, payload) => {
            const rootState = state;
            state = stateSelector(state);
            fn({rootState, state}, payload);
        }
    });
    return newObj;
}