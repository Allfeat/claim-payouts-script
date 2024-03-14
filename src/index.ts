import { cryptoWaitReady } from '@polkadot/util-crypto';
import { waitReady } from '@polkadot/wasm-crypto';
import {connectToNode} from "./node";
import {type ApiPromise, Keyring} from '@polkadot/api';
import type { KeyringPair } from "@polkadot/keyring/types";
import "@allfeat/types/interfaces/augment-api.ts";
import "@allfeat/types/interfaces/augment-types.ts";

// all type stuff, the only one we are using here
import dotenv from 'dotenv';

export class AllfeatCaller {
    account: KeyringPair | undefined;
    isReady: Promise<void>;

    constructor() {
        console.log("Creating the caller account...");
        let makeReady: () => void;

        this.isReady = new Promise((resolve) => {
            makeReady = resolve;
        });

        try {
            const keyring = new Keyring({ type: "ethereum" });

            const index = 0;
            const derivationPath = "m/44'/60'/0'/0/" + index;

            waitReady().then(() => {
                this.account = keyring.addFromUri(`${process.env.MNEMONIC}/${derivationPath}`);
                makeReady()
            });
        } catch (error) {
            console.log(error);
        }
    }
}

export class AllfeatActions {
    caller: AllfeatCaller;
    api: ApiPromise;
    validator: string | undefined;
    eras_to_claim: number[];

    constructor(api: ApiPromise) {
        this.caller = new AllfeatCaller;
        this.api = api;
        this.eras_to_claim = [];
    }

    public set_validator(address: string) {
        this.validator = address;
    }

    async get_current_era_index(): Promise<number> {
        // Get last era
        let result = await this.api.query.staking.currentEra()
        // using toNumber() is kinda unsafe as it can overflow but
        // we expect EraIndex to never be that big for the moment
        return result.unwrap().toNumber();
    }

    async get_eras_to_claim_from_current() {
        // resetting
        this.eras_to_claim = [];

        let history_depth = this.api.consts.staking.historyDepth.toNumber();
        let last_era = await this.get_current_era_index();

        let to_check: number = last_era - history_depth;

        for (let i = to_check < 0 ? 0 : to_check; i < last_era; i++) {
            let result = await this.api.query.staking.claimedRewards(i, this.validator);
            if (result.isEmpty) {
                this.eras_to_claim.push(i)
            }
        }
    }

    async claim_era(era: number) {
        console.log(`✏️ Starting claim for era ${era}...`)
        await this.caller.isReady;
        const tx = this.api.tx.staking.payoutStakersByPage(this.validator!, era, 0);
        const unsub = await tx.signAndSend(this.caller.account!, {nonce: -1}, (result) => {
            console.log(`Submitted tx: ${result.status}`);

            if (result.status.isInBlock) {
                console.log(`✅ Rewards for Era ${era} was successfully claimed at block ${result.status.asInBlock}`);
                unsub()
                return Promise.resolve();
            }
        });
    }

    async claim_all_eras() {
        console.log(`Initializing claim for ${this.eras_to_claim.length} era(s)...`)
        //const [nonce] = await this.api.query.system.account(this.caller.account?.address);
        for (const era of this.eras_to_claim) {
            await this.claim_era(era);
        }
    }
}
async function main() {
    await cryptoWaitReady();

    const api = await connectToNode("");

    console.log("Initializing Staking Payout claims...")

    const actions = new AllfeatActions(api);

    actions.set_validator("");
    await actions.get_eras_to_claim_from_current();
    await actions.claim_all_eras();
}

main().catch(console.error);