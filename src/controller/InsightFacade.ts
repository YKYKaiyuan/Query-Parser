import {Util} from "../Util";
import {Dataset} from "../components/Dataset";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import {DatasetManager} from "../helpers/datasets/DatasetManager";
import {SectionsDatasetExaminer} from "../helpers/datasets/SectionsDatasetExaminer";
import {QueryManager} from "../helpers/queries/QueryManager";
import JSZip, {forEach} from "jszip";
import {RoomsDatasetExaminer} from "../helpers/datasets/RoomsDatasetExaminer";

export type DatasetKindMap = Map<string, InsightDatasetKind>;
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public datasets: Dataset[];
	public sectionsParser: SectionsDatasetExaminer;
	public roomsParser: RoomsDatasetExaminer;

	constructor() {
		this.datasets = DatasetManager.readAllDatasets();
		this.sectionsParser = new SectionsDatasetExaminer();
		this.roomsParser = new RoomsDatasetExaminer();
	}

	public listDatasetIds(): string[] {
		let datasetIds: string[] = [];
		this.datasets.forEach((dataset) => {
			datasetIds.push(dataset.id);
		});
		return datasetIds;
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise<string[]>((resolve, reject) => {
			if (id === null || !Util.checkValidId(id)) {
				return reject(new InsightError("Invalid ID provided"));
			}

			if (kind !== InsightDatasetKind.Sections && kind !== InsightDatasetKind.Rooms) {
				return reject(new InsightError("Unsupported dataset kind"));
			}

			let datasetIds = this.listDatasetIds();
			if (datasetIds.indexOf(id) > -1) {
				return reject(new InsightError("Duplicate ID"));
			}

			let jsZip = new JSZip();
			jsZip
				.loadAsync(content, {base64: true})
				.then((data: JSZip) => {
					let dataParser = kind === InsightDatasetKind.Sections ? this.sectionsParser : this.roomsParser;
					dataParser
						.examineDataset(data, id)
						.then((dataset: Dataset) => {
							this.datasets.push(dataset);
							DatasetManager.saveDataset(dataset);
							let addedIds = this.listDatasetIds();
							resolve(addedIds);
						})
						.catch((error) => {
							reject(error);
						});
				})
				.catch((error) => {
					reject(new InsightError(error));
				});
		});
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			// Check for valid ID
			if (!Util.checkValidId(id)) {
				return reject(new InsightError("Invalid Dataset ID"));
			}

			for (let i = 0; i < this.datasets.length; i++) {
				if (this.datasets[i].id === id) {
					this.datasets.splice(i, 1);
					let removedFromDisk = DatasetManager.deleteDataset(id);
					if (removedFromDisk) {
						return resolve(id);
					}
					return reject(new NotFoundError("Removed From Cache, ID Not Found On Disk"));
				}
			}

			return reject(new NotFoundError("Dataset ID Not Found For Removal"));
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise<any[]>((resolve, reject) => {
			try {
				let queryResults = QueryManager.parseQuery(this, query);
				resolve(queryResults);
			} catch (error) {
				if (error instanceof InsightError || error instanceof ResultTooLargeError) {
					reject(error);
				} else {
					let unknownError = new InsightError(error as string);
					reject(unknownError);
				}
			}
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return new Promise<InsightDataset[]>((resolve, reject) => {
			let allDatasets: InsightDataset[] = this.datasets.map(
				(dataset) =>
					({
						id: dataset.id,
						kind: dataset.kind,
						numRows: dataset.data.length,
					} as InsightDataset)
			);
			return resolve(allDatasets);
		});
	}

	public getDatasetKind(): DatasetKindMap {
		let idsWithKind = new Map();
		this.datasets.map((dataset) => idsWithKind.set(dataset.id, dataset.kind));
		return idsWithKind;
	}
}
