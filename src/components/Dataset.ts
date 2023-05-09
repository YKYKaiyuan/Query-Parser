import {InsightDatasetKind} from "../controller/IInsightFacade";
import {Section} from "./Section";
import {Util} from "../Util";
import {Room} from "./Room";

export const datasetKeys = {
	id: "id",
	kind: "kind",
	data: "data",
};

export class Dataset {
	constructor(
		public readonly id: string,
		public readonly kind: InsightDatasetKind,
		public readonly data: Section[] | Room[] // For C1, Room[] is an invalid dataset kind
	) {}

	/**
	 * Validates the given object for all the following conditions:
	 * - Object has 'object' type
	 * - Object has valid 'id' (no whitespaces, underscores, and not empty)
	 * - Object has valid id type (i.e. string)
	 * - Object has a valid dataset kind (i.e. Sections or Rooms)
	 * - Object data is in the form of an array
	 * - Object contains all the necessary keys (i.e. id, kind, data)
	 * - Object data contains all rows with valid sections
	 * @param object The JSON parsed object to be validated
	 * @returns true, if passes all id, keys, and type validation checks, else return false
	 */
	public static isValidDataset(object: any): object is Dataset {
		const isValidObject = Util.checkObjectType(object);
		const isValidId = Util.checkValidId(object.id);
		const isValidIdType = typeof object.id === "string";
		const isValidDatasetKind = Object.values(InsightDatasetKind).includes(object.kind);
		const isValidDataType = Array.isArray(object.data);

		if (!(isValidObject && isValidId && isValidIdType && isValidDatasetKind && isValidDataType)) {
			return false;
		}

		for (let key in datasetKeys) {
			let isKeyPresent = key in object;
			if (!isKeyPresent) {
				return false;
			}
		}
		// TODO: Dataset is still valid if even one section is valid!
		for (let entry of object.data) {
			if (!Section.isValidSection(entry) && !Room.isValidRoom(entry)) {
				return false;
			}
		}

		return true;
	}
}
