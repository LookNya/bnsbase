function Tree(name, lit_name) {
	this.name = name;
	this.lit_name = lit_name;
	this.rawData = {};
	this.root = null;
	this.lastTouched = null;
	this.spent_points = 0;
	this.subsks = [];
	this.htmlElem = null;
	
	this.node_width = 72;
	this.node_height = 72;
	this.img_base_path = "./";
}

Tree.prototype._err = function(msg) {
	console.error("Tree '"+this.name+"': "+msg);
}

Tree.prototype._warn = function(msg) {
	console.warn("Tree '"+this.name+"': "+msg);
}

Tree.prototype._setup_processRawSubsk = function(id, subsk) {
	var is_root = id == "root";
	if (!is_root) id = +id;
	
	subsk.id = id;
	subsk.tree = this;
	subsk.curr_lvl = 0;
	subsk.active = is_root;
	subsk.relations = subsk.relations || [];
	subsk.reverse_relation = null;
	if ('img' in subsk) subsk.img = subsk.img
	
	if (is_root) {
		if (this.root)                  this._err("Got second ROOT subskill, previous id: "+this.root.id);
		if (subsk.relations.length > 1) this._warn("Expected ROOT subskill to have exactly ONE relation but found "+subsk.relations.length+" of them");
		if ('max_lvl' in subsk)         this._warn("max_lvl is set for ROOT subskill, it will be overwritten.");
		
		['name', 'img'].forEach(function(attr) {
			if (!(attr in subsk)) this._err("Expected ROOT subskill to have '"+attr+"'.");
		});
		
		this.root = subsk;
		this.origRoot = subsk;
		this.lastTouched = subsk;
		subsk.max_lvl = 0;
		subsk.effects = subsk.effects || {};
	} else {
		if (!('max_lvl' in subsk)) {
			subsk.max_lvl = 0;
			this._warn("No max_lvl set for subskill (id:"+id+"), set "+subsk.max_lvl+" by default.");
		}
		
		this.subsks[id] = subsk;
		subsk.effects_0 = subsk.effects || {};
		subsk.effects = {};
		this._update_subskEffects(subsk);
	}
	
	if (subsk.legendary && subsk.relations.length > 0) {
		this._err("Subskill '"+id+"' is legendary but has some ("+subsk.relations.join(",")+") relations.");
	}
}

Tree.prototype._setup_correctRelations = function() {
	this.subsks.root = this.root;
	for (var id in this.subsks) {
		var subsk = this.subsks[id];
		
		for (var i=0; i<subsk.relations.length; i++) {
			var rel_id = subsk.relations[i];
			var rel = this.subsks[rel_id];
			
			if (!rel) {
				this._err("Subskill (id:"+id+") has relation to non-existing subskill (id:"+rel_id+").");
				continue;
			}
			
			if (rel.reverse_relation) {
				this._err("Subskill (id:"+rel_id+") referenced by TWO (at least) subskills:"+
				          " id:"+rel.reverse_relation.id+" and id:"+id);
			}
			
			subsk.relations[i] = rel;
			rel.reverse_relation = subsk;
		}
	}
	delete this.subsks.root;
	
	if (this.subsks.length > 0 && this.root.relations.length == 0) {
		this._err("Root has no relations, but tree has some subskills.");
	}
}

Tree.prototype._setup_setDefaults = function() {
	this.subsks.forEach(function(subsk) {
		if (!('name' in subsk)) subsk.name = subsk.tree.root.name;
		if (!('img' in subsk)) subsk.img = subsk.tree.root.img;
	});
}

Tree.prototype._setup = function() {
	this.rawData = null;
	if (!this.root) console.error("AHTUNG! No root subskill assigned for tree '"+this.name+"'!");
	this._setup_correctRelations();
	this._setup_setDefaults();
	this._activateChildren(this.root);
	UI.init_skillTree_makeHTML(this, this.node_width, this.node_height);
}

Tree.prototype._setSubskActive = function(subsk, active) {
	subsk.active = active;
	if (subsk.htmlElem) {
		subsk.htmlElem.classList[active?'add':'remove']('active'); //TODO: to UI
	}
	if (subsk.htmlUpperEdge) {
		subsk.htmlUpperEdge.classList[active?'add':'remove']('active');
	}
}

