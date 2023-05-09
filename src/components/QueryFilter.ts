import {Room} from "./Room";
import {Section} from "./Section";

export abstract class QueryFilter {
	/**
	 * Performs the filter specified by the QueryFilter subclass
	 * @param input The section to be filtered
	 * @returns true if filtered successfully, otherwise return false
	 */
	public abstract filter(input: Section | Room): boolean;
}

export class AndFilter extends QueryFilter {
	constructor(public subFilters: QueryFilter[]) {
		super();
	}

	public filter(input: Section | Room): boolean {
		for (let subFilter of this.subFilters) {
			if (!subFilter.filter(input)) {
				return false;
			}
		}
		return true;
	}
}

export class OrFilter extends QueryFilter {
	constructor(public subFilters: QueryFilter[]) {
		super();
	}

	public filter(input: Section | Room): boolean {
		for (let subFilter of this.subFilters) {
			if (subFilter.filter(input)) {
				return true;
			}
		}
		return false;
	}
}

export enum ComparatorType {
	LT = "LT",
	GT = "GT",
	EQ = "EQ",
}

export class ComparatorFilter extends QueryFilter {
	constructor(public comparator: ComparatorType, public queryKey: string, public compareValue: number) {
		super();
	}

	public filter(input: Section): boolean {
		let queryKeyValue: number = (input as any)[this.queryKey];
		switch (this.comparator) {
			case ComparatorType.EQ:
				return queryKeyValue === this.compareValue;
			case ComparatorType.LT:
				return queryKeyValue < this.compareValue;
			case ComparatorType.GT:
				return queryKeyValue > this.compareValue;
		}
	}
}

export class NotFilter extends QueryFilter {
	constructor(public subFilter: QueryFilter) {
		super();
	}

	public filter(input: Section | Room): boolean {
		return !this.subFilter.filter(input);
	}
}

export class IsFilter extends QueryFilter {
	constructor(
		public queryKey: string,
		public containValue: string,
		public prefixWildcard: boolean,
		public suffixWildcard: boolean
	) {
		super();
	}

	public filter(input: Section | Room): boolean {
		let queryKeyValue: string = (input as any)[this.queryKey];
		if (this.prefixWildcard && this.suffixWildcard) {
			return queryKeyValue.includes(this.containValue);
		} else if (this.prefixWildcard) {
			return queryKeyValue.endsWith(this.containValue);
		} else if (this.suffixWildcard) {
			return queryKeyValue.startsWith(this.containValue);
		} else {
			return queryKeyValue === this.containValue;
		}
	}
}
