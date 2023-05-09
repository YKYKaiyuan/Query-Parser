import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);
		this.express.put("/dataset/:id/:kind", Server.put);
		this.express.delete("/dataset/:id", Server.delete);
		this.express.get("/datasets", Server.get);
		this.express.post("/query", Server.post);
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	public static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	public static put(req: Request, res: Response) {
		let insightFacade = new InsightFacade();
		try{
			let encodeDataset = Buffer.from(req.body).toString();
			let datasetID = req.params.id.toLowerCase();
			let datasetKind = req.params.kind.toLowerCase();
			if(datasetKind === "sections"){
				insightFacade.addDataset(datasetID, encodeDataset, InsightDatasetKind.Sections).then((response) => {
					res.status(200).json({result: response});
				}).catch((err) => {
					res.status(400).json({result: "Something is wrong with dataset, it cannot be added."});
				});
			} else if(datasetKind === "rooms"){
				insightFacade.addDataset(datasetID, encodeDataset, InsightDatasetKind.Rooms).then((response) => {
					res.status(200).json({result: response});
				}).catch((err) => {
					res.status(400).json({result: err});
				});
			} else {
				res.status(400).json({result: "Something is wrong with dataset, it cannot be added."});
			}
		}catch(err){
			res.status(400).json({result: "Error occured."});
		}
	}

	public static delete(req: Request, res: Response) {
		let insightFacade = new InsightFacade();
		let datasetID = req.params.id;
		insightFacade.removeDataset(datasetID).then((response) =>{
			res.status(200).json({result: response});
		}).catch((err) =>{
			if(err instanceof InsightError){
				res.status(400).json({result: "Deletion failed."});
			} else if(err instanceof NotFoundError){
				res.status(404).json({result: "The given id is not found in datasets."});
			} else {
				res.status(400).json({result: "Deletion failed."});
			}
		});
	}

	public static get(req: Request, res: Response) {
		let insightFacade = new InsightFacade();
		insightFacade.listDatasets().then((response) =>{
			res.status(200).json({result: response});
		}).catch((err) =>{
			// won't reject
		});
	}

	public static post(req: Request, res: Response) {
		let insightFacade = new InsightFacade();
		let query = Buffer.from(req.body).toString();
		let parseQuery = JSON.parse(query);
		insightFacade.performQuery(parseQuery).then((response) =>{
			res.status(200).json({result: response});
		}).catch((err) =>{
			res.status(400).json({result: "Query cannot be performed."});
		});
	}

}
