<script>
	import QuillRenderer, {NODE_TEXT, NODE_ELEMENT} from '../utils/quill-render';

	export default {
		props : {
			delta : {type : Object}
		},

		created() {
			this.renderer = new QuillRenderer();
		},

		render(createElement) {
			if(!this.delta) {
				return createElement('div');
			}

			return this.renderer.render(this.delta, (type, tagNameOrText, style, attrs, childs) => {
				switch(type) {
					case NODE_TEXT :
						return tagNameOrText;
					case NODE_ELEMENT :
						return createElement(tagNameOrText, {style, attrs}, childs);
				}
			});
		}
	}
</script>

<style></style>