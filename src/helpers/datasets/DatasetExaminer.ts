import JSZip from "jszip";
import {Dataset} from "../../components/Dataset";
import {TSFormat} from "../../Util";

export abstract class DatasetExaminer {
	public abstract examineDataset(zipData: JSZip, id: string): Promise<Dataset>;

	protected static examineDatasetData(
		data: any,
		queryKey: string,
		expected: TSFormat.string | TSFormat.number
	): string | number {
		if (!(queryKey in data)) {
			throw new Error("Invalid key found in entry, does not exist");
		}
		let sectionDataType = typeof data[queryKey];
		if ((sectionDataType as TSFormat) === expected) {
			return data[queryKey];
		}
		switch (expected) {
			case TSFormat.string:
				return `${data[queryKey]}`;
			case TSFormat.number:
				return parseFloat(data[queryKey]);
		}
	}
}
