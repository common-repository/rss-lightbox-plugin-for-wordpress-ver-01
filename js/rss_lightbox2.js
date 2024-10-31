// -----------------------------------------------------------------------------------
//
//	rss_Lightbox v2.03.3
//	by Lokesh Dhakar - http://www.huddletogether.com
//	5/21/06
//
//	For more information on this script, visit:
//	http://huddletogether.com/projects/lightbox2/
//
//	Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
//	
//	Credit also due to those who have helped, inspired, and made their code available to the public.
//	Including: Scott Upton(uptonic.com), Peter-Paul Koch(quirksmode.com), Thomas Fuchs(mir.aculo.us), and others.
//
//
// -----------------------------------------------------------------------------------
/*

	Table of Contents
	-----------------
	Configuration
	Global Variables

	Extending Built-in Objects	
	- Object.extend(Element)
	- Array.prototype.removeDuplicates()
	- Array.prototype.empty()

	rss_Lightbox Class Declaration
	- initialize()
	- updateImageList()
	- start()
	- changeImage()
	- resizeImageContainer()
	- showImage()
	- updateDetails()
	- updateNav()
	- enableKeyboardNav()
	- disableKeyboardNav()
	- keyboardAction()
	- preloadNeighborImages()
	- end()
	
	Miscellaneous Functions
	- getPageScroll()
	- getPageSize()
	- getKey()
	- listenKey()
	- showSelectBoxes()
	- hideSelectBoxes()
	- showFlash()
	- hideFlash()
	- pause()
	- rssInitLightbox()
	
	Function Calls
	- addLoadEvent(rss_initLightbox)
	
*/
// -----------------------------------------------------------------------------------

//
//	Configuration
//

var rss_overlayOpacity = 0.8;	// controls transparency of shadow overlay

var rss_animate = true;			// toggles resizing animations
var rss_resizeSpeed = 7;		// controls the speed of the image resizing animations (1=slowest and 10=fastest)

var rss_borderSize = 10;		//if you adjust the padding in the CSS, you will need to update this variable

// -----------------------------------------------------------------------------------

//
//	Global Variables
//
var rss_imageArray = new Array;
var rss_activeImage;

if(rss_animate == true){
	rss_overlayDuration = 0.2;	// shadow fade in/out duration
	if(rss_resizeSpeed > 10){ rss_resizeSpeed = 10;}
	if(rss_resizeSpeed < 1){ rss_resizeSpeed = 1;}
	rss_resizeDuration = (11 - rss_resizeSpeed) * 0.15;
} else { 
	rss_overlayDuration = 0;
	rss_resizeDuration = 0;
}

// -----------------------------------------------------------------------------------

//
//	Additional methods for Element added by SU, Couloir
//	- further additions by Lokesh Dhakar (huddletogether.com)
//
Object.extend(Element, {
	getWidth: function(element) {
	   	element = $(element);
	   	return element.offsetWidth; 
	},
	setWidth: function(element,w) {
	   	element = $(element);
    	element.style.width = w +"px";
	},
	setHeight: function(element,h) {
   		element = $(element);
    	element.style.height = h +"px";
	},
	setTop: function(element,t) {
	   	element = $(element);
    	element.style.top = t +"px";
	},
	setLeft: function(element,l) {
	   	element = $(element);
    	element.style.left = l +"px";
	},
	setSrc: function(element,src) {
    	element = $(element);
    	element.src = src; 
	},
	setHref: function(element,href) {
    	element = $(element);
    	element.href = href; 
	},
	setInnerHTML: function(element,content) {
		element = $(element);
		element.innerHTML = content;
	}
});

// -----------------------------------------------------------------------------------

//
//	Extending built-in Array object
//	- array.removeDuplicates()
//	- array.empty()
//
Array.prototype.removeDuplicates = function () {
    for(i = 0; i < this.length; i++){
        for(j = this.length-1; j>i; j--){        
            if(this[i][0] == this[j][0]){
                this.splice(j,1);
            }
        }
    }
}

// -----------------------------------------------------------------------------------

Array.prototype.empty = function () {
	for(i = 0; i <= this.length; i++){
		this.shift();
	}
}

// -----------------------------------------------------------------------------------

