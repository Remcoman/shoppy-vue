
export default {
	data() {
		return {
			transitionProps : null,
			previousView : null,
			hasCustomTransition : false,
			disableTransition : false,
			goingBack : false
		}
	},

	created() {
		this.historyStack = [ this.$router.currentRoute.path ];
	},

	props : {
		customTransitions : {type : Array, required : false, default : []},
		defaultTransition : {required : true}
	},

	render(h) {
		let data = {
			on 	  : {},
			props : {}
		}

		if(this.hasCustomTransition) {
			data.on.leave = this.leave;
			data.on.enter = this.enter;
		}
		else if(!this.disableTransition) {
			data.props = this.goingBack ? this.defaultTransition.backward : this.defaultTransition.forward;
		}

		return h('transition', data, [
			h('router-view', {
				ref : 'currentView'
			})
		]);
	},

	watch : {
		'$route' (to, from) {
			this.transitionProps = {from, to};
			this.previousView = this.$refs.currentView;
			this.hasCustomTransition = this.customTransitions.some(({from : mapFrom, to : mapTo, check}) => {
				return mapFrom === from.matched[0].path && mapTo === to.matched[0].path && (!check || check(this.previousView));
			});
			this.disableTransition = to.params.disableTransition;

			if(this.historyStack.length && to.path === this.historyStack[this.historyStack.length-2]) {
				this.historyStack.pop();
				this.goingBack = true;
			}
			else {
				this.historyStack.push(to.path);
				this.goingBack = false;
			}
		}
	},

	methods : {
		leave(el, done) {
			const methodName = "routeLeave";
			if(methodName in this.previousView) {
				this.previousView[methodName](this.transitionProps, done);
			}
			else {
				done();
			}
		},

		enter(el, done) {
			const methodName = "routeEnter";
			if(methodName in this.$refs.currentView) {
				this.$refs.currentView[methodName](this.transitionProps, done);
			}
			else {
				done();
			}
		}
	}
}