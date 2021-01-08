const express = require("express");
const morgan = require("morgan");
const request = require("request");
const validUrl = require("valid-url");
const csv = require("csvtojson");
const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Welcome to Glitch backend intern challenge",
  });
});

// check csv url
const validateUrl = (url) => {
  if (!url || url == null || url.length == 0) return false;
  if (!validUrl.isUri(url)) return false;

  let fileSplit = url.split("?")[0];
  let fileIndex = fileSplit.substring(fileSplit.lastIndexOf(".") + 1);
  return fileIndex === "csv";
};

// generate random unique identifier without collisions
const uniqueID = function () {
  let dec2hex = [];
  for (var i = 0; i <= 15; i++) {
    dec2hex[i] = i.toString(16);
  }
  let uuid = "";
  for (var i = 1; i <= 36; i++) {
    if (i === 9 || i === 14 || i === 19 || i === 24) {
      uuid += "-";
    } else if (i === 15) {
      uuid += 4;
    } else if (i === 20) {
      uuid += dec2hex[(Math.random() * 4) | (0 + 8)];
    } else {
      uuid += dec2hex[(Math.random() * 16) | 0];
    }
  }
  return uuid;
};

app.post("/", async (req, res) => {
  const { url, select_fields } = req.body.csv;
  let newArray = [];
  try {
    // check the url if it contains valid CSV
    const isValidUrl = validateUrl(url);
    if (!isValidUrl) {
      return res.status(422).json({
        status: "fail",
        message: "Ensure you enter a valid CSV url",
      });
    }
    const csvData = request.get(url); // fetch the csv file from url
    const jsonArray = await csv().fromStream(csvData);
    // check if select_fields is present and if it's an array
    if (select_fields && Array.isArray(select_fields)) {
      for (var i = 0; i <= jsonArray.length - 1; i++) {
        let newObj = {};
        for (var j in jsonArray[i]) {
          if (select_fields.includes(j)) {
            newObj[j] = jsonArray[i][j];
          }
        }
        newArray.push(newObj);
      }
    } else {
      newArray = jsonArray;
    }

    return res.status(200).json({
      conversion_key: uniqueID(), // "e27881c4-f924-b8f7-59d9-525878c7a812"
      json: newArray,
    });
  } catch (error) {
    console.log("error occurred due to >>>>>", error);
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong. Try again.",
    });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🚀 server running on PORT ${port}`));
