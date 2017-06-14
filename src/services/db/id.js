
const generateID = a=> {
	return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,generateID);
}

export default function (prefix=null) {
    const id = generateID();
    return (prefix !== null ? prefix : "") + id;
}