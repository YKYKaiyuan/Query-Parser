import Decimal from "decimal.js";
import {Dataset, datasetKeys} from "../../components/Dataset";
import {QueryFilter} from "../../components/QueryFilter";
import {OrderDir, QueryOptions} from "../../components/QueryOptions";
import {Room} from "../../components/Room";
import {Section} from "../../components/Section";
import {ResultTooLargeError} from "../../controller/IInsightFacade";
import {DatasetKindMap} from "../../controller/InsightFacade";
import {Util} from "../../Util";
import {ApplyRule} from "./QueryApply";
import {QueryTransformation} from "./QueryTransformation";

export class ResultManager {
	public static readonly TOO_LARGE_RESULTS: number = 5000;

	public static findEntries(
		dataset: Dataset,
		filterKey: QueryFilter | null,
		options: QueryOptions,
		transform: QueryTransformation | null
	): any[] {
		let dataEntries: any[] = [];
		let filteredEntries: any[] = [];

		if (filterKey === null) {
			for (let entry of dataset.data) {
				dataEntries.push(entry);
			}
		} else {
			for (let entry of dataset.data) {
				if ((Section.isValidSection(entry) || Room.isValidRoom(entry)) && filterKey.filter(entry)) {
					dataEntries.push(entry);
				}
			}
		}

		if (transform) {
			filteredEntries = this.applyTransforms(dataEntries, options, transform);
		} else {
			filteredEntries = dataEntries.map((entry) => {
				return this.filterAttributes(entry, options);
			});
		}

		if (filteredEntries.length > this.TOO_LARGE_RESULTS) {
			throw new ResultTooLargeError(
				`The result is too big. Only queries with a maximum of ${this.TOO_LARGE_RESULTS} results are supported.`
			);
		}

		this.sortFilteredEntries(filteredEntries, options);

		return filteredEntries;
	}

	public static filterAttributes(entry: Section | Room, options: QueryOptions): any {
		let filteredAttributes: any = {};
		for (let attribute of options.columnKeys) {
			if (attribute in entry) {
				let validAttributeKey = `${options.datasetId}_${attribute}`;
				let entryData = (entry as any)[attribute];
				filteredAttributes[validAttributeKey] = entryData;
			}
		}
		return filteredAttributes;
	}

	public static sortFilteredEntries(filtered: any[], options: QueryOptions) {
		let sortFunction = (aEntry: any, bEntry: any) => {
			for (let key of options.orderKey) {
				let aEntryValue = aEntry[key];
				let bEntryValue = bEntry[key];
				let sortValue = aEntryValue > bEntryValue ? 1 : -1;
				return sortValue;
			}
			return 0;
		};

		filtered.sort(sortFunction);
		if (options.orderDir === OrderDir.DOWN) {
			filtered.reverse();
		}
	}

	public static applyTransforms(
		entries: Section[] | Room[],
		options: QueryOptions,
		transform: QueryTransformation
	): any {
		let groupMap = this.applyGroup(entries, options, transform);
		let transformedData: any[] = [];
		for (let [groupName, groupedEntries] of groupMap) {
			transformedData.push(this.applyApply(groupedEntries, options, transform));
		}
		return transformedData;
	}

	public static applyGroup(
		entries: Section[] | Room[],
		options: QueryOptions,
		transform: QueryTransformation
	): Map<string, Section[] | Room[]> {
		let applyGroup: string[] = transform.group;
		let groupMap = new Map();
		for (let entry of entries) {
			let groupedKeys = this.getGroupedKeys(entry, applyGroup, options.kindMap);
			let containsGroupKey = groupMap.has(groupedKeys);
			if (containsGroupKey) {
				let groupMapContainer = groupMap.get(groupedKeys);
				groupMapContainer.push(entry);
			} else {
				groupMap.set(groupedKeys, [entry]);
			}
		}
		return groupMap;
	}

	public static getGroupedKeys(entry: Section | Room, keys: string[], kindMap: DatasetKindMap): string {
		let groupedKeys = "";
		for (let key of keys) {
			let idKey = Util.splitQueryKey(key, kindMap).datasetKey;
			groupedKeys = groupedKeys.concat((entry as any)[idKey]) + "_";
		}
		return groupedKeys;
	}

	public static applyApply(entries: Section[] | Room[], options: QueryOptions, transform: QueryTransformation): any {
		let entriesFiltered = this.filterAttributes(entries[0], options);
		let applyList = transform.apply;

		for (let apply of applyList) {
			let applyName = apply.applyName;
			let applyKey = apply.applyKey;
			if (!options.applyKeys.includes(applyName)) {
				continue;
			}
			let entryValues = entries.map((entry) => (entry as any)[applyKey]);
			entriesFiltered[applyName] = this.applyRule(entryValues, apply.applyRule);
		}
		return entriesFiltered;
	}

	public static applyRule(values: any[], applyRule: ApplyRule): number {
		switch (applyRule) {
			case ApplyRule.COUNT: {
				return new Set(values).size;
			}
			case ApplyRule.SUM: {
				let sumValues = values.reduce((previous, current) => previous + current);
				let sumValuesFixed = sumValues.toFixed(2);
				return Number(sumValuesFixed);
			}
			case ApplyRule.AVG: {
				let decimals = values.map((value) => new Decimal(value));
				let total = decimals.reduce((previous, current) => {
					return Decimal.add(previous, current);
				}, new Decimal(0));
				let average = total.toNumber() / values.length;
				return Number(average.toFixed(2));
			}
			case ApplyRule.MIN: {
				return Math.min(...values);
			}
			case ApplyRule.MAX: {
				return Math.max(...values);
			}
		}
	}
}
