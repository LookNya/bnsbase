var Utils = new function() {
	function invert(str) {
		var res = {};
		for (var i=0; i<str.length; i++) res[str[i]] = i;
		return res;
	}
	
	this.extra_char = "&";
	
	this.chars_for_zeroes_encoding = "-abcdefghij"; // first char is not used
	this.int_by_char_for_zeroes_encoding = invert(this.chars_for_zeroes_encoding);
	
	this.rgx_for_zeroes_replace = new RegExp("0{2,"+(this.chars_for_zeroes_encoding.length)+"}", "g")
	this.rgx_for_zeroes_restore = new RegExp("["+this.chars_for_zeroes_encoding.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1")+"]", "g");
	
	this.chars_for_encoding =
		"0123456789"+
		"ABCDEFGHIJKLMNOPQRSTUVWXYZ"+
		          "klmnopqrstuvwxyz";
	this.int_by_char_for_encoding = invert(this.chars_for_encoding);
}



Utils.getClassName = function() {
	var m = location.pathname.match(/\/(sum|des|bm|lsm|asn|kfm|fm)\//);
	return m ? m[1] : "noclass";
}



Utils._describeEffect = function(prev_effects, curr_effects, effect_type) {
	var curr_value = curr_effects[effect_type];
	var prev_value = prev_effects[effect_type];
	
	if (prev_value == curr_value)
		return {status:"still", curr:curr_value, prev:prev_value, type:effect_type};
	
	if (prev_value === undefined)
		return {status:"new", curr:curr_value, prev:"", type:effect_type};
	
	if (curr_value === undefined)
		return {status:"delete", curr:"", prev:prev_value, type:effect_type};
	
	return {status:"change", curr:curr_value, prev:prev_value, type:effect_type};
}


Utils.updateInfo = function(curr_subsk, compare) {
	// очистка всех групп
	UI.update_skillInfo_clear();
	
	// эффекты текущегои и предыдущего подскиллов
	var curr_effects, prev_effects;
	if (!compare) {
		// если эффекты не нужно сравнивать
		curr_effects = prev_effects = curr_subsk.effects;
	} else {
		// если эффекты нужно сравнить с предыдущим
		var last_touched_subsk = curr_subsk.tree.lastTouched;
		
		// multiroot stuff #2
		if (last_touched_subsk == curr_subsk.tree.root
		 && curr_subsk.tree.root != curr_subsk.tree.origRoot) {
			last_touched_subsk = curr_subsk.tree.origRoot;
		}
		
		prev_effects = curr_subsk == last_touched_subsk
			? curr_subsk.effects
			: last_touched_subsk.effects;
		curr_effects = curr_subsk.tree.getSubskNextLevelEffects(curr_subsk);
	}
	
	// все эффекты для отображения:
	// 1) все от текщего скилла
	var effect_types = Object.keys(curr_effects);
	// 2) и исчезнувшие от предыдущего
	for (var type in prev_effects)
		if (!(type in curr_effects))
			effect_types.unshift(type);
	
	// заполнение инфы о подскилле начинается ЗДЕСЬ
	UI.update_skillInfo_setIconNameNote(curr_subsk);
	
	// заполнение инфы о эффектах
	for (var i=0; i<effect_types.length; i++) {
		var type = effect_types[i];
		var desc = this._describeEffect(prev_effects, curr_effects, type);
		UI.update_skillInfo_addEffect(desc);
	}
	
	// обработка эффектов, которые не были заполнены
	UI.update_skillInfo_handleEmptyEffects();
}


Utils.loadDataFromHash = function() {
	var res = {spendings:[], tree_name:"", is_build:false};
	var hash = window.location.hash.substr(1);
	if (hash.length == 0) hash = localStorage[Utils.getClassName()+"LastHash"];
	if (!hash) return null;
	
	var ic = this.int_by_char_for_encoding;
	var icl = this.chars_for_encoding.length;
	
	// разворачивание последовательностей из '0' обратно
	var ze = this.int_by_char_for_zeroes_encoding;
	hash = hash.replace(this.rgx_for_zeroes_restore, function(c){ return new Array(ze[c]+2).join("0") });
	//console.log(hash)
	
	var tree_id_enc = hash.substr(0, 2);
	var tree_id = ic[tree_id_enc[0]]*icl + ic[tree_id_enc[1]];
	// вытаскивание режима отображения
	res.is_build = tree_id >= 1000;
	tree_id = tree_id%1000;
	// вытаскивание названия дерева
	res.tree_name = "tree_" + (tree_id/2|0) + (tree_id%2 ? ".0" : "");
	hash = hash.substr(2);
	
	// восстановление скиллов
	for (var lvl=1, pos=0; pos<hash.length; lvl++){
		var n = ic[hash[pos]];
		if (n === undefined) {
			console.error("DECODER: Unable to convert char '"+hash[pos]+"' (pos:"+pos+") to int");
			return null;
		}
		
		var a = [];
		for (var j=0; j<n; j++, pos++) {
			var val = hash[pos+1] == this.extra_char
				? ic[hash[++pos+1]]*icl + ic[hash[++pos+1]]
				: ic[hash[pos+1]];
			////console.log(val, hash[pos+j-1+1], hash[pos+j+1], icl)
			if (val === undefined || val != val) {
				console.error("DECODER: Wrong val: "+val+", pos: "+pos+", hash: "+hash+" (extra char: "+this.extra_char+")");
				return null;
			}
			a.push(val);
		}
		pos ++;
		
		//console.log(lvl, a)
		for (var i=1; i<a.length; i++) a[i] += a[i-1];
		//console.log(a)
		for (var i=1; i<a.length; i++) a[i] += i;
		//console.log(a)
		
		for (var i=0; i<a.length; i++) {
			res.spendings.push({lvl:lvl, sk_id:a[i]});
		}
	}
	
	return res;
}


Utils.generateDataToHash = function(subsks, tree_name, is_build) {
	var data = "";
	var subsks_on_lvls = [[], [], [], []];
	
	var ch = this.chars_for_encoding;
	var chl = ch.length;
	
	// добавление айдишника дерева
	var m = tree_name.match(/_(\d+)(\.\d+)?$/);
	var tree_id = +m[1]*2;
	if (m[2]) tree_id += 1; // если имя дерева оканчивается на ".0"
	// и флажка режима отображения
	if (is_build) tree_id += 1000;
	data += ch[tree_id/chl|0] + ch[tree_id%chl];
	
	// группировка подскиллов по уровням их вкачанности
	for (var id in subsks) {
		var lvl = subsks[id].curr_lvl || 0;
		if (lvl == 0) continue;
		subsks_on_lvls[lvl-1].push(+id);
	}
	
	// компановка айдишников подскиллов
	subsks_on_lvls.forEach(function(a, lvl) {
		//console.log(lvl)
		//console.log(a)
		a.sort(function(a,b){ return a-b });
		//console.log(a)
		for (var i=1; i<a.length; i++) a[i] -= i;
		//console.log(a)
		for (var i=a.length-1; i>=1; i--) a[i] -= a[i-1];
		//console.log(a)
		
		if (a.length >= chl) {
			console.error("ENCODER: Too long subskill group: "+a.length, subsks_on_lvls);
		}
		data += ch[a.length];
		for (var i=0; i<a.length; i++) {
			data += a[i] < chl
				? ch[a[i]]
				: this.extra_char + ch[a[i]/chl|0] + ch[a[i]%chl];
		}
	}, this);
	
	//console.log(data)
	// замена длинных последовательностей из '0'
	var ze = this.chars_for_zeroes_encoding;
	data = data.replace(this.rgx_for_zeroes_replace, function(x){ return ze[x.length-1] });
	
	if (!window.DO_NOT_USE_HASH) location.hash = data;
	localStorage[Utils.getClassName()+"LastHash"] = data;
}


Utils.rusify = (function() {
	var s = "qй wц eу rк tе yн uг iш oщ pз [х ]ъ "+
	         "aф sы dв fа gп hр jо kл lд ;ж 'э "+
	          "zя xч cс vм bи nт mь ,б .ю /.";
	var h = {};
	for (var i=0; i<s.length; i+=3) h[s[i]] = s[i+1];
	
	return function(str) {
		return str.toLowerCase().replace(/[A-z\[\];',\.\/]/g, function(l) {
			return l in h ? h[l] : l;
		})
	}
})();


$ = document.querySelector.bind(document);
$$ = document.querySelectorAll.bind(document);
Element.prototype.$ = Element.prototype.querySelector;
Element.prototype.$$ = Element.prototype.querySelectorAll;

Element.prototype.appendChildren = function(children) {
	for (var i=0; i<children.length; i++) this.appendChild(children[i]);
}

HTMLCollection.prototype.toArray =
NodeList.prototype.toArray = function() {
	var arr = new Array(this.length);
	for (var i=0; i<this.length; i++) arr[i] = this[i];
	return arr;
}


function getOffset(elem) {
	var box = elem.getBoundingClientRect();
	var body = document.body;
	var docElem = document.documentElement;
	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
	var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
	var clientTop = docElem.clientTop || body.clientTop || 0;
	var clientLeft = docElem.clientLeft || body.clientLeft || 0;
	var top  = box.top +  scrollTop - clientTop;
	var left = box.left + scrollLeft - clientLeft;
	return { top: Math.round(top), left: Math.round(left) };
}
