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
        		alert(pokemon.name);
        	} else if (nat_id > 10000 && nat_id < 10033) {
        		// mark additional forms
        		doc_type += '-form';
        	} 	// normal pokemon; do thing special;

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
                alert('got pokedex');
                requestPokemon(0,pokedex.length);
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