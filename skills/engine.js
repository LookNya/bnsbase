function Tree(name) {
	this.name = name;
	this.rawData = {};
	this.root = null;
	this.lastTouched = null;
	this.spent_points = 0;
	this.subsks = [];
	this.htmlElem = null;
	this.node_width = 72;
	this.node_height = 72;
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
	
	if (is_root) {
		if (this.root)                  this._err("Got second ROOT subskill, previous id: "+this.root.id);
		if (subsk.relations.length > 1) this._warn("Expected ROOT subskill to have exactly ONE relation but found "+subsk.relations.length+" of them");
		if ('max_lvl' in subsk)         this._warn("max_lvl is set for ROOT subskill, it will be overwritten.");
		
		['name', 'img'].forEach(function(attr) {
			if (!(attr in subsk)) this._err("Expected ROOT subskill to have '"+attr+"'.");
		});
		
		this.root = subsk;
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
				this._err("Subskill (id:"+rel_id+") already has parent (id:"+rel.reverse_relation.id+") "+
				          "but another subskill (id:"+sk_id+") is referencing it.");
			}
			
			subsk.relations[i] = rel;
			rel.reverse_relation = subsk;
		}
	}
	delete this.subsks.root;
}

Tree.prototype._setup_setDefaults = function() {
	this.subsks.forEach(function(subsk) {
		if (!('name' in subsk)) subsk.name = subsk.tree.root.name;
		if (!('img' in subsk)) subsk.img = subsk.tree.root.img;
	});
}

Tree.prototype._setup = function() {
	//this._setup_processRawData();
	this.rawData = null;
	if (!this.root) console.error("AHTUNG! No root subskill assigned for tree '"+this.name+"'!");
	this._setup_correctRelations();
	this._setup_setDefaults();
	this._activeChildren(this.root);
	UI.init_skillTree_makeHTML(this, this.node_width, this.node_height);
}

Tree.prototype._activeChildren = function(subsk) {
	for (var i=0; i<subsk.relations.length; i++) {
		var rel = subsk.relations[i];
		rel.active = true;
		if (rel.htmlElem) rel.htmlElem.classList.add('active');
	}
}

Tree.prototype._update_subskEffects = function(subsk) {
	for (var name in subsk.effects) delete subsk.effects[name];
	
	for (var i=subsk.curr_lvl; i>=0; i--) {
		var lvl_effects = subsk['effects_'+i];
		if (!lvl_effects) continue;
		
		for (var name in lvl_effects) {
			if (!(name in subsk.effects)) subsk.effects[name] = lvl_effects[name];
		}
	}
}

Tree.prototype.spendOn = function(subsk) {
	if (this.rawData) this._setup();
	if (!subsk.active) return false;
	if (subsk.curr_lvl == subsk.max_lvl) return false;
	
	this.spent_points ++;
	this.lastTouched = subsk;
	
	subsk.curr_lvl ++;
	this._update_subskEffects(subsk);
	if (subsk.curr_lvl == subsk.max_lvl) this._activeChildren(subsk);
	return true;
}

Tree.prototype.addSubsk = function(id, subsk) {
	this.rawData[id] = subsk;
	this._setup_processRawSubsk(id, subsk);
}

Tree.prototype.reset = function() {
	if (this.rawData) return;
	
	this.spent_points = 0;
	this.lastTouched = this.root;
	this.subsks.forEach(function(subsk) {
		subsk.curr_lvl = 0;
		subsk.active = false;
		subsk.htmlElem.classList.remove('active');
	});
	this._activeChildren(this.root);
}

Tree.prototype.getHTML = function() {
	if (this.rawData) this._setup();
	return this.htmlElem;
}



function Engine() {
	this.spent_points = 0;
	this.max_points = 45;
	
	this.subsks = [];
	this.trees = {};
	
	this.currTree = null;
	
	this.curr_race = 's';
	this.races = {
		a: "ass",
		b: "bm",
		l: "lsm",
		s: "sum",
		d: "des",
		k: "kfm",
	};
	
	//this.infoUpdateTimeout = null;
	
	UI.on_skillsListItem_click = this._on_skillsListItem_click.bind(this);
	UI.on_subskill_over = this._on_subskill_over.bind(this);
	UI.on_subskill_out = this._on_subskill_out.bind(this);
	UI.on_subskill_click = this._on_subskill_click.bind(this);
	UI.on_resetAll_click = this._on_resetAll_click.bind(this);
	UI.on_resetTree_click = this._on_resetTree_click.bind(this);
}

