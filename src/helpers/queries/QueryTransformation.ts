import {QueryOptions} from "../../components/QueryOptions";
import {QueryKey} from "../../components/QueryStructure";
import {InsightDatasetKind, InsightError} from "../../controller/IInsightFacade";
import {Util} from "../../Util";
import {QueryApply} from "./QueryApply";

export class QueryTransformation {
	public readonly group: string[];
	public readonly apply: QueryApply[];

	constructor(transforms: any, options: QueryOptions, kind: InsightDatasetKind) {
		this.group = transforms[QueryKey.GROUP];
		for (let key of this.group) {
			let idAttribute = Util.splitQueryKey(key, options.kindMap);
			if (idAttribute.datasetId !== options.datasetId) {
				throw new InsightError("Cannot query more than one dataset at a time");
			}
		}
		let applyObject: object[] = transforms[QueryKey.APPLY];
		this.apply = applyObject.map((rule) => {
			return new QueryApply(rule, options, kind);
		});
		let applyNames = this.apply.map((rule) => {
			return rule.applyName;
		});
		let setApplyKeys = new Set(applyNames);
		if (setApplyKeys.size !== applyNames.length) {
			throw new InsightError("Must contain unique keys in ApplyKeys");
		}
		for (let applyKey of options.applyKeys) {
			if (!applyNames.includes(applyKey)) {
				throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS present");
			}
		}
		for (let columnKey of options.columnKeys) {
			if (!this.group.includes(`${options.datasetId}_${columnKey}`)) {
				throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS present");
			}
		}
	}
}
