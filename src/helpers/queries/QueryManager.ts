import {Dataset} from "../../components/Dataset";
import {DatasetAttribute} from "../../components/DatasetAttribute";
import {
	AndFilter,
	ComparatorFilter,
	ComparatorType,
	IsFilter,
	NotFilter,
	OrFilter,
	QueryFilter,
} from "../../components/QueryFilter";
import {QueryOptions} from "../../components/QueryOptions";
import {QueryKey, QueryValidator} from "../../components/QueryStructure";
import {InsightError} from "../../controller/IInsightFacade";
import InsightFacade from "../../controller/InsightFacade";
import {TSFormat, Util} from "../../Util";
import {QueryTransformation} from "./QueryTransformation";
import {ResultManager} from "./ResultManager";

export class QueryManager {
	public static parseQuery(parent: InsightFacade, query: any): any[] {
		let queryValidator = new QueryValidator();

		if (!queryValidator.validate(query)) {
			throw new InsightError("Encountered false return error in validation");
		}

		let queryWhere = query[QueryKey.WHERE];
		let queryOptions = query[QueryKey.OPTIONS];
		let hasTransform = Object.prototype.hasOwnProperty.call(query, QueryKey.TRANSFORMATIONS);
		// let hasTransform = query.hasOwnProperty(QueryKey.TRANSFORMATIONS);
		let transform = hasTransform ? query[QueryKey.TRANSFORMATIONS] : null;
		let kindMap = parent.getDatasetKind();

		let optionsObject: QueryOptions = new QueryOptions(queryOptions, transform, kindMap);
		let loadedDatasetIds = parent.listDatasetIds();
		if (!loadedDatasetIds.includes(optionsObject.datasetId)) {
			throw new InsightError("Dataset ID not loaded");
		}

		let datasetQueried = this.findQueryDataset(parent, optionsObject);
		let transformOperation = null;
		if (hasTransform) {
			transformOperation = new QueryTransformation(transform, optionsObject, datasetQueried.kind);
		} else {
			if (optionsObject.applyKeys.length > 0) {
				throw new InsightError("Invalid key in COLUMNS");
			}
		}
		let selectedFilter = this.findFilter(datasetQueried, queryWhere, true);
		let filteredEntries = ResultManager.findEntries(
			datasetQueried,
			selectedFilter,
			optionsObject,
			transformOperation
		);
		return filteredEntries;
	}

	public static findQueryDataset(parent: InsightFacade, options: QueryOptions): Dataset {
		let datasetIds = parent.listDatasetIds();
		if (!datasetIds.includes(options.datasetId)) {
			throw new InsightError("Dataset ID is not loaded in instance of InsightFacade");
		}

		let datasetQueried: Dataset = parent.datasets.find((dataset) => dataset.id === options.datasetId) as Dataset;
		return datasetQueried;
	}

	public static findFilter(dataset: Dataset, filter: any, atWhereLevel: boolean): QueryFilter | null {
		let filterKey = Object.keys(filter);
		if (filterKey.length === 0) {
			if (atWhereLevel) {
				return null;
			} else {
				throw new InsightError("FILTER contains missing keys, currently none specified");
			}
		}
		if (filterKey.length > 1) {
			throw new InsightError("Excess keys in query");
		}

		let queryFilter: QueryFilter;
		switch (filterKey[0]) {
			case QueryKey.AND:
			case QueryKey.OR:
				queryFilter = this.parseLogicComparison(dataset, filter);
				break;
			case QueryKey.EQ:
			case QueryKey.LT:
			case QueryKey.GT:
				queryFilter = this.parseMComparison(dataset, filter);
				break;
			case QueryKey.IS:
				queryFilter = this.parseSComparison(dataset, filter);
				break;
			case QueryKey.NOT:
				queryFilter = this.parseNegationComparison(dataset, filter);
				break;
			default:
				throw new InsightError(`Invalid filter key provided: ${filterKey[0]}`);
		}

		return queryFilter;
	}

	public static parseLogicComparison(dataset: Dataset, filter: any): AndFilter | OrFilter {
		let filterKey: string = Object.keys(filter)[0];
		let filterObject = Util.getFilterObject(filter, filterKey, TSFormat.object, false, false);
		let subFilters: QueryFilter[] = [];

		if (filterObject.length === 0) {
			throw new InsightError(`${filterKey} filter can not be empty`);
		}

		for (let filterItem of filterObject) {
			let subFilter = this.findFilter(dataset, filterItem, false) as QueryFilter;
			subFilters.push(subFilter);
		}

		if (filterKey === QueryKey.AND) {
			return new AndFilter(subFilters);
		} else {
			return new OrFilter(subFilters);
		}
	}

