
var itemDivs = document.getElementsByClassName('weapon_container')
var ingrDivs = document.getElementsByClassName('ingr_container')
var popup = document.createElement('div');
var ingrpopup = document.createElement('div');
/*                                                            инициализация кнопок*/
for(var i=0; i<itemDivs.length; i++){
	itemDivs[i].setAttribute('onmouseover', 'itemdivMouseover(this)')
	itemDivs[i].setAttribute('onmouseout', 'itemdivMouseout(this)')
	var wepName = weaponsDB[itemDivs[i].dataset.iid].name
	if(weaponsDB[itemDivs[i].dataset.iid].u5th){
		wepName = wepName + ' 10'
	} else {
		wepName = wepName + ' 5'
	}
	itemDivs[i].innerHTML = wepName
}
for(var i=0; i<ingrDivs.length; i++){
	ingrDivs[i].setAttribute('onmouseover', 'ingrdivMouseover(this)')
	ingrDivs[i].setAttribute('onmouseout', 'ingrdivMouseout(this)')
	var ingrBack =ingrDB[ingrDivs[i].dataset.iid].icon
	ingrDivs[i].style.background = 'url('+ingrBack+') white no-repeat'
	ingrDivs[i].style.backgroundSize = '100%'
	ingrDivs[i].style.backgroundOrigin ='content-box'
	ingrDivs[i].style.padding = "2px"
}
/*                                                            генерация попапов*/
function itemdivMouseover(el){
	if(window.innerWidth<1024) return
	var itemid = el.dataset.iid
	var w = weaponsDB[itemid]
	//popup = document.createElement('div');
	popup.classList.add('wepPopup')
	if((getOffset(el).left+el.offsetWidth+400)>window.innerWidth){
		popup.style.left = getOffset(el).left - 332 +'px'
	} else{
		popup.style.left = getOffset(el).left + el.offsetWidth +'px'
	}
	popup.style.top = (getOffset(el).top)-130 + 'px'
	popup.setAttribute('onmouseover', 'popupMouseover(this)')
	popup.setAttribute('onmouseout', 'popupMouseout(this)')
	
	var buff=''
	
	var name= ''
	if(w.u5th){
		name = w.name + ' 10'
	} else {
		name = w.name + ' 5'
	}
	buff += '<div class="wname w'+w.color+'">' + name + '</div>' +
			'<div class="wmain_descr">' +
				'<div style="overflow: hidden; padding-bottom: 15px;"><div class="wicon" style="background: url('+ w.icon +');background-size: cover"></div>' +
				'<div class="watk">' +
					'<div class="wmatk"> Сила атаки ' +w.atk+ '</div>'
	for(var i=0; i<w.ad_atk.length; i++){
		buff+='<span>'+w.ad_atk[i]+'</span></br>'
	}			
	buff+=		''+
				'</div></div>'
			'</div>'
	if(w.effects){
		for(var i=0; i<w.effects.length; i++){
			buff+='<div class="weffect">'+w.effects[i]+'</div>'
		}
	}
	if(w.up){
		buff+='<div class="wup"><span class="wuptitle">Развитие</span><br><span class="wupunder">Прорыв на 5 уровне:</span></div>'
		for(var i=0; i<w.up.length; i++){
			var color = weaponsDB[w.up[i]].color
			var name = weaponsDB[w.up[i]].name
			if(weaponsDB[w.up[i]].u5th){
				name = name + ' 10'
			} else {
				name = name + ' 5'
			}
			buff+='<div class="wup5 w'+color+'">'+name+'</div>'
		}
	}
	if(w.max){
		var color1 = weaponsDB[w.max[0]].color
		var color2 = weaponsDB[w.max[1]].color
		var color3 = weaponsDB[w.max[2]].color
		var name1 = weaponsDB[w.max[0]].name
		var name2 = weaponsDB[w.max[1]].name
		var name3 = weaponsDB[w.max[2]].name
		if(weaponsDB[w.max[0]].u5th){
			name1 = name1 + ' 10'
		} else {
			name1 = name1 + ' 5'
		}
		if(weaponsDB[w.max[1]].u5th){
			name2 = name2 + ' 10'
		} else {
			name2 = name2+ ' 5'
		}
		if(weaponsDB[w.max[2]].u5th){
			name3 = name3 + ' 10'
		} else {
			name3 = name3 + ' 5'
		}
		buff+='<div class="wup"><span class="wupunder">Слияние на 10 уровне:</span></div>'
		buff+='<div class="wupmax"><span class="w'+color1+'">'+ name1 +'</span> + <span class="w'+color2+'">'+ name2 +'</span> = <span class="w'+color3+'">'+ name3 +'</span>' +
			'</div>'
	}
	buff+= '<div class="wobtaining"><span class="wuptitle">Подбор</span><br>' + w.obtaining + '</div>'
	buff+= '<div class="wstartlvl"><span class="wuptitle">Необходимый уровень</span><br>' + w.startlvl + '</div>'
	
	popup.id = 'w_' + itemid
	popup.innerHTML = buff

	document.body.appendChild(popup)
}

function ingrdivMouseover(el){
	if(window.innerWidth<1024) return
	var itemid = el.dataset.iid
	var it = ingrDB[itemid]
	
	ingrpopup.classList.add('ingrPopup')
	ingrpopup.style.left = getOffset(el).left + el.offsetWidth +'px'
	ingrpopup.style.top = (getOffset(el).top)-25 + 'px'
	
	ingrpopup.setAttribute('onmouseover', 'popupMouseover(this)')
	ingrpopup.setAttribute('onmouseout', 'popupMouseout(this)')
	
	ingrpopup.id = 'i_' + itemid
	ingrpopup.innerHTML = '<div class="wname ">'+it.name+'</div>'+
							'<div class="wmain_descr"><span class="wuptitle">Подбор</span></br>'+it.obtaining+'</div>'
	document.body.appendChild(ingrpopup)
}
/*                                                            удаление попапов*/
function popupMouseover(el){
	el.classList.add('hovered')
}
function popupMouseout(el){
	el.classList.remove('hovered')
}
function itemdivMouseout(el){
	setTimeout(function(){
		try{
			var elemid = 'w_' + el.dataset.iid
			var target = document.getElementById(elemid)
			if(target.classList.contains('hovered')){
				itemdivMouseout(el)
			} else {
				remove(el)
			}
		}catch(e){}
	},300)
}
function ingrdivMouseout(el){
	setTimeout(function(){
		try{
			var elemid = 'i_' + el.dataset.iid
			var target = document.getElementById(elemid)
			if(target.classList.contains('hovered')){
				ingrdivMouseout(el)
			} else {
				remove(el)
			}
		}catch(e){}
	},300)
}
/*                                                            утилс*/
function getOffset(elem) {
	if (elem.getBoundingClientRect) {
		return getOffsetRect(elem)
	} else {
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
	var box = elem.getBoundingClientRect()
	var body = document.body
	var docElem = document.documentElement
	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
	var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
	var clientTop = docElem.clientTop || body.clientTop || 0
	var clientLeft = docElem.clientLeft || body.clientLeft || 0
	var top  = box.top +  scrollTop - clientTop
	var left = box.left + scrollLeft - clientLeft
	return { top: Math.round(top), left: Math.round(left) }
}
function remove(el){
	if(el.classList.contains('ingr_container')) {
		elemid = 'i_' + el.dataset.iid
	} else {
		elemid = 'w_' + el.dataset.iid
	}
	try{
		return document.getElementById(elemid).parentNode.removeChild(document.getElementById(elemid));
	} catch(e){}
    
}
