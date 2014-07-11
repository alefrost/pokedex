<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Testing PokeAPI</title>
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js"></script>
<script type="text/javascript" src="/js/mustache.js"></script>
<script>
	function getPokemonById()
	{
		var id = parseInt($('#PokeID').val(), 10) + 1;
		var pokemon;
    	$.ajax({
                url: 'http://pokeapi.co/api/v1/sprite/'+ id + '/',
                dataType: 'jsonp',
                success: function(data){
                    pokemon = data;
                    //alert(pokemon.pokemon.name + "\n" + pokemon.image);
                    $('#imgSprite').attr('src', 'http://pokeapi.co' + pokemon.image);
                    $('#imgSprite').css('display', 'block');
                    $('#PokeName').val(pokemon.pokemon.name);
                }
            });
        return pokemon;
    }

    function getPokemonByName()
	{
		var n = $('#PokeName').val();
		var src = $('#img'+n).attr('src');
		$('#imgSprite').attr('src', src);
        $('#imgSprite').css('display', 'block');
        $('#PokeID').val(src.slice(28,-4));
    }

    function pokedex_sort(a, b) {
    	// slice(15,-1) obtains national dex ID from resource uri.
    	// this keeps from having to do another API call just for ID, although, one might happen anyway...
    	var aid = parseInt(a.resource_uri.slice(15,-1), 10);
    	var bid = parseInt(b.resource_uri.slice(15,-1), 10);
    	return aid - bid;
    }

    $.ajax({
    	url: 'http://pokeapi.co/api/v1/pokedex/1/',
    	dataType: 'jsonp',
    	success: function(data){
    		pokedex = data.pokemon;

    		//list comes in garbled and needs sorted by national dex ID
    		pokedex.sort(pokedex_sort);

    		// Display each row
    		var htmlstr = "";
    		for  (var i = 0; i < pokedex.length; i++) {
    			//if(i >= 718) {break;}
    			var nat_id = pokedex[i].resource_uri.slice(15,-1);
                //htmlstr += '<img id="img'+pokedex[i].name+'" src="http://serebii.net/xy/pokemon/' + ('000' + nat_id).substr(-3) + '.png" />';
                htmlstr += '<img id="img'+pokedex[i].name+'" src="http://pokeapi.co/media/img/' + nat_id + '.png" />';
    			htmlstr += '<p>'+ nat_id + " : " + pokedex[i].name + '</p>\n';
    		}
    		$('#pokedex').html(htmlstr);
    	}
    });

    //alert(get_pokemon(6).name);
</script>
</head>

<body>

<img id="imgSprite" src="" style="display:none;"/>
<input id="PokeID" type="text" />
<button onclick="getPokemonById()">Search by ID</button>
<br />
<input id="PokeName" type="text" />
<button onclick="getPokemonByName()">Search by Name</button>
<div id="pokedex"></div>
</body>
</html>