//
//	rss_Lightbox Class Declaration
//	- initialize()
//	- start()
//	- changeImage()
//	- resizeImageContainer()
//	- showImage()
//	- updateDetails()
//	- updateNav()
//	- enableKeyboardNav()
//	- disableKeyboardNav()
//	- keyboardNavAction()
//	- preloadNeighborImages()
//	- end()
//
//	Structuring of code inspired by Scott Upton (http://www.uptonic.com/)
//
var rss_Lightbox = Class.create();

rss_Lightbox.prototype = {
	
	// initialize()
	// Constructor runs on completion of the DOM loading. Calls updateImageList and then
	// the function inserts html at the bottom of the page which is used to display the shadow 
	// overlay and the image container.
	//
	initialize: function() {	
		
		this.updateImageList();

		// Code inserts html at the bottom of the page that looks similar to this:
		//
		//	<div id="overlay"></div>
		//	<div id="lightbox">
		//		<div id="outerImageContainer">
		//			<div id="imageContainer">
		//				<img id="lightboxImage">
		//				<div style="" id="hoverNav">
		//					<a href="#" id="prevLink"></a>
		//					<a href="#" id="nextLink"></a>
		//				</div>
		//				<div id="loading">
		//					<a href="#" id="loadingLink">
		//						<img src="images/loading.gif">
		//					</a>
		//				</div>
		//			</div>
		//		</div>
		//		<div id="imageDataContainer">
		//			<div id="imageData">
		//				<div id="imageDetails">
		//					<span id="caption"></span>
		//					<span id="numberDisplay"></span>
		//				</div>
		//				<div id="bottomNav">
		//					<a href="#" id="bottomNavClose">
		//						<img src="images/close.gif">
		//					</a>
		//				</div>
		//			</div>
		//		</div>
		//	</div>


		var objBody = document.getElementsByTagName("body").item(0);
		
		var objOverlay = document.createElement("div");
		objOverlay.setAttribute('id','rss_overlay');
		objOverlay.style.display = 'none';
		objOverlay.onclick = function() { rssMyLightbox.end(); }
		objBody.appendChild(objOverlay);
		
		var objLightbox = document.createElement("div");
		objLightbox.setAttribute('id','rss_lightbox');
		objLightbox.style.display = 'none';
		objLightbox.onclick = function(e) {	// close rss_Lightbox is user clicks shadow overlay
			if (!e) var e = window.event;
			var clickObj = Event.element(e).id;
			if ( clickObj == 'rss_lightbox') {
				rssMyLightbox.end();
			}
		};
		objBody.appendChild(objLightbox);
			
		var objOuterImageContainer = document.createElement("div");
		objOuterImageContainer.setAttribute('id','rss_outerImageContainer');
		objLightbox.appendChild(objOuterImageContainer);

		// When rss_Lightbox starts it will resize itself from 250 by 250 to the current image dimension.
		// If animations are turned off, it will be hidden as to prevent a flicker of a
		// white 250 by 250 box.
		if(rss_animate){
			Element.setWidth('rss_outerImageContainer', 250);
			Element.setHeight('rss_outerImageContainer', 250);			
		} else {
			Element.setWidth('rss_outerImageContainer', 1);
			Element.setHeight('rss_outerImageContainer', 1);			
		}

		var objImageContainer = document.createElement("div");
		objImageContainer.setAttribute('id','rss_imageContainer');
		objOuterImageContainer.appendChild(objImageContainer);
		
		
		var objBottomNav=document.createElement("div");
		objBottomNav.setAttribute('id','rss_bottomNav');
		objOuterImageContainer.appendChild(objBottomNav);
		
		var objBottomNavCloseLink=document.createElement("a");
		objBottomNavCloseLink.setAttribute('id','rss_bottomNavClose');
		objBottomNavCloseLink.setAttribute('href','#');
		objBottomNavCloseLink.onclick=function(){
			rssMyLightbox.end();
			return false;
		}
		objBottomNav.appendChild(objBottomNavCloseLink);
		
		var objBottomNavCloseImage=document.createElement("img");
		objBottomNavCloseImage.setAttribute('src',rss_fileBottomNavCloseImage);
		objBottomNavCloseLink.appendChild(objBottomNavCloseImage);
		
	
		var objLightboxImage = document.createElement("img");
		objLightboxImage.setAttribute('id','rss_lightboxImage');
		objImageContainer.appendChild(objLightboxImage);
	
		var objLoading = document.createElement("div");
		objLoading.setAttribute('id','rss_loading');
		objImageContainer.appendChild(objLoading);
	
		var objLoadingLink = document.createElement("a");
		objLoadingLink.setAttribute('id','loadingLink');
		objLoadingLink.setAttribute('href','#');
		objLoadingLink.onclick = function() { rssMyLightbox.end(); return false; }
		objLoading.appendChild(objLoadingLink);
	
		var objLoadingImage = document.createElement("img");
		objLoadingImage.setAttribute('src', rss_fileLoadingImage);
		objLoadingLink.appendChild(objLoadingImage);

		var objImageDataContainer = document.createElement("div");
		objImageDataContainer.setAttribute('id','rss_imageDataContainer');
		objLightbox.appendChild(objImageDataContainer);
		
		var objImageData = document.createElement("div");
		objImageData.setAttribute('id','rss_imageData');
		objImageDataContainer.appendChild(objImageData);
	
		
		var objHoverNav = document.createElement("div");
		objHoverNav.setAttribute('id','rss_hoverNav');
		objImageData.appendChild(objHoverNav);
	
		var objNextLink = document.createElement("a");
		objNextLink.setAttribute('id','rss_nextLink');
		objNextLink.setAttribute('href','#');
		objHoverNav.appendChild(objNextLink);

		var objNavNext = document.createElement("img");
		objNavNext.setAttribute('src', rss_fileNext);
		objNextLink.appendChild(objNavNext);
		
		
		var objPrevLink = document.createElement("a");
		objPrevLink.setAttribute('id','rss_prevLink');
		objPrevLink.setAttribute('href','#');
		objHoverNav.appendChild(objPrevLink);
		
		var objNavPrev = document.createElement("img");
		objNavPrev.setAttribute('src', rss_filePrev);
		objPrevLink.appendChild(objNavPrev);
		
		var objenlaces=document.createElement("div");
		objenlaces.setAttribute('id','rss_enlaces');
		objImageData.appendChild(objenlaces);
	
		var objImageDetails = document.createElement("div");
		objImageDetails.setAttribute('id','rss_imageDetails');
		objImageData.appendChild(objImageDetails);
	
		var objNumberDisplay = document.createElement("span");
		objNumberDisplay.setAttribute('id','rss_numberDisplay');
		objImageDetails.appendChild(objNumberDisplay);
		
		var objCaption = document.createElement("span");
		objCaption.setAttribute('id','rss_caption');
		objImageDetails.appendChild(objCaption);
		
		var objdescripgal=document.createElement("div");
		objdescripgal.setAttribute('id','rss_descripgal');
		objImageDetails.appendChild(objdescripgal);
		
		var objcredito=document.createElement("div");
		objcredito.setAttribute('id','rss_credito');
		objImageDetails.appendChild(objcredito);
		
		var objNumberDisplay=document.createElement("div");
		objNumberDisplay.setAttribute('id','rss_numberDisplay');
		objImageDetails.appendChild(objNumberDisplay);
		
		
	},


	//
	// updateImageList()
	// Loops through anchor tags looking for 'rss_lightbox' references and applies onclick
	// events to appropriate links. You can rerun after dynamically adding images w/ajax.
	//
	updateImageList: function() {	
		if (!document.getElementsByTagName){ return; }
		var anchors = document.getElementsByTagName('a');
		var areas = document.getElementsByTagName('area');

		// loop through all anchor tags
		for (var i=0; i<anchors.length; i++){
			var anchor = anchors[i];
			
			var relAttribute = String(anchor.getAttribute('rel'));
			
			// use the string.match() method to catch 'rss_lightbox' references in the rel attribute
			if (anchor.getAttribute('href') && (relAttribute.toLowerCase().match('rss_lightbox'))){
				anchor.onclick = function () {rssMyLightbox.start(this); return false;}
			}
		}

		// loop through all area tags
		// todo: combine anchor & area tag loops
		for (var i=0; i< areas.length; i++){
			var area = areas[i];
			
			var relAttribute = String(area.getAttribute('rel'));
			
			// use the string.match() method to catch 'rss_lightbox' references in the rel attribute
			if (area.getAttribute('href') && (relAttribute.toLowerCase().match('rss_lightbox'))){
				area.onclick = function () {rssMyLightbox.start(this); return false;}
			}
		}
	},
	
	
	//
	//	start()
	//	Display overlay and lightbox. If image is part of a set, add siblings to rss_imageArray.
	//
	start: function(jsondata) {	

		hideSelectBoxes();
		hideFlash();

		// stretch overlay to fill page and fade in
		var arrayPageSize = getPageSize();
		Element.setWidth('rss_overlay', arrayPageSize[0]);
		Element.setHeight('rss_overlay', arrayPageSize[1]);

		new Effect.Appear('rss_overlay', { duration: rss_overlayDuration, from: 0.0, to: rss_overlayOpacity });

		rss_imageArray = [];
		imageNum = 0;		

		if (!document.getElementsByTagName){ return; }
		//var anchors = document.getElementsByTagName( imageLink.tagName);

		var i=1;
		//for(var i=0;i<jsondata.picture.length;i++){
		while(jsondata.picture[i]!=undefined){
			var pic=jsondata["picture"][i];
			var tit=jsondata["title"][i];
			var cre=jsondata["credit"][i];
			var des=jsondata["author"][i];
			rss_imageArray.push(new Array(pic,tit,cre,des));
			i++;
		}
		// calculate top and left offset for the lightbox 
		var arrayPageScroll = getPageScroll();
		var lightboxTop = arrayPageScroll[1] + (arrayPageSize[3] / 23);
		//var lightboxTop = 5;
		var lightboxLeft = arrayPageScroll[0];
		Element.setTop('rss_lightbox', lightboxTop);
		Element.setLeft('rss_lightbox', lightboxLeft);
		
		Element.show('rss_lightbox');
		
		this.changeImage(imageNum);
	},

	//
	//	changeImage()
	//	Hide most elements and preload image in preparation for resizing image container.
	//
	changeImage: function(imageNum) {	
		
		rss_activeImage = imageNum;	// update global var

		// hide elements during transition
		if(rss_animate){ Element.show('rss_loading');}
		
		Element.hide('rss_lightboxImage');
		Element.hide('rss_bottomNav');
		Element.hide('rss_hoverNav');
		Element.hide('rss_prevLink');
		Element.hide('rss_nextLink');
		Element.hide('rss_imageDataContainer');
		Element.hide('rss_numberDisplay');		
		Element.hide('rss_enlaces');
		
		imgPreloader = new Image();
		
		// once image is preloaded, resize image container
		imgPreloader.onload=function(){
			Element.setSrc('rss_lightboxImage', rss_imageArray[rss_activeImage][0]);
			rssMyLightbox.resizeImageContainer(imgPreloader.width, imgPreloader.height);
			
			imgPreloader.onload=function(){};	//	clear onLoad, IE behaves irratically with animated gifs otherwise 
		}
		imgPreloader.src = rss_imageArray[rss_activeImage][0];
	},

	//
	//	resizeImageContainer()
	//
	resizeImageContainer: function( imgWidth, imgHeight) {

		// get curren width and height
		this.widthCurrent = Element.getWidth('rss_outerImageContainer');
		this.heightCurrent = Element.getHeight('rss_outerImageContainer');

		// get new width and height
		var widthNew = (imgWidth  + (rss_borderSize * 2));
		var heightNew = (imgHeight  + (rss_borderSize * 2));

		// scalars based on change from old to new
		this.xScale = ( widthNew / this.widthCurrent) * 100;
		this.yScale = ( heightNew / this.heightCurrent) * 100;

		// calculate size difference between new and old image, and resize if necessary
		wDiff = this.widthCurrent - widthNew;
		hDiff = this.heightCurrent - heightNew;

		if(!( hDiff == 0)){ new Effect.Scale('rss_outerImageContainer', this.yScale, {scaleX: false, duration: rss_resizeDuration, queue: 'front'}); }
		if(!( wDiff == 0)){ new Effect.Scale('rss_outerImageContainer', this.xScale, {scaleY: false, delay: rss_resizeDuration, duration: rss_resizeDuration}); }

		// if new and old image are same size and no scaling transition is necessary, 
		// do a quick pause to prevent image flicker.
		if((hDiff == 0) && (wDiff == 0)){
			if (navigator.appVersion.indexOf("MSIE")!=-1){ pause(250); } else { pause(100);} 
		}

		//Element.setHeight('rss_prevLink', imgHeight);
		//Element.setHeight('rss_nextLink', imgHeight);
		Element.setWidth( 'rss_imageDataContainer', widthNew);

		this.showImage();
	},
	
	//
	//	showImage()
	//	Display image and begin preloading neighbors.
	//
	showImage: function(){
		Element.hide('rss_loading');
		Effect.Appear('rss_bottomNav',{duration: rss_resizeDuration});
		new Effect.Appear('rss_lightboxImage', { duration: rss_resizeDuration, queue: 'end', afterFinish: function(){	rssMyLightbox.updateDetails(); } });
		this.preloadNeighborImages();
	},

	//
	//	updateDetails()
	//	Display caption, image number, and bottom nav.
	//
	updateDetails: function() {
		
	
		// if caption is not null
		if(rss_imageArray[rss_activeImage][1]){
			Element.show('rss_caption');
			Element.setInnerHTML( 'rss_caption', rss_imageArray[rss_activeImage][1]);
		}
		var divcito=document.getElementById('rss_enlaces');
		divcito.innerHTML="";
		var texto="";
		var linksito="";
		
		// if image is part of set display 'Image x of x' 
		if(rss_imageArray.length > 1){
			for(rss_ix=0;rss_ix<rss_imageArray.length;rss_ix++){
				if(rss_imageArray.length > 1){
					Element.show('rss_numberDisplay');
					Element.setInnerHTML( 'rss_numberDisplay', "Image " + eval(rss_activeImage + 1) + " of " + rss_imageArray.length);
					linksito=document.createElement("a");
					linksito.href="javascript: rssMyLightbox.changeImage("+rss_ix+");"
					barra=document.createTextNode("  ");
					if (rss_activeImage == rss_ix){
						texto=document.createTextNode("["+(rss_ix+1)+"]");
						
					} else {
						texto=document.createTextNode(rss_ix+1);
					}
					linksito.appendChild(texto);
					divcito.appendChild(barra);
					divcito.appendChild(linksito);
				}				
			}
		}
		Element.show('rss_enlaces');
		Element.show('rss_hoverNav');
		Element.setInnerHTML('rss_credito',rss_imageArray[rss_activeImage][2]);
		Element.setInnerHTML('rss_descripgal',rss_imageArray[rss_activeImage][3]);
		
		new Effect.Parallel(
			[ new Effect.SlideDown( 'rss_imageDataContainer', { sync: true, duration: rss_resizeDuration, from: 0.0, to: 1.0 }), 
			  new Effect.Appear('rss_imageDataContainer', { sync: true, duration: rss_resizeDuration }) ], 
			{ duration: rss_resizeDuration, afterFinish: function() {
				// update overlay size and update nav
				var arrayPageSize = getPageSize();
				Element.setHeight('rss_overlay', arrayPageSize[1]);
				rssMyLightbox.updateNav();
				}
			} 
		);
	},

	//
	//	updateNav()
	//	Display appropriate previous and next hover navigation.
	//
	updateNav: function() {

		Element.show('rss_hoverNav');				

		// if not first image in set, display prev image button
		if(rss_activeImage != 0){
			Element.show('rss_prevLink');
			document.getElementById('rss_prevLink').onclick = function() {
				rssMyLightbox.changeImage(rss_activeImage - 1); return false;
			}
		}

		// if not last image in set, display next image button
		if(rss_activeImage != (rss_imageArray.length - 1)){
			Element.show('rss_nextLink');
			document.getElementById('rss_nextLink').onclick = function() {
				rssMyLightbox.changeImage(rss_activeImage + 1); return false;
			}
		}
		
		this.enableKeyboardNav();
	},

	//
	//	enableKeyboardNav()
	//
	enableKeyboardNav: function() {
		document.onkeydown = this.keyboardAction; 
	},

	//
	//	disableKeyboardNav()
	//
	disableKeyboardNav: function() {
		document.onkeydown = '';
	},

	//
	//	keyboardAction()
	//
	keyboardAction: function(e) {
		if (e == null) { // ie
			keycode = event.keyCode;
			escapeKey = 27;
		} else { // mozilla
			keycode = e.keyCode;
			escapeKey = e.DOM_VK_ESCAPE;
		}

		key = String.fromCharCode(keycode).toLowerCase();
		
		if((key == 'x') || (key == 'o') || (key == 'c') || (keycode == escapeKey)){	// close lightbox
			rssMyLightbox.end();
		} else if((key == 'p') || (keycode == 37)){	// display previous image
			if(rss_activeImage != 0){
				rssMyLightbox.disableKeyboardNav();
				rssMyLightbox.changeImage(rss_activeImage - 1);
			}
		} else if((key == 'n') || (keycode == 39)){	// display next image
			if(rss_activeImage != (rss_imageArray.length - 1)){
				rssMyLightbox.disableKeyboardNav();
				rssMyLightbox.changeImage(rss_activeImage + 1);
			}
		}

	},

	//
	//	preloadNeighborImages()
	//	Preload previous and next images.
	//
	preloadNeighborImages: function(){

		if((rss_imageArray.length - 1) > rss_activeImage){
			preloadNextImage = new Image();
			preloadNextImage.src = rss_imageArray[rss_activeImage + 1][0];
		}
		if(rss_activeImage > 0){
			preloadPrevImage = new Image();
			preloadPrevImage.src = rss_imageArray[rss_activeImage - 1][0];
		}
	
	},

	//
	//	end()
	//
	end: function() {
		this.disableKeyboardNav();
		Element.hide('rss_lightbox');
		new Effect.Fade('rss_overlay', { duration: rss_overlayDuration});
		showSelectBoxes();
		showFlash();
	}
}