Tree.prototype._activateChildren = function(subsk) {
	for (var i=0; i<subsk.relations.length; i++) {
		var rel = subsk.relations[i];
		this._setSubskActive(rel, true);
	}
}

Tree.prototype._deactivateChildrenExcept = function(subsk, child) {
	for (var i=0; i<subsk.relations.length; i++) {
		var rel = subsk.relations[i];
		if (rel == child) continue;
		this._setSubskActive(rel, false);
	}
}
Tree.prototype._deactivateChildren = function(subsk) {
	this._deactivateChildrenExcept(subsk, null);
}


Tree.prototype._fillWithSubskEffects = function(obj, subsk, level) {
	for (var i=level; i>=0; i--) {
		var lvl_effects = subsk['effects_'+(i-1)];
		if (!lvl_effects) continue;
		
		for (var name in lvl_effects) {
			if (!(name in obj)) obj[name] = lvl_effects[name];
		}
	}
}
Tree.prototype.getSubskNextLevelEffects = function(subsk) {
	var res = {};
	var lvl = Math.min(subsk.curr_lvl+1, subsk.max_lvl);
	this._fillWithSubskEffects(res, subsk, lvl);
	return res;
}
Tree.prototype._update_subskEffects = function(subsk) {
	for (var name in subsk.effects) delete subsk.effects[name];
	this._fillWithSubskEffects(subsk.effects, subsk, subsk.curr_lvl);
}

Tree.prototype.spendOn = function(subsk) {
	if (this.rawData) this._setup();
	if (!subsk.active) return false;
	if (subsk.curr_lvl == subsk.max_lvl) return false;
	
	this.spent_points ++;
	this.lastTouched = subsk;
	
	subsk.htmlElem.classList.remove('points_'+subsk.curr_lvl)
	subsk.curr_lvl ++;
	subsk.htmlElem.classList.add('points_'+subsk.curr_lvl)
	this._update_subskEffects(subsk);
	this._deactivateChildrenExcept(subsk.reverse_relation, subsk);
	if (subsk.curr_lvl == subsk.max_lvl) this._activateChildren(subsk);
	
	UI.update_treePointsCounter(this.name, this.spent_points);
	return true;
}

Tree.prototype.addSubsk = function(id, subsk) {
	this.rawData[id] = subsk;
	this._setup_processRawSubsk(id, subsk);
}

Tree.prototype.hasTouchedSubskillsAfter = function(subsk) {
	for (var i=0; i<subsk.relations.length; i++) {
		if (subsk.relations[i].curr_lvl > 0) return true;
	}
	return false;
}

Tree.prototype._resetSubsk = function(subsk) {
	this.spent_points -= subsk.curr_lvl;
	subsk.htmlElem.classList.remove('points_'+subsk.curr_lvl);
	subsk.curr_lvl = 0;
	this._update_subskEffects(subsk);
}

Tree.prototype.init_activateSubsk = function(subsk) {
	this._setSubskActive(subsk, true);
}

Tree.prototype.init_fixLastTouched = function(startSubsk) {
	if (!startSubsk) startSubsk = this.root;
	for (var i=0; i<startSubsk.relations.length; i++) {
		var rel = startSubsk.relations[i];
		if (rel.active && rel.curr_lvl>0) {
			this.init_fixLastTouched(rel);
			return;
		}
	}
	this.lastTouched = startSubsk;
}

Tree.prototype.resetSubsk = function(subsk) {
	if (subsk.curr_lvl == 0) return false;
	if (this.hasTouchedSubskillsAfter(subsk)) return false;
	this._resetSubsk(subsk);
	this.lastTouched = subsk.reverse_relation;
	this._activateChildren(subsk.reverse_relation);
	this._deactivateChildren(subsk);
	UI.update_treePointsCounter(this.name, this.spent_points);
	return true;
}

Tree.prototype.reset = function() {
	if (this.rawData) return;
	
	this.lastTouched = this.root;
	this.subsks.forEach(function(subsk) {
		this._resetSubsk(subsk);
		this._setSubskActive(subsk, false);
	}, this);
	this._activateChildren(this.root);
	UI.update_treePointsCounter(this.name, this.spent_points);
}

