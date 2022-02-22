import * as dotenv from "dotenv";
dotenv.config();
import { BigNumber, Contract, Signer, Wallet } from "ethers";
import { MockProvider } from "ethereum-waffle";
import * as hre from "hardhat";
const BN = require("bn.js");
import { Address, toChecksumAddress } from "ethereumjs-util";
import { arrayify } from "ethers/lib/utils";
import { createHash, randomInt, Sign } from "crypto";
import { ethers } from "hardhat";

let waveSupplies: number = 500;
let whitelist: boolean = false;
describe("ClubCards", () => {
  const provider = new MockProvider();
  const [admin] = provider.getWallets();
  let cc: Contract;
  let ccat: Contract;
  let waves: Array<Promise<Object>> = [];
  let waveData: Array<any> = [];
  beforeEach(async () => {
    const ClubCards = await hre.ethers.getContractFactory("ClubCards");
    cc = await ClubCards.deploy("0x4f65cDFfE6c48ad287f005AD14E78ff6433c8d67");
    const CCAuthTx = await hre.ethers.getContractFactory("CCAuthTx");
    ccat = await CCAuthTx.deploy(cc.address);
    await cc.setAdmin(admin.address);
    await cc.setAllStatus(true);
    const waveNums: number = 6;
    for (let i = 3; i < waveNums + 3; i++) {
      let wave: any = constructWave(
        i,
        86400,
        0.01 * (3 + getRandInt(7)),
        true,
        whitelist
      );
      console.log(`Wave ${i}:`);
      console.log(wave);
      waveData.push(wave);
      waves.push(
        cc.setWave(
          i,
          wave.MAX_SUPPLY,
          wave.REVEAL_TIMESTAMP,
          wave.price,
          wave.status,
          wave.whitelistStatus,
          wave.provHash,
          wave._waveURI
        )
      );
    }
  });
  it("Test Call", async () => {
    const numMints = 10;
    let [admin, testWallet] = await hre.ethers.getSigners();
    let parsed = waveToJSON(await cc.getWave(3));
    let ccad = ccat.connect(admin);
    let ccte = ccat.connect(testWallet);
    console.log(`CCAuth Addy: ${ccat.address}`);
    console.log(`CC Addy: ${cc.address}`);

    await ccad.test(numMints, 3, getOverrides(numMints, parsed.price));
    await ccte.test(numMints, 3, getOverrides(numMints, parsed.price));
  });
  /* 
  it("Stress Test", async () => {
    const start = Date.now();
    let counter: number = 0;
    let tracker: any = {};
    tracker["Ids"] = [];
    tracker["Claimable"] = [];
    tracker["WaveIds"] = [];
    tracker["Amounts"] = [];
    tracker["ClaimIds"] = [];
    tracker["Gas"] = {};
    tracker["Gas"]["Claims"] = {};
    tracker["Gas"]["WLMints"] = {};
    for (let i = 1; i < 11; i++) {
      tracker["Gas"][i.toString()] = [];
      tracker["Gas"]["Claims"][i.toString()] = [];
      tracker["Gas"]["WLMints"][i.toString()] = [];
    }
    let claimNums = 1;
    let filled: Array<number> = [];
    let ti = 0;
    const claimTxBuilder = (
      numClaims: number,
      tokenIdsOfClaims: Array<BigNumber>,
      claimNonce: number
    ) => {
      let claimArgs: Array<any> = [];
      claimArgs[2] = claimNonce;
      let claimedIds: Array<number> = [];
      claimArgs[0] = [];
      claimArgs[1] = [];

      while (numClaims > 0) {
        let claimId: number;
        do {
          claimId = getRandInt(tokenIdsOfClaims.length);
        } while (claimedIds.includes(claimId));
        claimedIds.push(claimId);
        claimArgs[0].push(tokenIdsOfClaims[claimId].toNumber());
        claimArgs[1].push(2 + getRandInt(4));
        numClaims--;
      }

      return claimArgs;
    };
    const addId = (numMints: number, waveId?: number, gas?: number) => {
      for (let i = 0; i < numMints; i++) {
        tracker.Ids.push(ti);

        if (waveId === undefined) {
          tracker.Amounts.push(0);
          tracker.Claimable.push(true);
          tracker.WaveIds.push(undefined);
          tracker.ClaimIds.push(claimNums);
          claimNums++;
        } else {
          tracker.Amounts.push(1);
          tracker.Claimable.push(false);
          tracker.WaveIds.push(waveId);
          tracker.ClaimIds.push(undefined);
          if (!(gas === undefined)) {
            tracker.Gas[numMints.toString()].push(gas);
          }
        }
        ti++;
      }
    };
    const increaseSupply = (
      tokenIds: Array<number>,
      amounts: Array<number>
    ) => {
      if (tokenIds.length != amounts.length) {
        throw Error("invlaid lengths");
      }
      for (let i = 0; i < tokenIds.length; i++) {
        tracker.Amounts[tokenIds[i]] += amounts[i];
      }
    };

    await Promise.all(waves);
    let wave = await cc.getWave(4);
    console.log(wave);

    await cc.setAllStatus(true);
    await cc.setClaim(claimNums, " ", true);
    addId(1);
    for (let i = 3; i < waves.length + 3; i++) {
      if (i % 3 === 0) {
        await cc.manualSetBlock(i);
      }
    }

    while (true) {
      if (filled.length == waves.length) {
        console.log("Finished");
        let results: Array<number> = [];
        Object.keys(tracker.Gas).forEach((key) => {
          if (!isNaN(parseInt(key))) {
            let arr = tracker.Gas[parseInt(key)];
            let result =
              arr.reduce((a: number, b: number) => a + b) / arr.length;
            results.push(result);
          }
        });
        Object.keys(tracker.Gas).forEach((key) => {
          if (!isNaN(parseInt(key))) {
            let arr = tracker.Gas[parseInt(key)];
            console.log(arr[arr.length - 1]);
          }
        });
        console.log("Average of all mints:");
        results.forEach((elem) => {
          console.log(elem);
        });
        results = [];
        Object.keys(tracker.Gas.Claims).forEach((key) => {
          let arr = tracker.Gas.Claims[key];
          let result = arr.reduce((a: number, b: number) => a + b) / arr.length;
          results.push(result);
        });
        Object.keys(tracker.Gas.Claims).forEach((key) => {
          let arr = tracker.Gas.Claims[key];
          console.log(arr[arr.length - 1]);
        });
        console.log("Average of all Claims:");
        results.forEach((elem) => {
          console.log(elem);
        });
        break;
      }
      const randWaveNum: number = getRandInt(waves.length) + 3;

      if (getRandInt(5) == 0) {
        await cc.setClaim(
          claimNums,
          `http://www.api-clubcards.io/claims/${claimNums}/`,
          true
        );
        addId(1);
      }
      if (getRandInt(4) == 0 && claimNums > 1) {
        let tokenIdsOfClaims: Array<BigNumber> = [];
        for (let i = 1; i < claimNums; i++) {
          let claim = await cc.getClaim(i);
          tokenIdsOfClaims.push(claim[1]);
        }
        let claimNonce = await cc.authTxNonce(
          "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
        );
        let claimArgs = claimTxBuilder(
          tokenIdsOfClaims.length > 10
            ? 1 + getRandInt(10)
            : 1 + getRandInt(tokenIdsOfClaims.length),
          tokenIdsOfClaims,
          claimNonce.toNumber()
        );
        createClaimSig(
          claimArgs[0],
          claimArgs[1],
          claimNonce,
          toChecksumAddress("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"),
          admin,
          admin.address,
          async (res: any) => {
            claimArgs[4] = res.signature;
            claimArgs[3] = res.timestamp;
            let claimTx = await cc.claim(
              claimArgs[0],
              claimArgs[1],
              claimArgs[2],
              claimArgs[3],
              claimArgs[4]
            );
            let txRec = await ethers.provider.getTransactionReceipt(
              claimTx.hash
            );
            let gasUsed = txRec.gasUsed.toNumber();
            tracker.Gas.Claims[claimArgs[0].length.toString()].push(gasUsed);
            increaseSupply(claimArgs[0], claimArgs[1]);
          }
        );
      }
      if (filled.includes(randWaveNum)) {
        continue;
      } else {
        let wave = waveToJSON(await cc.getWave(randWaveNum));
        let mintsLeft = wave.MAX_SUPPLY - wave.circSupply;
        if (mintsLeft === 0) {
          filled.push(randWaveNum);
          continue;
        }
        const numMints = mintsLeft <= 10 ? mintsLeft : 1 + getRandInt(10);
        if (getRandInt(11) === 0 && whitelist) {
          await cc.setWaveWLStatus(randWaveNum, true);
          const res = await createMintSig(
            toChecksumAddress("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"),
            numMints,
            randWaveNum,
            0,
            admin,
            admin.address
          );
          let mintTx = await cc.whitelistMint(
            res.numMints,
            res.waveId,
            0,
            res.timestamp,
            res.signature,
            getOverrides(numMints, wave.price)
          );
          let txRec = await ethers.provider.getTransactionReceipt(mintTx.hash);
          addId(numMints, randWaveNum);
        } else {
          await cc.setWaveWLStatus(randWaveNum, false);
          let mintTx = await cc.mintCard(
            numMints,
            randWaveNum,
            getOverrides(numMints, wave.price)
          );
          let txRec = await ethers.provider.getTransactionReceipt(mintTx.hash);
          let gasUsed = txRec.gasUsed.toNumber();
          addId(numMints, randWaveNum, gasUsed);
        }
      }
      counter++;
      if ((counter + 100) % 100 === 0) {
        await cc.withdraw();
        console.log(counter);
      }
    }
    let supply = (await cc.totalSupply()).toNumber();
    console.log(`total supply: ${supply}`);
    let claims = claimNums;
    if (claims !== claimNums) {
      console.log(`claims: ${claims}`);
      console.log(`claimNums: ${claimNums}`);

      throw Error("ERROR");
    }
    /*     for (let i = 0; i < supply; i++) {
      if (tracker.Claimable[i]) {
        const claimId = tracker.ClaimIds[i];
        const claimToken = await cc.getClaim(claimId);
        const totalSupply = (await cc.totalSupply()).toNumber();
        if (
          claimToken[0].toNumber() !== claimId ||
          claimToken[1].toNumber() !== i ||
          claimToken[3].toNumber() !== totalSupply
        ) {
          console.log(claimToken[0].toNumber());
          console.log(claimId);
          console.log(i);
          console.log(claimToken[1].toNumber());
          console.log(claimToken[3].toNumber());
          console.log(tracker.Amounts[i]);

          console.log(totalSupply);
          throw Error("ERROR 2");
        }
        if (tracker.WaveIds[i] !== undefined) {
          console.log(tracker.WaveIds[i]);
          throw Error("ERROR 1");
        }
      } else {
        if (tracker.Amounts[i] > 1) {
          console.log(tracker.Amounts[i]);
          throw Error("ERROR 3");
        } else {
          let waveToken = await cc.getToken(i);
          if (waveToken[1].toNumber() !== tracker.WaveIds[i]) {
            console.log(waveToken[1].toNumber());
            console.log(tracker.WaveIds[i]);

            throw Error("ERROR 4");
          }
        }
      }
    }
    for (let i = 3; i < waves.length + 3; i++) {
      let wave = await cc.getWave(i);
      let waveParsed = waveToJSON(wave);

      if (
        waveParsed.waveId != waveData[i - 3].waveId ||
        waveParsed.MAX_SUPPLY != waveData[i - 3].MAX_SUPPLY ||
        waveParsed.REVEAL_TIMESTAMP != waveData[i - 3].REVEAL_TIMESTAMP ||
        waveParsed.price.sub(waveData[i - 3].price).toNumber() !== 0 ||
        waveParsed.startIndex != waveData[i - 3].startIndex ||
        waveParsed.startIndex > waveParsed.MAX_SUPPLY ||
        waveParsed.startIndexBlock === 0 ||
        waveParsed.provHash != waveData[i - 3].provHash ||
        waveParsed.status != waveData[i - 3].status ||
        waveParsed._waveURI != waveData[i - 3]._waveURI
      ) {
        console.log(waveParsed);
        console.log(waveData[i - 3]);

        throw Error("ERROR WAVES");
      }
    }
    for (let i = 3; i < waves.length + 3; i++) {
      let RNG = randomInt(9999);
      let randomPrice: number = 0.01 * (1 + (RNG % 6));
      let randomStatus: boolean = RNG % 2 === 0;
      await cc.setWavePrice(
        i,
        hre.ethers.utils.parseEther(randomPrice.toString())
      );
      await cc.setWaveStatus(i, randomStatus);
      await cc.setWaveURI(i, `www.randomuri.com/${i}/`);
      await cc.setWaveStartIndex(i);

      let wave = await cc.getWave(i);
      let waveParsed = waveToJSON(wave);
      if (
        waveParsed.waveId != i ||
        waveParsed.price
          .sub(hre.ethers.utils.parseEther(randomPrice.toString()))
          .toNumber() !== 0 ||
        waveParsed.status != randomStatus ||
        waveParsed._waveURI != `www.randomuri.com/${i}/` ||
        waveParsed.MAX_SUPPLY != waveParsed.circSupply ||
        waveParsed.startIndex == 0 ||
        waveParsed.startIndexBlock == 0
      ) {
        console.log(waveParsed);

        throw Error("ERROR 6");
      }
    }

    await cc.setAdmin("0x599ED2119EFC6b97d23729E0f2aF5Bf71c1e1249");
    await cc.setContractURI("www.randomurl.com/contract");
    await cc.setClaimURI(1, "www.randomClaimURI.com/claim/");

    for (let i = 0; i < 25; i++) {
      let randId = getRandInt(supply);
      let [isClaim, editionId, idOfWave] = await cc.getToken(randId);
      let uri = await cc.uri(randId);
      console.log(`\nCon - editionId: ${editionId}`);
      console.log(`Con - idOfWave: ${idOfWave}`);
      console.log(`Con - uri: ${uri}`);
      console.log(`Loc - isClaim: ${tracker.Claimable[randId]}`);
      console.log(`Loc - uri: ${tracker.WaveIds[randId]}`);
    }
    let end = Date.now();
    let final = end - start;
    console.log(`Total Runtime: ${final}`);
  });
 */
  // it("Stress Test", async () => {});
});

