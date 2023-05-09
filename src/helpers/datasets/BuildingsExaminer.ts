import JSZip from "jszip";
import {parse} from "parse5";
import {Document, Element} from "parse5/dist/tree-adapters/default";
import {Building} from "../../components/Building";
import {GeoResponseLocation, isGeoResponseError, isGeoResponseLocation} from "../../components/GeoResponse";
import {Room} from "../../components/Room";
import {Util} from "../../Util";
import {findAllSelectors, findChildNode, findSelector, getText} from "../Parse5Helper";
import {RoomsExaminer} from "./RoomsExaminer";
import {TableExaminer} from "./TableExaminer";

export class BuildingsExaminer extends TableExaminer {
	private static readonly GEOLOCATION_GET: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team181/";
	private static readonly CSS_BUILDING_CODE: string = "td.views-field-field-building-code";
	private static readonly CSS_BUILDING_TITLE: string = "td.views-field-title a";
	private static readonly CSS_BUILDING_ADDRESS: string = "td.views-field-field-building-address";
	private readonly roomsExaminer: RoomsExaminer;

	constructor() {
		super();
		this.roomsExaminer = new RoomsExaminer();
	}

	public extractRoomsFromIndex(zipData: JSZip, indexContent: string): Promise<Room[]> {
		return new Promise<Room[]>((resolve, reject) => {
			let document: Document = parse(indexContent) as Document;
			let tables = findAllSelectors(document, "table");
			let validTable = this.getValidTable(tables);
			if (validTable) {
				let rows = findAllSelectors(validTable, "tr");
				let roomPromises = [];
				for (let row of rows) {
					let roomPromise = this.extractRoomsFromRow(zipData, row);
					roomPromises.push(roomPromise);
				}
				Promise.all(roomPromises).then((roomArrays) => {
					let rooms: Room[] = [];
					for (let roomArray of roomArrays) {
						rooms.push(...roomArray);
					}
					resolve(rooms);
				});
			} else {
				resolve([]);
			}
		});
	}

	public extractRoomsFromRow(zipData: JSZip, row: Element): Promise<Room[]> {
		return new Promise<Room[]>((resolve, reject) => {
			this.constructBuildingGeolocation(row)
				.then((building) => {
					let file = zipData.file(building.filePath);
					if (file == null) {
						return resolve([]);
					}
					this.extractRoomsFromBuildingFile(file, building).then((rooms) => {
						resolve(rooms);
					});
				})
				.catch(() => {
					resolve([]);
				});
		});
	}

	public extractRoomsFromBuildingFile(file: JSZip.JSZipObject, building: Building): Promise<Room[]> {
		return new Promise<Room[]>((resolve, reject) => {
			file.async("text").then((response) => {
				this.roomsExaminer
					.extractRoomsFromRoomsFile(response, building)
					.then((rooms) => {
						resolve(rooms);
					})
					.catch(() => {
						resolve([]);
					});
			});
		});
	}

	protected getValidTable(tables: Element[]): Element | null {
		let filter = (row: Element) => {
			return this.constructBuilding(row) != null;
		};
		let validTable = this.findValidTable(tables, filter);
		return validTable;
	}

	private constructBuilding(row: Element): Building | null {
		let code = findSelector(row, BuildingsExaminer.CSS_BUILDING_CODE);
		let name = findSelector(row, BuildingsExaminer.CSS_BUILDING_TITLE);
		let address = findSelector(row, BuildingsExaminer.CSS_BUILDING_ADDRESS);
		let link = this.getMoreInfo(row);
		if (code && name && address && link) {
			let building = new Building(
				getText(code) as string,
				getText(name) as string,
				getText(address) as string,
				link
			);
			return building;
		}
		return null;
	}

	private constructBuildingGeolocation(row: Element): Promise<Building> {
		return new Promise<Building>((resolve, reject) => {
			let building = this.constructBuilding(row);
			if (building == null) {
				return reject("Unable to construct building from table row");
			}

			this.getBuildingGeolocation(building.address)
				.then((location) => {
					if (building !== null) {
						building.geolocation = location;
						resolve(building);
					}
				})
				.catch(() => {
					reject();
				});
		});
	}

	private getBuildingGeolocation(address: string): Promise<GeoResponseLocation> {
		return new Promise<GeoResponseLocation>((resolve, reject) => {
			let getCallAddress = `${BuildingsExaminer.GEOLOCATION_GET}${encodeURIComponent(address)}`;
			Util.getCall(getCallAddress)
				.then((response) => {
					try {
						let data = JSON.parse(response.data);
						if (isGeoResponseLocation(data)) {
							resolve(data);
						} else if (isGeoResponseError(data)) {
							reject(data.error);
						} else {
							reject("Unknown GET response error encountered");
						}
					} catch (err) {
						reject(err);
					}
				})
				.catch((err) => {
					reject(err);
				});
		});
	}
}