// -----------------------------------------------------------------------------------

//
// getPageScroll()
// Returns array with x,y page scroll values.
// Core code from - quirksmode.com
//
function getPageScroll(){

	var xScroll, yScroll;

	if (self.pageYOffset) {
		yScroll = self.pageYOffset;
		xScroll = self.pageXOffset;
	} else if (document.documentElement && document.documentElement.scrollTop){	 // Explorer 6 Strict
		yScroll = document.documentElement.scrollTop;
		xScroll = document.documentElement.scrollLeft;
	} else if (document.body) {// all other Explorers
		yScroll = document.body.scrollTop;
		xScroll = document.body.scrollLeft;	
	}

	arrayPageScroll = new Array(xScroll,yScroll) 
	return arrayPageScroll;
}

// -----------------------------------------------------------------------------------

//
// getPageSize()
// Returns array with page width, height and window width, height
// Core code from - quirksmode.com
// Edit for Firefox by pHaez
//
function getPageSize(){
	
	var xScroll, yScroll;
	
	if (window.innerHeight && window.scrollMaxY) {	
		xScroll = window.innerWidth + window.scrollMaxX;
		yScroll = window.innerHeight + window.scrollMaxY;
	} else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
		xScroll = document.body.scrollWidth;
		yScroll = document.body.scrollHeight;
	} else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
		xScroll = document.body.offsetWidth;
		yScroll = document.body.offsetHeight;
	}
	
	var windowWidth, windowHeight;
	