const getOverrides = (numMints: number, wavePrice: BigNumber) => {
  let price = wavePrice.mul(numMints);
  return {
    value: price,
  };
};

function createMintSig(
  sender: string,
  numMints: number,
  waveId: number,
  nonce: number,
  signer: Signer,
  signerAddy: string
) {
  let ts = Math.round(Date.now() / 1000);
  const message = hre.ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "uint256", "uint256"],
    [sender, numMints, waveId, nonce, ts]
  );
  let hashed = hre.ethers.utils.keccak256(message);
  return signer
    .signMessage(arrayify(hashed))
    .then((sig) => {
      let recAddress = hre.ethers.utils.recoverAddress(
        arrayify(hre.ethers.utils.hashMessage(arrayify(hashed))),
        sig
      );
      if (recAddress == signerAddy.toString()) {
        return {
          sender: sender,
          numMints: numMints,
          waveId: waveId,
          nonce: nonce,
          timestamp: ts,
          signature: sig,
        };
      } else {
        throw new Error("COULDNT RECOVER ADDRESS FROM SIGNATURE");
      }
    })
    .catch((err) => {
      return err;
    });
}
// create signed message
function createClaimSig(
  ids: Array<number>,
  amts: Array<number>,
  claims: number,
  sender: string,
  signer: Signer,
  signerAddy: string,
  callback: Function
) {
  let ts = Math.round(Date.now() / 1000);
  const message = hre.ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256[]", "uint256[]", "uint256", "uint256"],
    [sender, ids, amts, claims, ts]
  );
  let hashed = hre.ethers.utils.keccak256(message);
  return signer
    .signMessage(arrayify(hashed))
    .then((sig) => {
      let recAddress = hre.ethers.utils.recoverAddress(
        arrayify(hre.ethers.utils.hashMessage(arrayify(hashed))),
        sig
      );
      if (recAddress == signerAddy.toString()) {
        callback({
          tokens: ids,
          amounts: amts,
          claimNum: claims,
          signature: sig,
          recAddy: recAddress,
          timestamp: ts,
        });
      } else {
        throw new Error("COULDNT RECOVER ADDRESS FROM SIGNATURE");
      }
    })
    .catch((err) => {
      return err;
    });
}
const getRandInt = (max: number) => {
  return Math.floor(Math.random() * max);
};
const getRandomHash = () => {
  const randint = getRandInt(9999);
  return createHash("sha256").update(randint.toString()).digest("hex");
};
function numStringToBytes32(num: String) {
  var bn = new BN(num).toTwos(256);
  return padToBytes32(bn.toString(16));
}

