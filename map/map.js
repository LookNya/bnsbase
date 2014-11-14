curPin={"isActive":false,"id":0 };
curMap="f";
searchBuff=""
calcedHeight = 0;
calcedWidth = 0;
sliderHeight=556;

document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        init();
    }
}

function init(){
	calcMapSize()
	loadMap('f')
    loadSearchItems()
    loadPins()
    initSearch()
	initTopMenu()
    document.getElementById('map').addEventListener('click', mapClick)
	window.onresize = function(){calcMapSize()}
	openHash()
}
function openHash(){
	
	hash = window.location.hash
	if(hashNotValid()){
		return
	}
	if(document.getElementById(hash.split('#')[1])){
		document.getElementById(hash.split('#')[1]).click()
	} else {
		loadMap(hash.split('#')[1][0])
	}
	function hashNotValid(){
		if(!hash){
			return true
		}	
		if(hash.split('#')[1][0]=='f'||hash.split('#')[1][0]=='d'||hash.split('#')[1][0]=='p'){
			return false
		}
		var data = hash.split('#')[1]
		if(items_description[data]){
			return false
		}
		return true
	}
}
function calcMapSize(){
	minWidth=750
	width = window.innerWidth || document.body.clientWidth
	height = window.innerHeight || document.body.clientHeight
	calcedWidth=width-(60*3+275)
	if(calcedWidth>1024) calcedWidth = 1024
	calcedHeight = Math.round(calcedWidth*0.8085)
	if(calcedHeight+150>height){
		calcedHeight = height-150;
		calcedWidth = Math.round(calcedHeight*1.2367)
	}
	if(calcedWidth<minWidth){
		calcedWidth = minWidth
		calcedHeight = Math.round(calcedWidth*0.8085)
	}
	map.style.width = calcedWidth+"px"
	map.style.height = calcedHeight+"px"
	document.getElementsByClassName('items_container')[0].style.height = calcedHeight+"px"
	ic.style.height = calcedHeight-document.getElementsByClassName('items_search')[0].offsetHeight+"px"
	document.getElementsByClassName('selector')[0].style.width = document.getElementsByClassName('main_map_wrap')[0].offsetWidth - 100 +'px'
}
function casheMap(){ // currently not used
	document.getElementsByClassName('map_container')[0].setAttribute('class', 'map_container f_l blured')
	img = new Image()
	img.src='http://i.imgur.com/ob6cKSP.jpg'
	img.onload = function(){
		loadMap('f')
	}
	document.getElementsByClassName('map_container')[0].setAttribute('class', 'map_container f_l')
}
function loadMap(m){
    curMap=m
    maps={"f":"forest", "d":"desert", "p":"plane"}
	document.getElementById('map').className=maps[m]
	for(i=0; i<document.getElementsByClassName('class_but').length; i++){
		document.getElementsByClassName('class_but')[i].className = "class_but f_l"
		if(document.getElementsByClassName('class_but')[i].getAttribute('cl')==m){
			document.getElementsByClassName('class_but')[i].className = "class_but f_l selected_but"
		}
	}
	//document.getElementByClassName('map_container')[0].className="map_container blured"
}
function loadSearchItems(){
    var items_buff=""
    for (i=0; i<Object.keys(items_description).length; i++){
        if(items_description[Object.keys(items_description)[i]].searchable){
            for(j=0; j<items_description[Object.keys(items_description)[i]].items_here.length; j++){
                items_buff+='<div class="search_item" s_id="'+Object.keys(items_description)[i]+'">'+items_description[Object.keys(items_description)[i]].items_here[j]+'</div>'
            }
        }
    }
    ic.innerHTML=items_buff
    for (i=0; i<document.getElementsByClassName('search_item').length; i++){
        document.getElementsByClassName('search_item')[i].addEventListener('click', callPin)
    }
}
function loadPins(){
    var pins_buff=""
    var pin_location="forest_pin"
    for (i=0; i<Object.keys(items_description).length; i++){
        if(Object.keys(items_description)[i].charAt(0)=="f"){
            pin_location="forest_pin"
        } else if(Object.keys(items_description)[i].charAt(0)=="d"){
            pin_location="desert_pin"
        } else if(Object.keys(items_description)[i].charAt(0)=="p"){
            pin_location="plane_pin"
        }
        pins_buff+='<div class="pin '+pin_location+'" id="' +Object.keys(items_description)[i]+'"></div>'
    }
    pins_buff+= '<div id="map_data_slider" class="slider_closed"></div> <div id="slider_pointer" class="hidden"></div>'
    map.innerHTML=pins_buff
    for (i=0; i<document.getElementsByClassName('pin').length; i++){
        document.getElementsByClassName('pin')[i].addEventListener('click', pinSelect)
    }
}
function initSearch(){

    //todo load search from adress

    setInterval(function(){
        if(searchBuff!=search_input.value){
            filterResults(search_input.value.toLowerCase())
            searchBuff=search_input.value
        } else {return}

    },300)
    function filterResults(querry){
        for (i=0; i<document.getElementsByClassName('search_item').length; i++){
			buffStr=document.getElementsByClassName('search_item')[i].innerText.toLowerCase()
            if(buffStr.indexOf(querry) + 1){
                document.getElementsByClassName('search_item')[i].className="search_item visible"
            } else if (buffStr.indexOf(querry) + 1 == 0){
                document.getElementsByClassName('search_item')[i].className="search_item hidden"
            }
        }
    }
}
function initTopMenu(){
	for(i=0; i<document.getElementsByClassName('class_but').length; i++){
		document.getElementsByClassName('class_but')[i].addEventListener('click', function(e){
			for(i=0; i<document.getElementsByClassName('class_but').length; i++){
				document.getElementsByClassName('class_but')[i].className = "class_but f_l"
			}
			e.target.className = "class_but f_l selected_but"
			closeMapSlider()
			loadMap(e.target.getAttribute('cl'))
		})
	}
}
function callPin(e){
    curPin={"isActive":false,"id":0 };
    document.getElementById(e.target.getAttribute('s_id')).click()
}


