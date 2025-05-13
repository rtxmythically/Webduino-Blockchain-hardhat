const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const contractAddress = process.env.CONTRACT_ADDRESS;
const abiFilePath = path.resolve(__dirname, "../artifacts/contracts/TempHumidity.sol/TempHumidity.json");
const contractJson = fs.readFileSync(abiFilePath, "utf-8");
const contractData = JSON.parse(contractJson);
const abi = contractData.abi;

const provider = new ethers.JsonRpcProvider(process.env.PRC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

let lastData = { temperature: 0, humidity: 0, timestamp: 0 };

async function shouldUpload(temperature, humidity) {
  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceLast = currentTime - lastData.timestamp;

  if (lastData.timestamp === 0) {
    return true;
  }

  if (timeSinceLast >= 3600) {
    return true;
  }

  const tempChanged =
    temperature > lastData.temperature
      ? temperature - lastData.temperature >= 2
      : lastData.temperature - temperature >= 2;
  const humidityChanged =
    humidity > lastData.humidity
      ? humidity - lastData.humidity >= 5
      : lastData.humidity - humidity >= 5;

  return tempChanged || humidityChanged;
}

async function storeData(temperature, humidity) {
  try {
    const tx = await contract.storeData(temperature, humidity);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    lastData = { temperature, humidity, timestamp: Math.floor(Date.now() / 1000) };
    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error("Error storing data:", error);
    return { success: false, error: error.reason || error.message };
  }
}

app.post("/api/storeData", async (req, res) => {
  const { temperature, humidity } = req.body;
  if (!temperature || !humidity) {
    return res.status(400).json({ success: false, error: "Missing temperature or humidity" });
  }

  const canUpload = await shouldUpload(temperature, humidity);
  if (!canUpload) {
    return res.json({ success: false, error: "Conditions not met (time or change too small)" });
  }

  const result = await storeData(temperature, humidity);
  res.json(result);
});

app.get("/api/status", (req, res) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const timeSinceLast = lastData.timestamp ? currentTime - lastData.timestamp : 0;
  const timeToNext = timeSinceLast < 3600 ? 3600 - timeSinceLast : 0;

  res.json({
    lastUpload: {
      temperature: lastData.temperature,
      humidity: lastData.humidity,
      timestamp: lastData.timestamp,
      timeSinceLast: timeSinceLast,
    },
    timeToNext: timeToNext,
  });
});

app.get("/api/latestRecord", async (req, res) => {
  try {
    const [temperature, humidity, timestamp] = await contract.getLatestRecord();
    res.json({
      success: true,
      temperature: Number(temperature),
      humidity: Number(humidity),
      timestamp: Number(timestamp),
    });
  } catch (error) {
    console.error("Error fetching latest record:", error);
    res.json({ success: false, error: error.reason || error.message });
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    console.log("Querying DataStored events for contract:", contractAddress);
    const latestBlock = await provider.getBlockNumber();
    const blockRange = 499; // 嚴格限制為 499 區塊，確保不超過 500
    const fromBlock = Math.max(latestBlock - blockRange, 0);
    console.log(`Querying from block ${fromBlock} to ${latestBlock}`);

    const events = await contract.queryFilter(contract.filters.DataStored(), fromBlock, latestBlock);
    console.log("Events found:", events.length);

    const transactions = await Promise.all(
      events.map(async (event) => {
        const block = await event.getBlock();
        console.log("Event:", event.transactionHash, event.args);
        return {
          txHash: event.transactionHash,
          temperature: Number(event.args.temperature),
          humidity: Number(event.args.humidity),
          timestamp: Number(event.args.timestamp),
          formattedTime: new Date(Number(event.args.timestamp) * 1000).toLocaleString("en-US"),
        };
      })
    );

    res.json({ success: true, transactions: transactions.reverse() });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.json({ success: false, error: error.message || "Failed to fetch transactions" });
  }
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});