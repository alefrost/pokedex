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

function buildEvoTrees() {
	var explored = [];
	// getEvos() is a recursive function to compile a single evolution tree for a given pokemon family
	function getEvos(pokemon,tree,method,detail,level) {
		//alert(JSON.stringify(tree));
		tree.push({
				"name":pokemon.name, 
				"national_id":pokemon.national_id, 
				"local_image_uri":pokemon.local_image_uri,
				"method":method,
				"detail":detail,
				"level":level
			});
		explored.push(pokemon.national_id);
		if (pokemon.evolutions.length == 1) {
			$.ajax({
				url: couch_url+'pokedex_dev01/pokemon-'+getIdFromURI(pokemon.evolutions[0].resource_uri),
				dataType: 'json',
				async: false,
				success: function(pkmn) {
					tree = getEvos(pkmn,tree,pokemon.evolutions[0].method,pokemon.evolutions[0].detail,pokemon.evolutions[0].level);
				}
			});
		} else if (pokemon.evolutions.length > 1) {
			pokemon.evolutions.map(function (evo) {
				$.ajax({
					url: couch_url+'pokedex_dev01/pokemon-'+getIdFromURI(evo.resource_uri),
					dataType: 'json',
					async: false,
					success: function(pkmn) {
						tree.push(getEvos(pkmn,[],evo.method,evo.detail,evo.level));
					}
				});	
			})
		}
		return tree;
	}

	$.getJSON(couch_url+'pokedex_dev01/_design/pokemon/_view/base', function(view) {
		var limit = 264;//view.rows.length;
		for (var i=264;i<=limit;i++) {
			var tree = [];
			if ($.inArray(view.rows[i].value.national_id, explored) == -1) {
				getEvos(view.rows[i].value,tree,null,null,null));
				//alert(explored);
				//getEvos(view.rows[i].value);
			}
		}
	});
}