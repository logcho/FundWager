import { createApp } from "@deroll/app";
import { createWallet } from "@deroll/wallet";
import { 
  Address,
  Hex,
  decodeFunctionData,
  getAddress,
  hexToString,
  stringToHex,
  numberToHex,
  parseAbi,
 } from "viem";

const app = createApp({url: process.env.ROLLUP_HTTP_SERVER_URL || "http://127.0.0.1:5004"});

const wallet = createWallet();
app.addAdvanceHandler(wallet.handler);

const token = "0x92C6bcA388E99d6B304f1Af3c3Cd749Ff0b591e2"; // change to real token upon deployment

interface Post {
  title: string;        
  description: string;    
  imageUrl: string;
  walletAddress: Address;   
}

const createPostReports = async (post: Post) => {
    await app.createReport({payload: stringToHex(post.title)});
    await app.createReport({payload: stringToHex(post.description)});
    await app.createReport({payload: stringToHex(post.imageUrl)});
    await app.createReport({payload: post.walletAddress});
};

const createPostNotices = async (post: Post) => {
  await app.createNotice({payload: stringToHex(post.title)});
  await app.createNotice({payload: stringToHex(post.description)});
  await app.createNotice({payload: stringToHex(post.imageUrl)});
  await app.createNotice({payload: stringToHex(post.walletAddress)});
};

var posts: Post[] = [];


// const abi = parseAbi([
//   "function transfer(address to, uint256 amount)",
//   "function createPost(string title, string description, string imageUrl)",
// ]);

// const inspectAbi = parseAbi([
//   "function getPost(address post)",
//   "function getAllPosts()",
// ]);

app.addAdvanceHandler( async ({metadata, payload}) => {
  const payloadString = hexToString(payload)
  console.log("payload:", payloadString)
  const jsonPayload = JSON.parse(payloadString)
  const sender = metadata.msg_sender
  console.log("sender : ", sender)

  // {"method":"createPost","title":"title1","description":"description1","imageUrl":".com","walletAddress":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"} 

  if (jsonPayload.method === "transfer"){ 
      const post = jsonPayload.address; 
      const amount = jsonPayload.amount;

      wallet.transferERC20(token, sender, post, amount);

      return "accept";
  }
  else if (jsonPayload.method ===  "createPost"){
      const post: Post = {
        title: jsonPayload.title,
        description: jsonPayload.description,
        imageUrl: jsonPayload.imageUrl,
        walletAddress: sender,
      };
      posts.push(post);
      console.log("Post added:", post); // Log the added post for confirmation
      
      await createPostNotices(post);

      return "accept"
  }
      

  return "reject";
})

app.addInspectHandler( async ({payload}) => {
  const url = hexToString(payload).split("/") // inspect/balance/address
  console.log("Inspect call:", url)
  const address = url[2]
  // const postsString = posts.map(post => {
  //   return `Title: ${post.title}, Description: ${post.description}, Image URL: ${post.imageUrl}, Wallet Address: ${post.walletAddress}`;
  // }).join(' | '); // Join all posts with a separator
  const post = posts.find(post => post.walletAddress === address);
  await app.createReport( {payload: stringToHex(post?.title || "not found")} )
  

      

      // await app.createReport({payload: stringToHex(postsString)});
      

})

app.start().catch((e) => {
  console.error(e);
  process.exit(1);
});