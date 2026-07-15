# jatah-ai top-up contract

Soroban smart contract used by the wallet top-up flow (`lib/stellar/soroban.ts`
in the app). It pulls native XLM from a connected wallet into the app's
treasury via the standard SEP-41 token interface, and keeps a running
on-chain total of how much each address has paid in.

```text
.
├── contracts
│   └── topup
│       ├── src
│       │   ├── lib.rs    # contract logic
│       │   └── test.rs   # unit tests
│       └── Cargo.toml
├── Cargo.toml             # workspace
└── README.md
```

## Contract interface

- `__constructor(token: Address, treasury: Address)` — set at deploy time.
- `top_up(from: Address, amount: i128) -> i128` — requires `from`'s auth;
  transfers `amount` of `token` from `from` to `treasury`, adds it to `from`'s
  running total, and returns the new total.
- `credited(address: Address) -> i128` — read-only lookup of an address's
  lifetime total.
- `treasury() -> Address` / `token() -> Address` — read-only config getters.

## Build & test

```sh
cargo test
stellar contract build
```

## Deploy (testnet)

```sh
stellar keys generate jatah-deployer --network testnet --fund

stellar contract deploy \
  --wasm target/wasm32v1-none/release/topup.wasm \
  --source jatah-deployer \
  --network testnet \
  --alias jatah-topup \
  -- \
  --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
  --treasury <treasury-G-address>
```

`CDLZFC...` is the deterministic Stellar Asset Contract id for native XLM on
testnet (`stellar contract id asset --asset native --network testnet`).

The deployed contract id and treasury address are wired into the app via
`NEXT_PUBLIC_STELLAR_TOPUP_CONTRACT_ID` / `NEXT_PUBLIC_STELLAR_TREASURY_ADDRESS`
(see `lib/stellar/config.ts` for the defaults currently deployed).
