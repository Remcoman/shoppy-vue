import Vue from 'vue';

export default function register() {
	Vue.directive('on-all', {
		bind : function (el, binding, vnode) {
			const {componentInstance} = vnode;
			const oldEmit = componentInstance.$emit;

			componentInstance.$emit = function (event, ...args) {
				binding.value(event, ...args);
				return oldEmit.apply(componentInstance, arguments);
			};
		}
	});
}