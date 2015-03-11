var UI = new function() {
	var f = function(){};
	this.on_skillsListItem_click = f;
	this.on_resetAll_click = f;
	this.on_resetTree_click = f;
	this.on_subskill_over = f;
	this.on_subskill_out = f;
	this.on_subskill_click = f;
	this.on_subskill_contextmenu = f;
	this.on_viewCalc_switch = f;
	this.on_viewBuild_switch = f;
	
	for (var i in this) {
		this["_binded_"+i] = (function(ui, i){
			return function(e){
				e.preventDefault();
				e.owner = this;
				ui[i](e);
			}
		})(this, i);
	}
	
	this._skillsList_standardOrder = null;
	this._skillsList_levelsOrder = null;
}


UI._skillsList_applySearchText = function(text) {
	var name_part = Utils.rusify(text);
	var elems = skills_list_wrap.children;
	var group_is_empty = true;
	
	for (var i=elems.length-1; i>=0; i--) {
		var elem = elems[i];
		if (elem.classList.contains('skills_separator')) {
			elem.style.display = group_is_empty ? "none" : null;
			group_is_empty = true;
			continue;
		}
		var textElem = elem.$('.skill_name');
		var matches = textElem.textContent.toLowerCase().indexOf(name_part) != -1;
		if (matches) {
			elem.style.display = null;
			group_is_empty = false;
		} else {
			elem.style.display = "none";
		}
	}
}


UI._skillsList_createSeparator = function(name) {
	var elem = document.createElement('div');
	elem.className = "skills_separator";
	elem.innerHTML = name;
	return elem;
}


UI.init_view_switchButtons = function() {
	calcmodeCalc.onclick = UI._binded_on_viewCalc_switch;
	calcmodeBuild.onclick = UI._binded_on_viewBuild_switch;
	buildViewBackBut.onclick = UI._binded_on_viewCalc_switch;
}


UI.init_resetButtons = function() {
	reset_all_but.onclick = this._binded_on_resetAll_click;
	reset_tree_but.onclick = this._binded_on_resetTree_click;
}


UI.init_skillsList_search = function() {
	search_input.onkeyup = function(e) {
		UI._skillsList_applySearchText(this.value);
	}
}

UI.init_skillsList_orderButtons = function() {
	skills_order_standard_but.onclick = function() {
		if (this.classList.contains('selected_but')) return;
		UI.update_skillList_sortStandart();
	}
	skills_order_levels_but.onclick = function() {
		if (this.classList.contains('selected_but')) return;
		UI.update_skillList_sortLevels();
	}
}

UI.init_skillsList_addSeparator = function(name) {
	var sep = UI._skillsList_createSeparator(name);
	skills_list_wrap.appendChild(sep);
}

UI.init_skillsList_addSkill = function(skill, tree, hotkey_name) {
	var elem = document.createElement('div');
	elem.className = "skills_skill";
	
	elem.dataset.tree_name = skill.tree;
	elem.dataset.obtain_lvl = skill.obtain_lvl;
	
	elem.onclick = this._binded_on_skillsListItem_click;
	if (tree.subsks.length != 0) {
		elem.classList.add('with_tree')
	}
	
	var img = new Image();
	img.src = tree.root.img;
	elem.appendChild(img);
	
	var nameBox = document.createElement('span');
	nameBox.className = 'skill_name';
	nameBox.innerHTML = skill.name;
	elem.appendChild(nameBox);
	
	var pointsBox = document.createElement('span');
	pointsBox.className = "skill_points";
	elem.appendChild(pointsBox);
	
	var hotkeyBox = document.createElement('span');
	hotkeyBox.className = "skill_hotkey";
	hotkeyBox.innerHTML = hotkey_name;
	elem.appendChild(hotkeyBox);
	
	skills_list_wrap.appendChild(elem);
}


UI.init_skillsList_clickFirst = function() {
	skills_list_wrap.$('.skills_skill').click();
}


UI.init_skillsList_scrollToTreeAndClick = function(tree_name) {
	var elem = tree_name && skills_list_wrap.$('.skills_skill[data-tree_name="'+tree_name+'"]');
	if (elem) {
		elem.click();
		skills_list_wrap.scrollTop = elem.offsetTop - 8;
	} else {
		UI.init_skillsList_clickFirst();
	}
}


