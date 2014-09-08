document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        init();
    }
}
function init(){
	
	for(i = 0; i< document.getElementsByClassName('class_but').length; i++)
		document.getElementsByClassName('class_but')[i].addEventListener('click', switchClass)
	for (i in document.getElementsByClassName('wep_select')){
		document.getElementsByClassName('wep_select')[i].innerHTML = "Кодати"
	}
}

function switchClass(e){
	mapping = {
		"sin":"Кодати",
		"sum":"Талисман",
		"kun":"Кастеты",
		"for":"Амулет",
		"des":"Секира",
		"blm":"Меч",
		"lbm":"Тати"
	}
	for (i in document.getElementsByClassName('wep_select')){
		document.getElementsByClassName('wep_select')[i].innerHTML = mapping[e.target.getAttribute('cl')]
	}
	for (i in document.getElementsByClassName('class_but')){
		document.getElementsByClassName('class_but')[i].className = "class_but f_l"
		
	}
	e.target.className = "class_but f_l selected_but"
}