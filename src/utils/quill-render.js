
export const NODE_ELEMENT = 1;
export const NODE_TEXT = 2;

class Node {
	constructor(tagName = 'p', childs = [], style={}, attrs={}) {
		this.tagName = tagName;
		this.childs = childs;
		this.style = style;
		this.attrs = attrs;
		this.parent = null;
	}
}

export default class {
	constructor() {
		this._cursor = null;
		this._node = null;
		this._inList = false;
		this._matchNewLines = /[\r\n]/g;
	}

	/**
	 * Reset the render
	 * @private
	 */
	_reset() {
		this._cursor = new Node('div');
		this._node = new Node();
		this._inList = false;
	}

	/**
	 * Appends the current node to the parents childs and starts a new line
	 * @private
	 */
	_br() {
		if(this._node) {
			if(this._node && this._node.tagName === "p" && !this._node.childs.length) {
				this._node.childs.push( new Node('br') );
			}
			this._node.parent = this._cursor;
			this._cursor.childs.push( this._node );
		}
		this._node = new Node();
	}

	/**
	 * Pushes a new node to the current cursors childs array and sets that node as the new cursor
	 *
	 * @private
	 * @return {[type]}
	 */
	_push(node) {
		node.parent = this._cursor;
		this._cursor.childs.push(node);
		return (this._cursor = node);
	}

	/**
	 * Sets the cursor to the parent of the cursor
	 *
	 * @private
	 */
	_pop() {
		this._cursor = this._cursor.parent;
	}

	/**
	 * Walks through all the nodes and executes a callback for each node
	 * The arguments which are passed to the callback depend on the node which is being walked
	 * For a text node: NODE_TEXT, text
	 * For a element node: NODE_ELEMENT, the tag name, style, attributes, childs
	 *
	 * @private
	 * @param  {Node|String}
	 * @param  {Function}
	 * @return {*}
	 */
	_walkNode(target, fn) {
		if(typeof target === "string") {
			return fn(NODE_TEXT, target);
		}
		return fn(NODE_ELEMENT, target.tagName, target.style, target.attrs, target.childs.map(child => this._walkNode(child, fn)));
	}

	/**
	 * Climbs up the tree of the given target until no parent exists
	 *
	 * @private
	 * @param  {Node}
	 * @return {Node}
	 */
	_climbToRoot(target) {
		for(;target.parent !== null; target = target.parent) {} //eslint-disable-line no-empty
		return target;
	}

	/**
	 * Wraps the given text by a node for each styled attribute
	 *
	 * @private
	 * @param  {Object}
	 * @param  {String}
	 * @return {Node}
	 */
 	_createStyledNode(attributes, content) {
		if(!attributes) {
			return content;
		}

		let styledNode = [['link', 'a'], ['bold', 'strong'], ['italic', 'em'], ['underline', 'u']].reduce((prev, [attr, tagName]) => {
			if(!(attr in attributes)) {
				return prev;
			}

			let node = new Node(tagName);
			node.parent = prev;

			if(attr === "link") {
				node.attrs.href = attributes[attr];
				node.attrs.target = "_blank";
			}

			if(prev) {
				prev.childs.push(node);
			}
			
			return node;
		}, null);

		if(!styledNode) {
			if(attributes.color) {
				styledNode = new Node('span');
			}
			else {
				return content;	
			}
		}

		if(attributes.color) {
			styledNode.style.color = attributes.color;
		}

		styledNode.childs.push(content);

		return this._climbToRoot(styledNode);
	}

	/**
	 * Appends the styled node to the target node, merging adjacent duplicate tags in the process.
	 *
	 * @private
	 * @param  {Node}
	 * @param  {Node}
	 */
	_appendStyledNode(targetNode, styledNode) {
		const {childs} = targetNode, prevChild = childs.length ? childs[childs.length-1] : null;
		
		if(prevChild && prevChild.tagName && prevChild.tagName === styledNode.tagName) {
			styledNode.childs.forEach(styledChild => this._appendStyledNode(prevChild, styledChild));
		}
		else {
			childs.push( styledNode );
		}
	}

	processOp({insert = "\n", attributes = {}}) {
		if(!insert) {
			return;
		}

		this._matchNewLines.lastIndex = 0;

		let m, prevIndex = 0;

		while(m = this._matchNewLines.exec(insert)) { //eslint-disable-line no-cond-assign
			//get the line content
			const line = insert.substring(prevIndex, m.index);
			if(line) {
				this._appendStyledNode(this._node, this._createStyledNode(attributes, line));
			}

			//these attributes apply to the last line
			if(attributes.header) {
				this._node.tagName = 'h' + attributes.header.toString();
			}
			else if(attributes.list) { //wrap a ol or ul around the li elements. Set inList to true
				if(!this._inList) {
					this._inList = true;

					const listNode = new Node(attributes.list.charAt(0) + 'l');
					this._push(listNode);
				}
				this._node.tagName = 'li';
			}
			else if(!attributes.list && this._inList) { //if no longer in the list we should pop the stack to escape the ol,ul
				this._inList = false;
				this._pop();
			}

			this._br(); //add a line break

			prevIndex = m.index+1;
		}

		if(prevIndex < insert.length) {
			this._appendStyledNode(this._node, this._createStyledNode(attributes, insert.substring(prevIndex)));
		}
	}

	render(delta, fn) {
		this._reset();

		delta.ops.forEach(op => this.processOp(op));

		this._cursor = this._climbToRoot(this._cursor);

		if(this._node.childs.length) {
			this._br();
		}

		return this._walkNode(this._cursor, fn);
	}
}