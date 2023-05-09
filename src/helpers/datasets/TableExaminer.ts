import {DefaultTreeAdapterMap} from "parse5";
import {Element} from "parse5/dist/tree-adapters/default";
import {extractCssSelector, findAllSelectors, findParentNode, getAttribute, getText} from "../Parse5Helper";

const MORE_INFO_TEXT = "More info";
const MORE_INFO_CLASS = "td.views-field-nothing a";

export abstract class TableExaminer {
	protected abstract getValidTable(tables: Element[]): Element | null;

	protected findValidTable(tables: Element[], filter: (tableRow: Element) => boolean): Element | null {
		for (let table of tables) {
			let rows = findAllSelectors(table, "tr");
			for (let row of rows) {
				let selector = extractCssSelector("thead");
				let headerRow = findParentNode(null, row, selector);
				let validFilter = filter(row);
				if (!headerRow && validFilter) {
					return table;
				}
			}
		}
		return null;
	}

	public getMoreInfo(row: Element): string | null {
		let elements = findAllSelectors(row, MORE_INFO_CLASS);
		for (let element of elements) {
			let text = getText(element);
			let link = getAttribute(element, "href");
			if (text === MORE_INFO_TEXT && link !== null) {
				return link;
			}
		}
		return null;
	}
}
