import {TSFormat, Util} from "../Util";

export const roomKeys = new Map([
	["fullname", "string"],
	["shortname", "string"],
	["number", "string"],
	["name", "string"],
	["address", "string"],
	["lat", "number"],
	["lon", "number"],
	["seats", "number"],
	["type", "string"],
	["furniture", "string"],
	["href", "string"],
]);

export class Room {
	public fullname: string | null = "";
	public shortname: string | null = "";
	public number: string | null = "";
	public name: string | null = "";
	public address: string | null = "";
	public lat: number | null = 0;
	public lon: number | null = 0;
	public seats: number | null = 0;
	public type: string | null = "";
	public furniture: string | null = "";
	public href: string | null = "";

	public static isValidRoom(object: any): object is Room {
		let validObject = Util.checkObjectType(object);
		let validFullName = Util.checkObjectKeys(object, "fullname", TSFormat.string);
		let validShortName = Util.checkObjectKeys(object, "shortname", TSFormat.string);
		let validNumber = Util.checkObjectKeys(object, "number", TSFormat.string);
		let validName = Util.checkObjectKeys(object, "name", TSFormat.string);
		let validAddress = Util.checkObjectKeys(object, "address", TSFormat.string);
		let validLat = Util.checkObjectKeys(object, "lat", TSFormat.number);
		let validLon = Util.checkObjectKeys(object, "lon", TSFormat.number);
		let validSeats = Util.checkObjectKeys(object, "seats", TSFormat.number);
		let validType = Util.checkObjectKeys(object, "type", TSFormat.string);
		let validFurniture = Util.checkObjectKeys(object, "furniture", TSFormat.string);
		let validHref = Util.checkObjectKeys(object, "href", TSFormat.string);
		return (
			validObject &&
			validFullName &&
			validShortName &&
			validNumber &&
			validName &&
			validAddress &&
			validLat &&
			validLon &&
			validSeats &&
			validType &&
			validFurniture &&
			validHref
		);
	}
}
