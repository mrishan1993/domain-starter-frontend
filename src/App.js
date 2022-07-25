import React, {useEffect, useState} from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers, providers } from "ethers";
import contractAbi from './utils/contractABI.json';
// At the very top of the file, after the other imports
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const tld = '.batman'; 

const App = () => {
	const [currentAccount, setCurrentAccount] = useState("")
	const [editing, setEditing] = useState(false);
  	const [loading, setLoading] = useState(false);
	const [mints, setMints] = useState([]);
	const [domain, setDomain] = useState("")
	const [record, setRecord] = useState("")
	const [network, setNetwork] = useState("")
	const connectWallet = async () => {
		const {ethereum} = window
		try {
			if (!ethereum) {
				alert("Get Metamask --> https://metamask.io")
				return
			} 
			const accounts = await ethereum.request({method: "eth_requestAccounts"})
			console.log("Connected : ", accounts[0])
			setCurrentAccount(accounts[0])
		} catch (error) {
			console.error("Error: ", error)
		}
		const chainID = await ethereum.request({method: "eth_chainId"})
		setNetwork(networks[chainID])
		ethereum.on('chainChanged', handleChainChanged)
	}
	const handleChainChanged = (_chainID) => {
		window.location.reload()
	}
	const checkIfWalletIsConnected = async () => {
		const {ethereum} = window;
		if (!ethereum) {
			console.log("Please install Metamask");
			return;
		} else {
			console.log("We have the ethereum object");
		}
		const accounts = await ethereum.request({method: "eth_accounts"})
		if (accounts.length !== 0) {
			const account = accounts[0]
			console.log("Found an authorized account :", account);
			setCurrentAccount(account);
		} else {
			console.log("No authorized account found");
		}
	}

	const fetchMints = async () => {
		try {
			const {ethereum} = window
			if (ethereum) {
				const provider = await ethers.providers.Web3Provider(ethereum)
				const signer = await provider.getSigner()
				const contract = await ethers.Contract("0x93Dd61871e1467f63919774fB998d456F705A391", contractAbi.abi, signer)
				const names = await contract.getAllNames()
				const mintRecords = await Promise.all(names.map(async (name) => {
					const mintRecord = await contract.records(name)
					const owner = await contract.domains(name)
					return {
						id: names.indexOf(name),
						name: name,
						record: mintRecord,
						owner: owner
					}
				}))
				console.log("Mint fetched ", mintRecords)
				setMints(mintRecords)
			}
		} catch (error) {
			console.log("Error at ", error)
		}
	}
	useEffect ( () => {
		if (network == "Polygon Mumbai Testnet") {
			fetchMints()
		}
	}, [currentAccount, network])
	const renderNotConnectedContainer = () => {
		return (
			<div className="connect-wallet-container">
				<img src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif" alt="Ninja gif" />
				<button onClick={connectWallet} className="cta-button connect-wallet-button">
					Connect Wallet
				</button>
			</div>
		)
	}
	const updateDomain = async () => {
		if (!record || !domain) {
			return
		}
		setLoading(true)
		console.log("Updating domain ", domain, " with record ", record)
		try {
			const {ethereum} = window
			if (ethereum) {
				const provider = await ethers.providers.Web3Provider(ethereum)
				const signer = await provider.getSigner()
				const contract = new ethers.Contract("0x93Dd61871e1467f63919774fB998d456F705A391", contractAbi.abi, signer)
				let transaction = await contract.setRecord(domain, record)
				await transaction.wait()
				console.log("Record set ", transaction.hash)
				fetchMints("")
				setRecord("")
				setDomain("")
			}
		} catch (error) {
			console.error("Error ", error)
		}
		setLoading(false)
	}
	const switchNetwork = async () => {
		if (window.ethereum) {
			try {
				await window.ethereum.request({
					method: "wallet_switchEthereumChain",
					params: [{chainId: "0x13881"}]
				})
			} catch (error) {
				if (error.code == 4902) {
					try {
						await window.ethereum.request({
							method: "wallet_addEthereumChain",
							params: [{
								chainId: "0x13881",
								chainName: "Polygon Mumbai Testnet",
								rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
								nativeCurrency: {
									name: "Mumbai Matic",
									symbol: "MATIC",
									decimals: 18
								},
								blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
							}]
						})
					} catch(error) {
						console.error("Error at ", error)
					}
				}
			}
		} else {
			alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		}
	}
	const editRecord = (name) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
	}
	const renderInputForm = () =>{
	
	
		return (
		  <div className="form-container">
			<div className="first-row">
			  <input
				type="text"
				value={domain}
				placeholder='domain'
				onChange={e => setDomain(e.target.value)}
			  />
			  <p className='tld'> {tld} </p>
			</div>
	
			<input
			  type="text"
			  value={record}
			  placeholder='whats ur ninja power?'
			  onChange={e => setRecord(e.target.value)}
			/>
			  {/* If the editing variable is true, return the "Set record" and "Cancel" button */}
			  {editing ? (
				<div className="button-container">
				  
				  <button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
					Set record
				  </button>  
				  <button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
					Cancel
				  </button>  
				</div>
			  ) : (
				// If editing is not true, the mint button will be returned instead
				<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
				  Mint
				</button>  
			  )}
		  </div>
		);
	  }
	const mintDomain = async () => {
		if (!domain) {
			return
		}
		if (domain.length < 3 ) {
			alert("Domain name must be more than 2 characters")
			return 
		}
		const price = domain.length === 3 ? '0.05' : domain.length === 4 ? "0.03" : "0.01"
		console.log("Minting domain ", domain, "with price ", price)
		try {
			const {ethereum} = window
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const contract = new ethers.Contract("0x93Dd61871e1467f63919774fB998d456F705A391", contractAbi.abi, signer)
				console.log("Going to pop wallet to pay gas")
				let transaction = await contract.register(domain, {value: ethers.utils.parseEther(price)})
				const receipt = await transaction.wait()
				if (receipt.status == 1) {
					console.log("Domain minted! at ", transaction.hash)
					transaction = await contract.setRecord(domain, record)
					console.log("Record set : ", transaction.hash)
					setTimeout(() => {
						fetchMints();
					}, 2000);
					setDomain("")
					setRecord("")
				} else {
					console.log("Transaction failed! ")
				}
			}
		} catch(error) {
			console.error ("error at : ", error)
		}
	}
	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
		  return (
			<div className="mint-container">
			  <p className="subtitle"> Recently minted domains!</p>
			  <div className="mint-list">
				{ mints.map((mint, index) => {
				  return (
					<div className="mint-item" key={index}>
					  <div className='mint-row'>
						<a className="link" href={`https://testnets.opensea.io/assets/mumbai/0x93Dd61871e1467f63919774fB998d456F705A391/${mint.id}`} target="_blank" rel="noopener noreferrer">
						  <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
						</a>
						{/* If mint.owner is currentAccount, add an "edit" button*/}
						{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
						  <button className="edit-button" onClick={() => editRecord(mint.name)}>
							<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
						  </button>
						  :
						  null
						}
					  </div>
				<p> {mint.record} </p>
			  </div>)
			  })}
			</div>
		  </div>);
		}
	  };
	useEffect (() => {
		checkIfWalletIsConnected()
	}, [])

  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
            <div className="left">
              <p className="title">🐱‍👤 Ninja Name Service</p>
              <p className="subtitle">Your immortal API on the blockchain!</p>
            </div>
			<div className="right">
				<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
				{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
			</div>
					</header>
			</div>
			{!currentAccount &&renderNotConnectedContainer()}
			{currentAccount && renderInputForm()}
        <div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built with @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;
