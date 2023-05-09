import path from "path";
import {GeoResponseLocation} from "./GeoResponse";

export class Building {
	public readonly code: string;
	public readonly name: string;
	public readonly address: string;
	public readonly url: string;
	public readonly filePath: string;
	public geolocation: GeoResponseLocation = {lat: 0, lon: 0};

	constructor(code: string, name: string, address: string, url: string) {
		this.code = code;
		this.name = name;
		this.address = address;
		this.url = url;
		this.filePath = path.join(url).replace(/\\/g, "/");
	}
}
