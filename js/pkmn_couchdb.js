var couch_url = 'http://localhost:5984/';
function get_db(db_name) {
	updateLoadBar(1, 1, 'testLoadBar');
	$.get(couch_url + 'pokedex_dev01' + '/', function (data) {
		alert(JSON.stringify(data));
	});
}

function add_document(doc_type, id, doc) {
	var db_name = 'pokedex_dev01/';
	var doc_url = couch_url + db_name + id;

	//add doc_type to document
	doc['doc_type'] = doc_type;

	$.ajax({
	    url : doc_url,
	    data : JSON.stringify(doc),
	    contentType : "application/json", 
	    type : 'PUT',
	    success : function(resp) {
	    	/*$.get(doc_url, function(data) {
	    		alert(JSON.stringify(data));
	    	});*/
	    }
	  });
}

function update_document(doc) {
	var doc_url = couch_url + 'pokedex_dev01/';
	$.ajax({
		url: doc_url + doc._id,
		data: JSON.stringify(doc),
		contentType: "application/json",
		type: 'PUT'
	})
}

function getIdFromURI(uri) {
	return uri.slice(16,-1);
}

function requestPokemon(i, limit) {
	if (i > limit) {
		alert("Requested all Pokemon");
		return;
	}

	// Save each pokemon
    var nat_id = pokedex[i].resource_uri.slice(15,-1);

    $.ajax({
        url: 'http://pokeapi.co/api/v1/pokemon/' + nat_id +  '/',
        dataType: 'jsonp',
        success: function(pokemon){
        	//alert(i);
        	var doc_type = 'pokemon';
        	if (nat_id > 10032) {
        		// mark mega evolutions
        		doc_type += '-mega';
        	} else if (nat_id > 10000 && nat_id < 10033) {
        		// mark additional forms
        		doc_type += '-form';
        	} 	// normal pokemon; do thing special;
        	alert(nat_id);
        	add_document(doc_type, 'pokemon-'+nat_id, pokemon)
        	updateLoadBar(i, limit, 'pokemonLoadBar');
        	requestPokemon(i+1, limit);
        }
    });
	//requestPokemon(i+1);
}

function addPokedexAndPokemon() {
	$.ajax({
            url: 'http://pokeapi.co/api/v1/pokedex/1/',
            dataType: 'jsonp',
            success: function(data){
                pokedex = data.pokemon;
                pokedex.sort(pokedex_sort)
                alert('got pokedex');
                requestPokemon(66,69);//pokedex.length);
            }
        });
}

function requestDataToSave(i, limit, apiDataType) {
	if (i > limit) {
		alert("Requested all Data!");
		return;
	}

    $.ajax({
        url: 'http://pokeapi.co/api/v1/'+ apiDataType +'/' + i +  '/',
        dataType: 'jsonp',
        success: function(data){
        	//alert(i);
        	//if (apiDataType == 'move') {
        		// append move type by linking to list
        	//}

        	add_document(apiDataType, apiDataType+'-'+i, data)
        	updateLoadBar(i, limit, apiDataType+'LoadBar');
        	requestDataToSave(i+1, limit, apiDataType);
        }
    });
}

function saveMoves() {
	alert('Saving Moves...')
	requestDataToSave(1, 625, 'move');
}
function saveTypes() {
	alert('Saving Types...');
	requestDataToSave(1, 18, 'type');
}
function saveAbilities() {
	alert('Saving Abilities...');
	requestDataToSave(1, 248, 'ability');
}
function saveEggGroups() {
	alert('Saving Egg Groups...');
	requestDataToSave(1,15,'egg');
}
function saveDescriptions() {
	alert('Saving Descriptions... This will take a long time...');
	requestDataToSave(11,6610,'description'); //total 6610
}

