$ = document.querySelector.bind(document)
$$ = document.querySelectorAll.bind(document)
Element.prototype.$ = Element.prototype.querySelector
Element.prototype.$$ = Element.prototype.querySelectorAll

initCanvases()

function initCanvases(){
	var divs = $$('.for_canvas')
	for(var i=0; i<divs.length; i++){
		setUpCanvas(divs[i])
	}
}

// Попап с буквами
function makeHoverBox(){
	var div = document.createElement('div')
	div.className = 'hover_box'
	div.innerHTML = ''+
		'<div class="ca_content">'+
			'<span class="percent"></span>%<br>'+
			'<span class="value"></span>'+
		'</div>'
	return div
}
function showHoverBox(el, x, y, percent, value){
	var hoverBox = $('.hover_box') || makeHoverBox()
	hoverBox.style.display = 'block';
	hoverBox.$('.percent').textContent = percent|0
	hoverBox.$('.value').textContent = value|0
	hoverBox.style.left = x+'px'
	hoverBox.style.top = y+'px'
	if (hoverBox.parentNode != el) el.appendChild(hoverBox)
}
function hideHoverBox(){
	var hoverBox = $('.hover_box')
	if (hoverBox) hoverBox.style.display = 'none'
}

// Канвас для точки с пунктирами
function makeHoverCanvas(){
	var c = document.createElement('canvas')
	c.className = 'hover_canvas'
	c.ctx = c.getContext('2d')
	return c
}
function showHoverCanvas(el, canvas, padding, x, y){
	var hoverCanvas = $('.hover_canvas') || makeHoverCanvas()
	hoverCanvas.style.display = 'block';
	if (hoverCanvas.width != canvas.width) hoverCanvas.width = canvas.width
	if (hoverCanvas.height != canvas.height) hoverCanvas.height = canvas.height
	var height = canvas.height / devicePixelRatio
	var ctx = hoverCanvas.ctx
	ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
	
	var r = 3
	var dashStep = 5
	var dashLen = 4
	
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.strokeStyle = 'grey'
	ctx.fillStyle = '#5CA3F1'
	
	// Пунктиры
	ctx.beginPath()
	for (var i=padding; i<x-r; i+=dashStep) {
		ctx.moveTo(i,y)
		ctx.lineTo(i+dashLen,y)
	}
	for (var j=height-padding; j>y+r; j-=dashStep) {
		ctx.moveTo(x,j)
		ctx.lineTo(x,j-dashLen)
	}
	ctx.stroke()
	// Точка
	ctx.beginPath()
	ctx.arc(x,y, r, 0,Math.PI*2)
	ctx.fill()
	ctx.stroke()
	
	if (hoverCanvas.parentNode != el) el.appendChild(hoverCanvas)
}
function hideHoverCanvas(){
	var hoverCanvas = $('.hover_canvas')
	if (hoverCanvas) hoverCanvas.style.display = 'none'
}


function setUpCanvas(el){
	var padding = 40
	var highLight = {}
	highLight.start = '0'
	highLight.end = '100'
	
	var width = el.dataset.cWidth
	var height = el.dataset.cHeight
	var formula = el.dataset.cFormula
	
	var canvas = document.createElement('canvas')
	canvas.style.width = width +'px'
	canvas.style.height = height +'px'
	el.appendChild(canvas)
	var ctx = canvas.getContext("2d")
	
	resetAndDrawTheImage()
	window.addEventListener('resize', resetAndDrawTheImage, false)
	
	function calcPos(i) {
		var x = (10000/(width-2*padding))*i
		var yPerc = eval(formula)
		var y = height-((height-padding*2)/100*yPerc)-padding
		return {x:x, yPerc:yPerc, y:y}
	}
	
	function resetAndDrawTheImage() {
		ctx.canvas.width = width * devicePixelRatio
		ctx.canvas.height = height * devicePixelRatio
		ctx.scale(devicePixelRatio, devicePixelRatio)
		
		// Полосочки, текст
		var count = 0
		for(var i = height-padding; i>=padding; i-=(height-padding*2)/5){
			drawText(count+'%', 'grey',padding/5,i)
			count+=20
		}
		count = 10000
		for(var i = width-padding; i>=padding; i-=(width-padding*2)/5){
			drawText(count, 'grey',i,height-padding*0.5)
			count-=2000
		}
	
		drawLine(padding,padding*0.5, padding, height-padding, 'black')
		drawLine(padding, height-padding, width-padding*0.5, height-padding, 'black')
		// Кривая
		for(var i = padding; i<width-padding; i+=0.1){
			var p = calcPos(i-padding)
			if( p.yPerc>highLight.start && p.yPerc<highLight.end){
				drawDot(i, p.y-1.5, '#5CA3F1', 3)
			} else {
				drawDot(i, p.y)
			}
		}
	}
	
	function drawLine(fromX, fromY, toX, toY, color){
		var color = color||'grey'
		ctx.beginPath();
		ctx.moveTo(fromX, fromY);
		ctx.lineTo(toX, toY);
		ctx.strokeStyle = color;
		ctx.stroke();
	}
	function drawText(text, color, x, y){
		var color = color||'grey'
		var x = x||10
		var y = y||10
		ctx.font = "11px Helvetica";
		ctx.fillStyle = color
		ctx.fillText(text, x, y);
	}
	function drawDot(x,y, color, wide){
		var color = color||'grey'
		var wide = wide||1
		ctx.fillStyle = color
		ctx.fillRect(x,y,wide,wide)
	}
	
	function hover(clientX) {
		var rect = el.getBoundingClientRect()
		var i = clientX-rect.left
		if (i < padding) i = padding
		if (i > width-padding) i = width-padding
		var p = calcPos(i-padding)
		showHoverCanvas(el, canvas, padding, i, p.y)
		showHoverBox(el, i, p.y, p.yPerc, p.x)
	}
	function out(e) {
		hideHoverCanvas()
		hideHoverBox()
	}
	el.onmousemove = function(e){ hover(e.clientX) }
	el.onmouseup = el.onmouseout = out
	el.ontouchstart = el.ontouchmove = function(e){ hover(e.touches[0].clientX) }
	el.ontouchend = out
}
