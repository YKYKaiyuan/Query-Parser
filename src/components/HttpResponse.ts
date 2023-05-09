import {IncomingMessage} from "http";

export class HttpResponse {
	public readonly response: IncomingMessage;
	public readonly data: string;

	constructor(response: IncomingMessage, data: string) {
		this.response = response;
		this.data = data;
	}
}