Tree.prototype.getHTML = function() {
	if (this.rawData) this._setup();
	return this.htmlElem;
}

Tree.prototype.isMultiRoot = function() {
	return this.name.indexOf(".") != -1;
}

Tree.prototype.setRoot = function(subsk) {
	if (this.lastTouched == this.root) this.lastTouched = subsk;
	this.root = subsk;
	this.root.tree = this;
}



function Engine() {
	this.spent_points = 0;
	this.max_points = 31;
	
	this.subsks = [];
	this.trees = {};
	
	this.view = "calc";
	this.currTree = null;
	
	/*this.curr_race = 's';
	this.races = {
		a: "ass",
		b: "bm",
		l: "lsm",
		s: "sum",
		d: "des",
		k: "kfm",
	};*/
	
	UI.on_skillsListItem_click = this._on_skillsListItem_click.bind(this);
	UI.on_subskill_over = this._on_subskill_over.bind(this);
	UI.on_subskill_out = this._on_subskill_out.bind(this);
	UI.on_subskill_click = this._on_subskill_click.bind(this);
	UI.on_subskill_contextmenu = this._on_subskill_contextmenu.bind(this);
	UI.on_resetAll_click = this._on_resetAll_click.bind(this);
	UI.on_resetTree_click = this._on_resetTree_click.bind(this);
	UI.on_viewCalc_switch = this._on_viewCalc_switch.bind(this);
	UI.on_viewBuild_switch = this._on_viewBuild_switch.bind(this);
}

Engine.prototype._on_skillsListItem_click = function(e) {
	var tree_name = e.owner.dataset.tree_name;
	// multiroot stuff #1
	var s = tree_name.split(".");
	if (s.length == 2) {
		var new_root = this.trees[tree_name].origRoot;
		tree_name = s[0]+".0";
		new_root.relations = this.trees[tree_name].root.relations;
		this.trees[tree_name].setRoot(new_root);
	}
	this.currTree = this.trees[tree_name];
	UI.update_skillListItem_setActive(this.currTree.name);
	UI.update_skillTree(this.currTree.getHTML());
	Utils.updateInfo(this.currTree.lastTouched);
	this._update_urlHash();
}

Engine.prototype._on_subskill_over = function(e) {
	var subsk = this.subsks[e.owner.dataset.id];
	Utils.updateInfo(subsk, true);
}

Engine.prototype._on_subskill_out = function(e) {
	Utils.updateInfo(this.currTree.lastTouched);
}

Engine.prototype._on_resetAll_click = function(e) {
	var tree_name_before_reset = this.currTree.name;
	this._resetVariables();
	UI.init_skillsList_scrollToTreeAndClick(tree_name_before_reset);
	this._update_pointsCounter();
	this._update_urlHash();
}

Engine.prototype._on_resetTree_click = function(e) {
	this.spent_points -= this.currTree.spent_points;
	this._resetTree(this.currTree);
	Utils.updateInfo(this.currTree.lastTouched);
	this._update_pointsCounter();
	this._update_urlHash();
}

Engine.prototype._on_subskill_click = function(e) {
	var subsk = this.subsks[e.owner.dataset.id];
	this._spendRecursiveTo(subsk);
	
	this._update_treePointsCounter(subsk.tree);
	this._update_pointsCounter();
	Utils.updateInfo(subsk);
	this._update_urlHash();
}

Engine.prototype._on_subskill_contextmenu = function(e) {
	var subsk = this.subsks[e.owner.dataset.id];
	if (subsk.curr_lvl == 0) return;
	this._resetRecursiveTo(subsk.reverse_relation);
	this._update_treePointsCounter(subsk.tree);
	this._update_pointsCounter();
	Utils.updateInfo(subsk, true);
	this._update_urlHash();
}

