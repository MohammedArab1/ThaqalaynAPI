const mongoose = require("mongoose");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
const HadithModel = require("./models/hadithV2");
const BookNamesModel = require("./models/bookNameV2");
const IngredientModel = require("./models/ingredientsV2");

// Map model names to actual models
const modelMap = {
  HadithModel: HadithModel,
  IngredientModel: IngredientModel,
  BookNamesModel: BookNamesModel,
};

// Validate required flags
const validateFlags = (argv) => {
  if (!argv.path) {
    throw new Error("Path to data file is required (--path)");
  }
  
  if (!argv.model) {
    throw new Error("Model name is required (--model)");
  }
  
  if (!modelMap[argv.model]) {
    throw new Error(`Invalid model name. Valid options: ${Object.keys(modelMap).join(", ")}`);
  }
  
  return true;
};

// Modify entire collection
const modifyCollection = async (pathToData, model) => {
  const data = require(pathToData);
  const Model = modelMap[model];
  
  console.log("Deleting old data...");
  await Model.deleteMany({});
  console.log("Old data deleted");
  
  console.log("Inserting new data...");
  await Model.insertMany(data);
  console.log("New data inserted successfully");
};

// Modify specific book data
const modifyBook = async (pathToData, model) => {
  const data = require(pathToData);
  const Model = modelMap[model];
  const bookId = pathToData.split("/").pop().split(".")[0];
  
  console.log(`Deleting data for book ID: ${bookId}...`);
  await Model.deleteMany({ bookId });
  console.log("Old data deleted");
  
  console.log("Inserting new data...");
  await Model.insertMany(data);
  console.log("New data inserted successfully");
};

// Main function
const main = async () => {
  try {
    const argv = yargs(hideBin(process.argv))
      .usage("Usage: $0 [options]")
      .option("path", {
        alias: "p",
        describe: "Path to the JSON data file",
        type: "string",
        demandOption: true,
      })
      .option("model", {
        alias: "m",
        describe: "Model name (HadithModel, IngredientModel, BookNamesModel)",
        type: "string",
        demandOption: true,
      })
      .option("mode", {
        alias: "o",
        describe: "Operation mode (collection or book)",
        type: "string",
        default: "collection",
        choices: ["collection", "book"],
      })
      .option("uri", {
        alias: "u",
        describe: "MongoDB connection URI (overrides MONGODB_URI env var)",
        type: "string",
      })
      .help()
      .alias("help", "h")
      .argv;

    // Validate arguments
    validateFlags(argv);

    // Set MongoDB URI if provided
    if (argv.uri) {
      process.env.MONGODB_URI = argv.uri;
    }

    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is required");
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Execute appropriate function based on mode
    if (argv.mode === "book") {
      await modifyBook(argv.path, argv.model);
    } else {
      await modifyCollection(argv.path, argv.model);
    }

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
};

// Run the program
main();