import JSZip, {JSZipObject} from "jszip";
import {Dataset} from "../../components/Dataset";
import {Section} from "../../components/Section";
import {InsightDatasetKind, InsightError} from "../../controller/IInsightFacade";
import {TSFormat} from "../../Util";
import {DatasetExaminer} from "./DatasetExaminer";

export class SectionsDatasetExaminer extends DatasetExaminer {
	public examineDataset(zipData: JSZip, datasetId: string): Promise<Dataset> {
		return new Promise<Dataset>((resolve, reject) => {
			let sections: Section[] = [];
			let promises: Array<Promise<Section[]>> = [];
			zipData.forEach((path, file) => {
				let validFile = this.validateDirectoryFiles(path, file);
				if (validFile) {
					promises.push(this.examineSection(file));
				} else {
					return;
				}
			});

			Promise.all(promises).then((readSections) => {
				for (let sectionArray of readSections) {
					sections.push(...sectionArray);
				}
				if (sections.length === 0) {
					reject(new InsightError("No datasets read"));
				}
				resolve(new Dataset(datasetId, InsightDatasetKind.Sections, sections));
			});
		});
	}

	public validateDirectoryFiles(path: string, file: JSZipObject): boolean {
		let pathParts = path.split("/");
		let rootPath = pathParts[0];
		let isDirectory = file.dir;
		let isCoursesDirectory = rootPath === "courses";
		let notSingleDirectory = pathParts.length > 2;
		if (isDirectory || !isCoursesDirectory || notSingleDirectory) {
			return false;
		}
		return true;
	}

	public examineSection(file: JSZipObject): Promise<Section[]> {
		return new Promise<Section[]>((resolve, reject) => {
			file.async("text")
				.then((data) => {
					let parsedData: any;
					try {
						parsedData = JSON.parse(data);
					} catch (error) {
						return resolve([]);
					}

					if (this.checkInvalidParsedData(parsedData)) {
						return resolve([]);
					}

					let sectionsRead: Section[] = [];
					for (let parsedSection of parsedData.result) {
						if (typeof parsedSection !== "object" || parsedSection === null) {
							continue;
						}
						try {
							let section = this.createSectionFromData(parsedSection);
							sectionsRead.push(section);
						} catch (error) {
							continue;
						}
					}
					resolve(sectionsRead);
				})
				.catch(() => {
					resolve([]);
				});
		});
	}

	public checkInvalidParsedData(parsedData: any): boolean {
		return (
			typeof parsedData !== "object" ||
			Array.isArray(parsedData) ||
			parsedData === null ||
			!("result" in parsedData) ||
			!Array.isArray(parsedData.result) ||
			parsedData.result.length === 0
		);
	}

	public createSectionFromData(parsedSection: any): Section {
		let dept = DatasetExaminer.examineDatasetData(parsedSection, "Subject", TSFormat.string) as string;
		let id = DatasetExaminer.examineDatasetData(parsedSection, "Course", TSFormat.string) as string;
		let avg = DatasetExaminer.examineDatasetData(parsedSection, "Avg", TSFormat.number) as number;
		let instructor = DatasetExaminer.examineDatasetData(parsedSection, "Professor", TSFormat.string) as string;
		let title = DatasetExaminer.examineDatasetData(parsedSection, "Title", TSFormat.string) as string;
		let pass = DatasetExaminer.examineDatasetData(parsedSection, "Pass", TSFormat.number) as number;
		let fail = DatasetExaminer.examineDatasetData(parsedSection, "Fail", TSFormat.number) as number;
		let audit = DatasetExaminer.examineDatasetData(parsedSection, "Audit", TSFormat.number) as number;
		let uuid = DatasetExaminer.examineDatasetData(parsedSection, "id", TSFormat.string) as string;
		let year = 1900;
		if (parsedSection.Section !== "overall") {
			year = DatasetExaminer.examineDatasetData(parsedSection, "Year", TSFormat.number) as number;
		}
		let section = new Section(dept, id, avg, instructor, title, pass, fail, audit, uuid, year);
		return section;
	}
}