function mapClick(e){
	if(e.target.getAttribute('id')!="map") return
    closeMapSlider()
}
function closeMapSlider(){
    map_data_slider.className = "slider_closed"
    map_data_slider.style.top=""
    curPin.isActive=false
    slider_pointer.className="hidden"
	hideLinkForThisDangeon()
}
function pinSelect(e){
	e.preventDefault()
	id = e.target.getAttribute('id')
	
	if(!curPin.isActive){
		if(curMap!=id.charAt(0)){
			loadMap(id.charAt(0))
			updateMenu()
		}
	}
	leftPos = e.target.offsetLeft
	topPos = e.target.offsetTop
	
	if(!curPin.isActive){
		if(curMap!=id.charAt(0)){
			loadMap(id.charAt(0))
			updateMenu()
		}
		fillMapSlider(id)

		map_data_slider.style.top=calcedHeight+"px"
		map_data_slider.style.height=sliderHeight
		
		if(leftPos<calcedWidth/2){
			map_data_slider.style.left=parseFloat(leftPos)+15+25+"px"
		} else{
			map_data_slider.style.left=parseFloat(leftPos)-250-25+"px"
		}
		setTimeout(function(){
            placeSlider()
			if(topPos<40){
				slider_pointer.style.top=40+"px"
			}else if(topPos>calcedHeight-40){
				slider_pointer.style.top=calcedHeight-60+"px"
			} else{
				slider_pointer.style.top=parseFloat(topPos)+1+"px"
			}
			if(leftPos<calcedWidth/2){
			    slider_pointer.style.left= parseFloat(leftPos)+ 25+"px"
				slider_pointer.className="visible"
			} else{
			    slider_pointer.style.left= parseFloat(leftPos)-25+"px"
				slider_pointer.className="visible reverse"			
			}
        },30)
		map_data_slider.className = "slider_open"	

		
		curPin.isActive=true
		curPin.id=id
		createLinkForThisDangeon()
	} else if(curPin.isActive && curPin.id!=id){
		if(curMap!=id.charAt(0)){
			loadMap(id.charAt(0))
			updateMenu()
		}
        fillMapSlider(id)
		curPin.id=id
		createLinkForThisDangeon()
		
		placeSlider()
        if(leftPos<calcedWidth/2){
			map_data_slider.style.left=parseFloat(leftPos)+15+25+"px"
			slider_pointer.style.left= parseFloat(leftPos)+ 25+"px"
			slider_pointer.className="visible"
		} else{
			map_data_slider.style.left=parseFloat(leftPos)-250-25+"px"
			slider_pointer.style.left= parseFloat(leftPos)-25+"px"
			slider_pointer.className="visible reverse"
		}
        if(topPos<40){
			slider_pointer.style.top=40+"px"
		}else if(topPos>calcedHeight-40){
			slider_pointer.style.top=calcedHeight-60+"px"
		} else{
			slider_pointer.style.top=parseFloat(topPos)+1+"px"
		}

	} else if(curPin.isActive && curPin.id==id){
        closeMapSlider()
	}
	
	function placeSlider(){
		if(topPos>calcedHeight/2){
			if(calcedHeight-topPos>sliderHeight/2+50){
				map_data_slider.style.top=topPos-sliderHeight/2+"px"
			} else{
				map_data_slider.style.top=calcedHeight-sliderHeight-25+"px"
			}
		}else{
			if(calcedHeight-(calcedHeight-topPos)<sliderHeight/2+50){
				map_data_slider.style.top=25+"px"
			} else{
				map_data_slider.style.top=topPos-sliderHeight/2+"px"
			}
		}
	}
	
	function updateMenu(){
		for(i=0; i<document.getElementsByClassName('class_but').length; i++){
			if(document.getElementsByClassName('class_but')[i].getAttribute('cl')==id.charAt(0)){
				document.getElementsByClassName('class_but')[i].className = "class_but f_l selected_but"
			} else {
				document.getElementsByClassName('class_but')[i].className = "class_but f_l"
			}
		}
	}
}
function fillMapSlider(id){
	str = ""
	str+="<div id='mds_top'>"+ items_description[id].title +"</div>"
		//+"<img src='"+ items_description[id].pic_url +"'><div id='mds_body'><p></p>"
		+"<div class='mapbgdiv bg_for_"+ id +"'></div><div id='mds_body'><p></p>"
		//+"<p>"+ items_description[id].add_text +"</p>"
		+"<p></p>"
	for (i=0; i<items_description[id].pin_items.length; i++){
		str+="<p class='itype_"+ items_description[id].pin_items[i].type +"'>" 
		+ items_description[id].pin_items[i].name +"</p>"
	}
	str+="</div><div id='mds_bottom' onclick='closeMapSlider()'>Закрыть</div>"
    map_data_slider.innerHTML=str
	mds_body.style.height=sliderHeight-50-50-141-2+"px"
}
function createLinkForThisDangeon(){
	//dangeonLink.style.display = 'block'
	//window.location.hash = curPin.id
	dangeonLink.innerHTML = "Ссылка на данж: <a href='http://bnsbase.com/map#"+curPin.id+"'>bnsbase.com/map#"+curPin.id+"</a>"
}
function hideLinkForThisDangeon(){
	window.location.hash = ""
	//dangeonLink.style.display = 'none'
	dangeonLink.innerHTML = "</br>"
}