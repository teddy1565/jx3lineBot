const mysql = require("promise-mysql");
const lineBot = require("@line/bot-sdk");
const fs = require("fs");
/**
 * lineBOT負責顯示錯誤訊息在LOG的Handler
 * @param {{errorPoint:string,errorActivity:string,expectedActivity:string,detailMessage:string|Array.<string>}} param0 
 * @member errorPoint 發生的錯誤點
 * @member errorActivity 錯誤的行為
 * @member expectedActiveity 預期的行為
 * @member detailMessage 詳細的訊息
 */
function lineWebhookErrorMessageHandler({errorPoint="",errorActivity="",expectedActivity="",detailMessage=""}){
    console.log("[lineBOT Webhook]:");
    console.log(`Wrong point: ${errorPoint}`);
    console.log(`Wrong activity: ${errorActivity}`);
    console.log(`Expected activity:${expectedActivity}`);
    console.log(`Detail message:`);
    if(!Array.isArray(detailMessage)){
        console.log(detailMessage);
    }else{
        for(let i in detailMessage)console.log(detailMessage[i]);
    }
}

/**
 * 取得linebot,database...等設定檔
 * @requires module:fs fileSystem module
 * @param {{errorMessageHandler:function,fileSystem:fs,configPath:Array.<string>,lineConfigPath:string,dbConfigPath:string,defaultSetupPathMode:boolean,resultKey:Array.<string>}} param0 
 * @member errorMessageHandler 提示錯誤訊息的callback
 * @member fileSystem nodeJS fileSystem module
 * @member configPath 多個設定檔的路徑
 * @member lineConfigPath 單一個line設定檔路徑
 * @member dbConfigPath 單一個database設定檔路徑
 * @member defaultSetupPathMode 查找Config的模式
 * @member resultKey 多個設定檔的Key陣列
 * @returns {object|false} 回傳一個物件，可以透過解構賦值 若回傳false代表操作失敗
 */
function getConfig({errorMessageHandler=lineWebhookErrorMessageHandler,fileSystem=fs,configPath=["./lineConfig.json","./dbConfig.json"],lineConfigPath="./lineConfig.json",dbConfigPath="./dbConfig.json",defaultSetupPathMode=true,resultKey=["lineConfig","dbConfig"]}){
    let result = {};
    if(defaultSetupPathMode){
        result.lineConfig = JSON.parse(fileSystem.readFileSync(lineConfigPath));
        result.dbConfig = JSON.parse(fileSystem.readFileSync(dbConfigPath));
    }else{
        if(!Array.isArray(configPath)){
            errorMessageHandler({errorPoint:"Function:setup",errorActivity:`傳入setup的configPath的型態為${typeof(configPath)}`,expectedActivity:"configPath型態應該為Array",detailMessage:["configPath與resultKey兩者長度必須相同，並且鍵值對應","e.g. configPath[0]<=>resultKey[0]"]});
            return false;
        }
        if(!Array.isArray(resultKey)){
            errorMessageHandler({errorPoint:"Function:setup",errorActivity:`傳入setup的resultKey的型態為${typeof(configPath)}`,expectedActivity:"resultKey型態應該為Array",detailMessage:["resultKey與configPath兩者長度必須相同，並且鍵值對應","e.g. configPath[0]<=>resultKey[0]"]});
            return false;
        }
        if(configPath.length!=resultKey.length){
            errorMessageHandler({errorPoint:"Function:setup",errorActivity:"傳入setup的configPath與resultKey兩者長度不一",expectedActivity:"configPath與resultKey兩者長度相同，並且鍵值對應",detailMessage:["e.g. configPath[0]<=>resultKey[0]",configPath,resultKey]});
            return false;
        }
        for(let i in configPath){
            result[resultKey[i]] = JSON.parse(fileSystem.readFileSync(configPath[i]));
        }
    }
    return result;
}
/**
 * 取得訊息來源的型態
 * @param {{errorMessageHandler:function,lineRequest:JSON}} param0 
 * @member errorMessageHandler 錯誤訊息callback
 * @member lineRequest line伺服器發送的request中的JSON
 * @returns {string|false} 回傳source.type 若回傳false則代表操作失敗
 */
function getMessageSourceType({errorMessageHandler=lineWebhookErrorMessageHandler,lineRequest}){
    let type;
    try{
        type = lineRequest.events[0].source.type
    }catch{
        errorMessageHandler({errorPoint:"function: getMessageSourceType",errorActivity:"接收的資料中可能未包含events[0].source.type",expectedActivity:"資料中應該包含events[0].source.type"});
        return false;
    }
    return type;
}
/**
 * 取得發送訊息的使用者ID
 * @param {{errorMessageHandler:function,lineRequest:JSON}} param0 
 * @member errorMessageHandler 錯誤訊息callback
 * @member lineRequest line伺服器發送的request中的JSON
 * @returns {string|false} 回傳source.userId 若回傳false則代表操作失敗
 */
