<?php require_once('wp_rss_db.php');
//edit this line if your wordpress are stored into other directory that is not the root...
$yourhome='http://'.$_SERVER['HTTP_HOST'].'/tbogard';

define("_wp_rsslightboxhouse_",$yourhome.'/wp-content/plugins/rss_lightbox/');


if (!function_exists("GetSQLValueString")) {
function GetSQLValueString($theValue, $theType, $theDefinedValue = "", $theNotDefinedValue = "") 
{
  $theValue = get_magic_quotes_gpc() ? stripslashes($theValue) : $theValue;

  $theValue = function_exists("mysql_real_escape_string") ? mysql_real_escape_string($theValue) : mysql_escape_string($theValue);

  switch ($theType) {
    case "text":
      $theValue = ($theValue != "") ? "'" . $theValue . "'" : "NULL";
      break;    
    case "long":
    case "int":
      $theValue = ($theValue != "") ? intval($theValue) : "NULL";
      break;
    case "double":
      $theValue = ($theValue != "") ? "'" . doubleval($theValue) . "'" : "NULL";
      break;
    case "date":
      $theValue = ($theValue != "") ? "'" . $theValue . "'" : "NULL";
      break;
    case "defined":
      $theValue = ($theValue != "") ? $theDefinedValue : $theNotDefinedValue;
      break;
  }
  return $theValue;
}
}

//force to detect the blogname
mysql_select_db($database_wp_rss_db, $wp_rss_db);
$query_getBlogName = "SELECT * FROM ".$wp_prefix."options WHERE wp_options.option_name='blogname'";
$getBlogName = mysql_query($query_getBlogName, $wp_rss_db) or die(mysql_error());
$row_getBlogName = mysql_fetch_assoc($getBlogName);
$totalRows_getBlogName = mysql_num_rows($getBlogName);

//check if exist the key in the options....
mysql_select_db($database_wp_rss_db, $wp_rss_db);
$query_enableRSSListener = "SELECT * FROM ".$wp_prefix."options WHERE wp_options.option_name='RSS_LIGHTBOX_ENABLE'";
$enableRSSListener = mysql_query($query_enableRSSListener, $wp_rss_db) or die(mysql_error());
$row_enableRSSListener = mysql_fetch_assoc($enableRSSListener);
$totalRows_enableRSSListener = mysql_num_rows($enableRSSListener);

//enable only if exist the key. it means that plugin was activated...
if($totalRows_enableRSSListener>0){
	require_once("json.php");
	require_once("xmltoarray.php");
	if(!isset($_POST['remoteurl'])){
		showerror("Debe proporcionar un servicio RSS o un archivo con datos formateados en XML.");
	}else{
		$da = @fopen($_POST['remoteurl'],"r");
		if(!$da){
			standardParsing(null,"noanswer");
		} else {
			$info = stream_get_meta_data($da);
			if($info["time_out"]){
				standardParsing(null,"timeout");
			} else {
				xmltoarray(file_get_contents($_POST['remoteurl']),$_POST['service']);
			}
			
		}
	}
}
// end enable...

// flow functions
function showerror($error){
	$xml='<?xml version="1.0" encoding="utf-8"?>';
	$xml.="<error>";
	$xml.="<description>".$error."</description>";
	$xml.="</error>";
	return $xml;
}

function returnJson($chain){
	$json = new Services_JSON();
	$cadena = $json->encode($chain);
	srand ((double) microtime( )*1000000);
	$random_number = rand();
	echo("_data_{$random_number}=".trim($cadena));
}

function xmltoarray($xml,$service){
	$xmlContent=$xml;
	$xmlObj    = new XmlToArray($xmlContent);
	$arrayData = $xmlObj->createArray();
	$return = "";
	$refer="";
	
	if(strpos(strtolower($xml),"photobucket")>0){
		$return = $arrayData["rss"]["channel"][0]["item"];
		$refer="photobucket";
	}
	
	//here for flickr...
	
	if ($return!=""){
		standardParsing($return,$refer);
	} else {
		standardParsing(null,"404");
	}
}
//Array standart ro retrieve in json format:
/*
data.titulo[0] = "foo";
data.thumbnail[0]= "thumb_foo";
data.picture[0]="http://foo.com/galeria/foo.jpg";
data.author[0]="t.bogard";
now, let's generate the array to convert it in Json......
*/
function standardParsing($arrayInBrute,$hosting){
	global $row_getBlogName;
	$title=array();
	$thumbnail=array();
	$picture=array();
	$author = array();
	$credit=array();
	$newArray = array ("title"=>$title,"thumbnail"=>$thumbnail,"picture"=>$picture,"author"=>$author,"credit"=>$credit);
	$totalrows=0;
	switch($hosting){
		case "photobucket":
			$totalrows = count($arrayInBrute);
			for($i=0;$i<$totalrows;$i++){
				$newArray["title"][$i+1]=$arrayInBrute[$i]["title"];
				$newArray["thumbnail"][$i+1]=$arrayInBrute[$i]["media:content"][0]["media:thumbnail"]["url"];
				$newArray["picture"][$i+1]=$arrayInBrute[$i]["guid"];
				$newArray["author"][$i+1]="Author : ".str_replace("_photos","",$arrayInBrute[$i]["dc:creator"]);
				$newArray["credit"][$i+1]=$row_getBlogName['option_value'];
			}
			returnJson($newArray);
		break;
		
		//handle errors
		
		case "timeout":
			$newArray["title"][1]="Ooops! Timeout request!";
			$newArray["thumbnail"][1]=_wp_rsslightboxhouse_."images/th_timeout.jpg";
			$newArray["picture"][1]=_wp_rsslightboxhouse_."images/timeout.jpg";
			$newArray["author"][1]="Sorry, the server isn't answer the request.";
			$newArray["credit"][1]="Try again later.";
			returnJson($newArray);
		break;
		
		case "404":
			$newArray["title"][1]="Ooops! RSS Don't exist";
			$newArray["thumbnail"][1]=_wp_rsslightboxhouse_."images/th_404.jpg";
			$newArray["picture"][1]=_wp_rsslightboxhouse_."images/msg_404.jpg";
			$newArray["author"][1]="Sorry, Check the provided URL.";
			$newArray["credit"][1]="Try again later.";
			returnJson($newArray);
		break;
		
		case "noanswer":
			$newArray["title"][1]="Ooops! RSS remote server Don't answer the request";
			$newArray["thumbnail"][1]=_wp_rsslightboxhouse_."images/th_noanswer.jpg";
			$newArray["picture"][1]=_wp_rsslightboxhouse_."images/noanswer.jpg";
			$newArray["author"][1]="Sorry, The RSS remote server may be offline. Check your URL. May be this is incorrect.";
			$newArray["credit"][1]="Try again later.";
			returnJson($newArray);
		break;
		
	}

}

?>
<?php
mysql_free_result($getBlogName);

mysql_free_result($enableRSSListener);
?>