UI.init_skillTree_makeHTML = function(tree, node_width, node_height) {
	tree.htmlElem = document.createElement('div');
	tree.htmlElem.className = "tree";
	
	// некачаемое дерево
	if (tree.subsks.length == 0) {
		tree.htmlElem.innerHTML = '<img src="/img/sc/nt.png">';
		return;
	}
	
	// генерация квадратиков
	tree.subsks.forEach(function(subsk) {
		var elem = document.createElement('div');
		elem.className = "skill_but f_l";
		elem.dataset.id = subsk.id;
		if (subsk.active) elem.classList.add("active");
		if (subsk.legendary) elem.classList.add("legendary");
		if (subsk.max_lvl == 2) elem.classList.add("twopoint");
		
		var img = new Image();
		img.src = subsk.img;
		elem.appendChild(img);
		
		elem.onmouseover = this._binded_on_subskill_over;
		elem.onmouseout = this._binded_on_subskill_out;
		elem.onclick = this._binded_on_subskill_click;
		elem.oncontextmenu = this._binded_on_subskill_contextmenu;
		
		subsk.htmlElem = elem;
		tree.htmlElem.appendChild(elem);
	}, this);
	
	
	var max_depth = (function depthIter(subsk, depth) {
		var max_depth = depth;
		for (var i=0; i<subsk.relations.length; i++) {
			var new_depth = depthIter(subsk.relations[i], depth+1);
			if (new_depth > max_depth) max_depth = new_depth;
		}
		return max_depth;
	})(tree.root, 0);
	
	// генерация полосок и вычисление размера
	var iter = function(subsk, x, y) {
		var width = 0;
		var height = y + node_height;
		
		var left = x+node_width/2 + "px";
		var top = y+node_height/2 + "px";
		
		for (var i=0; i<subsk.relations.length; i++) {
			var edge = document.createElement('div');
			edge.style.top = top;
			edge.style.left = left;
			
			var extra_height = subsk.relations[i].legendary
				? max_height - height - node_height
				: 0;
			
			if (i == 0) {
				edge.className = "skill_tree_edge_first";
				edge.style.height = node_height + extra_height + "px";
			} else {
				edge.className = "skill_tree_edge_other";
				edge.style.width = width + "px";
				edge.style.height = node_height/2 + extra_height + "px";
				edge.style.marginTop = node_height/2 + "px";
			}
			
			subsk.relations[i].htmlUpperEdge = edge;
			tree.htmlElem.insertBefore(edge, tree.htmlElem.firstChild);
			width += iter(subsk.relations[i], x+width, height+extra_height);
		}
		
		subsk.htmlElem.style.left = left;
		subsk.htmlElem.style.top = top;
		
		return width || 72;
	};
	
	var max_height = max_depth * node_height;
	var max_width = iter(tree.root.relations[0], 0, 0);
	
	// размер контейнера с деревом
	tree.htmlElem.style.width = max_width+"px";
	tree.htmlElem.style.height = max_height+"px";
}


UI.update_spentPointsCounter = function(spent_points, max_points) {
	document.getElementById('counter').innerHTML = spent_points +'/'+ max_points;
}


UI.update_treePointsCounter = function(tree_name, points) {
	var elem = skills_list_wrap
		.$('[data-tree_name="'+tree_name+'"]')
		.$('.skill_points');
	elem.innerHTML = points==0 ? "" : points;
}


UI.update_skillListItem_setActive = function(tree_name) {
	var elems = skills_list_wrap.$$('.skills_skill.skill_but_active');
	for (var i=0; i<elems.length; i++) elems[i].classList.remove('skill_but_active');
	skills_list_wrap.$('[data-tree_name="'+tree_name+'"]').classList.add('skill_but_active');
}


UI.update_skillList_sortStandart = function() {
	skills_order_standard_but.classList.add('selected_but');
	skills_order_levels_but.classList.remove('selected_but');
	skills_list_wrap.innerHTML = "";
	skills_list_wrap.appendChildren(this._skillsList_standardOrder);
	UI._skillsList_applySearchText(search_input.value);
}

