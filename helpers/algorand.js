import { CID } from 'multiformats/cid';
import algosdk from 'algosdk';
import * as digest from 'multiformats/hashes/digest';
import * as mfsha2 from 'multiformats/hashes/sha2';

const INDEXER_URL = 'https://mainnet-idx.algonode.cloud';

export async function addrToCid(template, addr) {
	const [, , ver, codec, ,] = template.split(':');
	const mhash = digest.create(mfsha2.sha256.code, algosdk.decodeAddress(addr).publicKey);
	return CID.create(ver * 1, codec == 'dag-pb' ? 0x70 : 0x55, mhash).toV1().toString();
}

export async function getAssetByID(asa_id) {
	const indexerClient = new algosdk.Indexer('', INDEXER_URL, '');
	const _asset = await indexerClient.lookupAssetByID(asa_id).do();
	const asset = _asset.asset;
	const divisor = Math.pow(10, asset.params.decimals);
	return {
		creator: `${asset.params.creator}`,
		decimals: asset.params.decimals,
		name: `${asset.params.name}`,
		total: asset.params.total,
		unit_name: `${asset.params['unit-name']}`,
		url: `${asset.params.url}`,
		clawback: `${asset.params.clawback}`,
		divisor: divisor,
	};
}