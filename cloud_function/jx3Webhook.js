const line = require("@line/bot-sdk");
const mysql = require("promise-mysql");
const lineBOT_version = "v0.3.1";
let lineConfig = {
	channelSecret:"57a20a46c34367c8c836dea780fc0b3b",
	channelAccessToken:"f5FATQ1yc49uDXte+ahJ7N4HDEMBJno732p3vJ+un9szQ/0sI7D5PqU/Y5D8tqWRYGsrcuz6SzERcX2Id8dH/AN8dqyUyKhYnxJUm/xz+IXP1pA0GxiXOjCVCNWW0rpQJUlISC2UfkqUpKpZ2x9PFwdB04t89/1O/w1cDnyilFU="
};
let lineBOT = new line.Client(lineConfig);
let dbConfig = {
	user: "webSiteConfigProvidesService",
	password: "Fmrd5339",
	database: "temp_001",
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
    console.log(queryStrGenerator("Group",configToJSON(JSON.stringify(config)),info))
    // if(sourceType=="room"){
    //     if(context[1]=="改名"||context[1]=="rename"){
    //         if(context[2].length<2)return "改名失敗";
    //         let queryPool = await mysql.createPool(dbConfig);
    //         config.keyWord = context[2];
    //         console.log(config);
    //         let jsonStr = ((data)=>{
    //             console.log(data);
    //             let result = "";
    //             for(let i in data){
    //                 if(data[i]=='"'){
    //                     result = result+`\\"`;
    //                     continue;
    //                 }
    //                 result = result+data[i];
    //             }
    //             return result;
    //         })(JSON.stringify(config));
    //         let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //         let result = await queryPool.query(queryStr);
    //         queryPool.end();
    //         return "好的！好的！我叫"+context[2];
    //     }else if(context[1]=="幫助"||context[1]=="help"||context[1]=="指令說明"){
    //         let document = {
    //             "改名":"指令名稱:[改名]\n\n說明:\n更改機器人名字\n\n範例:\n[機器人名稱] 改名 [想改的名字]\n\n替換指令:[rename]",
    //             "註冊":"指令名稱:[註冊]\n\n說明:\n在尚未註冊的情況下，註冊群組資訊\n\n範例:\n[機器人名稱] 註冊 [幫會名稱]\n\n替換指令:[regis]",
    //             "幫助":"指令名稱:[幫助]\n\n說明:\n取得使用說明及指令參數\n\n範例:\n[機器人名稱] 幫助 [想查詢的指令]\n\n替換指令:[help|指令說明]",
    //             "小本本":"指令名稱:[小本本]\n\n說明:\n打本小本本\n\n範例:\n[機器人名稱] 小本本 新增 { [玩家ID],[玩家UID],[職業],[副本],[原因] }\n\n替換指令:[黑名單|BlackList]\n\n子指令集:\n[新增,查詢,刪除]\n\n若要查詢子指令用法，請輸入:\n\n[機器人名稱] help 小本本>[子指令集]",
    //             "小本本>新增":"指令名稱:[小本本]\n\n子指令:[新增]\n\n說明:\n可以新增紀錄用以查詢黑名單\n\n範例:\n[機器人名稱] 小本本 新增 玩家ID,玩家UID,職業,副本,原因\n\n備註:\n資訊可以空白但','逗號不可省略\n\n子指令替換指令:[ add | note | 紀錄]",
    //             "小本本>查詢":"指令名稱:[小本本]\n\n子指令:[查詢]\n\n說明:\n可以查詢玩家是否登錄在黑名單\n\n範例:\n[機器人名稱] 小本本 查詢 玩家ID,[玩家UID,[職業,[副本,[原因]]]] [參數]\n\n備註:\n玩家ID以外的資訊可以留白\n詳細說明往後補上\n正常情況下建議直接使用:\n\n[機器人名稱] 小本本 查詢 玩家ID\n\n子指令替換指令:[query]",
    //             "小本本>刪除":"指令名稱:[小本本]\n\n子指令:[刪除]\n\n說明:\n可以刪除已經登錄在冊的玩家\n\n範例:\n[機器人名稱] 小本本 刪除 玩家ID,[玩家UID,[副本,] [參數]\n\n備註:\n玩家ID以外的資訊可以留白\n詳細說明往後補上\n正常情況下建議直接使用:\n\n[機器人名稱] 小本本 刪除 玩家ID\n\n子指令替換指令:[ delete|-d|-D ]",
    //             "黑名單":"指令名稱:[黑名單]\n\n說明:\n打本黑名單\n\n範例:\n[機器人名稱] 黑名單 新增 { [玩家ID],[玩家UID],[職業],[副本],[原因] }\n\n替換指令:[小本本|BlackList]\n\n子指令集:\n[新增|查詢|刪除]\n\n若要查詢子指令用法，請輸入:\n\n[機器人名稱] help 黑名單>[子指令集]",
    //             "黑名單>新增":"指令名稱:[黑名單]\n\n子指令:[新增]\n\n說明:\n可以新增紀錄用以查詢黑名單\n\n範例:\n[機器人名稱] 黑名單 新增 玩家ID,玩家UID,職業,副本,原因\n\n備註:\n資訊可以空白但','逗號不可省略\n\n子指令替換指令:[ add | note | 紀錄]",
    //             "黑名單>查詢":"指令名稱:[黑名單]\n\n子指令:[查詢]\n\n說明:\n可以查詢玩家是否登錄在黑名單\n\n範例:\n[機器人名稱] 黑名單 查詢 玩家ID,[玩家UID,[職業,[副本,[原因]]]] [參數]\n\n備註:\n玩家ID以外的資訊可以留白\n詳細說明往後補上\n正常情況下建議直接使用:\n\n[機器人名稱] 黑名單 查詢 玩家ID\n\n子指令替換指令:[query]",
    //             "黑名單>刪除":"指令名稱:[黑名單]\n\n子指令:[刪除]\n\n說明:\n可以刪除已經登錄在冊的玩家\n\n範例:\n[機器人名稱] 黑名單 刪除 玩家ID,[玩家UID,[副本,] [參數]\n\n備註:\n玩家ID以外的資訊可以留白\n詳細說明往後補上\n正常情況下建議直接使用:\n\n[機器人名稱] 黑名單 刪除 玩家ID\n\n子指令替換指令:[ delete|-d|-D ]",
    //             "群組資訊":"指令名稱:[群組資訊]\n\n說明:\n取得此群組的相關資訊\n\n範例:\n[機器人名稱] 群組資訊\n\n替換指令:[GroupInfo]",
    //             "成員管理":"指令名稱:[成員管理]\n\n說明:\n操作幫會成員名單\n\n範例:\n[機器人名稱] 成員管理 [子指令] [參數]\n\n替換指令:[HR]\n\n備註:\n目前只有名單記錄功能\n將來可能結合權限系統管理\n\n子指令集:\n[新增|查詢|刪除|列表]\n\n若要查詢子指令集用法請輸入:\n[機器人名稱] help 成員管理>[新增|查詢|刪除|列表]",
    //             "成員管理>新增":"指令名稱:[成員管理]\n\n子指令名稱:[新增]\n\n說明:\n新增幫會成員\n\n範例:\n[機器人名稱] 成員管理 新增 [暱稱] [玩家ID]\n\n替換指令:[add]",
    //             "成員管理>刪除":"指令名稱:[成員管理]\n\n子指令名稱:[刪除]\n\n說明:\n刪除幫會成員，未輸入參數情況下\n請直接輸入暱稱即可\n\n範例:\n[機器人名稱] 成員管理 刪除 [暱稱|玩家ID] [參數]\n\n替換指令:[delete]\n\n參數:\n\n1.[--all]:輸入玩家ID，清除此ID所有相關資料\n2.[--gameId]:輸入玩家ID，並只刪除此遊戲ID，不清除其他資料",
    //             "成員管理>查詢":"目前正在開發中",
    //             "成員管理>列表":"目前正在開發中"
    //         }
    //         for(let i in document){
    //             if(`${i}`==context[2]){
    //                 return document[i];
    //             }
    //         }
    //         let message = "使用說明:\n"+
    //                     "所有的指令間皆以空格區隔，比如說:\n"+
    //                     "   阿巴阿巴 改名 ODO\n"+
    //                     "指令解析:\n"+
    //                     "  [觸發關鍵字] [指令] [參數]\n"+
    //                     "目前可以使用的指令:\n"+
    //                     "1.改名:更改機器人名字\n"+
    //                     "2.註冊:註冊群組資訊\n"+
    //                     "3.幫助(help|指令說明):取得操作及指令說明\n"+
    //                     "4.小本本(黑名單):打本小本本\n"+
    //                     "5.群組資訊:取得此群組的相關資訊\n"+
    //                     "6.機器人資訊:取得機器人相關資訊\n"+
    //                     "\n"+
    //                     "如果要取得個別指令說明請輸入:\n"+
    //                     "  [觸發關鍵字] 幫助 [想查詢的指令]";
    //         return message;
    //     }else if(context[1]=="機器人資訊"||context[1]=="BOTinfo"){
    //         let message = "資訊(2021/08/18)\n"+
    //                     "小助手主要用途為:\n"+
    //                     "1.協助管理幫會群組\n"+
    //                     "2.提供類似於個人秘書服務\n\n"+
    //                     "預計開發功能(針對群組):\n"+
    //                     "1.幫會活動預約提醒\n"+
    //                     "2.幫會群組成員管理\n"+
    //                     "3.幫會開本管理\n"+
    //                     "4.小本本\n"+
    //                     "5.其他功能(e.g. 幫會間不同群組傳送訊息....)\n\n"+
    //                     "預計開發功能(針對個人):\n"+
    //                     "1.活動提醒\n"+
    //                     "2.小本本\n"+
    //                     "3.玩家之間送信(e.g. 可以直接輸入遊戲ID發送訊息給同樣有使用此功能的玩家)\n"+
    //                     "4.其他功能....\n\n"+
    //                     "作者:TeddyXiong[墨老技師]\n"+
    //                     "協作者:[諾冬雪][溟靚][璃璃小時候][神樂月彌][赫曦]\n"+
    //                     "如果有其他建議，歡迎聯繫通知\n\n"+
    //                     `機器人版本:${lineBOT_version}`;
    //         return message;
    //     }else if(context[1]=="註冊"||context[1]=="regis"){
    //         if(context[2].length<2)return "註冊失敗";
    //         let queryPool = false;
    //         try{
    //             queryPool = await mysql.createPool(dbConfig);
    //         }catch{
    //             console.log("資料庫連線初始化失敗");
    //             return "註冊失敗"
    //         }
    //         console.log(config);
    //         if(config["groupName"]!=undefined){
    //             if(context[3]!="覆蓋"&&context[3]!="-cover"&&context[3]!="重新註冊"&&context[3]!="reset"&&context[3]!="-r"&&context[3]!="-R"){
    //                 let msg = "此群組已經註冊過了，請勿重新註冊\n如果確定要重新註冊，請輸入:\n  "+`${config["keyWord"]||"阿巴阿巴"} 註冊 ${context[2]} -R`;
    //                 queryPool.end();
    //                 return msg;
    //             }
    //         }
    //         console.log(context[2]);
    //         config["groupName"] = context[2];
    //         console.log(config);
    //         let jsonStr = configToJSON(JSON.stringify(config));
    //         console.log(jsonStr);
    //         let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //         console.log(queryStr);
    //         try{
    //             let result = await queryPool.query(queryStr);
    //             console.log(result);
    //         }catch{
    //             console.log("query faild");
    //             queryPool.end();
    //             return "註冊失敗";
    //         }
    //         queryPool.end();
    //         return "群組註冊成功！";
    //     }else if(context[1]=="群組資訊"||context[1]=='群組資訊'||context[1]=="GroupInfo"){
    //         if(config["groupName"]==undefined){
    //             return "請先註冊群組資訊";
    //         }
    //         let msg = `幫會名稱:${config["groupName"]}`;
    //         return msg;
    //     }else if(context[1]=="小本本"||context[1]=="黑名單"||context[1]=="BlackList"||context[1]=="blacklist"){
    //         if(config["BlackList"]==undefined)config["BlackList"] = [];
    //         if(context[2]=="紀錄"||context[2]=="note"||context[2]=="新增"||context[2]=="add"){
    //             if(context[3]==undefined)return "請輸入參數\n\ne.g.\n[機器人名稱] 新增 [玩家ID],[玩家UID],[玩家職業],[副本],[原因]\n\n備註:\n逗號(,)不可省略，請使用半型逗號\n\n範例指令:\n[機器人名稱] 小本本 新增\n[玩家ID],[UID(可省略)],[職業(可省略)],[副本(可省略)],[原因(可省略)]";
    //             let target = context[3].split(",");
    //             if(target.length!=5){
    //                 return "格式錯誤請重新輸入\n\n提示:\n1.請使用半型逗號\n2.逗號請勿省略\n3.輸入格式依照順序分別為\n[玩家ID],[玩家UID],[職業],[副本],[原因]";
    //             }
    //             let queryPool = await mysql.createPool(dbConfig);
    //             for(let i in target){
    //                 target[i] = planeParentheses(target[i]);
    //             }
    //             target = {
    //                 id:`${target[0]}`,
    //                 uid:`${target[1]}`,
    //                 profession:`${target[2]}`,
    //                 instancedungeon:`${target[3]}`,
    //                 cause:`${target[4]}`
    //             }
    //             config["BlackList"].push(target);
    //             let jsonStr = configToJSON(JSON.stringify(config));
    //             console.log(jsonStr);
    //             let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //             try{
    //                 let result = await queryPool.query(queryStr);
    //                 console.log(result);
    //             }catch{
    //                 queryPool.end();
    //                 return "小本本新增失敗";
    //             }
    //             queryPool.end();
    //             return "新增成功!\n["+target["id"]+"]\n已加入黑名單";
    //         }else if(context[2]=="查詢"||context[2]=="query"){
    //             if(context[3]==undefined)return "請輸入參數\n\ne.g.\n\n[機器人名稱] 小本本 查詢 [玩家ID]"
    //             let target = context[3];
    //             target = target.split(',');
    //             if(target.length>5)return "格式錯誤請重新輸入";
    //             for(let i in target){
    //                 target[i] = planeParentheses(target[i]);
    //             }
    //             if(context[4]=="ID"){
    //                 let response = [];
    //                 let responseStr = "";
    //                 for(let i in config["BlackList"]){
    //                     for(let j in target){
    //                         if(config["BlackList"][i]["id"]==target[j]){
    //                             response.push(config["BlackList"][i]);
    //                         }
    //                     }
    //                 }
    //                 for(let i in response){
    //                     responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
    //                 }
    //                 responseStr = responseStr+"查詢結束！";
    //                 return responseStr;
    //             }else if(context[4]=="UID"){
    //                 let response = [];
    //                 let responseStr = "";
    //                 for(let i in config["BlackList"]){
    //                     for(let j in target){
    //                         if(config["BlackList"][i]["uid"]==target[j]){
    //                             response.push(config["BlackList"][i]);
    //                         }
    //                     }
    //                 }
    //                 for(let i in response){
    //                     responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
    //                 }
    //                 responseStr = responseStr+"查詢結束！";
    //                 return responseStr;
    //             }else if(context[4]=="職業"||context[4]=="-P"||context[4]=="-p"||context[4]=="--profession"||context[4]=="Profession"){
    //                 let response = [];
    //                 let responseStr = "";
    //                 for(let i in config["BlackList"]){
    //                     for(let j in target){
    //                         if(config["BlackList"][i]["profession"]==target[j]){
    //                             response.push(config["BlackList"][i]);
    //                         }
    //                     }
    //                 }
    //                 for(let i in response){
    //                     responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
    //                 }
    //                 responseStr = responseStr+"查詢結束！";
    //                 return responseStr;
    //             }else if(context[4]=="副本"||context[4]=="-I"||context[4]=="-i"||context[4]=="instanceDungeon"||context[4]=="instancedungeon"||context[4]=="MAP"){
    //                 let response = [];
    //                 let responseStr = "";
    //                 for(let i in config["BlackList"]){
    //                     for(let j in target){
    //                         if(config["BlackList"][i]["instancedungeon"]==target[j]){
    //                             response.push(config["BlackList"][i]);
    //                         }
    //                     }
    //                 }
    //                 for(let i in response){
    //                     responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
    //                 }
    //                 responseStr = responseStr+"查詢結束！";
    //                 return responseStr;
    //             }else if(context[4]=="原因"||context[4]=="cause"||context[4]=="Cause"||context[4]=="-C"||context[4]=="-c"){
    //                 let response = [];
    //                 let responseStr = "";
    //                 for(let i in config["BlackList"]){
    //                     for(let j in target){
    //                         if(config["BlackList"][i]["cause"]==target[j]){
    //                             response.push(config["BlackList"][i]);
    //                         }
    //                     }
    //                 }
    //                 for(let i in response){
    //                     responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
    //                 }
    //                 responseStr = responseStr+"查詢結束！";
    //                 return responseStr;
    //             }else{
    //                 target = planeParentheses(context[3]);
    //                 let responseStr="此人在黑名單紀錄中!!\n\n";
    //                 let result=[];
    //                 let counter = 1;
    //                 for(let i in config["BlackList"]){
    //                     if(config["BlackList"][i]["id"]==target){
    //                         result.push(`第${counter}筆紀錄:\nID:${config["BlackList"][i]["id"]}\nUID:${config["BlackList"][i]["uid"]}\n職業:${config["BlackList"][i]["profession"]}\n副本:${config["BlackList"][i]["instancedungeon"]}\n原因:${config["BlackList"][i]["cause"]}\n\n`);
    //                     }
    //                 }
    //                 if(result.length==0)return "此人不在黑名單紀錄中，若有疑慮請確認查詢格式是否正確";
    //                 else{
    //                     for(let i in result){
    //                         responseStr=responseStr+`${result[i]}`;
    //                     }
    //                     responseStr = responseStr+"查詢結束!!";
    //                     return responseStr;
    //                 }
    //             }
    //         }else if(context[2]=="刪除"||context[2]=="-D"||context[2]=="-d"||context[2]=="--delete"||context[2]=="delete"){
    //             if(context[3]==undefined)return "請輸入參數\n\ne.g.\n\n[機器人名稱] 小本本 刪除 [玩家ID] [參數(可省略)]";
    //             let target = context[3].split(",");
    //             if(target.length>1&&context[4]==undefined)return "格式錯誤請重新輸入\n\n提示:\n\n1.格式為: [機器人名稱] 小本本 刪除 [玩家ID] [參數(可省略)]\n\n2.參數詳細使用可以輸入:\n\n[機器人名稱] 幫助 小本本>刪除";
    //             if(context[4]=="UID"||context[4]=="-U"||context[4]=="-u"||context[4]=="-UID"){
    //                 let updateArr = [];
    //                 let uid = target.length==1?target[0]:target[1];
    //                 uid = planeParentheses(uid);
    //                 for(let i in config["BlackList"]){
    //                     if(config["BlackList"][i]["uid"]!=uid){
    //                         updateArr.push(config["BlackList"][i]);
    //                     }
    //                 }
    //                 config["BlackList"]=updateArr;
    //             }else if(context[4]=="instancedungeon"||context[4]=="副本"||context[4]=="-i"||context[4]=="-I"){
    //                 let updateArr = [];
    //                 let instancedungeon = (()=>{
    //                     if(target.length==1)return target[0];
    //                     else if(target.length==2)return target[1];
    //                     else if(target.length==3)return target[2];
    //                     else if(target.length==4)return target[2];
    //                     else return target[4];
    //                 })()
    //                 instancedungeon = planeParentheses(instancedungeon);
    //                 for(let i in config["BlackList"]){
    //                     if(config["BlackList"][i]["instancedungeon"]!=instancedungeon){
    //                         updateArr.push(config["BlackList"][i]);
    //                     }
    //                 }
    //                 config["BlackList"]=updateArr;
    //             }else if(context[4]==undefined||context[4]=="ID"||context[4]=="id"){
    //                 let updateArr = [];
    //                 let id = target.length==1?target[0]:target[1];
    //                 id = planeParentheses(id);
    //                 for(let i in config["BlackList"]){
    //                     if(config["BlackList"][i]["id"]!=id){
    //                         updateArr.push(config["BlackList"][i]);
    //                     }
    //                 }
    //                 config["BlackList"]=updateArr;
    //             }
    //             let queryPool = await mysql.createPool(dbConfig);
    //             let jsonStr = configToJSON(JSON.stringify(config));
    //             let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //             try{
    //                 let result = await queryPool.query(queryStr);
    //                 console.log(result);
    //             }catch{
    //                 queryPool.end();
    //                 return "小本本刪除失敗!";
    //             }
    //             queryPool.end();
    //             return "小本本刪除成功";
    //         }
    //         return "請問要做什麼呢？\n參數:[新增|查詢|刪除]";
    //     }else if(context[1]=="日常活動"||context[1]=="dailyWork"){
    //         return "目前正在開發中～";
    //     }else if(context[1]=="活動提醒"||context[1]=="活動預約"||context[1]=="預約"||context[1]=="reserve"||context[1]=="Reserve"){
    //         return "目前正在開發中～";
    //     }else if(context[1]=="Mail"||context[1]=="訊息"||context[1]=="message"||context[1]=="mail"||context[1]=="信使"){
    //         return "目前正在開發中!";
    //         if(context[2]=="send"||context[2]=="Send"||context[2]=="-s"||context[2]=="-S"||context[2]=="發送"){
    //             /**目前正在開發中 */
    //         }
    //     }else if(context[1]=="成員管理"||context[1]=="MemberManagement"||context[1]=="membermanagement"||context[1]=="HR"||context=="人事管理"){
    //         if(context[2]=="新增"||context[2]=="add"||context[2]=="Add"||context[2]=="加入"){
    //             if(context[3]==undefined)return "請輸入暱稱(同一個群組內個人暱稱不可重複!)";
    //             else if(context[4]==undefined)return "請輸入遊戲ID";
    //             if(config["memberManagment"]==undefined)config["memberManagment"]=[];
    //             let flag = false;
    //             for(let i in config["memberManagment"]){
    //                 if(config["memberManagment"][i]["nickName"]==`${context[3]}`){
    //                     config["memberManagment"][i]["gameId"].push(`${context[4]}`);
    //                     flag = true;
    //                 }
    //             }
    //             let queryPool = await mysql.createPool(dbConfig);
    //             if(flag){
    //                 let jsonStr = configToJSON(JSON.stringify(config));
    //                 let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //                 try{
    //                     let result = await queryPool.query(queryStr);
    //                     console.log(result);
    //                 }catch{
    //                     console.log("成員管理 新增功能 寫入失敗[001]");
    //                     queryPool.end();
    //                     return "新增失敗!";
    //                 }
    //                 queryPool.end();
    //                 return "新增成功!";
    //             }else{
    //                 let arr = [];
    //                 arr.push(`${context[4]}`);
    //                 config["memberManagment"].push({nickName:`${context[3]}`,gameId:`${arr}`});
    //                 let jsonStr = configToJSON(JSON.stringify(config));
    //                 let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //                 try{
    //                     let result = await queryPool.query(queryStr);
    //                     console.log(result);
    //                 }catch{
    //                     console.log("成員管理 新增功能 寫入失敗[002]");
    //                     queryPool.end();
    //                     return "新增失敗!";
    //                 }
    //                 queryPool.end();
    //                 return "新增成功!";
    //             }
    //         }else if(context[2]=="刪除"||context[2]=="--delete"||context[2]=="--Delete"||context[2]=="-d"||context[2]=="-D"||context[2]=="delete"){
    //             if(context[3]==undefined)return "請輸入暱稱或遊戲ID";
    //             let queryPool = await mysql.createPool(dbConfig);
    //             if(context[4]=="--gameId"||context[4]=="--gameID"){
    //                 if(context[5]!=undefined){
    //                     queryPool.end();
    //                     return "格式錯誤";
    //                 }
    //                 for(let i in config["memberManagment"]){
    //                     let flag = false;
    //                     for(let j in config["memberManagment"][i]["gameId"]){
    //                         if(config["memberManagment"][i]["gameId"][j]==context[3]){
    //                             config["memberManagment"][i]["gameId"].splice(j,1);
    //                             flag=true;
    //                             break;
    //                         }
    //                     }
    //                     if(flag)break;
    //                 }
    //                 let jsonStr = configToJSON(JSON.stringify(config));
    //                 let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //                 try{
    //                     let result = await queryPool.query(queryStr);
    //                     console.log(result);
    //                 }catch{
    //                     console.log("成員管理 刪除功能 --gameId參數 DB操作錯誤[001]");
    //                     queryPool.end();
    //                     return "操作失敗！";
    //                 }
    //                 queryPool.end();
    //                 return "操作成功"
    //             }else if(context[4]=="--all"){
    //                 if(context[5]==undefined){
    //                     for(let i in config["memberManagment"]){
    //                         if(config["memberManagment"][i]["nickName"]==context[3]){
    //                             config["memberManagment"].splice(i,1);
    //                             break;
    //                         }
    //                     }
    //                     let jsonStr = configToJSON(JSON.stringify(config));
    //                     let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //                     try{
    //                         let result = await queryPool.query(queryStr);
    //                         console.log(result);
    //                     }catch{
    //                         console.log("成員管理 刪除功能 --all參數 DB操作錯誤[002]");
    //                         queryPool.end();
    //                         return "操作失敗!"
    //                     }
    //                     queryPool.end();
    //                     return "操作成功"
    //                 }else if(context[5]=="--gameId"||context[5]=="--gameID"){
    //                     for(let i in config["memberManagment"]){
    //                         let flag = false;
    //                         for(let j in config["memberManagment"][i]["gameId"]){
    //                             if(config["memberManagment"][i]["gameId"][j]==context[3]){
    //                                 config["memberManagment"].splice(i,1);
    //                                 flag = true;
    //                                 break;
    //                             }
    //                         }
    //                         if(flag)break;
    //                     }
    //                     let jsonStr = configToJSON(JSON.stringify(config));
    //                     let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //                     try{
    //                         let result = await queryPool.query(queryStr);
    //                         console.log(result);
    //                     }catch{
    //                         console.log("成員管理 刪除功能 --all --gameId參數 DB操作失敗[003]");
    //                         queryPool.end();
    //                         return "操作失敗!";
    //                     }
    //                     queryPool.end();
    //                     return "操作成功!";
    //                 }else{
    //                     queryPool.end();
    //                     return "格式錯誤";
    //                 }
    //             }else if(context[4]==undefined){
    //                 for(let i in config["memberManagment"]){
    //                     if(config["memberManagment"][i]["nickName"]==context[3]){
    //                         config["memberManagment"].splice(i,1);
    //                         break;
    //                     }
    //                 }
    //                 let jsonStr = configToJSON(JSON.stringify(config));
    //                 let queryStr = `UPDATE \`temp_001\`.\`room\` SET \`Config\`='${jsonStr}' WHERE \`GID\`='${info["GID"]}' AND \`ID\`='${info["ID"]}'`;
    //                 try{
    //                     let result = await queryPool.query(queryStr);
    //                     console.log(result);
    //                 }catch{
    //                     console.log("成員管理 刪除功能 預設操作 DB操作失敗");
    //                     queryPool.end();
    //                     return "操作失敗";
    //                 }
    //                 queryPool.end();
    //                 return "操作成功";
    //             }
    //             queryPool.end();
    //             return "格式錯誤，請重新確認格式";
    //         }else if(context[2]=="查詢"||context[2]=="query"||context[2]=="Query"||context[2]=="-q"||context[2]=="-Q"){
    //             return "開發中";
    //         }else if(context[2]=="列表"||context[2]=="list"||context[2]=="List"||context=="--l"||context[2]=="-l"||context=="-L"){
    //             return "開發中";
    //         }
    //         return "請輸入操作參數:[新增|刪除|查詢|列表]";
    //     }else{
    //         return "阿巴阿巴~";
    //     }
    // }else if(sourceType=="group"){
        if(context[1]=="改名"||context[1]=="rename"){
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
        }else if(context[1]=="幫助"||context[1]=="help"||context[1]=="指令說明"){
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
                        "   阿巴阿巴 改名 ODO\n"+
                        "指令解析:\n"+
                        "  [觸發關鍵字] [指令] [參數]\n"+
                        "目前可以使用的指令:\n"+
                        "1.改名:更改機器人名字\n"+
                        "2.註冊:註冊群組資訊\n"+
                        "3.幫助(help|指令說明):取得操作及指令說明\n"+
                        "4.小本本(黑名單):打本小本本\n"+
                        "5.群組資訊:取得此群組的相關資訊\n"+
                        "6.機器人資訊:取得機器人相關資訊\n"+
                        "\n"+
                        "如果要取得個別指令說明請輸入:\n"+
                        "  [觸發關鍵字] 幫助 [想查詢的指令]";
            return message;
        }else if(context[1]=="機器人資訊"||context[1]=="BOTinfo"){
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
                        "協作者:[諾冬雪][溟靚][璃璃小時候][神樂月彌][赫曦]\n"+
                        "如果有其他建議，歡迎聯繫通知\n\n"+
                        `機器人版本:${lineBOT_version}`;
            return message;
        }else if(context[1]=="註冊"||context[1]=="regis"){
            if(context[2].length<2)return "註冊失敗";
            let queryPool = false;
            try{
                queryPool = await mysql.createPool(dbConfig);
            }catch{
                console.log("資料庫連線初始化失敗");
                return "註冊失敗"
            }
            console.log(config);
            if(config["groupName"]!=undefined){
                if(context[3]!="覆蓋"&&context[3]!="-cover"&&context[3]!="重新註冊"&&context[3]!="reset"&&context[3]!="-r"&&context[3]!="-R"){
                    let msg = "此群組已經註冊過了，請勿重新註冊\n如果確定要重新註冊，請輸入:\n  "+`${config["keyWord"]||"阿巴阿巴"} 註冊 ${context[2]} -R`;
                    queryPool.end();
                    return msg;
                }
            }
            config["groupName"] = context[2];
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
        }else if(context[1]=="群組資訊"||context[1]=='群組資訊'||context[1]=="GroupInfo"){
            if(config["groupName"]==undefined){
                return "請先註冊群組資訊";
            }
            let msg = `幫會名稱:${config["groupName"]}`;
            return msg;
        }else if(context[1]=="小本本"||context[1]=="黑名單"||context[1]=="BlackList"||context[1]=="blacklist"){
            if(config["BlackList"]==undefined)config["BlackList"] = [];
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
                target = {
                    id:`${target[0]}`,
                    uid:`${target[1]}`,
                    profession:`${target[2]}`,
                    instancedungeon:`${target[3]}`,
                    cause:`${target[4]}`
                }
                config["BlackList"].push(target);
                try{
                    let result = await queryPool.query(queryStrGenerator(schemaName,configToJSON(JSON.stringify(config)),info));
                    console.log(result);
                }catch{
                    queryPool.end();
                    return "小本本新增失敗";
                }
                queryPool.end();
                return "新增成功!\n["+target["id"]+"]\n已加入黑名單";
            }else if(context[2]=="查詢"||context[2]=="query"){
                if(context[3]==undefined)return "請輸入參數\n\ne.g.\n\n[機器人名稱] 小本本 查詢 [玩家ID]"
                let target = context[3];
                target = target.split(',');
                if(target.length>5)return "格式錯誤請重新輸入";
                for(let i in target){
                    target[i] = planeParentheses(target[i]);
                }
                if(context[4]=="ID"){
                    let response = [];
                    let responseStr = "";
                    for(let i in config["BlackList"]){
                        for(let j in target){
                            if(config["BlackList"][i]["id"]==target[j]){
                                response.push(config["BlackList"][i]);
                            }
                        }
                    }
                    for(let i in response){
                        responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
                    }
                    responseStr = responseStr+"查詢結束！";
                    return responseStr;
                }else if(context[4]=="UID"){
                    let response = [];
                    let responseStr = "";
                    for(let i in config["BlackList"]){
                        for(let j in target){
                            if(config["BlackList"][i]["uid"]==target[j]){
                                response.push(config["BlackList"][i]);
                            }
                        }
                    }
                    for(let i in response){
                        responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
                    }
                    responseStr = responseStr+"查詢結束！";
                    return responseStr;
                }else if(context[4]=="職業"||context[4]=="-P"||context[4]=="-p"||context[4]=="--profession"||context[4]=="Profession"){
                    let response = [];
                    let responseStr = "";
                    for(let i in config["BlackList"]){
                        for(let j in target){
                            if(config["BlackList"][i]["profession"]==target[j]){
                                response.push(config["BlackList"][i]);
                            }
                        }
                    }
                    for(let i in response){
                        responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
                    }
                    responseStr = responseStr+"查詢結束！";
                    return responseStr;
                }else if(context[4]=="副本"||context[4]=="-I"||context[4]=="-i"||context[4]=="instanceDungeon"||context[4]=="instancedungeon"||context[4]=="MAP"){
                    let response = [];
                    let responseStr = "";
                    for(let i in config["BlackList"]){
                        for(let j in target){
                            if(config["BlackList"][i]["instancedungeon"]==target[j]){
                                response.push(config["BlackList"][i]);
                            }
                        }
                    }
                    for(let i in response){
                        responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
                    }
                    responseStr = responseStr+"查詢結束！";
                    return responseStr;
                }else if(context[4]=="原因"||context[4]=="cause"||context[4]=="Cause"||context[4]=="-C"||context[4]=="-c"){
                    let response = [];
                    let responseStr = "";
                    for(let i in config["BlackList"]){
                        for(let j in target){
                            if(config["BlackList"][i]["cause"]==target[j]){
                                response.push(config["BlackList"][i]);
                            }
                        }
                    }
                    for(let i in response){
                        responseStr = responseStr+`第${parseInt(i)+1}筆:\nID:${response[i]["id"]}\nUID:${response[i]["uid"]}\n職業:${response[i]["profession"]}\n副本:${response[i]["instancedungeon"]}\n原因:${response[i]["cause"]}\n\n`;
                    }
                    responseStr = responseStr+"查詢結束！";
                    return responseStr;
                }else{
                    target = planeParentheses(context[3]);
                    let responseStr="此人在黑名單紀錄中!!\n\n";
                    let result=[];
                    let counter = 1;
                    for(let i in config["BlackList"]){
                        if(config["BlackList"][i]["id"]==target){
                            result.push(`第${counter}筆紀錄:\nID:${config["BlackList"][i]["id"]}\nUID:${config["BlackList"][i]["uid"]}\n職業:${config["BlackList"][i]["profession"]}\n副本:${config["BlackList"][i]["instancedungeon"]}\n原因:${config["BlackList"][i]["cause"]}\n\n`);
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
                if(context[3]==undefined)return "請輸入參數\n\ne.g.\n\n[機器人名稱] 小本本 刪除 [玩家ID] [參數(可省略)]";
                let target = context[3].split(",");
                if(target.length>1&&context[4]==undefined)return "格式錯誤請重新輸入\n\n提示:\n\n1.格式為: [機器人名稱] 小本本 刪除 [玩家ID] [參數(可省略)]\n\n2.參數詳細使用可以輸入:\n\n[機器人名稱] 幫助 小本本>刪除";
                if(context[4]=="UID"||context[4]=="-U"||context[4]=="-u"||context[4]=="-UID"){
                    let updateArr = [];
                    let uid = target.length==1?target[0]:target[1];
                    uid = planeParentheses(uid);
                    for(let i in config["BlackList"]){
                        if(config["BlackList"][i]["uid"]!=uid){
                            updateArr.push(config["BlackList"][i]);
                        }
                    }
                    config["BlackList"]=updateArr;
                }else if(context[4]=="instancedungeon"||context[4]=="副本"||context[4]=="-i"||context[4]=="-I"){
                    let updateArr = [];
                    let instancedungeon = (()=>{
                        if(target.length==1)return target[0];
                        else if(target.length==2)return target[1];
                        else if(target.length==3)return target[2];
                        else if(target.length==4)return target[2];
                        else return target[4];
                    })()
                    instancedungeon = planeParentheses(instancedungeon);
                    for(let i in config["BlackList"]){
                        if(config["BlackList"][i]["instancedungeon"]!=instancedungeon){
                            updateArr.push(config["BlackList"][i]);
                        }
                    }
                    config["BlackList"]=updateArr;
                }else if(context[4]==undefined||context[4]=="ID"||context[4]=="id"){
                    let updateArr = [];
                    let id = target.length==1?target[0]:target[1];
                    id = planeParentheses(id);
                    for(let i in config["BlackList"]){
                        if(config["BlackList"][i]["id"]!=id){
                            updateArr.push(config["BlackList"][i]);
                        }
                    }
                    config["BlackList"]=updateArr;
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
        }else if(context[1]=="日常活動"||context[1]=="dailyWork"){
            return "目前正在開發中～";
        }else if(context[1]=="活動提醒"||context[1]=="活動預約"||context[1]=="預約"||context[1]=="reserve"||context[1]=="Reserve"){
            return "目前正在開發中～";
        }else if(context[1]=="Mail"||context[1]=="訊息"||context[1]=="message"||context[1]=="mail"||context[1]=="信使"){
            return "目前正在開發中!";
            if(context[2]=="send"||context[2]=="Send"||context[2]=="-s"||context[2]=="-S"||context[2]=="發送"){
                /**目前正在開發中 */
            }
        }else if(context[1]=="成員管理"||context[1]=="MemberManagement"||context[1]=="membermanagement"||context[1]=="HR"||context=="人事管理"){
            if(context[2]=="新增"||context[2]=="add"||context[2]=="Add"||context[2]=="加入"){
                if(context[3]==undefined)return "請輸入暱稱(同一個群組內個人暱稱不可重複!)";
                else if(context[4]==undefined)return "請輸入遊戲ID";
                if(config["memberManagment"]==undefined)config["memberManagment"]=[];
                console.log(config);
                let flag = false;
                for(let i in config["memberManagment"]){
                    if(config["memberManagment"][i]["nickName"]==`${context[3]}`){
                        config["memberManagment"][i]["gameId"].push(`${context[4]}`);
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
                    config["memberManagment"].push({nickName:`${context[3]}`,gameId:arr});
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
            }else if(context[2]=="刪除"||context[2]=="--delete"||context[2]=="--Delete"||context[2]=="-d"||context[2]=="-D"||context[2]=="delete"){
                if(context[3]==undefined)return "請輸入暱稱或遊戲ID";
                let queryPool = await mysql.createPool(dbConfig);
                if(context[4]=="--gameId"||context[4]=="--gameID"){
                    if(context[5]!=undefined){
                        queryPool.end();
                        return "格式錯誤";
                    }
                    for(let i in config["memberManagment"]){
                        let flag = false;
                        for(let j in config["memberManagment"][i]["gameId"]){
                            if(config["memberManagment"][i]["gameId"][j]==context[3]){
                                config["memberManagment"][i]["gameId"].splice(j,1);
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
                        for(let i in config["memberManagment"]){
                            if(config["memberManagment"][i]["nickName"]==context[3]){
                                config["memberManagment"].splice(i,1);
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
                    }else if(context[5]=="--gameId"||context[5]=="--gameID"){
                        for(let i in config["memberManagment"]){
                            let flag = false;
                            for(let j in config["memberManagment"][i]["gameId"]){
                                if(config["memberManagment"][i]["gameId"][j]==context[3]){
                                    config["memberManagment"].splice(i,1);
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
                    for(let i in config["memberManagment"]){
                        if(config["memberManagment"][i]["nickName"]==context[3]){
                            config["memberManagment"].splice(i,1);
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
            }else if(context[2]=="查詢"||context[2]=="query"||context[2]=="Query"||context[2]=="-q"||context[2]=="-Q"){
                return "開發中";
            }else if(context[2]=="列表"||context[2]=="list"||context[2]=="List"||context=="--l"||context[2]=="-l"||context=="-L"){
                return "開發中";
            }
            return "請輸入操作參數:[新增|刪除|查詢|列表]";
        }else{
            return "阿巴阿巴~";
        }
    // }
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