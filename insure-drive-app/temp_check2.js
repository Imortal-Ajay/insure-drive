const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
  const addr = '0x8829375C50B67794e50B90096Cc2Aa79BeA30241';
  
  const abi = [
    {
      "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
      "name": "eventVotes",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MIN_ORACLE_VOTES",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "bytes32", "name": "zone", "type": "bytes32"}],
      "name": "getEvent",
      "outputs": [
        {
          "components": [
            {"internalType": "bool", "name": "isActive", "type": "bool"},
            {"internalType": "uint256", "name": "payoutPerEvent", "type": "uint256"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
          ],
          "internalType": "struct InsureDrive.EventData",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
  
  const contract = new ethers.Contract(addr, abi, provider);
  const coder = ethers.AbiCoder.defaultAbiCoder();

  const zone = "Velachery";
  const zoneHash = ethers.keccak256(ethers.toUtf8Bytes(zone));
  
  const reqIdHeat = ethers.keccak256(coder.encode(["string", "string", "uint256"], ["HEAT", zone, 42]));
  const reqIdRain = ethers.keccak256(coder.encode(["string", "string", "uint256"], ["RAIN", zone, 25]));

  console.log('HEAT ID:', reqIdHeat);
  console.log('RAIN ID:', reqIdRain);

  const votesHeat = await contract.eventVotes(reqIdHeat);
  console.log('VOTES FOR HEAT:', votesHeat.toString());

  const votesRain = await contract.eventVotes(reqIdRain);
  console.log('VOTES FOR RAIN:', votesRain.toString());

  const minVotes = await contract.MIN_ORACLE_VOTES();
  console.log('MIN_ORACLE_VOTES:', minVotes.toString());
  
  const ev = await contract.getEvent(zoneHash);
  console.log('IS ACTIVE FOR Velachery?', ev[0]);
  console.log('Payout:', ev[1].toString());
}
main().catch(console.log);
