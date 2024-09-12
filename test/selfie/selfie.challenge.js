const { ethers } = require('hardhat');
const { expect } = require('chai');
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe('[Challenge] Selfie', function () {
    let deployer, player;
    let token, governance, pool;

    const TOKEN_INITIAL_SUPPLY = 2000000n * 10n ** 18n;
    const TOKENS_IN_POOL = 1500000n * 10n ** 18n;
    
    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, player] = await ethers.getSigners();

        // Deploy Damn Valuable Token Snapshot
        token = await (await ethers.getContractFactory('DamnValuableTokenSnapshot', deployer)).deploy(TOKEN_INITIAL_SUPPLY);

        // Deploy governance contract
        governance = await (await ethers.getContractFactory('SimpleGovernance', deployer)).deploy(token.address);
        expect(await governance.getActionCounter()).to.eq(1);

        // Deploy the pool
        pool = await (await ethers.getContractFactory('SelfiePool', deployer)).deploy(
            token.address,
            governance.address    
        );
        expect(await pool.token()).to.eq(token.address);
        expect(await pool.governance()).to.eq(governance.address);
        
        // Fund the pool
        await token.transfer(pool.address, TOKENS_IN_POOL);
        await token.snapshot();
        expect(await token.balanceOf(pool.address)).to.be.equal(TOKENS_IN_POOL);
        expect(await pool.maxFlashLoan(token.address)).to.eq(TOKENS_IN_POOL);
        expect(await pool.flashFee(token.address, 0)).to.eq(0);

    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */
        this.attack = await (await ethers.getContractFactory("AttackSelfie", player)).deploy(
            pool.address, governance.address, token.address
        )

        await this.attack.attack();
        
        await time.increase(2 * 24 * 60 * 60 + 1);

        await governance.connect(player).executeAction(1);
    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */

        // Player has taken all tokens from the pool
        expect(
            await token.balanceOf(player.address)
        ).to.be.equal(TOKENS_IN_POOL);        
        expect(
            await token.balanceOf(pool.address)
        ).to.be.equal(0);
    });
});

// describe('SelfiePool', function () {
//     let deployer, player;
//     let addr1;
//     let token, governance, pool;

//     const TOKEN_INITIAL_SUPPLY = 2000000n * 10n ** 18n;
//     const TOKENS_IN_POOL = 1500000n * 10n ** 18n;
    
//     before(async function () {
//         /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
//         [deployer, player,addr1] = await ethers.getSigners();
        
        

//         // Deploy Damn Valuable Token Snapshot
//         token = await (await ethers.getContractFactory('DamnValuableTokenSnapshot', deployer)).deploy(TOKEN_INITIAL_SUPPLY);

//         // Deploy governance contract
//         governance = await (await ethers.getContractFactory('SimpleGovernance', deployer)).deploy(token.address);
//         expect(await governance.getActionCounter()).to.eq(1);

//         // Deploy the pool
//         pool = await (await ethers.getContractFactory('SelfiePool', deployer)).deploy(
//             token.address,
//             governance.address    
//         );
//         expect(await pool.token()).to.eq(token.address);
//         expect(await pool.governance()).to.eq(governance.address);
        
//         // Fund the pool
//         await token.transfer(pool.address, TOKENS_IN_POOL);
//         await token.snapshot();
//         expect(await token.balanceOf(pool.address)).to.be.equal(TOKENS_IN_POOL);
//         expect(await pool.maxFlashLoan(token.address)).to.eq(TOKENS_IN_POOL);
//         expect(await pool.flashFee(token.address, 0)).to.eq(0);

//     });

  


//   describe('Deployment', function () {
//     it('should be deployed with the correct token address', async () => {
//       const tokenAddress = await pool.token();
//       expect(tokenAddress).to.equal(token.address); // Update based on your mock token address
//     });

//     it('should be deployed with the correct governance address', async () => {
//       const governanceAddress = await pool.governance();
//       expect(governanceAddress).to.equal(governance.address);
//     });
//   });

//   describe('maxFlashLoan', function () {


//     it('should return 0 for unsupported tokens', async () => {
//       const unsupportedToken = ethers.constants.AddressZero;

//       const maxLoan = await pool.maxFlashLoan(unsupportedToken);
//       expect(maxLoan).to.equal(0);
//     });
//   });

//   describe('flashFee', function () {
//     it('should return 0 for the supported token', async () => {
//       const amount = 100;

//       const fee = await pool.flashFee(pool.token(), amount);
//       expect(fee).to.equal(0);
//     });

//   });

//   describe('Test',function(){
//     it('should revert when attempting emergencyExit without governance rights', async () => {
//         // const [deployer, user1] = accounts;
//         const c1 = reciever.address;
      
//         await expect(pool.emergencyExit(c1)).to.be.revertedWith('CallerNotGovernance');
//       });

//     it('should emit a maxFlashLoan event when maxFlashLoan is called', async () => {
//         const [one] = await ethers.getSigners();
      
//         const tx = await pool.maxFlashLoan(pool.token());
//         const events = await pool.queryFilter(pool.MaxFlashLoan, null, null);
//         expect(events.length).to.equal(1); // Check if one event was emitted
//       });

//     it('should emit FundsDrained event when emergencyExit is called', async function () {
//         const receiver = addr1.address;
    
//         await token.transfer(pool.address, ethers.utils.parseEther('10'));
        
//         await expect(pool.connect(deployer).emergencyExit(receiver))
//           .to.emit(pool, 'FundsDrained');
//       });
      
//   });

// });
