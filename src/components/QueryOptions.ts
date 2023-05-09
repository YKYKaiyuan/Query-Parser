import {InsightError} from "../controller/IInsightFacade";
import {DatasetKindMap} from "../controller/InsightFacade";
import {Util} from "../Util";
import {DatasetAttribute} from "./DatasetAttribute";
import {QueryKey} from "./QueryStructure";

export class QueryOptions {
	public readonly datasetId: string;
	public readonly columnKeys: string[];
	public readonly orderKey: string[] = [];
	public readonly orderDir: string = OrderDir.UP;
	public readonly applyKeys: string[] = [];
	public readonly kindMap: DatasetKindMap;

	constructor(options: any, transform: any, kindMap: DatasetKindMap) {
		let columnKeys = options[QueryKey.COLUMNS];
		let datasetIds: string[] = [];
		let datasetKeys: string[] = [];
		this.kindMap = kindMap;

		for (let attribute of columnKeys) {
			if (Util.checkApplyName(attribute)) {
				this.applyKeys.push(attribute);
				continue;
			}
			let datasetAttribute: DatasetAttribute = Util.splitQueryKey(attribute, kindMap);
			datasetIds.push(datasetAttribute.datasetId);
			datasetKeys.push(datasetAttribute.datasetKey);
		}

		let uniqueIds = new Set(datasetIds);
		if (uniqueIds.size > 1) {
			throw new InsightError("Found more than one dataset ID in OPTIONS");
		}

		if (transform) {
			this.datasetId = QueryOptions.getIdFromTransform(transform, kindMap);
		} else {
			this.datasetId = datasetIds[0];
		}

		this.datasetId = datasetIds[0];
		this.columnKeys = datasetKeys;

		if (Object.prototype.hasOwnProperty.call(options, QueryKey.ORDER)) {
			let order = QueryOptions.changeOrder(options[QueryKey.ORDER]);
			let orderKeys: string[] = order[QueryKey.keys];
			this.orderDir = order[QueryKey.dir];
			if (this.orderDir !== OrderDir.DOWN && this.orderDir !== OrderDir.UP) {
				throw new InsightError("Order direction must be UP or DOWN");
			}

			for (let key of orderKeys) {
				if (!columnKeys.includes(key)) {
					throw new InsightError("ORDER key not contained within COLUMNS");
				}
			}
			this.orderKey = orderKeys;
		}
	}

	public static getIdFromTransform(transform: any, kindMap: DatasetKindMap): string {
		let id = transform[QueryKey.GROUP][0];
		let datasetId = Util.splitQueryKey(id, kindMap).datasetId;
		return datasetId;
	}

	public static changeOrder(object: any): any {
		if (typeof object === "string") {
			let key = object;
			object = {};
			object[QueryKey.dir] = OrderDir.UP;
			object[QueryKey.keys] = [key];
		}
		return object;
	}
}

export enum OrderDir {
	UP = "UP",
	DOWN = "DOWN",
}
