var UI = new function() {
	var f = function(){};
	this.on_skillsListItem_click = f;
	this.on_resetAll_click = f;
	this.on_resetTree_click = f;
	this.on_subskill_over = f;
	this.on_subskill_out = f;
	this.on_subskill_click = f;
	
	for (var i in this) {
		this["_binded_"+i] = function(i,e){ this[i](e) }.bind(this, i);
	}
}


UI.init_resetButtons = function() {
	reset_all_but.onclick = this._binded_on_resetAll_click;
	reset_tree_but.onclick = this._binded_on_resetTree_click;
}


UI.init_skillsList_addSkill = function(name, skill) {
	var elem = document.createElement('div');
	elem.innerHTML = skill.name;
	elem.className = skill.type == 'separator'
		? "skills_separator"
		: "skills_skill skill_but_active";
	
	if (skill.type != 'separator') {
		elem.dataset.tree_name = skill.tree;
		elem.onclick = this._binded_on_skillsListItem_click;
	}
	
	skills_list_wrap.appendChild(elem);
}


UI.init_skillsList_clickFirst = function() {
	skills_list_wrap.querySelector('.skills_skill').click();
}


UI.init_skillTree_makeHTML = function(tree, node_width, node_height) {
	tree.htmlElem = document.createElement('div');
	tree.htmlElem.className = "tree";
	
	// некачаемое дерево
	if (tree.subsks.length == 0) {
		tree.htmlElem.textContent = "Nety.";
		return;
	}
	
	// генерация квадратиков
	tree.subsks.forEach(function(subsk) {
		var elem = document.createElement('div');
		elem.className = "skill_but f_l";
		elem.dataset.id = subsk.id;
		if (subsk.active) elem.classList.add("active");
		
		elem.onmouseover = this._binded_on_subskill_over;
		elem.onmouseout = this._binded_on_subskill_out;
		elem.onclick = this._binded_on_subskill_click;
		
		subsk.htmlElem = elem;
		tree.htmlElem.appendChild(elem);
	}, this);
	
	// генерация полосок и вычисление размера
	var max_height = 0;
	var iter = function(subsk, x, y) {
		var width = 0;
		var height = y + node_height;
		
		var left = x+node_width/2 + "px";
		var top = y+node_height/2 + "px";
		
		if (height > max_height) max_height = height;
		
		for (var i=0; i<subsk.relations.length; i++) {
			var edge = document.createElement('div');
			edge.style.top = top;
			edge.style.left = left;
			
			if (i == 0) {
				edge.className = "skill_tree_edge_first";
				edge.style.height = node_height + "px";
			} else {
				edge.className = "skill_tree_edge_other";
				edge.style.width = width + "px";
				edge.style.height = node_height/2 + "px";
				edge.style.marginTop = edge.style.height;
			}
			
			tree.htmlElem.insertBefore(edge, tree.htmlElem.firstChild);
			width += iter(subsk.relations[i], x+width, height);
		}
		
		subsk.htmlElem.style.left = left;
		subsk.htmlElem.style.top = top;
		
		return width || 72;
	};
	
	var max_width = iter(tree.root.relations[0], 0, 0);
	// размер контейнера с деревом
	tree.htmlElem.style.width = max_width+"px";
	tree.htmlElem.style.height = max_height+"px";
}


UI.update_spentPointsCounter = function(spent_points, max_points) {
	document.getElementById('counter').innerHTML = spent_points +'/'+ max_points;
}


UI.update_skillTree = function(elem) {
	skills_tree_wrap.innerHTML = "";
	skills_tree_wrap.appendChild(elem);
}


UI.update_skillInfo_clear = function() {
	var elems = skills_info_wrap.getElementsByClassName("effect_group");
	for (var i=0; i<elems.length; i++) elems[i].innerHTML = "";
}

UI.update_skillInfo_setName = function(subsk) {
	subskill_name_box.textContent = subsk.name +
		" (вкач: "+subsk.curr_lvl+"/"+subsk.max_lvl+")";
	// а тут надо куда-то запихать картинку из curr_subsk.img
}

UI.update_skillInfo_addEffect = function(effect) {
	var str = "";
	
	var prefix = effect.type.match(/^[^_]*/)[0];
	var elem = skills_info_wrap.getElementsByClassName("effect_group_"+prefix)[0];
	if (!elem){
		console.warn("Can't find element .effect_group_"+prefix+", skipping.");
		return;
	}
	
	switch(effect.status){
	case "new":
		str += effect.curr;
		break;
	case "still":
		str += effect.curr;
		break;
	case "change":
		str += "<s>" + effect.prev + "</s> " + effect.curr;
		break;
	case "delete":
		str += "<s>" + effect.prev + "</s>";
		break;
	}
	
	elem.innerHTML += str + " ("+effect.status+")<br>";
}
