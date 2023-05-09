import {Util, TSType} from "../Util";

export const sectionKeys = new Map([
	["dept", "string"],
	["id", "string"],
	["avg", "number"],
	["instructor", "string"],
	["title", "string"],
	["pass", "number"],
	["fail", "number"],
	["audit", "number"],
	["uuid", "string"],
	["year", "number"],
]);

export class Section {
	constructor(
		public dept: string,
		public id: string,
		public avg: number,
		public instructor: string,
		public title: string,
		public pass: number,
		public fail: number,
		public audit: number,
		public uuid: string,
		public year: number
	) {}

	/**
	 * Validates the given object for all the following conditions:
	 * - Object has 'object' type
	 * - Object contains all the required keys
	 * - Object keys are all the correct type
	 * - Object key contents are not empty
	 * @param object The JSON parsed object to validate
	 * @returns true, if passes all type checking conditions (incl. keys), else return false
	 */
	public static isValidSection(object: any): object is Section {
		const isValidObject = Util.checkObjectType(object);
		if (!isValidObject) {
			return false;
		}
		for (let [key, type] of sectionKeys) {
			let isValidKeys = Util.checkObjectKeys(object, key, type as TSType);
			if (!isValidKeys) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Parse a Jzip string and convert it as a Section object, then push all sections to an array.
	 * @param file a JzipObject parsed as string
	 * @returns An array of sections.
	 */
	public static jsonToSection(file: string): Section[] {
		let sections: Section[] = [];
		let tsObj = JSON.parse(file);
		for (let i of tsObj.result) {
			let temp = new Section(
				i.Subject, // Section.dept
				i.id, // Section.id
				i.Avg, // Section.avg
				i.Professor, // Section.instructor
				i.Title, // Section.title
				i.Pass, // Section.pass
				i.Fail, // Section.fail
				i.Audit, // Section.audit
				i.Course, // Section.uuid
				i.Year
			); // Section.year
			if (this.checkIfAllSectionKeysAreValid(temp)) {
				sections.push(temp);
			}
		}
		return sections;
	}

	/**
	 * Check if a section contain every field used which can be used by a query.
	 * @param section A section object.
	 * @returns true, iff all keys of the section is not empty and defined.
	 */
	public static checkIfAllSectionKeysAreValid(section: Section): boolean {
		return Object.values(section).every((value) => {
			return !(value === undefined);
		});
	}
}
