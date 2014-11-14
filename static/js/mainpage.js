document.onreadystatechange = function () {
    if (document.readyState == "complete") {
        init();
    }
}

function init(){
	window.onscroll = onScroll;
	onScroll()
	setBg(Math.floor(Math.random() * 4) + 0)

}
function onScroll() {
	var scrolled = window.pageYOffset || document.documentElement.scrollTop;
	con_bg.style.transform='translateY('+ (scrolled)*0.05+'px)'
}
function setBg(n){
	con_bg.style.background='url("img/mpi/'+n+'.jpg")'
	con_bg.style.backgroundSize='100%'
	if(n==1||n==2||n==4){
		document.getElementsByClassName('head_1')[0].style.color="white"
		document.getElementsByClassName('head_2')[0].style.color="white"
	}
}
