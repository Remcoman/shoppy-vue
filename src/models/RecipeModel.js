import config from 'config';
import getSlug from 'speakingurl';
import createFactory from './factory';

const EMPTY_IMAGE = [];

const defaultProps = () => ({
	_id : undefined,
	_rev : undefined,
	_deleted : false,

	type : "recipe",
	name : "",
	slug : "",
	preparation : {},
	dateAdded : null,

	image : []
});

const RecipeModel = createFactory(defaultProps, {
	hasImage() {
		return this.image && Array.isArray(this.image.file) && this.image.file.length > 0;
	},

	hasPreparation() {
		return this.preparation && typeof this.preparation.rev !== "undefined";
	},

	resolvedImages() {
		if(!this.hasImage()) {
			return [];
		}
		return this.image.file.map(image => {
			return {...image, url : config.imageBasePath + "/" + image.url};	
		});
	}
}, {
	generateSlug(name) {
		return getSlug(name);
	}
})

export default RecipeModel;