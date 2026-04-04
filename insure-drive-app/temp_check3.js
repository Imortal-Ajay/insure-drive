const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
  const addr = '0x8829375C50B67794e50B90096Cc2Aa79BeA30241';
  
  const zone = "Velachery";
  const encodeData = ethers.AbiCoder.defaultAbiCoder().encode(["string", "string", "uint256"], ["HEAT", zone, 42]);
  const eventId = ethers.keccak256(encodeData);
  console.log('EventId:', eventId);

  // function eventVotes(bytes32) -> 0xe6e4df9c
  const eventVotesSelector = ethers.id('eventVotes(bytes32)').slice(0, 10);
  const data = eventVotesSelector + eventId.slice(2);
  const result = await provider.call({ to: addr, data });
  console.log('eventVotes for this HEAT eventId:', parseInt(result, 16));

  const encodeData2 = ethers.AbiCoder.defaultAbiCoder().encode(["string", "string", "uint256"], ["RAIN", zone, 25]);
  const eventId2 = ethers.keccak256(encodeData2);
  console.log('EventId RAIN:', eventId2);
  const data2 = eventVotesSelector + eventId2.slice(2);
  const result2 = await provider.call({ to: addr, data: data2 });
  console.log('eventVotes for this RAIN eventId:', parseInt(result2, 16));

  const zoneHash = ethers.keccak256(ethers.toUtf8Bytes(zone));
  console.log('ZoneHash:', zoneHash);
  
  // function getEvent(bytes32) -> 0xe35e7dfd
  const getEventSelector = ethers.id('getEvent(bytes32)').slice(0, 10);
  const data3 = getEventSelector + zoneHash.slice(2);
  const result3 = await provider.call({ to: addr, data: data3 });
  console.log('getEvent Active boolean flag:', result3.substring(0, 66));
}

main().catch(console.log);