Engine.prototype._on_skillsListItem_click = function(e) {
	this.currTree = this.trees[e.target.dataset.tree_name];
	UI.update_skillTree(this.currTree.getHTML());
	Utils.updateInfo(this.currTree.lastTouched);
	this._update_urlHash();
}

Engine.prototype._on_subskill_over = function(e) {
	var subsk = this.subsks[e.target.dataset.id];
	Utils.updateInfo(subsk);
}

Engine.prototype._on_subskill_out = function(e) {
	Utils.updateInfo(this.currTree.lastTouched);
}

Engine.prototype._on_resetAll_click = function(e) {
	this._resetVariables();
	UI.init_skillsList_clickFirst();
	Utils.updateInfo(this.currTree.lastTouched);
	this._update_pointsCounter();
	this._update_urlHash();
}

Engine.prototype._on_resetTree_click = function(e) {
	this.spent_points -= this.currTree.spent_points;
	this.currTree.reset();
	Utils.updateInfo(this.currTree.lastTouched);
	this._update_pointsCounter();
	this._update_urlHash();
}

Engine.prototype._on_subskill_click = function(e) {
	if (this.spent_points > this.max_points) return;
	
	var subsk = this.subsks[e.target.dataset.id];
	if (!subsk.tree.spendOn(subsk)) return;
	
	this.spent_points ++;
	this._update_pointsCounter();
	Utils.updateInfo(subsk);
	this._update_urlHash();
}

Engine.prototype._update_urlHash = function() {
	Utils.generateDataToHash(this.curr_race, this.subsks);
}

Engine.prototype._update_pointsCounter = function() {
	UI.update_spentPointsCounter(this.spent_points, this.max_points);
}

Engine.prototype._resetVariables = function() {
	this.spent_points = 0;
	this.currTree = null;
	for (var tree_name in this.trees) this.trees[tree_name].reset();
}

Engine.prototype._init_growTrees = function() {
	for (var name in skills_data) {
		var m = name.match(/^(\w+)\|(\d+|root)$/);
		if (!m) {
			console.error("Expected subskill name to be like 'treename|5' or 'treename|root' but got '"+name+"'.");
			continue;
		}
		
		if (!(m[1] in this.trees)) this.trees[m[1]] = new Tree(m[1], this);
		var tree = this.trees[m[1]];
		
		tree.addSubsk(m[2], skills_data[name]);
	}
	
	for (var tree_name in this.trees) {
		var tree = this.trees[tree_name];
		for (var i in tree.rawData) {
			if (i == "root") continue;
			if (i in this.subsks) console.error("Two subskills with same ids ("+i+") in trees '"+this.subsks[i].tree+"' and '"+tree.name+"'.");
			this.subsks[i] = tree.rawData[i];
		}
	}
	
	for (var i=0; i<this.subsks.length; i++) {
		if (!(i in this.subsks)) console.warn("Id '"+i+"' was not used for any subskill.");
	}
}

Engine.prototype._init = function() {
	for (var name in skills_list) UI.init_skillsList_addSkill(name, skills_list[name]);
	this._init_growTrees();
	this._resetVariables();
	
	var res = Utils.loadDataFromHash(this.subsks);
	this.curr_race = res && res.race || 's';
	res && res.spendings.forEach(function(s) {
		var subsk = this.subsks[s.sk_id];
		if (!subsk) {
			console.warn("Unable to find skill with id: "+s.sk_id+" (while loading from hash).");
			return;
		}
		var amount = s.lvl - subsk.curr_lvl;
		for (var j=0; j<amount; j++) subsk.tree.spendOn(subsk);
		this.spent_points += amount;
	}, this);
	
	
	UI.init_resetButtons();
	if (!this.currTree) UI.init_skillsList_clickFirst();
	this._update_pointsCounter();
}

//Engine.prototype.requestInfoUpdate = function() {
//	if (this.infoUpdateTimeout != null) return;
//	
//	this.infoUpdateTimeout = setTimeout(function() {
//		this.infoUpdateTimeout = null;
//		//!!!
//	}, 5);
//}

Engine.prototype.reset = function() {
	this._resetVariables();
	this._update_urlHash();
}


document.onreadystatechange = function() {
	if (document.readyState != "complete") return;
	console.time("Init");
	new Engine()._init();
	console.timeEnd("Init");
}