function getUserID({errorMessageHandler=lineWebhookErrorMessageHandler,lineRequest}){
    let userId;
    try{
        userId = lineRequest.events[0].source.userId;
    }catch{
        errorMessageHandler({errorPoint:"function: getUserID",errorActivity:"接收的資料中可能未包含events[0].source.userId",expectedActivity:"資料中應該包含events[0].source.userId"});
        return false;
    }
    return userId;
}
/**
 * 取得發送訊息的群組ID
 * @param {{errorMessageHandler:function,lineRequest:JSON}} param0 
 * @member errorMessageHandler 錯誤訊息callback
 * @member lineRequest line伺服器發送的request中的JSON
 * @returns {string|false} 回傳source.groupId 若回傳false則代表操作失敗
 */
function getGroupID({errorMessageHandler=lineWebhookErrorMessageHandler,lineRequest}){
    let groupId;
    try{
        groupId = lineRequest.events[0].source.groupId;
    }catch{
        errorMessageHandler({errorPoint:"function: getGroupID",errorActivity:"接收的資料中可能未包含events[0].source.groupId",expectedActivity:"資料中應該包含events[0].source.groupId"});
        return false;
    }
    return groupId;
}
/**
 * 取得發送訊息的多人聊天室ID
 * @param {{errorMessageHandler:function,lineRequest:JSON}} param0 
 * @member errorMessageHandler 錯誤訊息callback
 * @member lineRequest line伺服器發送的request中的JSON
 * @returns {string|false} 回傳source.roomId 若回傳false則代表操作失敗
 */
function getRoomID({errorMessageHandler=lineWebhookErrorMessageHandler,lineRequest}){
    let roomId;
    try{
        roomId = lineRequest.events[0].source.roomId;
    }catch{
        errorMessageHandler({errorPoint:"function: getRoomID",errorActivity:"接收的資料中可能未包含events[0].source.roomId",expectedActivity:"資料中應該包含events[0].source.roomId"});
        return false;
    }
    return roomId;
}
/**
 * 取得發送訊息的文本
 * @param {{errorMessageHandler:function,lineRequest:JSON,type:string}} param0 
 * @member errorMessageHandler 錯誤訊息callback
 * @member lineRequest line伺服器發送的request中的JSON
 * @member type lineRequest.events[0].source.type
 * @returns {string|boolean} 回傳source.userId 若回傳false則代表操作失敗 若回傳true代表操作成功但是沒有其它結果
 */
function getMessageContext({errorMessageHandler=lineWebhookErrorMessageHandler,lineRequest,type}){
    if(type=="text"){
        let result;
        try{
            result = lineRequest.events[0].message.text;
            return result;
        }catch{
            errorMessageHandler({errorPoint:"function: getMessageContext",errorActivity:"接收的資料中可能未包含events[0].message.text",expectedActivity:"資料中應該包含events[0].message.text"});
            return false;
        }
    }
    return true;
}
/**
 * 取得回覆的token，replyToken有時效性
 * @param {{errorMessageHandler:function,lineRequest:JSON}} param0 
 * @member errorMessageHandler 錯誤訊息callback
 * @member lineRequest line伺服器發送的request中的JSON
 * @returns {string|false} 回傳replyToken 若回傳false則代表操作失敗
 */
function getReplyToken({errorMessageHandler=lineWebhookErrorMessageHandler,lineRequest}){
    let result;
    try{
        result = lineRequest.events[0].replyToken;
    }catch{
        errorMessageHandler({errorPoint:"function: getReplyToken",errorActivity:"接收的資料中可能未包含events[0].replyToken",expectedActivity:"資料中應該包含events[0].replyToken"});
        return false;
    }
    return result;
}
/**
 * 將JSON(字串) 正規化後寫入database(SQL)
 * e.g. `UPDATE \`temp_001\`.\`${schema}\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
 * @param {JSON} data 
 * @returns {string} 正規化後的JSON字串 能夠寫入database
 */
function regexJSONtoSQL(data){
    let result = "";
    for(let i in data){
        if(data[i]=='"'){
            result = result+`\\"`;
            continue;
        }
        result = result+data[i];
    }
    return result;
}
/**
 * 因為使用`${variable}`所以有可能被injection attack
 * 這是一個嘗試過濾非法字元的函式
 * @param {string} messageContext 未過濾的line訊息文本
 * @returns {string} 過濾後的字串
 */
function injectionCheck(messageContext){
    let str = messageContext.split(/[\#\$\;\*\&\`\+\'\"\/]|\=\>(?=.)|\#/);
    let result = "";
    for(let i in s){
        result = result+str[i];
    }
    return result;
}

function getGuestConfig({HttpRequest}){

}
function checkGuest(){

}



const {lineConfig,dbConfig} = getConfig();
const lineBOT = new lineBot.Client(lineConfig);

exports.route = (req,res)=>{

};