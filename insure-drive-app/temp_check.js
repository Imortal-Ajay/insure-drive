const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
const addr = '0x8829375C50B67794e50B90096Cc2Aa79BeA30241';
const abi = [{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"activeEvents","outputs":[{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"uint256","name":"payoutPerEvent","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"}, {"inputs":[{"internalType":"bytes32","name":"zone","type":"bytes32"}],"name":"getEvent","outputs":[{"components":[{"internalType":"bool","name":"isActive","type":"bool"},{"internalType":"uint256","name":"payoutPerEvent","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"internalType":"struct InsureDrive.EventData","name":"","type":"tuple"}],"stateMutability":"view","type":"function"}, {"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"eventVotes","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}, {"inputs":[],"name":"MIN_ORACLE_VOTES","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"} ];

async function main() {
  const contract = new ethers.Contract(addr, abi, provider);
  const zoneStr = 'Velachery';
  const packHash = ethers.keccak256(ethers.toUtf8Bytes(zoneStr));
  
  const minVotes = await contract.MIN_ORACLE_VOTES();
  console.log('MIN VOTES REQUIRED:', minVotes.toString());

  const votes = await contract.eventVotes(packHash);
  console.log('CURRENT VOTES COUNTER FOR', zoneStr, ':', votes.toString());

  const ev = await contract.getEvent(packHash);
  console.log('--- EVENT DATA FOR', zoneStr, '---');
  console.log('isActive:', ev.isActive);
  console.log('payout:', ev.payoutPerEvent.toString());
}
main().catch(console.error);
