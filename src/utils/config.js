import { PinataSDK } from "pinata-web3";

const pinataJwt = process.env.REACT_APP_PINATA_JWT;
const pinataGateway = process.env.REACT_APP_GATEWAY_URL;

if (!pinataJwt || !pinataGateway) {
  throw new Error("PINATA_JWT atau PINATA_GATEWAY tidak ditemukan di environment variables.");
}

const pinata = new PinataSDK({
  pinataJwt: pinataJwt,
  pinataGateway: pinataGateway,
});

export default pinata;
