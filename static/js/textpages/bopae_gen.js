
var planeDivs = document.getElementsByClassName('for_plane')
fillPlanes()

function fillPlanes(){
	for(var i=0; i< planeDivs.length; i++){
		genPlaneHTML(planeDivs[i])
	}
	
	function genPlaneHTML(elem){
		var plane_id = elem.dataset.itemId
		var plane_data = planesDB[plane_id]
		var result = ''
		result += ''+
			'<div class="plane_top">'+
				'<div class="pt_left f_l">'+
					'<div class="plane_title"><h2 class="'+ plane_data.color +'">'+ plane_data.name +'</h2></div>'+
					'<div class="plane_drop p_descr">'+ plane_data.obtaining +'</div>'
		if(plane_data.set_3)
			result+='<div class="plane_set_3 p_descr">'+ genSetData(plane_data.set_3) +'</div>'
		if(plane_data.set_5)
			result+='<div class="plane_set_5 p_descr">'+ genSetData(plane_data.set_5) +'</div>'
		if(plane_data.set_8)
			result+='<div class="plane_set_8 p_descr">'+ genSetData(plane_data.set_8) +'</div>'
		result+='</div>'+
				'<div class="pt_right f_l"><img src="'+plane_data.icon+'"></img></div>'+
			'</div>'
		result += '<div class="plane_table">' + genTable(plane_data) +'</div>'
		elem.innerHTML = result
	}
	function genSetData(data){
		var str = ''
		var keys = Object.keys(data)
		for(var i=0; i<keys.length; i++){
			str+= stat_namesDB[keys[i]].ru+' +'+ data[keys[i]]
			if(i<keys.length-1){
				str+=', '
			} else {
				str+=' '
			}
		}
		return str
	}
	function genTable(data){
		
		var str='<div>'+
					'<div>'+
						'<div>'+'<div class="p_num">8</div>'+genPieceData(data['piece_8'])+'</div>'+
						'<div>'+'<div class="p_num">7</div>'+genPieceData(data['piece_7'])+'</div>'+
						'<div>'+'<div class="p_num">6</div>'+genPieceData(data['piece_6'])+'</div>'+
					'</div>'+
				'</div>'+
				'<div>'+
					'<div>'+
						'<div>'+'<div class="p_num">1</div>'+genPieceData(data['piece_1'])+'</div>'+
						'<div><div class="tbnsblogo"><div>BnS Base</div></div></div>'+
						'<div>'+'<div class="p_num">5</div>'+genPieceData(data['piece_5'])+'</div>'+
					'</div>'+
				'</div>'+
				'<div>'+
					'<div>'+
						'<div>'+'<div class="p_num">2</div>'+genPieceData(data['piece_2'])+'</div>'+
						'<div>'+'<div class="p_num">3</div>'+genPieceData(data['piece_3'])+'</div>'+
						'<div>'+'<div class="p_num">4</div>'+genPieceData(data['piece_4'])+'</div>'+
					'</div>'+
				'</div>'
		/*
		var str='<div>'+
					'<div><div>'+'<div class="p_num">8</div>'+genPieceData(data['piece_8'])+'</div></div>'+
					'<div><div>'+'<div class="p_num">1</div>'+genPieceData(data['piece_1'])+'</div></div>'+
					'<div><div>'+'<div class="p_num">2</div>'+genPieceData(data['piece_2'])+'</div></div>'+
				'</div><div>'+
					'<div><div>'+'<div class="p_num">7</div>'+genPieceData(data['piece_7'])+'</div></div>'+
					'<div class="tbnsblogo">BnS Base</div>'+
					'<div><div>'+'<div class="p_num">3</div>'+genPieceData(data['piece_3'])+'</div></div>'+
				'</div><div>'+
					'<div><div>'+'<div class="p_num">6</div>'+genPieceData(data['piece_6'])+'</div></div>'+
					'<div><div>'+'<div class="p_num">5</div>'+genPieceData(data['piece_5'])+'</div></div>'+
					'<div><div>'+'<div class="p_num">4</div>'+genPieceData(data['piece_4'])+'</div></div>'+
				'</div>'
		*/
		return str
	}
	function genPieceData(data){
		var str = ''
		if(data.main_min||data.min){
			var statName = Object.keys(data.main_min)
			var statName_lang = stat_namesDB[statName].ru
			str+='<div class="main_stat">'+statName_lang+' '+ data.main_min[statName]+'–'+data.main_max[statName]+'</div>'
			
			var keys = Object.keys(data.min)
			for(var i=0; i<keys.length; i++){
				str+= '<div>' + stat_namesDB[keys[i]].ru+' '+ data.min[keys[i]] +'–'+ data.max[keys[i]] +'</div>'
			}
		}else{
			var keys = Object.keys(data)
			for(var i=0; i<keys.length; i++){
				str+= '<div>' + stat_namesDB[keys[i]].ru+' '+ data[keys[i]] +'–'+ data[keys[i]] +'</div>'
			}
		}
		return str
	}
}