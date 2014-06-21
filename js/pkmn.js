/* output comes in format:
    {"data": {}}
    function should populate data attr
    */
function getPokemonById(id, renderId)
{
	$.ajax({
            url: 'http://pokeapi.co/api/v1/pokemon/'+ id + '/',
            dataType: 'jsonp',
            success: function(pokemon){
                // submit post request to php file... might not work due to JSONP datatype
                var img = 'http://www.serebii.net/art/th/'+id+'.png';
                pokemon["image_src"] = img;

                $.get('/pokedex/templates/pokemon.mustache', function(template) {
                    var html = Mustache.to_html(template, pokemon);
                    $('#'+renderId).html(html);
                });
            }
        });
}


function getPokemonIdByName(name)
{
    var id;
    $.ajax({
        dataType: 'json',
        url: 'pokedex/js/InvertedIndexPokedex.json',
        async: false,
        success: function(invertedPokedex) {
            //alert(JSON.stringify(invertedPokedex[name.toLowerCase()]));
            id = JSON.stringify(invertedPokedex[name.toLowerCase()]);
            //getPokemonById(id);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(errorThrown + ":\n" + textStatus);
        }
    });
    //alert("getPokemonByName\n" + id);
    return id;
}

// <One-Time use function>
// Only used to generate inverted index.
function writeInvertedPokedex()
{
    $.ajax({
            url: 'http://pokeapi.co/api/v1/pokedex/1/',
            dataType: 'jsonp',
            success: function(pokedex){
                $.post('invertedPokedex.php', {"pokedex": JSON.stringify(pokedex.pokemon)}, 
                    function(data, status){
                        $('#box').html(JSON.stringify(data));
                    });
            }
        });
}
