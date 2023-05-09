import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect, use} from "chai";
import chaiHttp from "chai-http";
import {clearDisk, getContentFromArchives} from "../TestUtil";

describe("Server", function () {

	let facade: InsightFacade;
	let server: Server;
	let SERVER_URL = "http://localhost:4321";
	let datasets: {[name: string]: string} = {};
	const archivesDatasets = [
		"courses",
		"nocoursesdir",
		"emptycourses",
		"novalidsections",
		"onevalidsection",
		"notjson",
		"invalidfile",
		"rooms",
		"noIndex",
		"invalidBuildingFIleType",
		"noRooms",
		"errorGeo",
		"onevalidroom",
		"notAllValid",
		"missingFurnitureKey",
	];
	use(chaiHttp);

	before(function () {
		clearDisk();
		facade = new InsightFacade();
		server = new Server(4321);
		for (const name of archivesDatasets) {
			datasets[name] = getContentFromArchives(name + ".zip");
		}
		try {
			server.start();
		} catch (err) {
			console.log(err);
		}
	});

	after(function () {
		server.stop();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	// Sample on how to format PUT requests

	it("PUT test for rooms dataset", function () {
		try {
			return chai.request(SERVER_URL)
				.put("/dataset/rooms/rooms")
				.send(datasets["rooms"])
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("PUT test for courses dataset", function () {
		try {
			return chai.request(SERVER_URL)
				.put("/dataset/courses/sections")
				.send(datasets["courses"])
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("Get dataset", function () {
		try {
			return chai.request(SERVER_URL)
				.get("/datasets")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("PUT dataset already put", function () {
		try {
			return chai.request(SERVER_URL)
				.put("/dataset/courses/sections")
				.send(datasets["courses"])
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("PUT test for wrong kind", function () {
		try {
			return chai.request(SERVER_URL)
				.put("/dataset/courses/setions")
				.send(datasets["courses"])
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("DELETE test for courses dataset", function () {
		try {
			return chai.request(SERVER_URL)
				.delete("/dataset/courses")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("PUT test Upper case", function () {
		try {
			return chai.request(SERVER_URL)
				.put("/dataset/Courses/Sections")
				.send(datasets["courses"])
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("PUT invalid dataset", function () {
		try {
			return chai.request(SERVER_URL)
				.put("/dataset/emptycourses/sections")
				.send(datasets["emptycourses"])
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("PUT invalid room dataset", function () {
		try {
			return chai.request(SERVER_URL)
				.put("/dataset/noIndex/rooms")
				.send(datasets["noIndex"])
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});


	it("DELETE 404", function () {
		try {
			return chai.request(SERVER_URL)
				.delete("/dataset/coures")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(404);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("DELETE insightErr", function () {
		try {
			return chai.request(SERVER_URL)
				.delete("/dataset/cou_rses")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("POST valid", function () {
		let object = {
			WHERE: {GT: {rooms_seats: 300}},
			OPTIONS: {
				COLUMNS: [
					"rooms_lat",
					"rooms_lon",
					"rooms_seats",
					"rooms_fullname",
					"rooms_shortname",
					"rooms_number",
					"rooms_name",
					"rooms_address",
					"rooms_type",
					"rooms_furniture",
					"rooms_href"
				],
				ORDER: {dir: "DOWN", keys: ["rooms_seats"]}
			}
		}
		;
		let query = JSON.stringify(object);
		try {
			return chai.request(SERVER_URL)
				.post("/query")
				.send(query)
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});


});
