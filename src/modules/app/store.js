export const mutationTypes = {
    SET_ONLINE         : "app/SET_ONLINE",
    SET_ERROR          : "app/SET_ERROR",
    TOGGLE_MENU_OPENED : "app/TOGGLE_MENU_OPENED"
};

export function createMutations() {
	return {
		[mutationTypes.SET_ONLINE] (state, payload) {
			state.online = payload;
		},

		[mutationTypes.SET_ERROR] (state, payload) {
			console.log(payload);
			
			state.error = payload;
		},

		[mutationTypes.TOGGLE_MENU_OPENED] (state, payload) {
			if(typeof payload !== "undefined") {
				state.menuOpened = payload;
			}
			else {
				state.menuOpened = !state.menuOpened;
			}
		}
	}
}

export function createState() {
	return {
		error : null,
		menuOpened : false,
		online : navigator.onLine
	}
}
