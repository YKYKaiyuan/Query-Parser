import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import InsightFacade from "../../src/controller/InsightFacade";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {folderTest} from "@ubccpsc310/folder-test";

chai.use(chaiAsPromised);

type Input = unknown;
type Output = Promise<InsightResult[]>; // Should be Promise<InsightResult[]> but type error in assertResult
type Error = "InsightError" | "ResultTooLargeError";

describe("InsightFacade", function () {
	// Set as 'let' to allow mutating in before function
	let datasets: {[name: string]: string} = {};
	let insightFacade: IInsightFacade;
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

	// Run this before running all tests
	before(function () {
		// Load all datasets to be used
		for (const name of archivesDatasets) {
			datasets[name] = getContentFromArchives(name + ".zip");
		}
	});

	// Modified from Add Dataset tests.
	// describe("Add Datasets (Rooms)", function () {
	// 	beforeEach(function () {
	// 		clearDisk();
	// 		insightFacade = new InsightFacade();
	// 	});
	//
	// 	it("(Rooms) Should not add datasets if there is no index.htm in", async function () {
	// 		const id = "noIndex";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("(Rooms) Should not parse building files that are not in HTML format", async function () {
	// 		const id = "invalidBuildingFIleType";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("(Rooms) Should skip if there are no rooms, even valid building html exists.", async function () {
	// 		const id = "noRooms";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("(Rooms) Should skip if a building's geolocation results in an error.", async function () {
	// 		const id = "errorGeo";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("(Rooms) Should skip if not all required fields are found.", async function () {
	// 		const id = "missingFurnitureKey";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("(Rooms) Should add one dataset", async function () {
	// 		const id = "rooms";
	// 		const expected = [id];
	// 		let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
	// 		return expect(addedIds).to.deep.equal(expected);
	// 	});
	//
	// 	it("(Rooms) Should add two datasets", async function () {
	// 		const id1 = "rooms";
	// 		const id2 = "onevalidroom";
	// 		const expected1 = [id1];
	// 		const expected2 = [id1, id2];
	// 		let addedIds = await insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Rooms);
	// 		expect(addedIds).to.deep.equal(expected1);
	// 		addedIds = await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms);
	// 		expect(addedIds).to.have.deep.members(expected2);
	// 		expect(addedIds).to.have.length(2);
	// 	});
	//
	// 	it("(Rooms) Should add even if some, but not all are invalid files", async function () {
	// 		const id = "notAllValid";
	// 		const expected = [id];
	// 		let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
	// 		return expect(addedIds).to.deep.equal(expected);
	// 	});
	// });
	//
	// describe("Add Datasets", function () {
	// 	beforeEach(function () {
	// 		clearDisk();
	// 		insightFacade = new InsightFacade();
	// 	});
	//
	// 	it("Should add no dataset if empty", async function () {
	// 		const id = "emptycourses";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Sections);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("Should add one dataset", async function () {
	// 		const id = "courses";
	// 		const expected = [id];
	// 		let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Sections);
	// 		return expect(addedIds).to.deep.equal(expected);
	// 	});
	//
	// 	it("Should add two datasets", async function () {
	// 		const id1 = "courses";
	// 		const id2 = "onevalidsection";
	// 		const expected1 = [id1];
	// 		const expected2 = [id1, id2];
	// 		let addedIds = await insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Sections);
	// 		expect(addedIds).to.deep.equal(expected1);
	// 		addedIds = await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Sections);
	// 		expect(addedIds).to.have.deep.members(expected2);
	// 		expect(addedIds).to.have.length(2);
	// 	});
	//
	// 	it("Should add one dataset, leave other invalid", async function () {
	// 		const id1 = "courses";
	// 		const id2 = "novalidsection";
	// 		const expected1 = [id1];
	// 		const expectedDataset = [
	// 			{
	// 				id: id1,
	// 				kind: InsightDatasetKind.Sections,
	// 				numRows: 64612,
	// 			},
	// 		];
	// 		// const expected2 = [id1, id2];
	// 		let addedIds = await insightFacade.addDataset(id1, datasets[id1], InsightDatasetKind.Sections);
	// 		expect(addedIds).to.deep.equal(expected1);
	// 		try {
	// 			addedIds = await insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Sections);
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		} finally {
	// 			let finalDatasets = await insightFacade.listDatasets();
	// 			expect(finalDatasets).to.have.deep.members(expectedDataset);
	// 			expect(finalDatasets).to.have.length(1);
	// 		}
	// 	});
	//
	// 	it("Should add if at least one valid section", async function () {
	// 		const id = "onevalidsection";
	// 		const expected = [id];
	// 		let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Sections);
	// 		return expect(addedIds).to.deep.equal(expected);
	// 	});
	//
	// 	it("Should add even if some, but not all are invalid files", async function () {
	// 		const id = "invalidfile";
	// 		const expected = [id];
	// 		let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Sections);
	// 		return expect(addedIds).to.deep.equal(expected);
	// 	});
	//
	// 	it("Should not add if no valid sections", async function () {
	// 		const id = "novalidsections";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Sections);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("Should not add if directory is not named courses", async function () {
	// 		const id = "nocoursesdir";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Sections);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("Should not add if all are not JSON format", async function () {
	// 		const id = "notjson";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Sections);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("Should not add dataset if dataset kind is rooms (C1)", async function () {
	// 		const id = "courses";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	//
	// 	it("Should not add if id contains an underscore anywhere", async function () {
	// 		const id = "courses";
	// 		const underscoreID = "_courses";
	// 		const idUnderscore = "courses_";
	// 		const underscore = "_";
	// 		let addedIds = insightFacade.addDataset(underscoreID, datasets[id], InsightDatasetKind.Sections);
	// 		return expect(addedIds)
	// 			.eventually.to.be.rejectedWith(InsightError)
	// 			.then((ids) => {
	// 				addedIds = insightFacade.addDataset(idUnderscore, datasets[id], InsightDatasetKind.Sections);
	// 				return expect(addedIds).eventually.to.be.rejectedWith(InsightError);
	// 			})
	// 			.then((ids) => {
	// 				addedIds = insightFacade.addDataset(underscore, datasets[id], InsightDatasetKind.Sections);
	// 				return expect(addedIds).eventually.to.be.rejectedWith(InsightError);
	// 			});
	// 	});
	//
	// 	it("Should not add if id is only whitespaces", async function () {
	// 		const id = "courses";
	// 		const whitespace = "   ";
	// 		try {
	// 			let addedIds = await insightFacade.addDataset(whitespace, datasets[id], InsightDatasetKind.Sections);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	// });
	//
	// describe("Remove Datasets", function () {
	// 	beforeEach(function () {
	// 		clearDisk();
	// 		insightFacade = new InsightFacade();
	// 	});
	//
	// 	it("Should not remove a dataset that does not exist", async function () {
	// 		const id = "courses";
	// 		try {
	// 			let removedId = await insightFacade.removeDataset(id);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(NotFoundError);
	// 		}
	// 	});
	//
	// 	it("Should remove a dataset with valid id", async function () {
	// 		const id = "courses";
	// 		const expected = [id];
	// 		let addedIds = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Sections);
	// 		expect(addedIds).to.deep.equal(expected);
	// 		let removedId = await insightFacade.removeDataset(id);
	// 		return expect(removedId).to.deep.equal(id);
	// 	});
	//
	// 	it("Should not remove if id contains an underscore anywhere", async function () {
	// 		const underscoreId = "_courses";
	// 		const idUnderscore = "courses_";
	// 		const underscore = "_";
	// 		let removedId = insightFacade.removeDataset(underscoreId);
	// 		return expect(removedId)
	// 			.eventually.to.be.rejectedWith(InsightError)
	// 			.then(() => {
	// 				removedId = insightFacade.removeDataset(idUnderscore);
	// 				return expect(removedId).eventually.to.be.rejectedWith(InsightError);
	// 			})
	// 			.then(() => {
	// 				removedId = insightFacade.removeDataset(underscore);
	// 				return expect(removedId).eventually.to.be.rejectedWith(InsightError);
	// 			});
	// 	});
	//
	// 	it("Should not remove if id is only whitespaces", async function () {
	// 		const whitespace = "   ";
	// 		try {
	// 			let removedId = await insightFacade.removeDataset(whitespace);
	// 			expect.fail("Should have rejected!");
	// 		} catch (err) {
	// 			expect(err).to.be.instanceOf(InsightError);
	// 		}
	// 	});
	// });
	//
	// describe("List Datasets", function () {
	// 	beforeEach(function () {
	// 		// Clearing disk required since datasets are persisted on disk even after function calls
	// 		clearDisk();
	// 		// If clearDisk called after 'new', chance that it's made from the cached version! (bad)
	// 		insightFacade = new InsightFacade();
	// 	});
	//
	// 	it("Should list no datasets", function () {
	// 		return insightFacade.listDatasets().then((insightDatasets) => {
	// 			expect(insightDatasets).to.deep.equal([]);
	// 		});
	// 	});
	//
	// 	it("Should list one dataset", async function () {
	// 		const id = "courses";
	// 		const expected = [
	// 			{
	// 				id: "courses",
	// 				kind: InsightDatasetKind.Sections,
	// 				numRows: 64612,
	// 			},
	// 		];
	// 		await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Sections);
	// 		const insightDatasets = await insightFacade.listDatasets();
	// 		return expect(insightDatasets).to.deep.equal(expected);
	// 	});
	//
	// 	it("Should list all available datasets", function () {
	// 		const id = "courses";
	// 		const id2 = "courses-2";
	// 		const expected = [
	// 			{
	// 				id: "courses",
	// 				kind: InsightDatasetKind.Sections,
	// 				numRows: 64612,
	// 			},
	// 			{
	// 				id: "courses-2",
	// 				kind: InsightDatasetKind.Sections,
	// 				numRows: 64612,
	// 			},
	// 		];
	// 		return insightFacade
	// 			.addDataset(id, datasets[id], InsightDatasetKind.Sections)
	// 			.then((addedIds) => {
	// 				return insightFacade.addDataset(id2, datasets[id], InsightDatasetKind.Sections);
	// 			})
	// 			.then(() => {
	// 				return insightFacade.listDatasets();
	// 			})
	// 			.then((insightDatasets) => {
	// 				const expectedDatasets: InsightDataset[] = expected;
	// 				expect(insightDatasets).to.be.instanceOf(Array);
	// 				expect(insightDatasets).to.have.deep.members(expectedDatasets);
	// 				expect(insightDatasets).to.have.length(2);
	// 			});
	// 	});
	// });
	//
	// describe("Perform Queries", function () {
	// 	before(async function () {
	// 		clearDisk();
	// 		insightFacade = new InsightFacade();
	// 		const id = "courses";
	// 		try {
	// 			await insightFacade.addDataset("sections", datasets[id], InsightDatasetKind.Sections);
	// 			console.log("Added the dataset");
	// 		} catch (err) {
	// 			console.log("Failed to add courses dataset");
	// 		}
	// 	});
	//
	// 	function assertResult(actual: any, expected: Awaited<Output>): void {
	// 		let expectedLength = JSON.parse(JSON.stringify(expected)).length;
	// 		expect(actual).to.have.deep.members(expected);
	// 		expect(actual).to.have.length(expectedLength);
	// 	}
	//
	// 	function assertError(actual: any, expected: Error): void {
	// 		if (expected === "ResultTooLargeError") {
	// 			expect(actual).to.be.an.instanceOf(ResultTooLargeError);
	// 		} else {
	// 			expect(actual).to.be.an.instanceOf(InsightError);
	// 		}
	// 	}
	//
	// 	folderTest<Input, Output, Error>(
	// 		"PerformQuery JSON Tests",
	// 		(input: Input): Output => {
	// 			return insightFacade.performQuery(input);
	// 		},
	// 		"./test/resources/queries",
	// 		{
	// 			assertOnResult: assertResult,
	// 			assertOnError: assertError,
	// 		}
	// 	);
	// });
	// describe("Perform Queries C2", function () {
	// 	before(async function () {
	// 		clearDisk();
	// 		insightFacade = new InsightFacade();
	// 		const id = "courses";
	// 		const id2 = "rooms";
	// 		try {
	// 			await insightFacade.addDataset("sections", datasets[id], InsightDatasetKind.Sections);
	// 			await insightFacade.addDataset("rooms", datasets[id2], InsightDatasetKind.Rooms);
	// 			console.log("Added the datasets");
	// 		} catch (err) {
	// 			console.log("Failed to add courses dataset");
	// 		}
	// 	});
	//
	// 	function assertResult(actual: any, expected: Awaited<Output>): void {
	// 		let expectedLength = JSON.parse(JSON.stringify(expected)).length;
	// 		expect(actual).to.have.deep.members(expected);
	// 		expect(actual).to.have.length(expectedLength);
	// 	}
	//
	// 	function assertError(actual: any, expected: Error): void {
	// 		if (expected === "ResultTooLargeError") {
	// 			expect(actual).to.be.an.instanceOf(ResultTooLargeError);
	// 		} else {
	// 			expect(actual).to.be.an.instanceOf(InsightError);
	// 		}
	// 	}
	//
	// 	folderTest<Input, Output, Error>(
	// 		"PerformQuery JSON Tests",
	// 		(input: Input): Output => {
	// 			console.log(typeof input);
	// 			return insightFacade.performQuery(input);
	// 		},
	// 		"./test/resources/queriesC2",
	// 		{
	// 			assertOnResult: assertResult,
	// 			assertOnError: assertError,
	// 		}
	// 	);
	// });
});
