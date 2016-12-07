import Vue from 'vue';

export default function register() {
    function focus(el, {value}) {
        if(value) {
            el.focus();
        }
    }

    Vue.directive('focus', {
        inserted : focus,
        update   : focus
    });
}