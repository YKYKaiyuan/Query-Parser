import {InsightError} from "../controller/IInsightFacade";
import {ApplyRule} from "../helpers/queries/QueryApply";
import {TSFormat, TSType, Util} from "../Util";
import {OrderDir, QueryOptions} from "./QueryOptions";

export enum QueryKey {
	WHERE = "WHERE",
	OPTIONS = "OPTIONS",
	COLUMNS = "COLUMNS",
	ORDER = "ORDER",
	AND = "AND",
	OR = "OR",
	LT = "LT",
	GT = "GT",
	EQ = "EQ",
	IS = "IS",
	NOT = "NOT",
	TRANSFORMATIONS = "TRANSFORMATIONS",
	GROUP = "GROUP",
	APPLY = "APPLY",
	dir = "dir",
	keys = "keys",
}

export abstract class QueryStructure {
	public readonly keyName: string = "";
	public readonly type: TSType = TSFormat.undefined;
	public readonly requiredKeys: QueryKey[] = [];
	public readonly optionalKeys: QueryKey[] | ApplyRule[] = [];
	public readonly isArray: boolean = false;
	public readonly notEmpty: boolean = false;
	public readonly maxKeys: number = -1;

	public validate(object: any): boolean {
		this.validateObjectType(this, object);

		if (!this.isArray && Array.isArray(object)) {
			throw new InsightError("Expected an object, but recieved an array");
		}

		if (this.isArray) {
			return this.validateArray(this, object);
		}

		let objectKeys = Object.keys(object);
		this.validateMaxKeys(this, objectKeys);

		if (this.requiredKeys.length === 0 && this.optionalKeys.length === 0) {
			return true;
		}

		let validKeys: string[] = [];
		this.validateRequiredKeys(objectKeys, object, validKeys);
		this.validateOptionalKeys(objectKeys, object, validKeys);
		this.validateOnlyValidKeys(this, validKeys, objectKeys);

		return true;
	}

	public validateObjectType(parent: QueryStructure, object: any): void {
		if (typeof object !== parent.type || object === null) {
			throw new InsightError(`${parent.keyName} must be of type '${parent.type}'`);
		}
	}

	public validateArray(parent: QueryStructure, object: any): boolean {
		if (!Array.isArray(object)) {
			throw new InsightError(`${parent.keyName} must be of type '${parent.type}'`);
		} else if (parent.notEmpty && object.length === 0) {
			throw new InsightError(`${parent.keyName} must be a non-empty array`);
		}
		return true;
	}

	public validateMaxKeys(parent: QueryStructure, keys: string[]): void {
		if (parent.maxKeys !== -1 && keys.length > parent.maxKeys) {
			throw new InsightError(
				`${parent.keyName} has a max of ${parent.maxKeys} keys, currently has ${keys.length} keys`
			);
		}
	}

	public validateRequiredKeys(objectKeys: string[], object: any, validKeys: string[]): boolean {
		for (let key of this.requiredKeys) {
			if (!objectKeys.includes(key as string)) {
				throw new InsightError(`${this.keyName} is missing required key: ${key}`);
			}

			let keyValidator: QueryStructure = QueryStructure.getKeyValidator(key);
			if (!keyValidator.validate(object[key])) {
				return false;
			}
			validKeys.push(key);
		}
		return true;
	}

	public validateOptionalKeys(objectKeys: string[], object: any, validKeys: string[]): boolean {
		for (let key of this.optionalKeys) {
			if (objectKeys.includes(key)) {
				let keyValidator: QueryStructure = QueryStructure.getKeyValidator(key);
				if (!keyValidator.validate(object[key])) {
					return false;
				}
				validKeys.push(key);
			}
		}
		return true;
	}

	public validateOnlyValidKeys(parent: QueryStructure, validKeys: string[], objectKeys: string[]) {
		if (validKeys.length !== objectKeys.length) {
			throw new InsightError(`${parent.keyName} contains invalid keys in query`);
		}
	}

