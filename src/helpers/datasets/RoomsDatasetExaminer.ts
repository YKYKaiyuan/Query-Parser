import JSZip from "jszip";
import {Dataset} from "../../components/Dataset";
import {InsightDatasetKind, InsightError} from "../../controller/IInsightFacade";
import {BuildingsExaminer} from "./BuildingsExaminer";
import {DatasetExaminer} from "./DatasetExaminer";

export class RoomsDatasetExaminer extends DatasetExaminer {
	private readonly buildingsExaminer: BuildingsExaminer;

	constructor() {
		super();
		this.buildingsExaminer = new BuildingsExaminer();
	}

	public examineDataset(zipData: JSZip, id: string): Promise<Dataset> {
		return new Promise<Dataset>((resolve, reject) => {
			let indexFile = zipData.file("index.htm");
			if (!indexFile) {
				return reject(new InsightError("index.htm file not found"));
			}

			indexFile.async("text").then((content) => {
				this.buildingsExaminer.extractRoomsFromIndex(zipData, content).then((rooms) => {
					if (rooms.length === 0) {
						return reject(new InsightError("No rooms datasets read"));
					}
					resolve(new Dataset(id, InsightDatasetKind.Rooms, rooms));
				});
			});
		});
	}
}
