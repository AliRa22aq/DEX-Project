import './App.css';
import React, { useEffect, useState } from "react"
import Web3 from "web3";
import { ERC20Basic as ERC20BasicType } from '../types/web3-v1-contracts/ERC20Basic'
import { DEX as DEXType } from '../types/web3-v1-contracts/DEX'
const ERC20ABI = require("./abis/ERC20Basic.json");
const DEXABI = require("./abis/DEX.json");


interface DataType {
  userAddress: string,
  ERCToken: ERC20BasicType | null,
  DEXContract: DEXType | null
  loading: boolean
  DEXAddress: string | null,
  approvedTokens: number,
  userBalance: { ethers: number, tokens: number }
  dexBalance: { ethers: number, tokens: number },
  updateBalance: boolean
}

function App() {

  const [data, setData] = useState<DataType>({
    userAddress: "",
    ERCToken: null,
    DEXContract: null,
    loading: false,
    DEXAddress: null,
    approvedTokens: 0,
    userBalance: { ethers: 0, tokens: 0 },
    dexBalance: { ethers: 0, tokens: 0 },
    updateBalance: false
  });

  window.ethereum.on('accountsChanged', function (accounts: string[]) {
    setData(pre => { return { ...pre, userAddress: accounts[0] } })
  })


  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      console.log(window.web3.currentProvider.isMetaMask)

      // Get current logged in user address
      const accounts = await window.web3.eth.getAccounts()
      setData(pre => { return { ...pre, userAddress: accounts[0] } })
      console.log(accounts[0])

    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };

  const loadBlockchainData = async () => {

    setData(pre => { return { ...pre, loading: true } })
    const web3 = new Web3(window.ethereum);

    // Detect which Ethereum network the user is connected to
    let networkId = await web3.eth.net.getId()
    const DEXData = DEXABI.networks[networkId]

    // setData(pre => { return { ...pre, DEXContractAddress: DEXData.address } })

    // Load Contract Data
    const DEXContract = (new web3.eth.Contract(DEXABI.abi, DEXData.address) as any) as DEXType;

    setData(pre => { return { ...pre, DEXContract: DEXContract, DEXAddress: DEXData.address } })

    const accounts = await window.web3.eth.getAccounts()

    const TOKENinDEX = await DEXContract.methods.token().call()
    console.log(" Token address in DEX ", TOKENinDEX)

    const ERCTokenContract = (new web3.eth.Contract(ERC20ABI.abi, TOKENinDEX) as any) as ERC20BasicType;
    console.log(ERCTokenContract)

    setData(pre => { return { ...pre, ERCToken: ERCTokenContract } })


    // Checking balances
    let userbalance = await web3.eth.getBalance(accounts[0]);
    let userbalanceInEth = web3.utils.fromWei(userbalance.toString(), "ether")
    console.log("User has Eths", userbalanceInEth)

    const userTokenbalance = await ERCTokenContract.methods.balanceOf(accounts[0]).call()
    const userTokenbalanceInEth = web3.utils.fromWei(userTokenbalance.toString(), "ether")
    console.log("User has Tokens ", userTokenbalanceInEth)

    const newUserBalance = {
      ethers: Number(userbalanceInEth),
      tokens: Number(userTokenbalanceInEth)
    }

    let DEXBalance = await web3.eth.getBalance(DEXData.address);
    let DEXBalanceInEth = web3.utils.fromWei(DEXBalance.toString(), "ether")
    console.log("DEX has Eths", DEXBalanceInEth)

    const DEXTokenBalance = await ERCTokenContract.methods.balanceOf(DEXData.address).call()
    const DEXTokenBalanceInEth = web3.utils.fromWei(DEXTokenBalance.toString(), "ether")
    console.log("DEX has ERC Tokens ", DEXTokenBalanceInEth)

    const newDexBalance = {
      ethers: Number(DEXBalanceInEth),
      tokens: Number(DEXTokenBalanceInEth)
    }

    const allownce = await ERCTokenContract.methods.allowance(accounts[0], DEXData.address).call()
    const allownceInEth = web3.utils.fromWei(allownce.toString(), "ether")

    setData(pre => {
      return {
        ...pre,
        approvedTokens: Number(allownceInEth),
        userBalance: newUserBalance,
        dexBalance: newDexBalance
      }
    })

    setData(pre => { return { ...pre, loading: false } })

  };


  const buyTokens = async () => {
    const web3 = new Web3(window.ethereum);
    await data?.DEXContract?.methods.buy().send({ from: data.userAddress, value: web3.utils.toWei("0.1", "ether") })
      .on("confirmation", (confirmationNumber: any, receipt: any) => {
        alert("Purchase successful")
        setData(pre => { return { ...pre, updateBalance: true } })
        console.log(confirmationNumber)
        console.log(receipt)
      })
  }

  const approveToSell = async () => {
    const web3 = new Web3(window.ethereum);
    if (data?.DEXAddress) {
      await data?.ERCToken?.methods.approve(data.DEXAddress, web3.utils.toWei("0.1", "ether")).send({ from: data.userAddress })
        .on("confirmation", (confirmationNumber: any, receipt: any) => {
          alert("Approval successful")
          setData(pre => { return { ...pre, updateBalance: true } })
          console.log(confirmationNumber)
          console.log(receipt)
        })
    }
  }

  const refuseToSell = async () => {
    const web3 = new Web3(window.ethereum);
    if (data?.DEXAddress) {
      await data?.ERCToken?.methods.approve(data.DEXAddress, web3.utils.toWei("0", "ether")).send({ from: data.userAddress })
        .on("confirmation", (confirmationNumber: any, receipt: any) => {
          alert("Approval successful")
          setData(pre => { return { ...pre, updateBalance: true } })
          console.log(confirmationNumber)
          console.log(receipt)
        })
    }
  }

  // const checkAllownce = async () => {
  //   const web3 = new Web3(window.ethereum);

  //   if (data?.DEXAddress && data.userAddress) {
  //     let allownce = await data?.ERCToken?.methods.allowance(data.userAddress, data?.DEXAddress).call()
  //     if (allownce) {
  //       allownce = web3.utils.fromWei(allownce, "ether")
  //       setData(pre => { return { ...pre, approvedTokens: Number(allownce) } })
  //     }
  //   }
  // }

  const sellTokens = async () => {
    const web3 = new Web3(window.ethereum);

    await data?.DEXContract?.methods.sell(web3.utils.toWei(String(data.approvedTokens), "ether"))
      .send({ from: data.userAddress })
      .on("confirmation", (confirmationNumber: any, receipt: any) => {
        alert("Sold successfully")
        setData(pre => { return { ...pre, updateBalance: true } })
        console.log(confirmationNumber)
        console.log(receipt)
      })
  }

  // const updateAllBalance = async () => {

  //   const web3 = new Web3(window.ethereum);
  //   if (data.DEXAddress && data.userAddress && data.ERCToken) {
  //     // Checking balances
  //     let userbalance = await web3.eth.getBalance(data.userAddress);
  //     let userbalanceInEth = web3.utils.fromWei(userbalance.toString(), "ether")
  //     console.log("User has Eths", userbalanceInEth)

  //     const userTokenbalance = await data?.ERCToken.methods.balanceOf(data.userAddress).call()
  //     const userTokenbalanceInEth = web3.utils.fromWei(userTokenbalance.toString(), "ether")
  //     console.log("User has Tokens ", userTokenbalanceInEth)

  //     const newUserBalance = {
  //       ethers: Number(userbalanceInEth),
  //       tokens: Number(userTokenbalanceInEth)
  //     }

  //     let DEXBalance = await web3.eth.getBalance(data.DEXAddress);
  //     let DEXBalanceInEth = web3.utils.fromWei(DEXBalance.toString(), "ether")
  //     console.log("DEX has Eths", DEXBalanceInEth)

  //     const DEXTokenBalance = await data.ERCToken.methods.balanceOf(data.DEXAddress).call()
  //     const DEXTokenBalanceInEth = web3.utils.fromWei(DEXTokenBalance.toString(), "ether")
  //     console.log("DEX has ERC Tokens ", DEXTokenBalanceInEth)

  //     const newDexBalance = {
  //       ethers: Number(DEXBalanceInEth),
  //       tokens: Number(DEXTokenBalanceInEth)
  //     }

  //     const allownce = await data.ERCToken.methods.allowance(data.userAddress, data.DEXAddress).call()
  //     const allownceInEth = web3.utils.fromWei(allownce.toString(), "ether")

  //     setData(pre => {
  //       return {
  //         ...pre,
  //         approvedTokens: Number(allownceInEth),
  //         userBalance: newUserBalance,
  //         dexBalance: newDexBalance
  //       }
  //     }
  //     )
  //   }
  // }


  useEffect(() => {
    loadWeb3()
  }, [])

  // useEffect(() => {
  //   updateAllBalance()
  // }, [data.updateBalance])


  useEffect(() => {
    if (data.userAddress) {
      loadBlockchainData()
    }
  }, [data.userAddress, data.updateBalance])





  return (
    <div className="App">
      <h2> Decentralized Exchange </h2>
      <br />

      {
        data.userAddress ?
          <div>You are login with Address: {data.userAddress}</div> :
          <>
            <div>Please Signin to Metamask</div>
            <br />
            <button onClick={() => loadWeb3()}> Connect </button>
            <br />
            <br />
          </>
      }

      <br />

      <div>
        User's Balance: <b>{data.userBalance.ethers}</b> ETHs  <b>{data.userBalance.tokens}</b> ERCs
      </div>

      <br />


      <div>
        DEX's Balance:  <b>{data.dexBalance.ethers}</b> ETHs <b>{data.dexBalance.tokens}</b> ERCs
      </div>

      <br />
      <br />
      <br />

      {
        data.dexBalance.tokens ?
          <div>
            Buy <b>0.1</b> ERC Tokens
            <br />
            <button disabled={data.dexBalance.tokens > 0 ? false : true} onClick={buyTokens}> Buy </button>
          </div> : null
      }

      < br />

      {
        data.approvedTokens > 0 ?
          <div>
            Refuse <b>0.1</b> ERCs to sell to DEX
            <br />
            <button onClick={refuseToSell}> Refuse </button>
          </div> :
          <div>
            Approve <b>0.1</b> ERCs to sell to DEX
            <br />
            <button disabled={data.userBalance.tokens < 0.1 ? true : false} onClick={approveToSell}> Approve </button>
          </div>
      }

      < br />

      <div>
        you have <b>{data.approvedTokens}</b> ERCs Approved to sell to DEX
        <br />
        <button disabled={data.approvedTokens > 0 ? false : true} onClick={sellTokens}> Sell </button>
      </div>

      < br />



    </div>
  );
}

export default App;
