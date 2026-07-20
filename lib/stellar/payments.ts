import { Asset, BASE_FEE, Horizon, Memo, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import {
  STELLAR_FRIENDBOT_URL,
  STELLAR_HORIZON_URL,
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_TREASURY_ADDRESS,
} from "@/lib/stellar/config";
import { StellarWalletsKit } from "@/lib/stellar/wallet-kit";

/** Used for read-only lookups (balances) — contract payments go through Soroban RPC. */
export const horizonServer = new Horizon.Server(STELLAR_HORIZON_URL);

export class StellarAccountNotFoundError extends Error {
  constructor(public address: string) {
    super(`Account ${address} isn't funded on testnet yet.`);
    this.name = "StellarAccountNotFoundError";
  }
}

/** Friendbot-funds a testnet account — dev convenience for wallets with no test XLM. */
export async function fundTestnetAccount(address: string): Promise<void> {
  const res = await fetch(`${STELLAR_FRIENDBOT_URL}/?addr=${encodeURIComponent(address)}`);
  if (!res.ok && res.status !== 400) {
    throw new Error("Friendbot funding failed. Try again in a moment.");
  }
}

/**
 * Sends a one-off native-XLM payment straight from the connected wallet to the
 * treasury — used for time-pass purchases, which happen rarely and at a fixed
 * price, instead of the top-up contract's running balance. Returns the
 * transaction hash once the ledger confirms it. `memoText` (≤ 28 bytes) ties
 * the payment to an order id so the server can verify it before granting.
 */
export async function payTreasuryDirect(
  address: string,
  amountXlm: number,
  memoText?: string,
): Promise<string> {
  const account = await horizonServer.loadAccount(address).catch((err) => {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) throw new StellarAccountNotFoundError(address);
    throw err;
  });

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  }).addOperation(
    Operation.payment({
      destination: STELLAR_TREASURY_ADDRESS,
      asset: Asset.native(),
      amount: amountXlm.toFixed(7),
    }),
  );
  if (memoText) builder.addMemo(Memo.text(memoText));
  const tx = builder.setTimeout(60).build();

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    address,
  });

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, STELLAR_NETWORK_PASSPHRASE);
  const result = await horizonServer.submitTransaction(signedTx);
  return result.hash;
}
