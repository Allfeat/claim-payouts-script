# claim-payouts-script

This project provides a script for validators on a Substrate-based blockchain that includes the `staking` pallet to automatically claim their rewards for each unclaimed Era using the private key of a calling account executing the payout.

## Prerequisites

- Bun and Node.js must be installed on your machine.
- Access to a Substrate-based blockchain including the `staking` pallet.
- The private key (mnemonic) of the calling account that will execute the rewards payout.

## Installation

1. Clone this repository to your local machine.
2. In the project directory, run `bun install` to install the necessary dependencies.

## Configuration

Create a `.env` file at the root of the project and add your mnemonic key like so:

`MNEMONIC=your_private_key_here`

## Usage

To run the script, use the following command in the terminal:

`bun run index.ts`

### Script Steps:

1. The script establishes a connection to the specified Substrate node.
2. It determines the Eras for which rewards have not yet been claimed by the specified validator.
3. For each identified Era, the script executes the claim for rewards using the private key of the calling account.

## Security

- **Never share your mnemonic key.** This script requires your mnemonic key to sign the reward claim transactions. Keep it secure and do not disclose it to anyone.
- Ensure you understand the implications of running scripts that use your private keys.

## Support

If you encounter any issues or have questions, please open an issue in this project's GitHub repository.