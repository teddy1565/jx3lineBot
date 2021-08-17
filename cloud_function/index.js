const line = require('@line/bot-sdk');
const mysql = require('promise-mysql');
let config = {
    channelSecret:"57a20a46c34367c8c836dea780fc0b3b",
    channelAccessToken:"f5FATQ1yc49uDXte+ahJ7N4HDEMBJno732p3vJ+un9szQ/0sI7D5PqU/Y5D8tqWRYGsrcuz6SzERcX2Id8dH/AN8dqyUyKhYnxJUm/xz+IXP1pA0GxiXOjCVCNWW0rpQJUlISC2UfkqUpKpZ2x9PFwdB04t89/1O/w1cDnyilFU="
}
let lineClient = new line.Client(config);

let dbConfig = {
    user: "webSiteConfigProvidesService", // e.g. 'my-db-user'
    password: "Fmrd5339", // e.g. 'my-db-password'
    database: "temp_001", // e.g. 'my-database'
    // If connecting via unix domain socket, specify the path
    socketPath: `/cloudsql/marine-lodge-321009:asia-east1:dev-001`
}


function getReplyToken(param){
  return param.events[0].replyToken;
}
function getMessageType(param){
  return param.events[0].source.type;
}
function getMessageContent(param){
  return param.events[0].message;
}
function getMessageText(param){
  if(param.type=="text"){
    return param.text;
  }else{
    return false;
  }
}
function parseMsgText(msgType,param){
  param = param.split(" ")[1];
  if(param=="help"&&msgType=="room"){
      let context = "預計開發功能:\n"+
      "1.幫會日常提醒\n"+
      "2.幫會公告\n"+
      "3.幫會成員名單\n"+
      "4.預約活動\n"+
      "5.活動到期提醒\n"+
      "6.其他";
      return context;
  }else if(param=="help"&&msgType=="user"){
      let context = "預計開發功能:\n"+
      "1.RL黑名單\n"+
      "2.活動預約提醒\n"+
      "3.幣值轉換器\n"+
      "4.小本本\n"+
      "5.其他";
      return context;
  }else{
    let context="目前正在開發中....";
    return context;
  }
}
function commandCheck(msg){
  msg = msg.split(" ");
  if(msg[0]!="小幫手")return false;
  let commandList = ["help","info"];
  for(let i in commandList){
    if(commandList[i]==msg[1]){
      return true
    }
  }
  return false;
}
async function handler(res,token,webhookResponse){
  let response = await lineClient.replyMessage(token,webhookResponse);
  res.json(response);
}
exports.route = (req, res) => {
  let token = getReplyToken(req.body);
  let msgType = getMessageType(req.body);
  let msgContent = getMessageContent(req.body);
  let msgText = getMessageText(msgContent);
  if(!commandCheck(msgText)){
    res.status(200).send();
    return 0;
  }
  msgText = parseMsgText(msgType,msgText);
  if(token){
      if(msgType=="user"&&msgText!=false){
          let webhookResponse = {
            type:"text",
            text:`${msgText}`
          }
          handler(res,token,webhookResponse);
      }else if(msgType=="room"&&msgText!=false){
          let webhookResponse = {
            type:"text",
            text:`${msgText}`
          }
          handler(res,token,webhookResponse);
      }
  }else{
      res.status(200).send();
  }
};