//	console.log(self.innerWidth);
//	console.log(document.documentElement.clientWidth);

	if (self.innerHeight) {	// all except Explorer
		if(document.documentElement.clientWidth){
			windowWidth = document.documentElement.clientWidth; 
		} else {
			windowWidth = self.innerWidth;
		}
		windowHeight = self.innerHeight;
	} else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
		windowWidth = document.documentElement.clientWidth;
		windowHeight = document.documentElement.clientHeight;
	} else if (document.body) { // other Explorers
		windowWidth = document.body.clientWidth;
		windowHeight = document.body.clientHeight;
	}	
	
	// for small pages with total height less then height of the viewport
	if(yScroll < windowHeight){
		pageHeight = windowHeight;
	} else { 
		pageHeight = yScroll;
	}

//	console.log("xScroll " + xScroll)
//	console.log("windowWidth " + windowWidth)

	// for small pages with total width less then width of the viewport
	if(xScroll < windowWidth){	
		pageWidth = xScroll;		
	} else {
		pageWidth = windowWidth;
	}
//	console.log("pageWidth " + pageWidth)

	arrayPageSize = new Array(pageWidth,pageHeight,windowWidth,windowHeight) 
	return arrayPageSize;
}

// -----------------------------------------------------------------------------------

//
// getKey(key)
// Gets keycode. If 'x' is pressed then it hides the lightbox.
//
function getKey(e){
	if (e == null) { // ie
		keycode = event.keyCode;
	} else { // mozilla
		keycode = e.which;
	}
	key = String.fromCharCode(keycode).toLowerCase();
	
	if(key == 'x'){
	}
}

