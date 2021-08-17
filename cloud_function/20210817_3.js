const line = require("@line/bot-sdk");
const mysql = require("promise-mysql");
let lineConfig = {
	channelSecret:"57a20a46c34367c8c836dea780fc0b3b",
	channelAccessToken:"f5FATQ1yc49uDXte+ahJ7N4HDEMBJno732p3vJ+un9szQ/0sI7D5PqU/Y5D8tqWRYGsrcuz6SzERcX2Id8dH/AN8dqyUyKhYnxJUm/xz+IXP1pA0GxiXOjCVCNWW0rpQJUlISC2UfkqUpKpZ2x9PFwdB04t89/1O/w1cDnyilFU="
};
let lineBOT = new line.Client(lineConfig);
let dbConfig = {
	user: "webSiteConfigProvidesService", // e.g. 'my-db-user'
	password: "Fmrd5339", // e.g. 'my-db-password'
	database: "temp_001", // e.g. 'my-database'
	socketPath: `/cloudsql/marine-lodge-321009:asia-east1:dev-001`
}

function getMessageType(param){
	let result = false;
	try{
		result = param.events[0].source.type;
	}catch{
		result = false;
	}
	return result;
}
function getMessageContextType(param){
	let result = false;
	try{
		result = param.events[0].message.type;
	}catch{
		result = false;
	}
	return result;
}
function getUserID(param){
	let result = false;
	try{
		result = param.events[0].source.userId;
	}catch{
		result = false;
	}
	return result;
}
function getGroupID(param){
	let result = false;
	try{
		result = param.events[0].source.roomId;
	}catch{
		result = false;
	}
	return result;
}
function getReplyToken(param){
	let result = false;
	try{
		result = param.events[0].replyToken;
	}catch{
		result = false;
	}
	return result;
}
function getMessageContext(param,type){
	let result = undefined;
	if(type=="text"){
		try{
			result = param.events[0].message.text;
		}catch{
			result = undefined;
		}
	}
	return result;
}
async function handler(req,res){
	let queryPool = await mysql.createPool(dbConfig);
	let msgType = getMessageType(req.body);
        if(msgType=="user"){
                let UID = getUserID(req.body);
		let queryString = `SELECT \`UID\` FROM \`temp_001\`.\`user\` WHERE \`UID\` = "${UID}"`;
		let SQLResult = await queryPool.query(queryString);
		try{
			if(SQLResult.length==0){
				let replyMessage = {
					type:'text',
					text:"尚未註冊，無法啟用服務\n目前開發中，尚未啟用註冊功能"
				}
				res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
			}else{
				/*分析訊息*/
				let replyMessage = {
					type:'text',
					text:`帳號辨識成功`
				}
				res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
			}
		}catch{
			res.status(200).send();
			return 0;
		}
        }else if(msgType=="room"){
                let GID = getGroupID(req.body);
		res.status(200).send();
        }else{
                res.status(200).send();
        }
	queryPool.end();
}
exports.route = (req,res)=>{
	handler(req,res);
};
