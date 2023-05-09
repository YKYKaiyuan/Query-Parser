import {parse} from "parse5";
import {Document, Element} from "parse5/dist/tree-adapters/default";
import {Building} from "../../components/Building";
import {Room} from "../../components/Room";
import {findAllSelectors, findSelector, getText} from "../Parse5Helper";
import {TableExaminer} from "./TableExaminer";

export class RoomsExaminer extends TableExaminer {
	private static readonly CSS_ROOM_NUMBER = "td.views-field-field-room-number a";
	private static readonly CSS_ROOM_SEATS = "td.views-field-field-room-capacity";
	private static readonly CSS_ROOM_TYPE = "td.views-field-field-room-type";
	private static readonly CSS_ROOM_FURNITURE = "td.views-field-field-room-furniture";

	public getValidTable(tables: Element[]): Element | null {
		let filter = (row: Element) => {
			let room = new Room();
			return this.constructRoom(room, row) !== null;
		};
		let validTable = this.findValidTable(tables, filter);
		return validTable;
	}

	private constructRoom(room: Room, row: Element): Room | null {
		try {
			let number = findSelector(row, RoomsExaminer.CSS_ROOM_NUMBER);
			let seats = findSelector(row, RoomsExaminer.CSS_ROOM_SEATS);
			let type = findSelector(row, RoomsExaminer.CSS_ROOM_TYPE);
			let furniture = findSelector(row, RoomsExaminer.CSS_ROOM_FURNITURE);
			let href = this.getMoreInfo(row);
			room.number = number ? getText(number) : null;
			let name = `${room.shortname}_${room.number}`;
			let stringSeats = seats ? getText(seats) : null;
			let intSeats = stringSeats ? parseInt(stringSeats, 10) : null;
			let validSeats = !Number.isNaN(intSeats) ? intSeats : null;
			room.seats = validSeats;
			room.type = type ? getText(type) : null;
			room.furniture = furniture ? getText(furniture) : null;
			room.href = href;
			room.name = name;
			if (Room.isValidRoom(room)) {
				return room;
			}
		} catch (error) {
			return null;
		}
		return null;
	}

	public extractRoomsFromRoomsFile(buildingContent: string, building: Building): Promise<Room[]> {
		return new Promise<Room[]>((resolve, reject) => {
			let document: Document = parse(buildingContent) as Document;
			let tables = findAllSelectors(document, "table");
			let validTable = this.getValidTable(tables);
			if (validTable) {
				let rows = findAllSelectors(validTable, "tr");
				let rooms: Room[] = [];
				for (let row of rows) {
					let room = new Room();
					room.fullname = building.name;
					room.shortname = building.code;
					room.address = building.address;
					room.lat = building.geolocation.lat;
					room.lon = building.geolocation.lon;
					let validRoom = this.constructRoom(room, row);
					if (validRoom) {
						rooms.push(validRoom);
					}
				}
				resolve(rooms);
			} else {
				resolve([]);
			}
		});
	}
}