function padToBytes32(n: String) {
  while (n.length < 64) {
    n = "0" + n;
  }
  return "0x" + n;
}

function bytes32ToNumString(bytes32str: String) {
  bytes32str = bytes32str.replace(/^0x/, "");
  var bn = new BN(bytes32str, 16).fromTwos(256);
  return bn.toString();
}
interface LooseObject {
  [key: string]: any;
}
const waveToJSON = (waveData: Array<any>) => {
  let temp: LooseObject = {};
  temp["waveId"] = waveData[0].toNumber();
  temp["MAX_SUPPLY"] = waveData[1].toNumber();
  temp["REVEAL_TIMESTAMP"] = waveData[2].toNumber();
  temp["price"] = waveData[3];
  temp["startIndex"] = waveData[4].toNumber();
  temp["startIndexBlock"] = waveData[5].toNumber();
  temp["status"] = waveData[6];
  temp["whitelistStatus"] = waveData[7];
  temp["circSupply"] = waveData[8].toNumber();
  temp["provHash"] = waveData[9];
  temp["_waveURI"] = waveData[10];

  return temp;
};
function hex_to_ascii(str1: String) {
  var hex = str1.toString();
  var str = "";
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
const constructWave = (
  num: number,
  timeout: number,
  price: number,
  status: boolean,
  whitelistStatus: boolean
) => {
  let priceStr = price.toString();
  return {
    waveId: num,
    MAX_SUPPLY: waveSupplies + getRandInt(100),
    REVEAL_TIMESTAMP: Math.ceil(Date.now() / 1000) + timeout,
    price: hre.ethers.utils.parseEther(priceStr),
    startIndex: 0,
    startIndexBlock: 0,
    status: status,
    whitelistStatus: whitelistStatus,
    circSupply: 0,
    provHash: getRandomHash(),
    _waveURI: `http://www.api-clubcards.io/waves/${num}/`,
  };
};