Engine.prototype._spendRecursiveTo = function(subsk, make_maxed) {
	var rev = subsk.reverse_relation;
	
	if (rev.curr_lvl == rev.max_lvl) {
		if (!subsk.active) this._resetRecursiveTo(rev);
	} else {
		this._spendRecursiveTo(rev, true);
	}
	
	for (var i=subsk.curr_lvl; i<=subsk.max_lvl; i++) {
		if (this.spent_points >= this.max_points) return;
		if (!subsk.tree.spendOn(subsk)) return;
		this.spent_points ++;
		if (!make_maxed) return;
	}
}

Engine.prototype._resetRecursiveTo = function(subsk) {
	if (subsk.tree.lastTouched == subsk) return;
	var subsk_points = subsk.tree.lastTouched.curr_lvl;
	if (!subsk.tree.resetSubsk(subsk.tree.lastTouched)) return;
	this.spent_points -= subsk_points;
	this._resetRecursiveTo(subsk);
}

Engine.prototype._update_urlHash = function() {
	Utils.generateDataToHash(this.subsks, this.currTree.name, this.view == "build");
}

Engine.prototype._update_treePointsCounter = function(tree) {
	UI.update_treePointsCounter(tree.name, tree.spent_points);
}

Engine.prototype._update_pointsCounter = function() {
	UI.update_spentPointsCounter(this.spent_points, this.max_points);
}

Engine.prototype._fillBuildView = function() {
	UI.update_buildView_clear();
	for (var tree_name in this.trees) {
		var tree = this.trees[tree_name];
		if (tree.spent_points > 0)
			UI.update_buildView_addTree(tree.lit_name, tree.getHTML().cloneNode(true));
	}
}

Engine.prototype._resetTree = function(tree) {
	tree.reset();
	this._update_treePointsCounter(tree);
}

Engine.prototype._resetVariables = function() {
	this.spent_points = 0;
	this.currTree = null;
	for (var tree_name in this.trees) this._resetTree(this.trees[tree_name]);
}

Engine.prototype._init_growTrees = function() {
	var trees_names = {};
	for (var name in skills_list)
		trees_names[skills_list[name].tree] = skills_list[name].name;
	
	for (var name in skills_data) {
		var m = name.match(/^(.+?)\|(\d+|root)$/);
		if (!m) {
			console.error("Expected subskill name to be like 'treename|5' or 'treename|root' but got '"+name+"'.");
			continue;
		}
		
		if (!(m[1] in this.trees)) this.trees[m[1]] = new Tree(m[1], trees_names[m[1]]);
		var tree = this.trees[m[1]];
		
		tree.addSubsk(m[2], skills_data[name]);
	}
	
	for (var tree_name in this.trees) {
		var tree = this.trees[tree_name];
		for (var i in tree.rawData) {
			if (i == "root") continue;
			if (i in this.subsks) console.error("Two subskills with same ids ("+i+") in trees '"+this.subsks[i].tree.name+"' and '"+tree.name+"'.");
			this.subsks[i] = tree.rawData[i];
		}
	}
	
	//for (var i=0; i<this.subsks.length; i++) {
	//	if (!(i in this.subsks)) console.warn("Id '"+i+"' was not used for any subskill.");
	//}
}

Engine.prototype._init = function() {
	console.time("Init: growing trees");
	this._init_growTrees();
	console.timeEnd("Init: growing trees");
	
	console.time("Init: listing skills");
	var last_separator_name = "-";
	for (var name in skills_list) {
		var skill = skills_list[name];
		var tree = 'tree' in skill ? this.trees[skill.tree] : null;
		if (tree === undefined) {
			console.error("skill '"+name+"' references unknown tree '"+skill.tree+"'");
			continue;
		}
		
		if (skill.type == 'separator') {
			UI.init_skillsList_addSeparator(skill.name);
			last_separator_name = skill.name;
		} else {
			UI.init_skillsList_addSkill(skill, tree, last_separator_name);
		}
	}
	console.timeEnd("Init: listing skills");
	
	console.time("Init: loading data from hash");
	this._resetVariables();
	var res = Utils.loadDataFromHash();
	res && res.spendings.forEach(function(s) {
		var subsk = this.subsks[s.sk_id];
		if (!subsk) {
			console.warn("Unable to find skill with id: "+s.sk_id+" (while loading from hash).");
			return;
		}
		subsk.tree.init_activateSubsk(subsk);
		var amount = s.lvl - subsk.curr_lvl;
		for (var j=0; j<amount; j++) subsk.tree.spendOn(subsk);
		this.spent_points += amount;
	}, this);
	
	for (var name in this.trees) this.trees[name].init_fixLastTouched();
	console.timeEnd("Init: loading data from hash");
	
	console.time("Init: a bit more");
	UI.init_view_switchButtons();
	UI.init_skillsList_orderButtons();
	UI.init_resetButtons();
	UI.init_skillsList_scrollToTreeAndClick(res && res.tree_name);
	this._update_pointsCounter();
	console.timeEnd("Init: a bit more");
	
	if (res && res.is_build) {
		console.time("Init: to build mode");
		this._on_viewBuild_switch();
		console.timeEnd("Init: to build mode");
	}
}

