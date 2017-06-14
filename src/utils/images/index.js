import * as jpeg from './jpeg';

export * from './canvas';

export function imgFromFile(file) {
	return jpeg.load(file);
}

let form, input;
export function browseForImg() {
	if(!form) {
		form = document.createElement("form");
		input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
	}

	form.reset();

	input.click(); //this will trigger the browse dialog

	return new Promise(resolve => {
		input.onchange = () => {
			if(input.value) {
				resolve( input.files[0] );
			}
			else {
				resolve(null);
			}
		} 
	}).then(file => {
		console.log(file);
		return file ? imgFromFile(file) : null;
	});
}