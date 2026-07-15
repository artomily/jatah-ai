#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, token, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// SEP-41 token this contract accepts (the testnet native XLM SAC).
    Token,
    /// Address that receives every top-up payment.
    Treasury,
    /// Running total credited to a given payer, in the token's base units.
    Credited(Address),
}

#[contractevent(data_format = "single-value")]
pub struct TopUp {
    #[topic]
    from: Address,
    amount: i128,
}

#[contract]
pub struct TopUpContract;

#[contractimpl]
impl TopUpContract {
    pub fn __constructor(env: Env, token: Address, treasury: Address) {
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
    }

    /// Pulls `amount` of the configured token from `from` into the treasury and
    /// records the credit against `from`'s running total. Returns the new total.
    pub fn top_up(env: Env, from: Address, amount: i128) -> i128 {
        from.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let token_id: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        token::Client::new(&env, &token_id).transfer(&from, &treasury, &amount);

        let key = DataKey::Credited(from.clone());
        let total: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        let new_total = total + amount;
        env.storage().persistent().set(&key, &new_total);
        env.storage()
            .persistent()
            .extend_ttl(&key, 100_000, 500_000);

        TopUp { from, amount }.publish(&env);

        new_total
    }

    /// Lifetime total a given address has paid into the treasury through this contract.
    pub fn credited(env: Env, address: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Credited(address))
            .unwrap_or(0)
    }

    pub fn treasury(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Treasury).unwrap()
    }

    pub fn token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }
}

mod test;