function updateLoadBar(current, total, divID) {
	var percentDone = Math.round(current/total*100);
	var data = {
		"percentDone": percentDone,
		"current": current,
		"total": total
	};

	$.get('/pokedex/templates/progressbar.mustache', function(template) {
		var html = Mustache.to_html(template, data);
        $('#'+divID).html(html);
	})
}

function addLocalURIs() {
	$.getJSON(couch_url+'pokedex_dev01/_design/pokemon/_view/base', function(view) {
		var limit = view.rows.length;
		for(var i=0; i<=limit;i++) {
			view.rows[i].value["local_image_uri"] = '/pokedex/images/' +  ('000' + view.rows[i].value.national_id).substr(-3) + '.png';
			update_document(view.rows[i].value);
        	updateLoadBar(i, limit, 'localURIsLoadBar');
		}
	});
}


/*
	This function builds the evolution trees of each pokemon and maps them to that pokemon. The data structure
	is designed to be usable by a d3.js tree layout, which means each evolution tree will have this recursive
	format:

	pokemon node = { name: <pokemon name>, children:[<list of pokemon nodes of evolutions>]}
*/
function buildEvoTrees() {
	// ignore pokemon that start with baby forms so the tree starts at the baby form.
	var explored = [25,26,35,36,39,40,106,107,113,122,124,125,126,143,183,184,185,202,226,237,315];

	//tracking variables
	var maxDepth;   // longest chain of evolutions in a given tree
	var maxBreadth; // highest number of branching in a given tree
	var involved;   // list of national_ids of all pokemon in a tree

	// getEvos() is a recursive function that returns the chain of evolutions from the given pokemon
	// until the highest evolution that it can reach. method, detail, and level are passed in from 
	// previous calls to maintain information about how the predecessor evolves to the current pokemon.
	function getEvos(pokemon, method, detail, level, depth) {
		// update global variables
		explored.push(pokemon.national_id);
		if (pokemon.national_id < 718) {
			involved.push(pokemon.national_id);
		}
		depth++;
		if (maxDepth <= depth) {maxDepth = depth;}

		// set required information
		var branch = {
				"name":pokemon.name, 
				"national_id":pokemon.national_id, 
				"local_image_uri":pokemon.local_image_uri,
				"method": method, // method of evolution. Null on basic pokemon
				"detail": detail, // detail of evolution. Null on basic pokemon
				"level": level // will only be populated by levelup evolutions
			};
		if (pokemon.evolutions && pokemon.evolutions.length > 0) {
			// set new maximum breadth if applicable
			if (pokemon.evolutions.length > maxBreadth) {maxBreadth = pokemon.evolutions.length;}

			// get children nodes by recurring on each evolution
			branch["children"] = pokemon.evolutions.map(function (evo) {
				var e;
				$.ajax({
					url: couch_url+'pokedex_dev01/pokemon-'+getIdFromURI(evo.resource_uri),
					dataType: 'json',
					async: false,
					success: function(pkmn) {
						e = getEvos(pkmn, evo.method, evo.detail, evo.level, depth);
					}
				});
				return e;
			})
		}
		return branch;
	}

	var id = 0;
	$.getJSON(couch_url+'pokedex_dev01/_design/pokemon/_view/base', function(view) {
		var limit =view.rows.length;

		for (var i=id;i<limit;i++) {
			if ($.inArray(view.rows[i].value.national_id, explored) == -1) {
				//reset tracking variables
				maxDepth = 0;
				maxBreadth = 1;
				involved = [];

				var tree = {"tree": getEvos(view.rows[i].value,null,null,null,maxDepth)};
				tree["depth"] = maxDepth;
				tree["breadth"] = maxBreadth;
				var strTree = JSON.stringify(tree);
				//displayEvoTree('testarea', tree);
				
				for (var j=0;j<involved.length;j++) {
					view.rows[involved[j]-1].value["evoTree"] = strTree;
					update_document(view.rows[involved[j]-1].value);
				}
			}
			updateLoadBar(i+1, limit, 'evoTreeLoadBar')
		}
	});
}