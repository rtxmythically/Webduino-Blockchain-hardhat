// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TempHumidity {
    struct Record {
        uint256 temperature;
        uint256 humidity;
        uint256 timestamp;
    }

    Record[] private records;

    event DataStored(
        address indexed sender,
        uint256 temperature,
        uint256 humidity,
        uint256 timestamp,
        bytes32 transactionHash
    );

    function storeData(uint256 _temperature, uint256 _humidity) public {
        records.push(Record(_temperature, _humidity, block.timestamp));
        emit DataStored(msg.sender, _temperature, _humidity, block.timestamp, bytes32(0));
    }

    function getLatestRecord() public view returns (uint256, uint256, uint256) {
        require(records.length > 0, "No data available");
        Record memory latest = records[records.length - 1];
        return (latest.temperature, latest.humidity, latest.timestamp);
    }

    function getAllRecords() public view returns (Record[] memory) {
        return records;
    }

    function getRecordCount() public view returns (uint256) {
        return records.length;
    }
}
