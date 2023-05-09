import {Util} from "../../Util";
import {Dataset} from "../../components/Dataset";
import {InsightDatasetKind, InsightError} from "../../controller/IInsightFacade";
import * as fs from "fs";
import {Section} from "../../components/Section";

export class DatasetManager {
	public static readonly ROOT_DIR: string = "./data/";
	public static readonly JSON_SUFFIX: string = ".json";
	public static readonly JSON_FORMAT_LEN: number = 5;

	/**
	 * Returns the file path for specified dataset id
	 * @param id The id of the specified dataset
	 * @returns The relative path of specified dataset in the root directory
	 */
	public static getFilePath(id: string): string {
		return `${this.ROOT_DIR}${Util.encodeIdPathBase64(id)}${this.JSON_SUFFIX}`;
	}

	/**
	 * REQUIRES: File exists with given ID name in the root directory.
	 * Reads a dataset with specified ID from the root directory.
	 * @param id The id of the requested dataset (UTF8 encoded)
	 * @returns The dataset with the requested ID
	 * @throws An 'InsightError' if either ID or dataset is invalid
	 */
	public static readDataset(id: string): Dataset {
		if (!Util.checkValidId(id)) {
			throw new InsightError("Invalid Dataset ID");
		}

		let bufferData = fs.readFileSync(this.getFilePath(id));
		let datasetData = JSON.parse(bufferData.toString());

		if (!Dataset.isValidDataset(datasetData)) {
			throw new InsightError("Invalid Dataset Data");
		}

		let datasetInitializer = new Dataset("", InsightDatasetKind.Sections, []);
		let dataset: Dataset = Object.assign(datasetInitializer, datasetData);
		for (let section in dataset.data) {
			dataset.data[section] = Object.assign({} as Section, dataset.data[section]);
		}

		return dataset;
	}

	/**
	 * Read all datasets from root directory on disk, if empty, creates
	 * the root directory.
	 * @returns An array of all datasets read from the root directory
	 */
	public static readAllDatasets(): Dataset[] {
		let datasets: Dataset[] = [];

		if (!fs.existsSync(this.ROOT_DIR)) {
			fs.mkdirSync(this.ROOT_DIR);
			return datasets;
		}
		let datasetFiles: string[] = fs.readdirSync(this.ROOT_DIR);

		for (let file of datasetFiles) {
			if (!file.endsWith(this.JSON_SUFFIX)) {
				continue; // Ignore files we are unable to read, move onto next one
			}

			try {
				// Attempt to read file
				let datasetIdDecoded = Util.decodeIdPathBase64(file.substring(0, file.length - this.JSON_FORMAT_LEN));
				let dataset = this.readDataset(datasetIdDecoded);
				datasets.push(dataset);
			} catch (err) {
				console.log(`Error loading dataset of file: "${file}"; Error: ${err}`);
			}
		}

		return datasets;
	}

	/**
	 * Attempts to remove the specified dataset of given ID from the root directory.
	 * @param id The id of the dataset to delete (UTF8 encoded)
	 * @returns true, if the specified dataset is removed from the root directory, else return false
	 */
	public static deleteDataset(id: string): boolean {
		let datasetFiles: string[] = fs.readdirSync(this.ROOT_DIR);
		for (let file of datasetFiles) {
			if (!file.endsWith(this.JSON_SUFFIX)) {
				continue;
			}
			let datasetId = file.substring(0, file.length - this.JSON_FORMAT_LEN);
			let decodedId = Util.decodeIdPathBase64(datasetId);
			if (id === decodedId) {
				try {
					fs.unlinkSync(this.getFilePath(id));
					return true;
				} catch (error) {
					return false;
				}
			}
		}
		return false;
	}

	public static saveDataset(dataset: Dataset) {
		fs.writeFileSync(this.getFilePath(dataset.id), JSON.stringify(dataset));
	}
}
