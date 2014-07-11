var couch_url = 'http://127.0.1:5984/';

function get_db(db_name) {
	$.get(couch_url + db_name + '/', function (data) {
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
        	requestPokemon(i+1, limit);
        }
    });
	//requestPokemon(i+1);
}

function addPokedexAndPokemon() {
	$.ajax({
            url: 'http://127.0.0.1:5984/pokedex_dev01/pokedex-1/',
            dataType: 'json',
            success: function(data){
            	//add_document('pokedex', 'pokedex-1', data);
                pokedex = data.pokemon;
                alert('got pokedex');
                //list comes in garbled and needs sorted by national dex ID
                //pokedex.sort(pokedex_sort);

                requestPokemon(0,pokedex.length);
            }
        });
}