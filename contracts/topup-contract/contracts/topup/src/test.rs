#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Env};

fn create_token_contract<'a>(
    e: &Env,
    admin: &Address,
) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let sac = e.register_stellar_asset_contract_v2(admin.clone());
    (
        token::Client::new(e, &sac.address()),
        token::StellarAssetClient::new(e, &sac.address()),
    )
}

#[test]
fn top_up_transfers_to_treasury_and_records_credit() {
    let e = Env::default();
    e.mock_all_auths();

    let token_admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let payer = Address::generate(&e);

    let (token, token_admin_client) = create_token_contract(&e, &token_admin);
    token_admin_client.mint(&payer, &1_000);

    let contract_id = e.register(TopUpContract, (&token.address, &treasury));
    let client = TopUpContractClient::new(&e, &contract_id);

    let total = client.top_up(&payer, &400);
    assert_eq!(total, 400);
    assert_eq!(token.balance(&payer), 600);
    assert_eq!(token.balance(&treasury), 400);
    assert_eq!(client.credited(&payer), 400);

    let total = client.top_up(&payer, &100);
    assert_eq!(total, 500);
    assert_eq!(token.balance(&payer), 500);
    assert_eq!(client.credited(&payer), 500);

    assert_eq!(client.treasury(), treasury);
    assert_eq!(client.token(), token.address);
}

#[test]
#[should_panic]
fn top_up_rejects_non_positive_amount() {
    let e = Env::default();
    e.mock_all_auths();

    let token_admin = Address::generate(&e);
    let treasury = Address::generate(&e);
    let payer = Address::generate(&e);
    let (token, _) = create_token_contract(&e, &token_admin);

    let contract_id = e.register(TopUpContract, (&token.address, &treasury));
    let client = TopUpContractClient::new(&e, &contract_id);

    client.top_up(&payer, &0);
}
