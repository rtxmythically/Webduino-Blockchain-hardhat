function formatTime(seconds) {
       if (seconds <= 0) return "Ready to upload";
       const minutes = Math.floor(seconds / 60);
       const secs = seconds % 60;
       return `${minutes} min ${secs} sec`;
     }

     async function updateStatus() {
       try {
         const response = await fetch("http://localhost:3000/api/status");
         if (!response.ok) {
           throw new Error(`HTTP error! Status: ${response.status}`);
         }
         const data = await response.json();

         const timeToNext = data.timeToNext;
         const timeSinceLast = data.lastUpload.timeSinceLast;

         document.getElementById("time-to-next").innerHTML = `Time to Next Upload: ${formatTime(timeToNext)}`;
         if (data.lastUpload.timestamp === 0) {
           document.getElementById("last-upload").innerHTML = "Last Upload: Never";
         } else {
           document.getElementById("last-upload").innerHTML = `Last Upload: ${data.lastUpload.temperature}°C, ${
             data.lastUpload.humidity
           }% (${formatTime(timeSinceLast)} ago)`;
         }
       } catch (error) {
         console.error("Error fetching status:", error);
         document.getElementById("time-to-next").innerHTML = "Time to Next Upload: Error";
         document.getElementById("last-upload").innerHTML = "Last Upload: Error";
       }
     }

     async function updateBlockchainData() {
       try {
         const response = await fetch("http://localhost:3000/api/latestRecord");
         if (!response.ok) {
           throw new Error(`HTTP error! Status: ${response.status}`);
         }
         const data = await response.json();

         if (data.success) {
           const tempClass = data.temperature >= 18 && data.temperature <= 25 ? "temp-normal" : "temp-warning";
           const humClass = data.humidity >= 40 && data.humidity <= 70 ? "humidity-normal" : "humidity-warning";
           document.getElementById("blockchain-data").innerHTML = `Blockchain Data: <span class="${tempClass}">${data.temperature}°C</span>, <span class="${humClass}">${data.humidity}%</span>`;
         } else {
           document.getElementById("blockchain-data").innerHTML = `Blockchain Data: ${data.error}`;
         }
       } catch (error) {
         console.error("Error fetching blockchain data:", error);
         document.getElementById("blockchain-data").innerHTML = "Blockchain Data: Error";
       }
     }

     async function updateTransactions() {
       try {
         const response = await fetch("http://localhost:3000/api/transactions");
         if (!response.ok) {
           throw new Error(`HTTP error! Status: ${response.status}`);
         }
         const data = await response.json();
         console.log("Transactions response:", data); // 新增日誌

         const transactionList = document.getElementById("transaction-list");
         if (data.success && data.transactions.length > 0) {
           transactionList.innerHTML = "";
           data.transactions.forEach((tx) => {
             const tempClass = tx.temperature >= 18 && tx.temperature <= 25 ? "temp-normal" : "temp-warning";
             const humClass = tx.humidity >= 40 && tx.humidity <= 70 ? "humidity-normal" : "humidity-warning";
             const item = document.createElement("div");
             item.className = "transaction-item";
             item.innerHTML = `
               <p>Transaction Hash: ${tx.txHash.slice(0, 8)}...${tx.txHash.slice(-8)}</p>
               <p>Temperature: <span class="${tempClass}">${tx.temperature}°C</span></p>
               <p>Humidity: <span class="${humClass}">${tx.humidity}%</span></p>
               <p>Time: ${tx.formattedTime}</p>
             `;
             transactionList.appendChild(item);
           });
         } else {
           transactionList.innerHTML = `No transaction records: ${data.error || "No data available"}`;
         }
       } catch (error) {
         console.error("Error fetching transactions:", error);
         document.getElementById("transaction-list").innerHTML = `Transaction List: Error - ${error.message}`;
       }
     }

     async function sendToBackend(temp, hum) {
       try {
         const statusElement = document.getElementById("status");
         statusElement.classList.add("status-update");

         const response = await fetch("http://localhost:3000/api/storeData", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ temperature: temp, humidity: hum }),
         });
         if (!response.ok) {
           throw new Error(`HTTP error! Status: ${response.status}`);
         }
         const result = await response.json();
         console.log("Store data response:", result); // 新增日誌
         if (result.success) {
           statusElement.innerHTML = `Uploaded: ${temp}°C, ${hum}% (Tx: ${result.txHash.slice(0, 8)}...${result.txHash.slice(-8)})`;
         } else {
           statusElement.innerHTML = `Not Uploaded: ${result.error}`;
         }

         setTimeout(() => {
           statusElement.classList.remove("status-update");
         }, 1500);
       } catch (error) {
         console.error("Error:", error);
         document.getElementById("status").innerHTML = "Upload Failed";
       }
     }

     boardReady({ board: "Smart", device: "10VaR3wQ", transport: "mqtt" }, function (board) {
       board.samplingInterval = 50;
       document.getElementById("status").innerHTML = "Sensor Ready!";
       const dht = getDht(board, 2);
       dht.read(function (evt) {
         const temp = dht.temperature;
         const hum = dht.humidity;
         console.log(`Temperature: ${temp}°C, Humidity: ${hum}%`);
         const tempClass = temp >= 18 && temp <= 25 ? "temp-normal" : "temp-warning";
         const humClass = hum >= 40 && hum <= 70 ? "humidity-normal" : "humidity-warning";
         document.getElementById("demo-area-01-show").innerHTML = `Current: <span class="${tempClass}">${temp}°C</span>, <span class="${humClass}">${hum}%</span>`;
         sendToBackend(Math.round(temp), Math.round(hum));
       }, 1000);
     });

     setInterval(() => {
       updateStatus();
       updateBlockchainData();
       updateTransactions();
     }, 1000);
     updateStatus();
     updateBlockchainData();
     updateTransactions();