	public static getKeyValidator(key: string): QueryStructure {
		switch (key) {
			case QueryKey.WHERE:
				return new WhereValidator();
			case QueryKey.OPTIONS:
				return new OptionsValidator();
			case QueryKey.COLUMNS:
				return new ColumnsValidator();
			case QueryKey.ORDER:
				return new OrderValidator();
			case QueryKey.dir:
				return new DirValidator();
			case QueryKey.keys:
				return new KeysValidator();
			case QueryKey.TRANSFORMATIONS:
				return new TransformationsValidator();
			case QueryKey.GROUP:
				return new GroupValidator();
			case QueryKey.APPLY:
				return new ApplyValidator();
			default:
				return new MockValidator();
		}
	}
}

export class MockValidator extends QueryStructure {
	public validate(): boolean {
		return true;
	}
}

export class QueryValidator extends QueryStructure {
	public keyName = "QUERY";
	public type = TSFormat.object as TSType;
	public requiredKeys: QueryKey[] = [QueryKey.WHERE, QueryKey.OPTIONS];
	public optionalKeys: QueryKey[] | ApplyRule[] = [QueryKey.TRANSFORMATIONS];
}

export class WhereValidator extends QueryStructure {
	public keyName = QueryKey.WHERE;
	public type = TSFormat.object as TSType;
	public optionalKeys: QueryKey[] = [
		QueryKey.AND,
		QueryKey.OR,
		QueryKey.LT,
		QueryKey.EQ,
		QueryKey.GT,
		QueryKey.IS,
		QueryKey.NOT,
	];

	public maxKeys: number = 1;
}

export class OptionsValidator extends QueryStructure {
	public keyName = QueryKey.OPTIONS;
	public type = TSFormat.object as TSType;
	public requiredKeys: QueryKey[] = [QueryKey.COLUMNS];
	public optionalKeys: QueryKey[] = [QueryKey.ORDER];
	public maxKeys = 2;
}

export class ColumnsValidator extends QueryStructure {
	public keyName = QueryKey.COLUMNS;
	public type = TSFormat.object as TSType;
	public isArray: boolean = true;
	public notEmpty: boolean = true;
}

export class OrderValidator extends QueryStructure {
	public keyName = QueryKey.ORDER;
	public type = TSFormat.object as TSType;
	public requiredKeys: QueryKey[] = [QueryKey.dir, QueryKey.keys];

	public validate(object: any): boolean {
		object = QueryOptions.changeOrder(object);
		return super.validate(object);
	}
}

export class DirValidator extends QueryStructure {
	public keyName = QueryKey.dir;
	public type = TSFormat.string as TSType;
}

export class KeysValidator extends QueryStructure {
	public keyName = QueryKey.keys;
	public type = TSFormat.object as TSType;
	public isArray: boolean = true;
	public notEmpty: boolean = true;
}

export class TransformationsValidator extends QueryStructure {
	public keyName = QueryKey.TRANSFORMATIONS;
	public type = TSFormat.object as TSType;
	public requiredKeys: QueryKey[] = [QueryKey.GROUP, QueryKey.APPLY];
}

export class GroupValidator extends QueryStructure {
	public keyName = QueryKey.GROUP;
	public type = TSFormat.object as TSType;
	public isArray: boolean = true;
	public notEmpty: boolean = true;
}

export class ApplyValidator extends QueryStructure {
	public keyName: string = QueryKey.APPLY;
	public type = TSFormat.object as TSType;
	public isArray: boolean = true;
	public notEmpty: boolean = false;

	public validate(object: any): boolean {
		super.validate(object);
		let applyArrayValidator = new ApplyArrayValidator();
		for (let applyName of object) {
			applyArrayValidator.validate(applyName);
		}
		return true;
	}
}

export class ApplyArrayValidator extends QueryStructure {
	public keyName: string = "";
	public type = TSFormat.object as TSType;
	public maxKeys: number = 1;

	public validate(object: any): boolean {
		super.validate(object);
		let applyName = Object.keys(object)[0];
		if (!Util.checkApplyName(applyName)) {
			throw new InsightError("Invalid Apply Key Name");
		}
		let validator = new ApplyKeyObjectValidator();
		return validator.validate(object[applyName]);
	}
}

export class ApplyKeyObjectValidator extends QueryStructure {
	public keyName = "";
	public type = TSFormat.object as TSType;
	public optionalKeys: ApplyRule[] = [ApplyRule.AVG, ApplyRule.COUNT, ApplyRule.SUM, ApplyRule.MAX, ApplyRule.MIN];
	public maxKeys: number = 1;
}
