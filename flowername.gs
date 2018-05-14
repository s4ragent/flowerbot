var PROPERTIES = PropertiesService.getScriptProperties();
//LINE
var CHANNEL_ACCESS_TOKEN = PROPERTIES.getProperty('LINE_ACCESS_TOKEN');
var GOOGLE_DRIVE_FOLDER_ID = PROPERTIES.getProperty('GOOGLE_DRIVE_FOLDER_ID');
var PREDICTION_KEY = PROPERTIES.getProperty('PREDICTION_KEY');
var VISION_PROJECT_ID = PROPERTIES.getProperty('VISION_PROJECT_ID');

function doPost(e) {
  Logger.log('start');
  var json = JSON.parse(e.postData.contents);
  if (json.events[0].message.type = 'image') {
    var blob = get_line_content(json.events[0].message.id);
    // 全部画像として扱っちゃう
    var text = analyze(blob);
    reply(json,text);
  }
}

// 画像とか取得するやつ
function get_line_content(message_id) {
  var headers = {
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
  };
  var options = {
    'method'  : 'GET',
    'headers': headers
  };
  var url = 'https://api.line.me/v2/bot/message/' + message_id + '/content';
  var blob = UrlFetchApp.fetch(url, options).getBlob();
  return blob;
}

function analyze(imgBlob) {
  var url = 'https://southcentralus.api.cognitive.microsoft.com/customvision/v2.0/Prediction/'+ VISION_PROJECT_ID +'/url';
  var headers = {
    "Content-Type" : "application/json",
    "Prediction-Key" : PREDICTION_KEY
  };

  var folder = DriveApp.getFolderById(GOOGLE_DRIVE_FOLDER_ID);
  var file = folder.createFile(imgBlob);
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var fileID = file.getId();
  var imageurl='https://drive.google.com/uc?export=view&id=' + fileID
  
  var data = "{ 'url' : '" + imageurl + "'}";
  
  var options = {
    "method" : "POST",
    "headers" : headers,
    "payload" : data
  };

  var res = UrlFetchApp.fetch(url, options);
  //var res=imageurl;
  var text = res.getContentText("UTF-8");
  var json = JSON.parse(text);
  
  //return Tag + " : " + Probability;
  var message = "確度:"+ json["predictions"][0]["probability"] +" "+json["predictions"][0]["tagName"]+"\n確度:"+ json["predictions"][1]["probability"] +" "+json["predictions"][1]["tagName"]+"\n確度:"+ json["predictions"][2]["probability"] +" "+json["predictions"][2]["tagName"];
  return message;;
  return message;
 }

function reply(json,text){
   // リプライを返すAPIのURI
  var url = "https://api.line.me/v2/bot/message/reply";
  var token = json.events[0].replyToken;
  // お作法①　HTTPヘッダーの設定
  var headers = {
    "Content-Type" : "application/json",
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
  };

  // お作法②　下記の構造でリクエストボディにデータを持つ
  var data = {
    "replyToken" : token, 
    "messages" : [{
      "type" : "text",
      "text" : text
    }]
  };

  var options = {
    "method" : "POST",
    "headers" : headers,
    "payload" : JSON.stringify(data)
  };

  // 返信！
  return UrlFetchApp.fetch(url, options); 
 }