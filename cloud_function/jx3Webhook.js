const line = require("@line/bot-sdk");
const mysql = require("promise-mysql");
const fs = require("fs");
const lineBOT_version = "v0.6.1";
let lineConfig = JSON.parse(fs.readFileSync("./lineAPIconfig.json"));
let lineBOT = new line.Client(lineConfig);
let dbConfig = JSON.parse(fs.readFileSync("./dbConfig.json"));

function getMessageType(param){
	let result = false;
	try{
		result = param.events[0].source.type;
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
		result = param.events[0].source.roomId||param.events[0].source.groupId;
	}catch{
		result = false;
	}
	return result;
}
function getMessageContext(param,type){
	let result="";
	if(type=="text"){
		try{
			result = param.events[0].message.text;
		}catch{
			result = undefined;
		}
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
function getReplyToken(param){
	let result = false;
	try{
		result = param.events[0].replyToken;
	}catch{
		result = false;
	}
	return result;
}
function configToJSON(data){
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
function planeParentheses(str,param="default"){
    let result = "";
    if(param=="default"){
        str = str.split(/[\[\]\{\}\(\)]/);
        for(let i in str){
            result = result+str[i];
        }
    }else if(param=="middle"){
        str = str.split(/[\[\]]/);
        for(let i in str){
            result = result+str[i];
        }
    }else if(param=="large"){
        str = str.split(/[\{\}]/);
        for(let i in str){
            result = result+str[i];
        }
    }else if(param=="small"){
        str = str.split(/[\(\)]/);
        for(let i in str){
            result = result+str[i];
        }
    }
    return result;
}
function injectionCheck(str){
    let s = str.split(/[\#\$\;\*\&\`\+\'\"\/]|\=\>(?=.)|\#/);
    let result = "";
    for(let i in s){
        result = result+s[i];
    }
    return result;
}
function queryStrGenerator(schema,jsonStr,info){
    let queryStr = `UPDATE \`temp_001\`.\`${schema}\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    return queryStr;
}
function matchParamStr(source,target){
    if(Array.isArray(target)){
        for(let i in target){
            if(source==target[i])return true;
        }
       return false
    }else if(!Array.isArray(target)){
        if(source==target)return true;
    }
    return false;
}
function sendActiveMessage(httpApiResponse,token,message,time=10000){
    async function echo(){
        let reply = await lineBOT.pushMessage(token,message,message);
        httpApiResponse.json(reply);
    }
    setTimeout(echo,time);
}
/**
 * 分析指令進行操作
 * @param context {string} line訊息文本
 * @param info {object} line使用者或群組資訊物件
 * @returns {string} 回覆的訊息
 */
async function operator(context,info,sourceType="room"){
    let schemaName="room";
    if(sourceType=="group"||sourceType=="Group")schemaName="Group";
    for(let i in context){
        context[i] = injectionCheck(context[i]);
    }
	let config = info["Config"];
	try{
		config = JSON.parse(config)
		try{
			config = JSON.parse(config);
		}catch{
			console.log("config不需要二次解析");
		}
	}catch{
		console.log("config is obj");
	}
	console.log(context);
    const commandsLists = ["改名","幫助","機器人資訊","註冊","群組資訊","小本本","日常活動","活動提醒","信使","成員管理","指令列表","權限管理"];
    if(matchParamStr(context[1],[`${commandsLists[0]}`,"rename"])){
        if(context[2].length<2)return "改名失敗";
        let queryPool = await mysql.createPool(dbConfig);
        config.keyWord = context[2];
        try{
            let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
            console.log(result);
        }catch{
            console.log("改名 DB操作失敗");
            queryPool.end();
            return "改名失敗";
        }
        queryPool.end();
        return "好的！好的！我叫"+context[2];
    }else if(matchParamStr(context[1],[`${commandsLists[1]}`,"help","指令說明"])){
        let document = {
            "改名":"指令名稱:[改名]\n\n說明:\n更改機器人名字\n\n範例:\n[機器人名稱] 改名 [想改的名字]\n\n替換指令:[rename]",
            "註冊":"指令名稱:[註冊]\n\n說明:\n在尚未註冊的情況下，註冊群組資訊\n\n範例:\n[機器人名稱] 註冊 [幫會名稱]\n\n替換指令:[regis]",
            "幫助":"指令名稱:[幫助]\n\n說明:\n取得使用說明及指令參數\n\n範例:\n[機器人名稱] 幫助 [想查詢的指令]\n\n替換指令:[help|指令說明]",
            "小本本":"指令名稱:[小本本]\n\n說明:\n打本小本本\n\n範例:\n[機器人名稱] 小本本 新增 { [玩家ID],[玩家UID],[職業],[副本],[原因] }\n\n替換指令:[黑名單|BlackList]\n\n子指令集:\n[新增,查詢,刪除]\n\n若要查詢子指令用法，請輸入:\n\n[機器人名稱] help 小本本>[子指令集]",
            "小本本>新增":"指令名稱:[小本本]\n\n子指令:[新增]\n\n說明:\n可以新增紀錄用以查詢黑名單\n\n範例:\n[機器人名稱] 小本本 新增 玩家ID,玩家UID,職業,副本,原因\n\n備註:\n資訊可以空白但','逗號不可省略\n\n子指令替換指令:[ add | note | 紀錄]",
            "小本本>查詢":"指令名稱:[小本本]\n\n子指令:[查詢]\n\n說明:\n可以查詢玩家是否登錄在黑名單\n\n範例:\n[機器人名稱] 小本本 查詢 玩家ID,[玩家UID,[職業,[副本,[原因]]]] [參數]\n\n備註:\n玩家ID以外的資訊可以留白\n詳細說明往後補上\n正常情況下建議直接使用:\n\n[機器人名稱] 小本本 查詢 玩家ID\n\n子指令替換指令:[query]",
            "小本本>刪除":"指令名稱:[小本本]\n\n子指令:[刪除]\n\n說明:\n可以刪除已經登錄在冊的玩家\n\n範例:\n[機器人名稱] 小本本 刪除 玩家ID,[玩家UID,[副本,] [參數]\n\n備註:\n玩家ID以外的資訊可以留白\n詳細說明往後補上\n正常情況下建議直接使用:\n\n[機器人名稱] 小本本 刪除 玩家ID\n\n子指令替換指令:[ delete|-d|-D ]",
            "黑名單":"指令名稱:[黑名單]\n\n說明:\n打本黑名單\n\n範例:\n[機器人名稱] 黑名單 新增 { [玩家ID],[玩家UID],[職業],[副本],[原因] }\n\n替換指令:[小本本|BlackList]\n\n子指令集:\n[新增|查詢|刪除]\n\n若要查詢子指令用法，請輸入:\n\n[機器人名稱] help 黑名單>[子指令集]",
            "黑名單>新增":"指令名稱:[黑名單]\n\n子指令:[新增]\n\n說明:\n可以新增紀錄用以查詢黑名單\n\n範例:\n[機器人名稱] 黑名單 新增 玩家ID,玩家UID,職業,副本,原因\n\n備註:\n資訊可以空白但','逗號不可省略\n\n子指令替換指令:[ add | note | 紀錄]",
            "黑名單>查詢":"指令名稱:[黑名單]\n\n子指令:[查詢]\n\n說明:\n可以查詢玩家是否登錄在黑名單\n\n範例:\n[機器人名稱] 黑名單 查詢 玩家ID,[玩家UID,[職業,[副本,[原因]]]] [參數]\n\n備註:\n玩家ID以外的資訊可以留白\n詳細說明往後補上\n正常情況下建議直接使用:\n\n[機器人名稱] 黑名單 查詢 玩家ID\n\n子指令替換指令:[query]",
            "黑名單>刪除":"指令名稱:[黑名單]\n\n子指令:[刪除]\n\n說明:\n可以刪除已經登錄在冊的玩家\n\n範例:\n[機器人名稱] 黑名單 刪除 玩家ID,[玩家UID,[副本,] [參數]\n\n備註:\n玩家ID以外的資訊可以留白\n詳細說明往後補上\n正常情況下建議直接使用:\n\n[機器人名稱] 黑名單 刪除 玩家ID\n\n子指令替換指令:[ delete|-d|-D ]",
            "群組資訊":"指令名稱:[群組資訊]\n\n說明:\n取得此群組的相關資訊\n\n範例:\n[機器人名稱] 群組資訊\n\n替換指令:[GroupInfo]",
            "成員管理":"指令名稱:[成員管理]\n\n說明:\n操作幫會成員名單\n\n範例:\n[機器人名稱] 成員管理 [子指令] [參數]\n\n替換指令:[HR]\n\n備註:\n目前只有名單記錄功能\n將來可能結合權限系統管理\n\n子指令集:\n[新增|查詢|刪除|列表]\n\n若要查詢子指令集用法請輸入:\n[機器人名稱] help 成員管理>[新增|查詢|刪除|列表]",
            "成員管理>新增":"指令名稱:[成員管理]\n\n子指令名稱:[新增]\n\n說明:\n新增幫會成員\n\n範例:\n[機器人名稱] 成員管理 新增 [暱稱] [玩家ID]\n\n替換指令:[add]",
            "成員管理>刪除":"指令名稱:[成員管理]\n\n子指令名稱:[刪除]\n\n說明:\n刪除幫會成員，未輸入參數情況下\n請直接輸入暱稱即可\n\n範例:\n[機器人名稱] 成員管理 刪除 [暱稱|玩家ID] [參數]\n\n替換指令:[delete]\n\n參數:\n\n1.[--all]:輸入玩家ID，清除此ID所有相關資料\n2.[--gameId]:輸入玩家ID，並只刪除此遊戲ID，不清除其他資料",
            "成員管理>查詢":"目前正在開發中",
            "成員管理>列表":"目前正在開發中"
        }
        for(let i in document){
            if(`${i}`==context[2]){
                return document[i];
            }
        }
        let message = "使用說明:\n"+
                    "所有的指令間皆以空格區隔，比如說:\n"+
                    "   阿巴阿巴 改名 ODO\n\n"+
                    "指令解析:\n"+
                    "  [觸發關鍵字] [指令] [參數]\n\n"+
                    "如果要取得可用指令列表請輸入:\n"+
                    "  [觸發關鍵字] 指令列表\n\n"+
                    "如果要取得個別指令說明請輸入:\n"+
                    "  [觸發關鍵字] 幫助 [想查詢的指令]";
        return message;
    }else if(matchParamStr(context[1],[`${commandsLists[2]}`,"BOTinfo"])){
        let message = "資訊(2021/08/18)\n"+
                    "小助手主要用途為:\n"+
                    "1.協助管理幫會群組\n"+
                    "2.提供類似於個人秘書服務\n\n"+
                    "預計開發功能(針對群組):\n"+
                    "1.幫會活動預約提醒\n"+
                    "2.幫會群組成員管理\n"+
                    "3.幫會開本管理\n"+
                    "4.小本本\n"+
                    "5.其他功能(e.g. 幫會間不同群組傳送訊息....)\n\n"+
                    "預計開發功能(針對個人):\n"+
                    "1.活動提醒\n"+
                    "2.小本本\n"+
                    "3.玩家之間送信(e.g. 可以直接輸入遊戲ID發送訊息給同樣有使用此功能的玩家)\n"+
                    "4.其他功能....\n\n"+
                    "作者:TeddyXiong[墨老技師]\n"+
                    "協作者:[諾冬雪]\n"+
                    "如果有其他建議，歡迎聯繫通知\n\n"+
                    `機器人版本:${lineBOT_version}`;
        return message;
    }else if(matchParamStr(context[1],[`${commandsLists[3]}`,"regis"])){
        if(context[2].length<2)return "註冊失敗";
        let queryPool = false;
        try{
            queryPool = await mysql.createPool(dbConfig);
        }catch{
            console.log("資料庫連線初始化失敗");
            return "註冊失敗"
        }
        /* 重複使用到的字串，修改字串可以直接改變機器人種類 */
        let configKey="groupName";
        console.log(config);
        if(config[configKey]!=undefined){
            if(context[3]!="覆蓋"&&context[3]!="-cover"&&context[3]!="重新註冊"&&context[3]!="reset"&&context[3]!="-r"&&context[3]!="-R"){
                let msg = "此群組已經註冊過了，請勿重新註冊\n如果確定要重新註冊，請輸入:\n  "+`${config["keyWord"]||"阿巴阿巴"} 註冊 ${context[2]} -R`;
                queryPool.end();
                return msg;
            }
        }
        config[configKey] = context[2];
        try{
            let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
            console.log(result);
        }catch{
            console.log("query faild");
            queryPool.end();
            return "註冊失敗";
        }
        queryPool.end();
        return "群組註冊成功！";
    }else if(matchParamStr(context[1],[`${commandsLists[4]}`,"GroupInfo","幫會資訊"])){
        let configKey = "groupName";
        if(config[configKey]==undefined){
            return "請先註冊群組資訊";
        }
        let msg = `幫會名稱:${config[configKey]}`;
        return msg;
    }else if(matchParamStr(context[1],[`${commandsLists[5]}`,"黑名單","BlackList","blacklist"])){
        let configKey="BlackList";
        let keyWords = ["ID","UID","職業","副本","原因"];
        let objkeyWords = ["id","uid","profession","instancedungeon","cause"];
        if(config[configKey]==undefined)config[configKey] = [];
        if(context[2]=="紀錄"||context[2]=="note"||context[2]=="新增"||context[2]=="add"){
            if(context[3]==undefined)return "請輸入參數\n\ne.g.\n[機器人名稱] 新增 [玩家ID],[玩家UID],[玩家職業],[副本],[原因]\n\n備註:\n逗號(,)不可省略，請使用半型逗號\n\n範例指令:\n[機器人名稱] 小本本 新增\n[玩家ID],[UID(可省略)],[職業(可省略)],[副本(可省略)],[原因(可省略)]";
            let target = context[3].split(",");
            if(target.length!=5){
                return "格式錯誤請重新輸入\n\n提示:\n1.請使用半型逗號\n2.逗號請勿省略\n3.輸入格式依照順序分別為\n[玩家ID],[玩家UID],[職業],[副本],[原因]";
            }
            let queryPool = await mysql.createPool(dbConfig);
            for(let i in target){
                target[i] = planeParentheses(target[i]);
            }
            let userObj = {};
            for(let i in target){
                userObj[objkeyWords[i]] = target[i];
            }
            config[configKey].push(userObj);
            try{
                let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                console.log(result);
            }catch{
                queryPool.end();
                return "小本本新增失敗";
            }
            queryPool.end();
            return "新增成功!\n["+userObj[objkeyWords[0]]+"]\n已加入黑名單";
        }else if(context[2]=="查詢"||context[2]=="query"){
            if(context[3]==undefined)return `請輸入參數\n\ne.g.\n\n[機器人名稱] 小本本 查詢 [${keyWords[0]}]`
            let target = context[3];
            target = target.split(',');
            if(target.length>5)return "格式錯誤請重新輸入";
            for(let i in target){
                target[i] = planeParentheses(target[i]);
            }
            if(context[4]==keyWords[0]){
                let response = [];
                let responseStr = "";
                for(let i in config[configKey]){
                    for(let j in target){
                        if(config[configKey][i][objkeyWords[0]]==target[j]){
                            response.push(config[configKey][i]);
                        }
                    }
                }
                for(let i in response){
                    responseStr = responseStr+`第${parseInt(i)+1}筆:\n${keyWords[0]}:${response[i][objkeyWords[0]]}\n${keyWords[1]}:${response[i][objkeyWords[1]]}\n${keyWords[2]}:${response[i][objkeyWords[2]]}\n${keyWords[3]}:${response[i][objkeyWords[3]]}\n${keyWords[4]}:${response[i][objkeyWords[4]]}\n\n`;
                }
                responseStr = responseStr+"查詢結束！";
                return responseStr;
            }else if(context[4]==keyWords[1]){
                let response = [];
                let responseStr = "";
                for(let i in config[configKey]){
                    for(let j in target){
                        if(config[configKey][i][objkeyWords[1]]==target[j]){
                            response.push(config[configKey][i]);
                        }
                    }
                }
                for(let i in response){
                    responseStr = responseStr+`第${parseInt(i)+1}筆:\n${keyWords[0]}:${response[i][objkeyWords[0]]}\n${keyWords[1]}:${response[i][objkeyWords[1]]}\n${keyWords[2]}:${response[i][objkeyWords[2]]}\n${keyWords[3]}:${response[i][objkeyWords[3]]}\n${keyWords[4]}:${response[i][objkeyWords[4]]}\n\n`;
                }
                responseStr = responseStr+"查詢結束！";
                return responseStr;
            }else if(context[4]==keyWords[2]||matchParamStr(context[4],["-P","-p","--profession","Profession"])){
                let response = [];
                let responseStr = "";
                for(let i in config[configKey]){
                    for(let j in target){
                        if(config[configKey][i][objkeyWords[2]]==target[j]){
                            response.push(config[configKey][i]);
                        }
                    }
                }
                for(let i in response){
                    responseStr = responseStr+`第${parseInt(i)+1}筆:\n${keyWords[0]}:${response[i][objkeyWords[0]]}\n${keyWords[1]}:${response[i][objkeyWords[1]]}\n${keyWords[2]}:${response[i][objkeyWords[2]]}\n${keyWords[3]}:${response[i][objkeyWords[3]]}\n${keyWords[4]}:${response[i][objkeyWords[4]]}\n\n`;
                }
                responseStr = responseStr+"查詢結束！";
                return responseStr;
            }else if(context[4]==keyWords[3]||matchParamStr(context[4],["-I","-i","instanceDungeon","instancedungeon","MAP"])){
                let response = [];
                let responseStr = "";
                for(let i in config[configKey]){
                    for(let j in target){
                        if(config[configKey][i][objkeyWords[3]]==target[j]){
                            response.push(config[configKey][i]);
                        }
                    }
                }
                for(let i in response){
                    responseStr = responseStr+`第${parseInt(i)+1}筆:\n${keyWords[0]}:${response[i][objkeyWords[0]]}\n${keyWords[1]}:${response[i][objkeyWords[1]]}\n${keyWords[2]}:${response[i][objkeyWords[2]]}\n${keyWords[3]}:${response[i][objkeyWords[3]]}\n${keyWords[4]}:${response[i][objkeyWords[4]]}\n\n`;
                }
                responseStr = responseStr+"查詢結束！";
                return responseStr;
            }else if(context[4]==keyWords[4]||matchParamStr(context[4],["cause","Cause","-C","-c"])){
                let response = [];
                let responseStr = "";
                for(let i in config[configKey]){
                    for(let j in target){
                        if(config[configKey][i][objkeyWords[4]]==target[j]){
                            response.push(config[configKey][i]);
                        }
                    }
                }
                for(let i in response){
                    responseStr = responseStr+`第${parseInt(i)+1}筆:\n${keyWords[0]}:${response[i][objkeyWords[0]]}\n${keyWords[1]}:${response[i][objkeyWords[1]]}\n${keyWords[2]}:${response[i][objkeyWords[2]]}\n${keyWords[3]}:${response[i][objkeyWords[3]]}\n${keyWords[4]}:${response[i][objkeyWords[4]]}\n\n`;
                }
                responseStr = responseStr+"查詢結束！";
                return responseStr;
            }else{
                target = planeParentheses(context[3]);
                let responseStr="此人在黑名單紀錄中!!\n\n";
                let result=[];
                let counter = 1;
                for(let i in config[configKey]){
                    if(config[configKey][i][objkeyWords[0]]==target){
                        result.push(`第${counter}筆紀錄:\n${keyWords[0]}:${config[configKey][i][objkeyWords[0]]}\n${keyWords[1]}:${config[configKey][i][objkeyWords[1]]}\n${keyWords[2]}:${config[configKey][i][objkeyWords[2]]}\n${keyWords[3]}:${config[configKey][i][objkeyWords[3]]}\n${keyWords[4]}:${config[configKey][i][objkeyWords[4]]}\n\n`);
                    }
                }
                if(result.length==0)return "此人不在黑名單紀錄中，若有疑慮請確認查詢格式是否正確";
                else{
                    for(let i in result){
                        responseStr=responseStr+`${result[i]}`;
                    }
                    responseStr = responseStr+"查詢結束!!";
                    return responseStr;
                }
            }
        }else if(context[2]=="刪除"||context[2]=="-D"||context[2]=="-d"||context[2]=="--delete"||context[2]=="delete"){
            if(context[3]==undefined)return `請輸入參數\n\ne.g.\n\n[機器人名稱] 小本本 刪除 [${keyWords[0]}] [參數(可省略)]`;
            let target = context[3].split(",");
            if(target.length>1&&context[4]==undefined)return "格式錯誤請重新輸入\n\n提示:\n\n1.格式為: [機器人名稱] 小本本 刪除 [玩家ID] [參數(可省略)]\n\n2.參數詳細使用可以輸入:\n\n[機器人名稱] 幫助 小本本>刪除";
            if(context[4]==keyWords[1]||matchParamStr(context[4],["-U","-u","--UID"])){
                let updateArr = [];
                let uid = target.length==1?target[0]:target[1];
                uid = planeParentheses(uid);
                for(let i in config[configKey]){
                    if(config[configKey][i][objkeyWords[1]]!=uid){
                        updateArr.push(config[configKey][i]);
                    }
                }
                config[configKey]=updateArr;
            }else if(context[4]==keyWords[3]||matchParamStr(context[4],["instancedungeon","-i","-I"])){
                let updateArr = [];
                let instancedungeon = (()=>{
                    if(target.length==1)return target[0];
                    else if(target.length==2)return target[1];
                    else if(target.length==3)return target[2];
                    else if(target.length==4)return target[2];
                    else return target[4];
                })()
                instancedungeon = planeParentheses(instancedungeon);
                for(let i in config[configKey]){
                    if(config[configKey][i][objkeyWords[3]]!=instancedungeon){
                        updateArr.push(config[configKey][i]);
                    }
                }
                config[configKey]=updateArr;
            }else if(context[4]==undefined||context[4]==keyWords[0]||matchParamStr(context[4],["id","--id","--ID"])){
                let updateArr = [];
                let id = target.length==1?target[0]:target[1];
                id = planeParentheses(id);
                for(let i in config[configKey]){
                    if(config[configKey][i][objkeyWords[0]]!=id){
                        updateArr.push(config[configKey][i]);
                    }
                }
                config[configKey]=updateArr;
            }
            let queryPool = await mysql.createPool(dbConfig);
            try{
                let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                console.log(result);
            }catch{
                queryPool.end();
                return "小本本刪除失敗!";
            }
            queryPool.end();
            return "小本本刪除成功";
        }
        return "請問要做什麼呢？\n參數:[新增|查詢|刪除]";
    }else if(matchParamStr(context[1],[`${commandsLists[6]}`,"dailyWork"])){
        return "目前正在開發中～";
    }else if(matchParamStr(context[1],[`${commandsLists[7]}`,"活動預約","預約","reserve","Reserve"])){
        return "目前正在開發中～";
    }else if(matchParamStr(context[1],[`${commandsLists[8]}`,"Mail","訊息","message","mail"])){
        return "目前正在開發中!";
        if(context[2]=="send"||context[2]=="Send"||context[2]=="-s"||context[2]=="-S"||context[2]=="發送"){
            /**目前正在開發中 */
        }
    }else if(matchParamStr(context[1],[`${commandsLists[9]}`,"memberManagment","membermanagment","HR","人事管理"])){
        let keyWords=["暱稱","ID"];
        let objkeyWords = ["nickName","gameId","authority"];
        let configKey = "memberManagment";
        if(matchParamStr(context[2],["新增權限","--add-level","--add-managment","--add-Authority","--add-authority"])){
            if(context[3]==undefined)return `請輸入${keyWords[0]}`;
            else if(context[4]==undefined) return "請輸入參數";
            let searchMode = false;
            if(matchParamStr(context[5],[`--with-${objkeyWords[1]}`]))searchMode=true;
            let user = [];
            let frameMark = 0;
            if(searchMode){
                for(let i in config[configKey]){
                    let flag = false;
                    for(let j in config[configKey][i][objkeyWords[1]][j]){
                        if(config[configKey][i][objkeyWords[1]][j]==context[3]){
                            user = config[configKey][i];
                            flag = true;
                            frameMark = i;
                            break;
                        }
                    }
                    if(flag)break;
                }
            }else{
                for(let i in config[configKey]){
                    if(config[configKey][i][objkeyWords[0]]==context[3]){
                        user = config[configKey].splice(i,1);
                        frameMark = i;
                        break;
                    }
                }
            }
            if(user.length==0){
                console.log("查無此人，若有疑慮有確認指令格式");
                return "查無此人，若有疑慮請確認指令格式  "+frameMark;
            }else{
                user = user[0];
                if(user[objkeyWords[2]]==undefined){
                    user[objkeyWords[2]] = [];
                    user[objkeyWords[2]].push(context[4]);
                }else{
                    user[objkeyWords[2]].push(context[4]);
                }
                config[configKey].push(user);
            }
            let queryPool = await mysql.createPool(dbConfig);
            try{
                let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                console.log(result);
            }catch{
                console.log("新增權限失敗");
                queryPool.end()
                return "新增權限失敗";
            }
            queryPool.end();
            return "新增權限成功";
        }else if(matchParamStr(context[2],["刪除權限","移除權限","--remove-authority","--Remove-Authority"])){
            if(context[3]==undefined)return `請輸入${keyWords[0]}`;
            else if(context[4]==undefined)return "請輸入要移除的權限名稱";
            
            if(matchParamStr(context[5],["--remove-all","--all"])){
                for(let i in config[configKey]){
                    if(config[configKey][i][objkeyWords[0]]==context[3]){
                        config[configKey][i][objkeyWords[2]]=[];
                        break;
                    }
                }
                let queryPool = await mysql.createPool(dbConfig);
                try{
                    let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                    console.log(result);
                }catch{
                    console.log("刪除權限失敗001");
                    queryPool.end();
                    return "刪除權限失敗";
                }
                queryPool.end();
                return "刪除權限成功";
            }else{
                let result = [];
                for(let i in config[configKey]){
                    let flag = false;
                    if(config[configKey][i][objkeyWords[0]]==context[3]){
                        for(let j in config[configKey][i][objkeyWords[2]]){
                            if(config[configKey][i][objkeyWords[2]][j]==context[4]){
                                result = config[configKey][i][objkeyWords[2]].splice(j,1);
                                flag=true;
                                break;
                            }
                        }
                    }
                    if(flag)break;
                }
                if(result.length==0)return "雖然此人沒有此權限能夠被移除，但是操作成功";
                let queryPool = await mysql.createPool(dbConfig);
                try{
                    let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                    console.log(result);
                }catch{
                    console.log("權限刪除操作失敗002");
                    queryPool.end();
                    return "權限刪除失敗";
                }
                queryPool.end();
                return "權限刪除成功";
            }
        }else if(matchParamStr(context[2],["權限查詢","查詢權限","--query-authority","--Query-Authority","--query-Authority"])){
            if(context[3]==undefined)return `請輸入${keyWords[0]}`;
            let responseStr = "此人所擁有的權限:\n\n";
            let querylist = [];
            let flag =false;
            for(let i in config[configKey]){
                if(!config[configKey][i][objkeyWords[2]])continue;
                if(config[configKey][i][objkeyWords[0]]==context[3]){
                    for(let j in config[configKey][i][objkeyWords[2]]){
                        querylist.push(config[configKey][i][objkeyWords[2]][j]);
                    }
                    flag = true;
                    break;
                }
            }
            if(flag==false)return "查無此人，請重新確認輸入資訊";
            else if(querylist.length==0)return "此人沒有任何權限";
            for(let i in querylist){
                responseStr = responseStr+`${i+1}. ${querylist[i]}\n`;
            }
            responseStr = responseStr+"====查詢結束====";
            return responseStr;
        }else if(matchParamStr(context[2],["新增","add","Add","ADD","加入"])){
            if(context[3]==undefined)return `請輸入${keyWord[0]}(同一個群組內暱稱不可重複!)`;
            else if(context[4]==undefined)return `請輸入${keyWord[1]}`;
            if(config[configKey]==undefined)config[configKey]=[];
            let flag = false;
            for(let i in config[configKey]){
                if(config[configKey][i][objkeyWords[0]]==`${context[3]}`){
                    config[configKey][i][objkeyWords[1]].push(`${context[4]}`);
                    flag = true;
                    break;
                }
            }
            let queryPool = await mysql.createPool(dbConfig);
            if(flag){
                try{
                    let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                    console.log(result);
                }catch{
                    console.log("成員管理 新增功能 寫入失敗[001]");
                    queryPool.end();
                    return "新增失敗!";
                }
                queryPool.end();
                return "新增成功!";
            }else{
                let arr = [];
                arr.push(`${context[4]}`);
                let tempObj = {};
                tempObj[objkeyWords[0]]=`${context[3]}`;
                tempObj[objkeyWords[1]]=arr;
                config[configKey].push(tempObj);
                try{
                    let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                    console.log(result);
                }catch{
                    console.log("成員管理 新增功能 寫入失敗[002]");
                    queryPool.end();
                    return "新增失敗!";
                }
                queryPool.end();
                return "新增成功!";
            }
        }else if(matchParamStr(context[2],["刪除","--delete","--Delete","-d","-D","delete"])){
            if(context[3]==undefined)return `請輸入${keyWords[0]}或${keyWords[1]}`;
            let queryPool = await mysql.createPool(dbConfig);
            if(matchParamStr(context[4],[`--${objkeyWords[1]}`,"--gameId","--gameID"])){
                if(context[5]!=undefined){
                    queryPool.end();
                    return "格式錯誤";
                }
                for(let i in config[configKey]){
                    let flag = false;
                    for(let j in config[configKey][i][objkeyWords[1]]){
                        if(config[configKey][i][objkeyWords[1]][j]==context[3]){
                            config[configKey][i][objkeyWords[1]].splice(j,1);
                            flag=true;
                            break;
                        }
                    }
                    if(flag)break;
                }
                try{
                    let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                    console.log(result);
                }catch{
                    console.log("成員管理 刪除功能 --gameId參數 DB操作錯誤[001]");
                    queryPool.end();
                    return "操作失敗！";
                }
                queryPool.end();
                return "操作成功"
            }else if(context[4]=="--all"){
                if(context[5]==undefined){
                    for(let i in config[configKey]){
                        if(config[configKey][i][objkeyWords[0]]==context[3]){
                            config[configKey].splice(i,1);
                            break;
                        }
                    }
                    try{
                        let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                        console.log(result);
                    }catch{
                        console.log("成員管理 刪除功能 --all參數 DB操作錯誤[002]");
                        queryPool.end();
                        return "操作失敗!"
                    }
                    queryPool.end();
                    return "操作成功"
                }else if(matchParamStr(context[5],[`${objkeyWords[1]}`,"--gameId","--gameID"])){
                    for(let i in config[configKey]){
                        let flag = false;
                        for(let j in config[configKey][i][objkeyWords[1]]){
                            if(config[configKey][i][objkeyWords[1]][j]==context[3]){
                                config[configKey].splice(i,1);
                                flag = true;
                                break;
                            }
                        }
                        if(flag)break;
                    }
                    try{
                        let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                        console.log(result);
                    }catch{
                        console.log("成員管理 刪除功能 --all --gameId參數 DB操作失敗[003]");
                        queryPool.end();
                        return "操作失敗!";
                    }
                    queryPool.end();
                    return "操作成功!";
                }else{
                    queryPool.end();
                    return "格式錯誤";
                }
            }else if(context[4]==undefined){
                for(let i in config[configKey]){
                    if(config[configKey][i][objkeyWords[0]]==context[3]){
                        config[configKey].splice(i,1);
                        break;
                    }
                }
                try{
                    let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                    console.log(result);
                }catch{
                    console.log("成員管理 刪除功能 預設操作 DB操作失敗");
                    queryPool.end();
                    return "操作失敗";
                }
                queryPool.end();
                return "操作成功";
            }
            queryPool.end();
            return "格式錯誤，請重新確認格式";
        }else if(matchParamStr(context[2],["查詢","query","Query","-q","-Q"])){
            if(context[3]==undefined)return `請輸入${keyWords[0]}`;
            let result = [];
            if(matchParamStr(context[4],[`${objkeyWords[1]}`,"--gameId","--gameID"])){
                for(let i in config[configKey]){
                    let flag=false;
                    for(let j in config[configKey][i]){
                        if(config[configKey][i][objkeyWords[1]][j]==context[3]){
                            result.push(config[configKey][i]);
                            flag=true;
                            break;
                        }
                    }
                    if(flag)break;
                }
                if(result.length!=0){
                    let resultStr="";
                    let counter=0;
                    for(let i in result){
                        resultStr = resultStr+`第${counter++}筆資料:\n\n${keyWords[0]}:${result[i][objkeyWords[0]]}\n${keyWords[1]}:\n`;
                        let countter = 1;
                        for(let j in result[i]){
                            resultStr = resultStr+`${countter++}.${result[i][objkeyWords[1]][j]}\n`;
                        }
                        resultStr = resultStr+"\n";
                    }
                    resultStr = resultStr+"查詢完畢!";
                    return resultStr;
                }else{
                    return "查詢失敗!\n\n可能原因:\n1.資料集中沒有此資料\n2.查詢格式或語法錯誤";
                }
            }
            let resultStr = "查詢到此人資料:\n\n";
            for(let i in config[configKey]){
                if(config[configKey][i][objkeyWords[0]]==context[3]){
                    let target = config[configKey][i];
                    resultStr = resultStr+`${keyWords[0]}:${target[objkeyWords[0]]}\n\n${keyWords[1]}:\n`;
                    let counter = 1;
                    for(let j in target[objkeyWords[1]]){
                        resultStr = resultStr+`${counter++}. ${target[objkeyWords[1]][j]}\n`;
                    }
                    resultStr=resultStr+"\n查詢完畢!!";
                    return resultStr;
                }
            }
            return "查詢失敗!\n\n可能原因:\n1.資料集中沒有此資料\n2.查詢格式或語法錯誤";
        }else if(matchParamStr(context[2],["列表","list","List","--l","-l","-L"])){
            if(matchParamStr(context[4],[`--with-${objkeyWords[1]}`,"--with-gameId","--with-gameID","--with-GameId","--With-gameId","--With-gameID","--With-GameId"])){
                let resultStr="";
                let counter=1;
                for(let i in config[configKey]){
                    let countter=1;
                    resultStr = resultStr+`第${counter++}筆資料:\n\n${keyWords[0]}:${config[configKey][i][objkeyWords[0]]}\n\n${keyWords[1]}:\n`;
                    for(let j in config[configKey][i][objkeyWords[1]]){
                        resultStr = resultStr+`${countter++}. ${config[configKey][i][objkeyWords[1]][j]}\n`
                    }
                    resultStr = resultStr+"--------\n";
                }
                resultStr = resultStr+"\n查詢結束！";
                return resultStr;
            }else if(context[3]==undefined||matchParamStr(context[3],["--all","--All"])){
                let resultStr ="";
                let counter=1;
                for(let i in config[configKey]){
                    resultStr = resultStr+`第${counter++}筆資料:\n\n${keyWords[0]}:${config[configKey][i][objkeyWords[0]]}\n----------\n`;
                }
                resultStr = resultStr+`查詢完畢!!\n若要查詢包括${keyWords[1]}的所有訊息請輸入:\n\n${config.keyWord} 成員管理 列表 --all --with-${objkeyWords[1]}`;
                return resultStr;
            }
            return "查詢失敗!\n\n可能原因:\n1.資料集中沒有此資料\n2.查詢格式或語法錯誤";
        }
        return "請輸入操作參數:[新增|刪除|查詢|列表]";
    }else if(matchParamStr(context[1],[`${commandsLists[10]}`,"command-list","commandList","commandlist","man","commands"])){
        let resultStr="";
        let commands = {
                            "幫助":"取得指令用法",
                            "機器人資訊":"簡介此機器人",
                            "註冊":"註冊群組資訊，才能夠使用\n信使,成員管理..等功能",
                            "群組資訊":"取得此群組目前資訊",
                            "小本本":"打本小本本，可以方便迅速查詢及登陸黑名單",
                            "日常活動":"管理員能夠安排固定的幫會日常活動\n時間快到時能夠傳訊息提醒幫會成員",
                            "活動提醒":"管理員能夠預約臨時活動，當時間快到時通知參與者",
                            "信使":"能夠傳訊息給其他幫會的群組\n需要他們也有使用此BOT\n並且註冊正確的相關資訊",
                            "成員管理":"能夠管理此群組中的成員，類似於記事本。\n包括了權限管理系統",
                            "指令列表":"列出所有的功能，以及其功能簡述"
                        };
        for(let i in commands){
            resultStr = resultStr+`${i}:\n${commands[i]}\n\n`;
        }
        return resultStr;
    }else if(matchParamStr(context[1],[`${commandsLists[11]}`,"管理權限","authorityManagment","Authority","Authoritymanagment","authority"])){
        let configKey = "authorityManagmentControlCenter";
        let status = "controlCenterStatus";
        let content = "authorityInstance";
        let contentKey = ["authorityName","authorityPolicyContent"];
        if(config[configKey]==undefined&&matchParamStr(context[2],["啟用","啟用權限系統","true","on","open","setup"])){
            config[configKey]={};
            config[configKey][status]=true;
            config[configKey][content] = [];
            let queryPool = await mysql.createPool(dbConfig);
            try{
                let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                console.log(result);
            }catch{
                console.log("DB寫入失敗");
                queryPool.end();
                return "初始化權限系統失敗";
            }
            queryPool.end();
            return "初始化權限系統成功";
        }else if(config[configKey]==undefined&&(!matchParamStr(context[2],["啟用","啟用權限系統","true","on","open","setup"]))){
            return `尚未啟用權限系統，如果要啟用權限系統，請輸入:\n${config.keyWord} 權限管理 setup`;
        }
        function checkSysStatus(param=config[configKey][status]){
            if(param==false)return true;
            return false;
        }
        if(matchParamStr(context[2],["新增","add","ADD","Add"])){
            if(checkSysStatus())return `目前權限系統狀態為關閉，若要開啟，請輸入:\n${config.keyWord} 權限管理 enable`;
            if(context[3]==undefined)return "請輸入權限名稱";
            else if(context[4]==undefined)return "請輸入權限政策內容";
            let policy = context[4].split(",");
            let target = {};
            target[contentKey[0]]=context[3];
            target[contentKey[1]]=[];
            let frameMark=0;
            let flag = false;
            for(let i in config[configKey][content]){
                if(config[configKey][content][i][contentKey[0]]==undefined)continue;
                if(config[configKey][content][i][contentKey[0]]==content[3]){
                    target = config[configKey][content][i];
                    frameMark=i;
                    flag = true;
                    break;
                }
            }
            for(let i in policy){
                if(policy[i].length==0)continue;
                target[contentKey[1]].push(policy[i]);
            }
            target[contentKey[1]] = ((target)=>{
                let copy = target[contentKey[1]];
                try{
                    for(let i in copy){
                        let match = copy[i];
                        for(let j in copy){
                            if(j==i)continue;
                            if(copy[j]==match){
                                copy.splice(j,1);
                            }
                        }
                    }
                    console.log("權限內容排序func發生錯誤");
                    return copy;
                }catch{
                    return target;
                }
            })(target);
            if(flag==false){
                config[configKey][content].push(target);
            }else{
                config[configKey][content][frameMark] = target;
            }
            let queryPool = await mysql.createPool(dbConfig);
            try{
                let result = queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                console.log(result);
            }catch{
                console.log("權限管理 新增權限功能發生錯誤");
                queryPool.end();
                return "新增失敗";
            }
            queryPool.end();
            return "新增成功";
        }else if(matchParamStr(context[2],["刪除","移除","remove","delete","Detele","-d","-D"])){
            if(checkSysStatus())return `目前權限系統狀態為關閉，若要開啟，請輸入:\n${config.keyWord} 權限管理 enable`;
        }else if(matchParamStr(context[2],["查詢","query","Query","--query","-Q","--Query"])){
            if(checkSysStatus())return `目前權限系統狀態為關閉，若要開啟，請輸入:\n${config.keyWord} 權限管理 enable`;
        }else if(matchParamStr(context[2],["編輯","修改","edit","--edit","Edit"])){
            if(checkSysStatus())return `目前權限系統狀態為關閉，若要開啟，請輸入:\n${config.keyWord} 權限管理 enable`;
        }else if(matchParamStr(context[2],["開啟","on","open","啟用","start","enable","true","Disable"])){
            config[configKey][status]=true;
            let queryPool = await mysql.createPool(dbConfig);
            try{
                let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                console.log(result);
            }catch{
                console.log("權限系統開啟失敗，請確認DB操作");
                queryPool.end();
                return "權限系統開啟失敗";
            }
            queryPool.end();
            return "權限系統開啟成功";
        }else if(matchParamStr(context[2],["關閉","close","Close","disable","false","Disable"])){
            config[configKey][status]=false;
            let queryPool = await mysql.createPool(dbConfig);
            try{
                let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                console.log(result);
            }catch{
                console.log("權限系統開啟失敗，請確認DB操作");
                queryPool.end();
                return "權限系統關閉失敗";
            }
            queryPool.end();
            return "權限系統關閉成功";
        }
        return "請輸入參數[新增|刪除|查詢|編輯|開啟|關閉]";
    }else{
        return "阿巴阿巴~";
    }
}
async function handler(req,res){
	let queryPool = await mysql.createPool(dbConfig);
	let msgType = getMessageType(req.body);
        if(msgType=="user"){
                let UID = getUserID(req.body);
				let queryString = `SELECT * FROM \`temp_001\`.\`user\` WHERE \`UID\` = '${UID}'`;
				let result = await queryPool.query(queryString);
				try{
					if(result.length==0){
						let reciveMessage = getMessageContext(req.body,getMessageContextType(req.body));
						if(reciveMessage!="註冊"){
							let replyMessage = {
								type:'text',
								text:`尚未註冊，無法啟用服務`
							}
							res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
						}else{
							let queryString = `INSERT INTO \`temp_001\`.\`user\`(\`UID\`,\`Config\`,\`Workqueue\`) VALUES('${UID}','{}','{}')`;
							let result = await queryPool.query(queryString);
							console.log(result);
							let replyMessage = {
								type:'text',
								text:`註冊成功`
							}
							res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
						}
					}else{
						/**進行操作 */
						let replyMessage = {
							type:'text',
							text:`帳號辨識成功`
						}
						res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
					}
				}catch{
					res.status(200).send();
				}
        }else if(msgType=="room"){
            let keyWord = "阿巴阿巴";
            let GID = getGroupID(req.body);
            let queryString = `SELECT * FROM \`temp_001\`.\`room\` WHERE \`GID\` = '${GID}'`;
            let result = await queryPool.query(queryString);
            try{
                if(result.length==0){
                    let reciveMessage = getMessageContext(req.body,getMessageContextType(req.body));
                    reciveMessage = reciveMessage.split(" ");
                    if(reciveMessage[0]==keyWord&&reciveMessage[1]!="啟用服務"){
                        let replyMessage = {
                            type:'text',
                            text:`尚未啟用，無法使用服務\n若要使用此服務請輸入[啟用服務]`
                        }
                        res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
                    }else if(reciveMessage[0]==keyWord&&reciveMessage[1]=="啟用服務"){
                        let queryString = `INSERT INTO \`temp_001\`.\`room\`(\`GID\`,\`Config\`,\`Workqueue\`) VALUES('${GID}','{}','{}')`;
                        let result = await queryPool.query(queryString);
                        console.log(result);
                        let replyMessage={
                            type:'text',
                            text:`啟用服務成功`
                        }
                        res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
                    }else{
                        res.status(200).send();
                    }
                }else{
                    let info = result[0];
                    let config = JSON.parse(info["Config"]);
                    console.log(config);
                    keyWord = config.keyWord || keyWord;
                    try{
                        let reciveMessage = getMessageContext(req.body,getMessageContextType(req.body));
                        reciveMessage = reciveMessage.split(" ");
                        if(reciveMessage[0]==keyWord){
                            let replyMessageContext = await operator(reciveMessage,info);
                            console.log(replyMessageContext);
                            let replyMessage = {
                                type:'text',
                                text:replyMessageContext
                            }
                            res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
                        }else{
                            res.status(200).send();
                        }
                    }catch{
                        console.log("operator可能出錯了");
                        let replyMessage = {
                                type:'text',
                                text:'操作失敗'
                            }
                        res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
                    }
                }
            }catch{
                console.log("DB操作有問題");
                res.status(200).send();
            }
        }else if(msgType=="group"){
            let keyWord = "阿巴阿巴";
            let GID = getGroupID(req.body);
            let queryString = `SELECT * FROM \`temp_001\`.\`Group\` WHERE \`GID\` = '${GID}'`;
            let result = await queryPool.query(queryString);
            try{
                if(result.length==0){
                    let reciveMessage = getMessageContext(req.body,getMessageContextType(req.body));
                    reciveMessage = reciveMessage.split(" ");
                    if(reciveMessage[0]==keyWord&&reciveMessage[1]!="啟用服務"){
                        let replyMessage = {
                            type:'text',
                            text:`尚未啟用，無法使用服務\n若要使用此服務請輸入[啟用服務]`
                        }
                        res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
                    }else if(reciveMessage[0]==keyWord&&reciveMessage[1]=="啟用服務"){
                        let queryString = `INSERT INTO \`temp_001\`.\`Group\`(\`GID\`,\`Config\`,\`Workqueue\`) VALUES('${GID}','{}','{}')`;
                        let result = await queryPool.query(queryString);
                        console.log(result);
                        let replyMessage={
                            type:'text',
                            text:`啟用服務成功`
                        }
                        res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
                    }else{
                        res.status(200).send();
                    }
                }else{
                    let info = result[0];
                    let config = JSON.parse(info["Config"]);
                    console.log(config);
                    keyWord = config.keyWord || keyWord;
                    try{
                        let reciveMessage = getMessageContext(req.body,getMessageContextType(req.body));
                        reciveMessage = reciveMessage.split(" ");
                        if(reciveMessage[0]==keyWord){
                            let replyMessageContext = await operator(reciveMessage,info,"group");
                            console.log(replyMessageContext);
                            let replyMessage = {
                                type:'text',
                                text:replyMessageContext
                            }
                            res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
                        }else{
                            res.status(200).send();
                        }
                    }catch{
                        console.log("operator可能出錯了");
                        let replyMessage = {
                                type:'text',
                                text:'操作失敗'
                            }
                        res.json(await lineBOT.replyMessage(getReplyToken(req.body),replyMessage));
                    }
                }
            }catch{
                console.log("DB操作有問題");
                res.status(200).send();
            }
        }else{
            res.status(200).send();
        }
	queryPool.end();
}
exports.route = (req,res)=>{
	handler(req,res);
    console.log(req.body);
    console.log(req.body.message);
    console.log(req.body.source);
    console.log(lineBOT_version);
};