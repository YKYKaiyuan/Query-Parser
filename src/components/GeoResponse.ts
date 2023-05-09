import {Util} from "../Util";

export interface GeoResponseLocation {
	lat: number;
	lon: number;
}

export interface GeoResponseError {
	error: string;
}

export function isGeoResponseLocation(object: any): object is GeoResponseLocation {
	let validObject = Util.checkObjectType(object);
	let validLat = Util.checkObjectKeys(object, "lat", "number");
	let validLon = Util.checkObjectKeys(object, "lon", "number");
	return validObject && validLat && validLon;
}

export function isGeoResponseError(object: any): object is GeoResponseError {
	let validObject = Util.checkObjectType(object);
	let validError = Util.checkObjectKeys(object, "error", "string");
	return validObject && validError;
}