// -----------------------------------------------------------------------------------

//
// listenKey()
//
function listenKey () {	document.onkeypress = getKey; }
	
// ---------------------------------------------------

function showSelectBoxes(){
	var selects = document.getElementsByTagName("select");
	for (i = 0; i != selects.length; i++) {
		selects[i].style.visibility = "visible";
	}
}

// ---------------------------------------------------

function hideSelectBoxes(){
	var selects = document.getElementsByTagName("select");
	for (i = 0; i != selects.length; i++) {
		selects[i].style.visibility = "hidden";
	}
}

// ---------------------------------------------------

function showFlash(){
	var flashObjects = document.getElementsByTagName("object");
	for (i = 0; i < flashObjects.length; i++) {
		flashObjects[i].style.visibility = "visible";
	}

	var flashEmbeds = document.getElementsByTagName("embed");
	for (i = 0; i < flashEmbeds.length; i++) {
		flashEmbeds[i].style.visibility = "visible";
	}
}

// ---------------------------------------------------

function hideFlash(){
	var flashObjects = document.getElementsByTagName("object");
	for (i = 0; i < flashObjects.length; i++) {
		flashObjects[i].style.visibility = "hidden";
	}

	var flashEmbeds = document.getElementsByTagName("embed");
	for (i = 0; i < flashEmbeds.length; i++) {
		flashEmbeds[i].style.visibility = "hidden";
	}

}


