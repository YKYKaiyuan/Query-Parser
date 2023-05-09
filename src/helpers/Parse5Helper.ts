import {Element, ParentNode, TextNode} from "parse5/dist/tree-adapters/default";
import {Util} from "../Util";

class CssSelector {
	public readonly type: SelectorType;
	public readonly value: string;

	constructor(type: SelectorType, value: string) {
		this.type = type;
		this.value = value;
	}
}

enum SelectorType {
	TAG,
	ID,
	CLASS,
}

export function findSelector(node: ParentNode, selector: string): Element | null {
	let foundSelectors = findAllSelectors(node, selector);
	if (foundSelectors.length !== 0) {
		return foundSelectors[0];
	}
	return null;
}

export function findAllSelectors(node: ParentNode, selector: string): Element[] {
	let selectors = selector.split(/\s+/).filter((element) => element.length !== 0);
	let cssSelectors: CssSelector[][] = selectors.map((sel) => extractCssSelector(sel));
	let endElement = cssSelectors.pop();
	let allElements = findChildNode(node, endElement as CssSelector[]);
	for (let i = allElements.length - 1; i >= 0; i--) {
		if (!hasParentNodes(node, allElements[i], cssSelectors)) {
			allElements.splice(i, 1);
		}
	}
	return allElements;
}

export function extractCssSelector(selector: string): CssSelector[] {
	let cssSelectors: CssSelector[] = [];
	let selectorType = SelectorType.TAG;

	let left = 0;
	let extractCssValue = (idx: number) => {
		let right = idx;
		if (left !== right) {
			let cssValue = selector.substring(left, right);
			let cssSelector = new CssSelector(selectorType, cssValue);
			cssSelectors.push(cssSelector);
		}
		left = idx + 1;
	};

	for (let index = 0; index < selector.length; index++) {
		if (selector[index] === "#") {
			extractCssValue(index);
			selectorType = SelectorType.ID;
		} else if (selector[index] === ".") {
			extractCssValue(index);
			selectorType = SelectorType.CLASS;
		} else if (index === selector.length - 1) {
			extractCssValue(selector.length);
		}
	}

	return cssSelectors;
}

export function findChildNode(node: ParentNode, selectors: CssSelector[]): Element[] {
	let elements: Element[] = [];
	for (let child of node.childNodes) {
		if (isElement(child)) {
			if (isMatchedSelector(child, selectors)) {
				elements.push(child);
			}
			let deepChildNodes = findChildNode(child, selectors);
			for (let deepChild of deepChildNodes) {
				elements.push(deepChild);
			}
		}
	}
	return elements;
}

export function hasParentNodes(rootNode: ParentNode, target: Element, selectors: CssSelector[][]): boolean {
	let remainingSelectors = [...selectors];
	let currentParent: Element | null = target;
	while (remainingSelectors.length !== 0) {
		let selector = remainingSelectors.pop() as CssSelector[];
		currentParent = findParentNode(rootNode, currentParent as Element, selector);
		if (currentParent === null) {
			return false;
		}
	}
	return true;
}

export function findParentNode(rootNode: ParentNode | null, target: Element, selectors: CssSelector[]): Element | null {
	if (typeof target.parentNode !== "object") {
		return null;
	}
	let currentNode: Element = target.parentNode as Element;
	for (;;) {
		if (isMatchedSelector(currentNode, selectors)) {
			return currentNode;
		}
		if (!isNewParentNode(rootNode as ParentNode, currentNode)) {
			return null;
		}
		currentNode = currentNode.parentNode as Element;
	}
}

export function isNewParentNode(rootNode: ParentNode, currentNode: Element) {
	let validNode = typeof currentNode.parentNode === "object";
	let validElement = isElement(currentNode.parentNode);
	let differentNodes = rootNode !== currentNode;
	return validNode && validElement && differentNodes;
}

export function isMatchedSelector(node: Element, selectors: CssSelector[]): boolean {
	for (let selector of selectors) {
		switch (selector.type) {
			case SelectorType.TAG:
				if (node.tagName !== selector.value) {
					return false;
				}
				break;
			case SelectorType.ID:
				if (!hasAttribute(node, "id", selector.value)) {
					return false;
				}
				break;
			case SelectorType.CLASS:
				if (!containsAttribute(node, "class", selector.value)) {
					return false;
				}
				break;
		}
	}
	return true;
}

export function isElement(object: any): object is Element {
	let validNodeName = Util.checkObjectKeys(object, "nodeName", "string");
	let validTagName = Util.checkObjectKeys(object, "tagName", "string");
	let validNamespace = Util.checkObjectKeys(object, "namespaceURI", "string");
	let validArray = typeof object === "object" && Array.isArray(object.attrs) && object !== null;
	return validNodeName && validTagName && validNamespace && validArray;
}

export function isTextNode(object: any): object is TextNode {
	let validNodeName = Util.checkObjectKeys(object, "nodeName", "string") && object.nodeName === "#text";
	let validContent = Util.checkObjectKeys(object, "value", "string");
	let validObject = typeof object === "object" && object !== null;
	return validNodeName && validContent && validObject;
}

export function getAttribute(node: Element, name: string): string | null {
	for (let attr of node.attrs) {
		if (attr.name === name) {
			return attr.value;
		}
	}
	return null;
}

export function hasAttribute(node: Element, name: string, value: string): boolean {
	for (let attr of node.attrs) {
		if (attr.name === name && attr.value === value) {
			return true;
		}
	}
	return false;
}

export function containsAttribute(node: Element, name: string, value: string): boolean {
	for (let attr of node.attrs) {
		if (attr.name === name) {
			let attrValues = attr.value.split(/\s+/);
			return attrValues.includes(value);
		}
	}
	return false;
}

export function getText(node: Element): string | null {
	if (node === null || !isElement(node)) {
		return null;
	}
	let text = "";
	for (let child of node.childNodes) {
		if (isTextNode(child)) {
			text += child.value;
		} else if (isElement(child)) {
			text += getText(child);
		}
	}
	return text.trim();
}
