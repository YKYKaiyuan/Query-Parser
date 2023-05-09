import {QueryOptions} from "../../components/QueryOptions";
import {InsightDatasetKind, InsightError} from "../../controller/IInsightFacade";
import {Util} from "../../Util";

export enum ApplyRule {
	MAX = "MAX",
	MIN = "MIN",
	AVG = "AVG",
	SUM = "SUM",
	COUNT = "COUNT",
}

export class QueryApply {
	public readonly applyName: string;
	public readonly applyRule: ApplyRule;
	public readonly applyKey: string;

	constructor(applyObj: any, options: QueryOptions, kind: InsightDatasetKind) {
		this.applyName = Object.keys(applyObj)[0];
		let applyRuleObject: any = applyObj[this.applyName];
		this.applyRule = Object.keys(applyRuleObject)[0] as ApplyRule;
		let applyKey: string = applyRuleObject[this.applyRule];

		let applyKeyAttribute = Util.splitQueryKey(applyKey, options.kindMap);
		if (applyKeyAttribute.datasetId !== options.datasetId) {
			throw new InsightError("Cannot query multiple datasets at a time");
		}
		if (!QueryApply.checkApplyType(this.applyRule, applyKeyAttribute.datasetKey, kind)) {
			throw new InsightError(`${this.applyRule} can only be applied for numerical values`);
		}
		this.applyKey = applyKeyAttribute.datasetKey;
	}

	private static checkApplyType(rule: ApplyRule, key: string, kind: InsightDatasetKind): boolean {
		if (rule === ApplyRule.COUNT) {
			return true;
		}

		return Util.getDatasetKeyType(key, kind) === "number";
	}
}
