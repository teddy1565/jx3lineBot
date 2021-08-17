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
	return param.events[0].source.type;
}
function getUserID(param){
	return param.events[0].source.userId;
}
function getGroupID(param){
	return param.events[0].source.roomId;
}
function getReplyToken(param){
	return param.events[0].replyToken;
}
async function handler(req,res){
	let queryPool = await mysql.createPool(dbConfig);
	let msgType = getMessageType(req.body);
        if(msgType=="user"){
                let UID = getUserID(req.body);
		let SQLResult = await queryPool.query(`SELECT \`UID\` FROM \`temp_001\`.\`user\` WHERE \`UID\`=\"?\"`,[UID]);
		console.log(SQLResult);
		let replyMessage = {
			type:'text',
			text:`${SQLResult}`
		}
		res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
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
