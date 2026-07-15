import { Address, Contract, TransactionBuilder, nativeToScVal, rpc, scValToNative } from "@stellar/stellar-sdk";
import {
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_SOROBAN_RPC_URL,
  STELLAR_TOPUP_CONTRACT_ID,
} from "@/lib/stellar/config";
import { StellarAccountNotFoundError } from "@/lib/stellar/payments";
import { StellarWalletsKit } from "@/lib/stellar/wallet-kit";

export const sorobanServer = new rpc.Server(STELLAR_SOROBAN_RPC_URL);

const topUpContract = new Contract(STELLAR_TOPUP_CONTRACT_ID);

async function loadSorobanAccount(address: string) {
  try {
    return await sorobanServer.getAccount(address);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Account not found")) {
      throw new StellarAccountNotFoundError(address);
    }
    throw err;
  }
}

/**
 * Invokes the `top_up` function on the Soroban topup contract: the contract
 * pulls native XLM from the connected wallet into the treasury (via the
 * native asset's Stellar Asset Contract) and records the credit on-chain.
 * Returns the transaction hash once the ledger confirms it.
 */
export async function topUpViaContract(address: string, amountStroops: bigint): Promise<string> {
  const account = await loadSorobanAccount(address);

  const tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(
      topUpContract.call(
        "top_up",
        new Address(address).toScVal(),
        nativeToScVal(amountStroops, { type: "i128" }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await sorobanServer.prepareTransaction(tx);

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(prepared.toXDR(), {
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    address,
  });

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, STELLAR_NETWORK_PASSPHRASE);
  const sent = await sorobanServer.sendTransaction(signedTx);
  if (sent.status === "ERROR") {
    throw new Error("The network rejected this transaction.");
  }

  const final = await sorobanServer.pollTransaction(sent.hash, {
    attempts: 20,
    sleepStrategy: rpc.LinearSleepStrategy,
  });
  if (final.status !== "SUCCESS") {
    throw new Error("The top-up transaction failed to confirm.");
  }

  return sent.hash;
}

/** Reads the payer's lifetime on-chain credited total (in stroops) from the contract. */
export async function getCreditedOnChain(address: string): Promise<number> {
  const account = await loadSorobanAccount(address);
  const tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(topUpContract.call("credited", new Address(address).toScVal()))
    .setTimeout(30)
    .build();

  const sim = await sorobanServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) return 0;
  const retval = rpc.Api.isSimulationSuccess(sim) ? sim.result?.retval : undefined;
  if (!retval) return 0;
  return Number(scValToNative(retval));
}