// ---------------------------------------------------

//
// pause(numberMillis)
// Pauses code execution for specified time. Uses busy code, not good.
// Help from Ran Bar-On [ran2103@gmail.com]
//

function pause(ms){
	var date = new Date();
	curDate = null;
	do{var curDate = new Date();}
	while( curDate - date < ms);
}
/*
function pause(numberMillis) {
	var curently = new Date().getTime() + sender;
	while (new Date().getTime();	
}
*/
// ---------------------------------------------------



function rss_initLightbox() { rssMyLightbox = new rss_Lightbox(); }
Event.observe(window, 'load', rss_initLightbox, false);

function showRssLoader(){
	//theobject.disabled=true;

	hideSelectBoxes();
	hideFlash();

	
	var objBody = document.getElementsByTagName("body").item(0);
	var objOverlay = document.createElement("div");
	objOverlay.setAttribute('id','rss_LoaderRssOverlay');
	objOverlay.style.display = 'none';
	objBody.appendChild(objOverlay);
	
	var objLoadingRssContainer=document.createElement("div");
	objLoadingRssContainer.setAttribute('id','rss_loadingRssContainer');
	objLoadingRssContainer.style.display = 'none';
	objBody.appendChild(objLoadingRssContainer);
	
	var objimageRssLoader=document.createElement("img");
	objimageRssLoader.setAttribute('src',rss_loadingmsg);
	objimageRssLoader.setAttribute('id','rss_imageRssLoader');
	objLoadingRssContainer.appendChild(objimageRssLoader);
	
	
	
	//ahora se muestran los elementos
	//1. overlay
	var arrayPageSize = getPageSize();
	Element.setWidth('rss_LoaderRssOverlay', arrayPageSize[0]);
	Element.setHeight('rss_LoaderRssOverlay', arrayPageSize[1]);
	
	//2. mensaje
	var arrayPageScroll = getPageScroll();
	var lightboxTop = arrayPageScroll[1] + (arrayPageSize[3] / 2);
		//var lightboxTop = 5;
	var pageSize = getPageSize()
	var lightboxLeft = arrayPageScroll[0];
	
	new Effect.Appear('rss_LoaderRssOverlay', { duration: rss_overlayDuration, from: 0.0, to: rss_overlayOpacity });
	Element.setTop('rss_loadingRssContainer', lightboxTop);
	Element.setLeft('rss_loadingRssContainer', lightboxLeft);
	Element.show('rss_loadingRssContainer');
}

function hideRssLoader(){
	Element.hide('rss_loadingRssContainer');
	Effect.Fade('rss_LoaderRssOverlay', { duration: 0.1});
		showSelectBoxes();
		showFlash();
}


function startRssLightbox(theurl,service) {
	showRssLoader();
	var modelo = {
		method:"post",
		contentType:"application/x-www-form-urlencoded",
		parameters:"remoteurl="+theurl+"&service="+service,
		onSuccess:resultado,
		onFailure:fallo
	};
	new Ajax.Request(jsonservice, modelo);
	
}


function fallo(e){
	$('ajax-gif').innerHTML='';
	alert("you have a bad configuration of your wordpress plugin.");
}

function resultado(e){
	hideRssLoader();
	var x=eval(e.responseText);
	_rss_data = x;
	rssMyLightbox.start(_rss_data);
}