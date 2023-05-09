import {DatasetAttribute} from "./components/DatasetAttribute";
import {HttpResponse} from "./components/HttpResponse";
import {sectionKeys} from "./components/Section";
import {InsightDatasetKind, InsightError} from "./controller/IInsightFacade";
import * as http from "http";
import {DatasetKindMap} from "./controller/InsightFacade";
import {roomKeys} from "./components/Room";

export class Util {
	public static splitQueryKey(attributeId: string, kindMap: DatasetKindMap | InsightDatasetKind): DatasetAttribute {
		if (typeof attributeId !== TSFormat.string || attributeId.indexOf("_") === -1) {
			throw new InsightError("Attribute ID provided is an invalid format, or doesn't contain an underscore");
		}
		let attributeArray = attributeId.split("_");
		if (attributeArray.length > 2) {
			throw new InsightError("Attribute ID contains more than one underscore");
		}

		let datasetId = attributeArray[0];
		let datasetKey = attributeArray[1];

		let datasetKind =
			kindMap instanceof Map
				? kindMap.get(datasetId)
				: Object.values(InsightDatasetKind).includes(kindMap)
					? kindMap
					: null;
		if (!datasetKind) {
			throw new InsightError("Error in reading dataset kind");
		}

		let validKeys = Array.from(this.getValidDatasetKeys(datasetKind).keys());
		if (!validKeys.includes(datasetKey)) {
			throw new InsightError(`${datasetKey} is an invalid query key for ${datasetKind} kind`);
		}

		return new DatasetAttribute(datasetId, datasetKey);
	}

	/**
	 * Perform validation of a dataset ID for presence of underscores, whitespaces,
	 * and non-emptiness.
	 * @param id The id of the dataset to validate
	 * @returns true, only if id has no underscores, no whitespaces, and not empty
	 */
	public static checkValidId(id: string): boolean {
		const regex = /^\S*$/; // string containing only non-whitespaces
		const containsWhitespace = !regex.exec(id);
		const containsUnderscore = id.includes("_");
		const emptyId = id === null || id.length === 0;
		return !containsUnderscore && !containsWhitespace && !emptyId;
	}

	/**
	 * Perform strict type equality check on the specified key within a object.
	 * The key must exist and match the type specified (nulls not accepted).
	 * @param object The object from the JSON parsed data
	 * @param key The key to check within specified object
	 * @param type The expected type of the key within specified object
	 * @returns true, only if key found and with correct matching type
	 */
	public static checkObjectKeys(object: any, key: string, type: TSType) {
		const validKey = key in object;
		const validKeyType = (typeof object[key] as TSType) === type;
		const keyNotNull = object[key] !== null;
		return validKey && validKeyType && keyNotNull;
	}

	/**
	 * Perform strict type equality check on the object.
	 * @param object The object from the JSON parsed data
	 * @returns true, only if object matches correct "object" typing
	 */
	public static checkObjectType(object: any) {
		const validObjectType = typeof object === "object";
		const objectNotNull = object !== null;
		return validObjectType && objectNotNull;
	}

	public static getFilterObject(filter: any, key: string, type: TSType, isArray: boolean, notEmpty: boolean): any {
		if (!this.checkObjectKeys(filter, key, type)) {
			throw new InsightError(`${key} has incorrect type, must be of type ${type}`);
		}

		let filterObject = filter[key];

		if (isArray && !Array.isArray(filterObject)) {
			throw new InsightError(`${key} must be of an array type`);
		} else if (notEmpty && filterObject.length === 0) {
			throw new InsightError(`${key} must be a non-empty array`);
		}

		return filterObject;
	}

	public static getValidDatasetKeys(kind: InsightDatasetKind): Map<string, string> {
		switch (kind) {
			case InsightDatasetKind.Sections:
				return sectionKeys;
			case InsightDatasetKind.Rooms:
				return roomKeys;
			default:
				return new Map<string, string>();
		}
	}

	public static getDatasetKeyType(key: string, kind: InsightDatasetKind): TSType | null {
		let datasetKeys = this.getValidDatasetKeys(kind);
		if (!datasetKeys.has(key)) {
			return null;
		} else {
			return datasetKeys.get(key) as TSType;
		}
	}

	/**
	 * Encode ID of the dataset with Base64 encoding to ensure datasets retain
	 * file naming consistency when writing to disk.
	 * Replaces forward slashs "/" with periods "." to eliminate file path errors.
	 * @param id The id of the dataset in UTF8 encoding
	 * @returns The id of the dataset encoded in Base64, with "/" replaced with "."
	 */
	public static encodeIdPathBase64(id: string): string {
		return Buffer.from(id).toString("base64").replace(/\//g, ".");
	}

	/**
	 * Decode ID of the dataset from Base64 encoding (i.e. file paths) for use in
	 * dataset operations requiring UTF8 encoded IDs.
	 * @param id The id of the dataset in Base64 encoding
	 * @returns The id of the dataset encoded in UTF8, with "." replaced with "/"
	 */
	public static decodeIdPathBase64(id: string): string {
		return Buffer.from(id.replace(/\./g, "/"), "base64").toString("utf8");
	}

	/**
	 * Check if a base64 string is the encode of a zip file.
	 * @param content The base64 encode of a file
	 * @returns true, iff the base64 string represents a zip file.
	 */
	public static checkIfZip(content: string): boolean {
		return content.charAt(0) === "U";
	}

	/**
	 * Check if the file is in json format.
	 * @param object Files send into addDataset method.
	 * @returns true, iff the file is in json format.
	 * reference: https://stackoverflow.com/questions/17713485/how-to-test-if-the-uploaded-file-is-a-json-file-in-node-js
	 */
	public static checkIfJson(object: any): boolean {
		try {
			JSON.parse(object);
			// if came to here, then valid
			return true;
		} catch (e) {
			// failed to parse
			return false;
		}
	}

	public static getCall(url: string): Promise<HttpResponse> {
		return new Promise<HttpResponse>((resolve, reject) => {
			http.get(url, (response: http.IncomingMessage) => {
				let readData = "";
				response.on("data", (chunk) => {
					readData += chunk;
				});
				response.on("end", () => {
					let httpResponse = new HttpResponse(response, readData);
					resolve(httpResponse);
				});
			}).on("error", (error: Error) => {
				reject(error);
			});
		});
	}

	public static checkApplyName(object: any) {
		return typeof object === "string" && !object.includes("_") && object.length > 0;
	}
}

/**
 * Specifiying all available TS types for type-checking
 */
export type TSType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";

/**
 * Enumeration of all available TS types in string format
 */
export enum TSFormat {
	string = "string",
	number = "number",
	bigint = "bigint",
	boolean = "boolean",
	symbol = "symbol",
	undefined = "undefined",
	object = "object",
	function = "function",
}
