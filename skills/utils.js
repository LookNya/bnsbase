var Utils = new function() {
	function invert(str) {
		var res = {};
		for (var i=0; i<str.length; i++) res[str[i]] = i;
		return res;
	}
	
	this.extra_char = "!";
	
	this.chars_for_zeroes_encoding = "$&'()*+,-./:=?@_~";
	this.int_by_char_for_zeroes_encoding = invert(this.chars_for_zeroes_encoding);
	
	this.rgx_for_zeroes_replace = new RegExp("0{2,"+(this.chars_for_zeroes_encoding.length+1)+"}", "g")
	this.rgx_for_zeroes_restore = new RegExp("["+this.chars_for_zeroes_encoding.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1")+"]", "g");
	
	this.chars_for_encoding =
		"0123456789"+
		"ABCDEFGHIJKLMNOPQRSTUVWXYZ"+
		"abcdefghijklmnopqrstuvwxyz";
	this.int_by_char_for_encoding = invert(this.chars_for_encoding);
}



Utils._describeEffectBySubsks = function(prev_subsk, curr_subsk, effect_type) {
	var curr_value = curr_subsk.effects[effect_type];
	var prev_value = prev_subsk && prev_subsk.effects[effect_type];
	
	if (!prev_subsk || prev_value === undefined)
		return {status:"new", curr:curr_value, prev:"", type:effect_type};
	
	if (curr_value === undefined)
		return {status:"delete", curr:"", prev:prev_value, type:effect_type};
	
	if (prev_value == curr_value)
		return {status:"still", curr:curr_value, prev:prev_value, type:effect_type};
	
	return {status:"change", curr:curr_value, prev:prev_value, type:effect_type};
}


Utils.updateInfo = function(subsk) {
	// очистка всех групп
	UI.update_skillInfo_clear();
	
	// текущий подскилл
	var curr_subsk = subsk;
	
	// предыдущий подскилл
	var last_touched_subsk = subsk.tree.lastTouched;
	var prev_subsk = curr_subsk == last_touched_subsk
		? (curr_subsk.reverse_relation || curr_subsk) // навели на текущий подскилл - показываем ему разницу с предыдущим по дереву
		: last_touched_subsk; // навели на не текущий - показываем разницу с текщим подскиллом
	
	// все эффекты для отображения:
	// 1) все от текщего скилла
	var effect_types = Object.keys(curr_subsk.effects);
	// 2) и исчезнувшие от предыдущего
	if (prev_subsk)
		for (var type in prev_subsk.effects)
			if (!(type in curr_subsk.effects))
				effect_types.unshift(type);
	
	// заполнение инфы о подскилле начинается ЗДЕСЬ
	UI.update_skillInfo_setName(curr_subsk);
	
	// заполнение инфы о эффектах
	for (var i=0; i<effect_types.length; i++) {
		var type = effect_types[i];
		var desc = this._describeEffectBySubsks(prev_subsk, curr_subsk, type);
		UI.update_skillInfo_addEffect(desc);
	}
}


Utils.loadDataFromHash = function(subsks) {
	var res = {race:null, spendings:[]};
	var hash = window.location.hash.substr(1);
	if (hash.length == 0) return null;
	
	res.race = hash[0];
	hash = hash.substr(1);
	
	var ze = this.int_by_char_for_zeroes_encoding;
	hash = hash.replace(this.rgx_for_zeroes_restore, function(c){ return new Array(ze[c]+2).join("0") });
	console.log(hash)
	
	var ic = this.int_by_char_for_encoding;
	var icl = ic.length;
	
	for (var lvl=1, pos=0; pos<hash.length; lvl++){
		var n = ic[hash[pos]];
		if (n === undefined) return null;
		
		var a = [];
		for (var j=0; j<n; j++) {
			var val = hash[pos+j+1] == this.extra_char
				? ic[hash[pos+ ++j+1]]*icl + ic[hash[pos+ ++j+1]]
				: ic[hash[pos+j+1]];
			console.log(val)
			if (val === undefined || val != val) return null;
			a.push(val);
		}
		
		console.log(a)
		for (var i=1; i<a.length; i++) a[i] += a[i-1];
		console.log(a)
		for (var i=1; i<a.length; i++) a[i] += i;
		console.log(a)
		
		for (var i=0; i<a.length; i++) {
			res.spendings.push({lvl:lvl, sk_id:a[i]});
		}
		
		pos += n+1;
	}
	
	return res;
}


Utils.generateDataToHash = function(race, subsks) {
	var data = "";
	var subsks_on_lvls = [[], [], [], []];
	
	for (var id in subsks) {
		var lvl = subsks[id].curr_lvl || 0;
		if (lvl == 0) continue;
		subsks_on_lvls[lvl-1].push(+id);
	}
	
	subsks_on_lvls.forEach(function(a, lvl) {
		console.log(lvl)
		console.log(a)
		a.sort(function(a,b){ return a-b });
		console.log(a)
		for (var i=1; i<a.length; i++) a[i] -= i;
		console.log(a)
		for (var i=a.length-1; i>=1; i--) a[i] -= a[i-1];
		console.log(a)
		
		var ch = this.chars_for_encoding;
		var chl = ch.length;
		data += ch[a.length];
		for (var i=0; i<a.length; i++) {
			data += a[i] < chl
				? ch[a[i]]
				: this.extra_char + ch[a[i]/chl|0] + ch[a[i]%chl];
		}
	}, this);
	
	
	var ze = this.chars_for_zeroes_encoding;
	data = data.replace(this.rgx_for_zeroes_replace, function(x){ return ze[x.length-1] });
	
	window.location.hash = race + data;
}