UI.update_skillList_sortLevels = function() {
	if (!this._skillsList_standardOrder)
		this._skillsList_standardOrder = skills_list_wrap.children.toArray();
	
	skills_order_standard_but.classList.remove('selected_but');
	skills_order_levels_but.classList.add('selected_but');
	
	if (!this._skillsList_levelsOrder) {
		this._skillsList_levelsOrder = [];
		var prev_lvl = -1;
		var elems = skills_list_wrap.$$('.skills_skill').toArray()
		elems.sort(function(a,b){ return +a.dataset.obtain_lvl - b.dataset.obtain_lvl });
		
		for (var i=0; i<elems.length; i++) {
			var curr_lvl = elems[i].dataset.obtain_lvl;
			if (prev_lvl != curr_lvl) {
				var sep = UI._skillsList_createSeparator(curr_lvl);
				this._skillsList_levelsOrder.push(sep);
			}
			this._skillsList_levelsOrder.push(elems[i]);
			prev_lvl = curr_lvl;
		}
	}
	
	skills_list_wrap.innerHTML = "";
	skills_list_wrap.appendChildren(this._skillsList_levelsOrder);
	UI._skillsList_applySearchText(search_input.value);
}


UI.update_skillTree = function(elem) {
	skills_tree_wrap.innerHTML = "";
	skills_tree_wrap.appendChild(elem);
}


UI.update_skillInfo_clear = function() {
	var elems = skills_info_wrap.getElementsByClassName("effect_group");
	for (var i=0; i<elems.length; i++) elems[i].innerHTML = "";
}

UI.update_skillInfo_setIconNameNote = function(subsk) {
	var mark_as_legendary = subsk.legendary || subsk.tree.lastTouched.legendary;
	subskill_icon_img.src = subsk.img;
	subskill_icon_img.classList[mark_as_legendary?'add':'remove']('legendary');
	
	subskill_name_box.textContent = subsk.name +
		(subsk.max_lvl==0 ? "" : " ("+subsk.curr_lvl+"/"+subsk.max_lvl+")");
	
	subskill_note.innerHTML = subsk.note || "";
}

UI.update_skillInfo_addEffect = function(effect) {
	var str = "";
	
	var prefix = effect.type.match(/^[^_]*/)[0];
	var wrap = skills_info_wrap.getElementsByClassName("effect_group_"+prefix)[0];
	if (!wrap){
		console.warn("Can't find element .effect_group_"+prefix+", skipping.");
		return;
	}
	
	var elem = document.createElement('p');
	elem.className = effect.status;
	
	switch(effect.status){
	case "new":
	case "still":
		elem.innerHTML = effect.curr;
		break;
	case "change":
		elem.innerHTML = "<s>" + effect.prev + "</s> " + effect.curr;
		break;
	case "delete":
		elem.innerHTML = "<s>" + effect.prev + "</s>";
		break;
	}
	
	wrap.appendChild(elem);
}

UI.update_skillInfo_handleEmptyEffects = function() {
	//var elems = skills_info_wrap.getElementsByClassName("effect_group");
	//for (var i=0; i<elems.length; i++)
	//	if (elems[i].innerHTML == "") elems[i].innerHTML = "Нет";
}


UI.update_view_showCalc = function() {
	calc_body.classList.remove("view_build");
	calc_body.classList.add("view_calc");
	calcmodeBuild.classList.remove("selected_calc_mode");
	calcmodeCalc.classList.add("selected_calc_mode");
}

UI.update_view_showBuild = function() {
	calc_body.classList.add("view_build");
	calc_body.classList.remove("view_calc");
	calcmodeBuild.classList.add("selected_calc_mode");
	calcmodeCalc.classList.remove("selected_calc_mode");
}

UI.update_buildView_clear = function() {
	buildViewHTML.innerHTML = "";
}

UI.update_buildView_addTree = function(tree_lit_name, treeElem) {
	var wrap = document.createElement('div');
	wrap.className = "bv_tree_wrap";
	
	var nameBox = document.createElement('div');
	nameBox.className = "bv_skill_name";
	nameBox.innerHTML = tree_lit_name;
	wrap.appendChild(nameBox);
	
	wrap.appendChild(treeElem);
	buildViewHTML.appendChild(wrap);
}