Engine.prototype._on_viewCalc_switch = function() {
	this.view = "calc";
	this._update_urlHash();
	UI.update_view_showCalc();
}

Engine.prototype._on_viewBuild_switch = function() {
	this.view = "build";
	this._fillBuildView();
	this._update_urlHash();
	UI.update_view_showBuild();
}

Engine.prototype.reset = function() {
	this._resetVariables();
	this._update_urlHash();
}


var Tutor = {
	curStep: 0,
	init: function initTutor(){
		if(!this._isComplete()){
			tutorPopup.classList.remove('hidden')
			tutorGoBut.addEventListener('click', this.nextStep.bind(this))
			tutorCancelBut.addEventListener('click', this.end.bind(this))
			this.curStep = 0
			this.nextStep()
		}
	},
	end: function(){
		this._saveCompletionStatus()
		tutorPopup.classList.add('hidden')
	},
	_isComplete: function(){
		return !!localStorage.getItem('myDB')
	},
	_saveCompletionStatus: function(){
		localStorage.setItem('myDB', JSON.stringify({"status":"complete"}))
	},
	_setCoords: function(){
		switch (this.curStep){
			case 0:
				tutorPopup.style.left = "60%"
				tutorPopup.style.top = "33%"
				break
			case 1:
				tutorPopup.style.left = getOffset(skills_tree_wrap).left + skills_tree_wrap.offsetWidth + 'px'
				tutorPopup.style.top = getOffset(skills_tree_wrap).top + 10 +'px'
				break
			case 2:
				tutorPopup.style.left = getOffset(calcmodeBuild).left - 91 + 'px'
				tutorPopup.style.top = getOffset(calcmodeBuild).top + 32 +'px'
				break
			case 3:
				tutorPopup.style.left = 135 + 'px'
				tutorPopup.style.top = 10 +'px'
				break
		}
	},
	nextStep: function(){
		switch (this.curStep){
			case 0:
				tutorContent.innerHTML="<p>Обучение</p> Желаете ознакомиться с новыми функциями калькулятора?"
				this._setCoords()
				this.curStep++
				break
			case 1:
				tutorContent.innerHTML="<p>Развитие</p> Умение сразу можно изучить до нужного уровня, кликнув на соответствующую иконку. Вместо прокликивания всех последовательно."
				tutorGoBut.innerHTML="Продолжить"
				this._setCoords()
				this.curStep++
				break
			case 2:
				tutorContent.innerHTML="<p>Отображение</p> Деревья всех развитых умений кратко отображаются на вкладке «билд»."
				tutorGoBut.innerHTML="Продолжить"
				this._setCoords()
				this.curStep++
				break
			case 3:
				tutorContent.innerHTML="<p>Ссылка на билд</p> Ссылка на билд также содержит в себе ссылку на открытое в данный момент умение и на режим представления калькулятора: обычный или «билд»."
				tutorGoBut.classList.toggle('hidden')
				this._setCoords()
				this.curStep++
				break
		}
	}
};


document.onreadystatechange = function() {
	if (document.readyState != "interactive") return;
	console.time("Init");
	var e = new Engine();
	e._init();
	if (e.spent_points == 0) Tutor.init(); else Tutor.end();
	window.engine = e;
	console.timeEnd("Init");
	UI.init_skillsList_search();
}
