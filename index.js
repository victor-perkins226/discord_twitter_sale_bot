const solanaWeb3 = require('@solana/web3.js');
const { Connection, programs } = require('@metaplex/js');
const axios = require('axios');
const twit = require('twit');
const Jimp = require("jimp");

require("dotenv").config();

// MongoDB
const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_HOST
const CONSUMER_KEY = process.env.CONSUMER_KEY
const CONSUMER_SECRET = process.env.CONSUMER_SECRET

mongoose.connect(mongoUri);
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${mongoUri}`)
})

const projectService = require('./services/project')
const marketplaceService = require('./services/marketplace')
const settingService = require('./services/setting');
const userService = require('./services/user');

const metaplexConnection = new Connection('mainnet-beta');
const { metadata: { Metadata } } = programs;
const pollingInterval = 10000; // ms

const runSalesBot = async () => {
    console.log("starting sales bot...");

    let settings;
    let marketplaces;
    let projects;
    let users;

    let signaturesMap;
    let lastKnownSignatures = {};
    let optionsMap = {};
    let SOLANA_RPC_URL;
    let solanaConnection;
    let twitterConfig = {};

    while (true) {
        try {
            settings = JSON.parse(JSON.stringify(await settingService.findAll())).data;
            marketplaces = JSON.parse(JSON.stringify(await marketplaceService.findAll())).data;
            projects = JSON.parse(JSON.stringify(await projectService.findAllActivated())).data;
            users = JSON.parse(JSON.stringify(await userService.findMany({}))).data;

            if (settings.filter(value => value.key === "SOLANA_RPC_URL").length === 0) {
                console.log(`Please set "SOLANA_RPC_URL" in setting page`);
                await timer(pollingInterval);
                continue;
            }

            if (marketplaces.length === 0) {
                console.log(`Please add marketplace`);
                await timer(pollingInterval);
                continue;
            }

            if (projects.length === 0) {
                console.log(`Please add project`);
                await timer(pollingInterval);
                continue;
            }

            SOLANA_RPC_URL = settings.filter(value => value.key === "SOLANA_RPC_URL")[0].value;
            solanaConnection = new solanaWeb3.Connection(SOLANA_RPC_URL, 'confirmed');
            let totalLength = 0;
            signaturesMap = await Promise.all(
                projects.map(async project => {
                    let signatures = [];

                    if (project.creatorAddress1 !== '') {
                        const projectPubKey = new solanaWeb3.PublicKey(project.creatorAddress1);
                        const tempsign = await solanaConnection.getSignaturesForAddress(projectPubKey, optionsMap[project._id] === undefined ? { limit: 5 } : optionsMap[project._id]);
                        signatures = [...signatures, ...tempsign];
                    }
                    if (project.creatorAddress2 !== '') {
                        const projectPubKey = new solanaWeb3.PublicKey(project.creatorAddress2);
                        const tempsign = await solanaConnection.getSignaturesForAddress(projectPubKey, optionsMap[project._id] === undefined ? { limit: 5 } : optionsMap[project._id]);
                        signatures = [...signatures, ...tempsign];
                    }
                    if (project.creatorAddress3 !== '') {
                        const projectPubKey = new solanaWeb3.PublicKey(project.creatorAddress3);
                        const tempsign = await solanaConnection.getSignaturesForAddress(projectPubKey, optionsMap[project._id] === undefined ? { limit: 5 } : optionsMap[project._id]);
                        signatures = [...signatures, ...tempsign];
                    }
                    if (project.creatorAddress4 !== '') {
                        const projectPubKey = new solanaWeb3.PublicKey(project.creatorAddress4);
                        const tempsign = await solanaConnection.getSignaturesForAddress(projectPubKey, optionsMap[project._id] === undefined ? { limit: 5 } : optionsMap[project._id]);
                        signatures = [...signatures, ...tempsign];
                    }
                    if (project.creatorAddress5 !== '') {
                        const projectPubKey = new solanaWeb3.PublicKey(project.creatorAddress5);
                        const tempsign = await solanaConnection.getSignaturesForAddress(projectPubKey, optionsMap[project._id] === undefined ? { limit: 5 } : optionsMap[project._id]);
                        signatures = [...signatures, ...tempsign];
                    }

                    totalLength += signatures.length
                    return {
                        project,
                        signatures
                    }
                })
            )

            if (totalLength === 0) {
                console.log("polling...")
                await timer(pollingInterval);
                continue;
            }
        } catch (err) {
            console.log("error fetching signatures: ", err);
            continue;
        }

        for (let j = 0; j < signaturesMap.length; j++) {
            let sMap = signaturesMap[j];
            const signatures = sMap['signatures']
            const sProject = sMap['project']
            let count = 1;
            if (signatures.length === 0) { continue; }
            for (let i = signatures.length - 1; i >= 0; i--) {
                console.log("i: ", i)
                try {
                    let { signature } = signatures[i];
                    const txn = await solanaConnection.getTransaction(signature);
                    if (txn === null) { continue; }
                    if (txn.meta && txn.meta.err != null) { continue; }

                    const accounts = txn.transaction.message.accountKeys;
                    const marketplaceAccount = accounts[accounts.length - 1].toString();

                    let marketplaceMap = {}

                    sProject.marketplaces.map(temp => {
                        marketplaces.map(elem => {
                            if (temp._id === elem._id) {
                                marketplaceMap[elem.address] = elem.name
                            }
                        })
                    })

                    if (marketplaceMap[marketplaceAccount]) {
                        const mintAddress = txn.meta.postTokenBalances[0].mint;
                        // const metadata = await getMetadata(mintAddress);
                        getMetadata(mintAddress).then(async metadata => {
                            if (!metadata) {
                                console.log("couldn't get metadata");
                            } else {
                                try {
                                    const dateString = new Date(txn.blockTime * 1000).toLocaleString();
                                    const price = Math.abs((txn.meta.preBalances[0] - txn.meta.postBalances[0])) / solanaWeb3.LAMPORTS_PER_SOL;
                                    const coinRate = await axios.get(`https://api.coinbase.com/v2/exchange-rates`);
                                    const usdPrice = 1 / coinRate.data.data.rates['SOL'] * price;
                                    const sellerAddress = accounts[4].toString();
                                    const buyerAddress = txn.meta.postTokenBalances[0].owner;
                                    let website = marketplaces.filter(value => value.address === marketplaceAccount)[0].url;
                                    website = website === '' ? 'https://solscan.io/token/' : website;

                                    try {
                                        if (sProject.activeDiscord) {
                                            await axios.post(sProject.discordWebhookUrl,
                                                {
                                                    "embeds": [
                                                        {
                                                            "url": `${website}${mintAddress}`,
                                                            "title": `${metadata.name} has been sold!`,
                                                            "color": 3447003,
                                                            "fields": [
                                                                {
                                                                    "name": "Item",
                                                                    "value": `${metadata.name}`,
                                                                    "inline": false
                                                                },
                                                                {
                                                                    "name": "Price",
                                                                    "value": `${price.toFixed(2)} SOL`,
                                                                    "inline": true
                                                                },
                                                                {
                                                                    "name": "USD",
                                                                    "value": `\`$${usdPrice.toFixed(2)}\``,
                                                                    "inline": true
                                                                },
                                                                {
                                                                    "name": "Market",
                                                                    "value": `${marketplaceMap[marketplaceAccount]}`,
                                                                    "inline": true
                                                                },
                                                                {
                                                                    "name": "Seller",
                                                                    "value": `[${sellerAddress.substring(0, 5)} ... ${sellerAddress.substring(sellerAddress.length - 6, sellerAddress.length - 1)}](https://solscan.io/account/${sellerAddress})`,
                                                                    "inline": true
                                                                },
                                                                {
                                                                    "name": "Buyer",
                                                                    "value": `[${buyerAddress.substring(0, 5)} ... ${buyerAddress.substring(buyerAddress.length - 6, buyerAddress.length - 1)}](https://solscan.io/account/${buyerAddress})`,
                                                                    "inline": true
                                                                },
                                                                {
                                                                    "name": "Explorer",
                                                                    "value": `https://solscan.io/tx/${signature}`
                                                                }
                                                            ],
                                                            "image": {
                                                                "url": `${metadata.image}`,
                                                            },
                                                            "footer": {
                                                                "text": "Bot by YourNFTHub.com",
                                                            },
                                                        }
                                                    ]
                                                },
                                                {
                                                    headers: {
                                                        'X-RateLimit-Limit': 1000,
                                                        'X-RateLimit-Remaining': 1,
                                                        'X-RateLimit-Reset-After': 1,
                                                        'X-RateLimit-Reset': Date.now(),
                                                    }
                                                }
                                            )
                                        }
                                    } catch (e) {
                                        console.log('Discord Error', e)
                                    }

                                    try {
                                        if (sProject.activeTwitter) {
                                            const twitterUser = users.filter(ele => ele.screen_name === sProject.twitterUserScreenName)[0]
                                            // OAuth 1.0a (User context)
                                            const twitterClient = new twit({
                                                consumer_key: CONSUMER_KEY,
                                                consumer_secret: CONSUMER_SECRET,
                                                // Following access tokens are not required if you are
                                                // at part 1 of user-auth process (ask for a request token)
                                                // or if you want a app-only client (see below)
                                                access_token: twitterUser.oauth_token,
                                                access_token_secret: twitterUser.oauth_token_secret,
                                            });
                                            // const twitterClient = new TwitterApi('AAAAAAAAAAAAAAAAAAAAANYxagEAAAAAgSI%2BfUca6OwwLBpgNJ7%2FBVq5PrE%3DPetVrsHVX4HyrVD7yZQn9N6xpyWZHYseSlKV5LvqbV4DlbIIKU');

                                            const tweetText = `${metadata.name} sold for ${price.toFixed(2)} SOL ($${usdPrice.toFixed(2)}) on ${marketplaceMap[marketplaceAccount]}\n\n${website}${mintAddress}\n`
                                            // const processedImage = await getBase64(metadata.image)

                                            const processedImage = await new Promise((resolve, reject) => {
                                                Jimp.read(metadata.image, function (err, img) {
                                                    if (err) throw reject(err);
                                                    img.resize(300, 300).getBuffer(Jimp.AUTO, function (e, img64) {
                                                        if (e) throw reject(e);

                                                        resolve(img64.toString('base64'))
                                                    });
                                                });
                                            })

                                            const mediaPromise = await new Promise((resolve, reject) => {
                                                twitterClient.post('media/upload', { media_data: processedImage }, (error, media, response) => {
                                                    if (!error) {
                                                        twitterClient.post('statuses/update',
                                                            {
                                                                status: tweetText,
                                                                media_ids: [media.media_id_string]
                                                            },
                                                            (error, tweet, response) => {
                                                                if (!error) {
                                                                    resolve(tweet)
                                                                } else {
                                                                    reject(error)
                                                                }
                                                            });
                                                    } else {
                                                        reject(error)
                                                    }
                                                })
                                            });

                                            console.log("user", mediaPromise)
                                        }
                                    } catch (e) {
                                        console.log('Twitter Error', e)
                                    }
                                    console.log("count", count++);

                                    printSalesInfo(dateString, price, signature, metadata.name, marketplaceMap[marketplaceAccount], metadata.image);

                                } catch (e) {
                                    console.log(e)
                                }
                            }
                        })
                    } else {
                        console.log("not a supported marketplace sale");
                    }
                } catch (err) {
                    if (err.response) {
                        if (err.response.status === 429) {
                            console.log("Too many request.")
                            await delay(2000);
                            i++;
                            continue;
                        }
                    }

                    console.log("error while going through signatures: ", err);
                    continue;
                }
            }

            const lastKnownSignature = signatures[0].signature;
            if (lastKnownSignature) {
                lastKnownSignatures[sProject._id] = lastKnownSignature;
                let options = {}
                options.until = lastKnownSignature;
                optionsMap[sProject._id] = options
            } else {
                optionsMap[sProject._id] = {}
            }
        }

    }
}
runSalesBot();

const printSalesInfo = (date, price, signature, title, marketplace, imageURL) => {
    console.log("-------------------------------------------")
    console.log(`Sale at ${date} ---> ${price} SOL`)
    console.log("Signature: ", signature)
    console.log("Name: ", title)
    console.log("Image: ", imageURL)
    console.log("Marketplace: ", marketplace)
}

const timer = ms => new Promise(res => setTimeout(res, ms))

const getMetadata = async (tokenPubKey) => {
    try {
        const addr = await Metadata.getPDA(tokenPubKey)
        const resp = await Metadata.load(metaplexConnection, addr);
        const { data } = await axios.get(resp.data.data.uri);

        return data;
    } catch (error) {
        console.log("error fetching metadata: ", error)
    }
}


// Format a provided URL into it's base64 representation
function getBase64(url) {
    return axios.get(url, { responseType: 'arraybuffer' }).then(response => Buffer.from(response.data, 'binary').toString('base64'))
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
