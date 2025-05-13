import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const TempHumidity = await ethers.getContractFactory("TempHumidity");
  const contract = await TempHumidity.deploy();
  await contract.waitForDeployment();

  const contractAddress = contract.target.toString(); // 使用 target 獲取合約地址
  console.log("智能合約部署成功，地址：", contractAddress);

  if (network.config.chainId === 17000 && process.env.ETHERSCAN_API_KEY) {
    await contract.deploymentTransaction()?.wait(6);
    await verify(contractAddress, []);
  }

  const envFilePath = ".env";
  const envFileContent = fs.readFileSync(envFilePath, "utf-8");
  if (envFileContent.includes("CONTRACT_ADDRESS")) {
    const updatedContent = envFileContent.replace(/CONTRACT_ADDRESS=[^\n]*\n/, "");
    fs.writeFileSync(envFilePath, updatedContent, { flag: "w" });
  }

  fs.appendFileSync(envFilePath, `CONTRACT_ADDRESS=${contractAddress}\n`);
  console.log("合約地址已存入 .env 文件");
}

async function verify(contractAddress: string, args: any[]) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e instanceof Error && e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!");
    } else {
      console.error(e);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});