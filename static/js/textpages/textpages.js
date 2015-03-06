var prevScrolPos = 0;
var scrolledOnlyDown = true

document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        init();
    }
}
function init(){
	for(var i=0; i<page_contents.getElementsByTagName('a').length; i++){
		if(page_contents.getElementsByTagName('a')[i].getAttribute('href')[0] == '#'){
			page_contents.getElementsByTagName('a')[i].addEventListener('click', anchorClick)
		}
	}
	if(document.location.hash){
		var scrolled = window.pageYOffset || document.documentElement.scrollTop
		scrollTo(0, scrolled-65)
	}
	window.onscroll = onScroll;
	onScroll()
	page_contents.className = 'pc_js pc_minimized pc_visible'
	page_contents.addEventListener('click', onPCclick)
}
function anchorClick(e){
	e.preventDefault()
	page = document.getElementsByClassName('page_text')[0]||document.getElementsByClassName('page')[0]
	targetHref = e.target.getAttribute('href').split('#')[1]
	for(var i=0; i<page.getElementsByTagName('a').length; i++){
		if(page.getElementsByTagName('a')[i].getAttribute('name')){
			if(page.getElementsByTagName('a')[i].getAttribute('name') == targetHref){
				SmothScrollTo(getOffset(page.getElementsByTagName('a')[i]).top-65)
				return
			}
		}
	}
}
function SmothScrollTo(pos){
	scrollTo(0,pos)
}
function onPCclick(e){
	if(e.target.tagName=='a'||e.target.tagName=='A') return
	if(page_contents.className == 'pc_js pc_maximized pc_visible'){
		page_contents.className = 'pc_js pc_minimized pc_visible'
	} else{
		page_contents.className = 'pc_js pc_maximized pc_visible'	
	}
}

function onScroll() {
	var scrolled = window.pageYOffset || document.documentElement.scrollTop;
	var pageTop = getOffsetRect(document.getElementsByClassName('page')[0]).top//130 by default
	try{
	if(scrolled>(pageTop+140) && fake_top_panel.className!="ftp_visible"){
		fake_top_panel.className="ftp_visible"
	} else if(scrolled<(pageTop+140)){
		fake_top_panel.className="ftp_hidden"
		fake_pages_list.className="hidden"
	}
	}catch(e){}
	if(scrolled<(pageTop+133) && scrolledOnlyDown){
		page_contents.style.top = (pageTop+50)-scrolled+'px'
		if(page_contents.className == 'pc_js pc_maximized pc_visible'){
			scrolledOnlyDown = false
		}
		if(page_contents.className == 'pc_js pc_minimized pc_hidden'){
			scrolledOnlyDown = true
		}
	} else {	
	if (prevScrolPos<scrolled && page_contents.className == 'pc_js pc_minimized pc_visible'){
			page_contents.style.top = (pageTop+50)-scrolled+'px'
			page_contents.className = 'pc_js pc_minimized pc_hidden'	
		}
		if (prevScrolPos>scrolled && page_contents.className == 'pc_js pc_minimized pc_hidden'){
			page_contents.className = 'pc_js pc_minimized pc_visible'
			scrolledOnlyDown = false
		}
		if((pageTop+50)-scrolled>(pageTop-30)){
			page_contents.style.top = (pageTop+50)-scrolled+'px'
			scrolledOnlyDown = true
		} else{
			if(!scrolledOnlyDown && scrolled!=0){
				page_contents.style.top = (pageTop-30)+'px'
			}
		}
	}
	prevScrolPos = scrolled
}
function togglePagesList(){
	if(fake_pages_list.className=="hidden"){
		fake_pages_list.className="fpl_visible"
	} else if(fake_pages_list.className=="fpl_visible"){
		fake_pages_list.className="fpl_hidden"
	} else if(fake_pages_list.className=="fpl_hidden"){
		fake_pages_list.className="fpl_visible"
	}
}

	function getOffset(elem) {
		if (elem.getBoundingClientRect) {
			// "правильный" вариант
			return getOffsetRect(elem)
		} else {
			// пусть работает хоть как-то
			return getOffsetSum(elem)
		}
	}
	function getOffsetSum(elem) {
		var top=0, left=0
		while(elem) {
			top = top + parseInt(elem.offsetTop)
			left = left + parseInt(elem.offsetLeft)
			elem = elem.offsetParent
		}
		return {top: top, left: left}
	}
	function getOffsetRect(elem) {
		// (1)
		var box = elem.getBoundingClientRect()

		// (2)
		var body = document.body
		var docElem = document.documentElement

		// (3)
		var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
		var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft

		// (4)
		var clientTop = docElem.clientTop || body.clientTop || 0
		var clientLeft = docElem.clientLeft || body.clientLeft || 0

		// (5)
		var top  = box.top +  scrollTop - clientTop
		var left = box.left + scrollLeft - clientLeft

		return { top: Math.round(top), left: Math.round(left) }
	}