# 🌡️ TempHumidity Smart Contract

This is a simple Solidity smart contract developed using **Hardhat**.  
It allows users to store and retrieve **temperature and humidity** data on the Ethereum blockchain.

---

## 🔧 Features

- **Store Sensor Data**  
  Save temperature and humidity readings along with a timestamp.

- **Emit Event on Data Storage**  
  When data is stored, the contract emits an event with:
  - `sender` address  
  - `temperature` and `humidity` values  
  - `timestamp`  
  - a placeholder for `transactionHash` (currently set as `bytes32(0)`)

- **Retrieve Latest Record**  
  Fetch the most recent temperature and humidity entry.

- **Get All Records**  
  Return the full list of all stored records.

- **Record Count**  
  Check how many records have been stored in total.

---