	public static parseMComparison(dataset: Dataset, filter: any): ComparatorFilter {
		let filterKey: ComparatorType = Object.keys(filter)[0] as ComparatorType;
		let filterObject = Util.getFilterObject(filter, filterKey, TSFormat.object, false, false);
		if (filterObject.length === 0) {
			throw new InsightError(`${filterKey} filter can not be empty`);
		}
		let datasetFilterKey: string = this.verifySingleFilter(filterObject, filterKey);
		let datasetAttribute: DatasetAttribute = this.verifyDatasetAttribute(
			dataset,
			filterKey,
			datasetFilterKey,
			TSFormat.number
		);

		let queryValue = filterObject[datasetFilterKey];
		let queryValueType = typeof filterObject[datasetFilterKey];
		if (queryValueType !== TSFormat.number) {
			throw new InsightError(`Invalid VALUE type in ${filterKey}, expected number but got ${queryValueType}`);
		}

		return new ComparatorFilter(filterKey, datasetAttribute.datasetKey, queryValue);
	}

	public static verifySingleFilter(filterObject: any, filterKey: string): string {
		let filterKeys: string[] = Object.keys(filterObject);
		if (filterKeys.length !== 1) {
			throw new InsightError(`${filterKey} should only have 1 key, currently has ${filterKeys.length} keys`);
		}

		return filterKeys[0];
	}

	public static parseSComparison(dataset: Dataset, filter: any): IsFilter {
		let filterObject = Util.getFilterObject(filter, QueryKey.IS, TSFormat.object, false, false);
		let datasetFilterKey: string = this.verifySingleFilter(filterObject, QueryKey.IS);
		if (filterObject.length === 0) {
			throw new InsightError(`${QueryKey.IS} filter can not be empty`);
		}
		let datasetAttribute: DatasetAttribute = this.verifyDatasetAttribute(
			dataset,
			QueryKey.IS,
			datasetFilterKey,
			TSFormat.string
		);

		let queryValue = filterObject[datasetFilterKey];
		let queryValueType = typeof filterObject[datasetFilterKey];
		if (queryValueType !== TSFormat.string) {
			throw new InsightError(`Invalid VALUE type in ${QueryKey.IS}, expected string but got ${queryValueType}`);
		}

		let prefixWildcard = queryValue.startsWith("*");
		let suffixWildcard = queryValue.endsWith("*");

		if (prefixWildcard && suffixWildcard) {
			if (queryValue.length !== 1) {
				queryValue = queryValue.substring(1, queryValue.length - 1);
			} else {
				queryValue = "";
			}
		} else if (prefixWildcard) {
			queryValue = queryValue.substring(1);
		} else if (suffixWildcard) {
			queryValue = queryValue.substring(0, queryValue.length - 1);
		}

		if (queryValue.includes("*")) {
			throw new InsightError("Wildcards (*) can only be placed at beginning or end of input string");
		}

		return new IsFilter(datasetAttribute.datasetKey, queryValue, prefixWildcard, suffixWildcard);
	}

	public static parseNegationComparison(dataset: Dataset, filter: any): NotFilter {
		let filterObject = Util.getFilterObject(filter, QueryKey.NOT, TSFormat.object, false, false);
		if (filterObject.length === 0) {
			throw new InsightError(`${QueryKey.NOT} filter can not be empty`);
		}
		let subFilterKey: string = this.verifySingleFilter(filterObject, QueryKey.NOT);
		let subFilter: QueryFilter = this.findFilter(dataset, filterObject, false) as QueryFilter;
		return new NotFilter(subFilter);
	}

	public static verifyDatasetAttribute(
		dataset: Dataset,
		filterKey: string,
		datasetKey: string,
		type: TSFormat
	): DatasetAttribute {
		let datasetAttribute = Util.splitQueryKey(datasetKey, dataset.kind);
		let datasetKeyType = Util.getDatasetKeyType(datasetAttribute.datasetKey, dataset.kind);

		if (datasetAttribute.datasetId !== dataset.id) {
			throw new InsightError("Cannot query more than one dataset at a time");
		}
		if (datasetKeyType === null) {
			throw new InsightError(`Invalid key ${datasetKey} was provided in ${filterKey}`);
		}
		if (datasetKeyType !== type) {
			throw new InsightError(
				`Invalid type of key was provided in ${filterKey}, expected ${type} and got ${datasetKeyType}`
			);
		}

		return datasetAttribute;
	}
}
