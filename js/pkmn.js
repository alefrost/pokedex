/* Renders pokemon of the given ID
    PARAMS:
    - int <id>: national_id of Pokemon
    - string <renderId>: ID of html div to render template inside of
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

                formatMoves(pokemon);

                $.get('/pokedex/templates/pokemon.mustache', function(template) {
                    //alert(JSON.stringify(pokemon));
                    var html = Mustache.to_html(template, pokemon);
                    $('#'+renderId).html(html);
                });
            }
        });
}

/* Renders pokemon of the given name
    PARAMS:
    - string <name>: Name of Pokemon
    - string <renderId>: ID of html div to render template inside of
*/
function getPokemonByName(name, renderId)
{
    $.ajax({
        dataType: 'json',
        url: '/pokedex/js/InvertedIndexPokedex.json',
        success: function(invertedPokedex) {
            var id = JSON.stringify(invertedPokedex[name.toLowerCase()]);
            getPokemonById(id, renderId);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(errorThrown + ":\n" + textStatus);
        }
    });
}

function formatMoves(pokemon) {
    moves = {
        'levelup': [],
        'machine': [],
        'egg_move': [],
        'tutor': [],
        'other': [],
    };

    // Load in inverted index of TM/HM moves
    var machines;
    $.ajax({
        dataType: 'json',
        url: '/pokedex/js/InvertedMachineIndex.json',
        async: false,
        success: function(invertedMachines) {
            machines = invertedMachines;
        }
    })

    // filter moves into categories via learn type
    var mach_id;
    var move;
    for(var i=0; i < pokemon.moves.length; i++) {
        switch(pokemon.moves[i].learn_type) {
            case 'level up':
                moves.levelup.push(pokemon.moves[i]);
                break;
            case 'machine':
                mach_id = machines[pokemon.moves[i]["name"].toLowerCase()];
                move = pokemon.moves[i];
                if (mach_id != "" && mach_id != null) {
                    move["mach_id"] = mach_id;
                    moves.machine.push(move);
                } else {
                    // handle old TM/HM moves prior to gen 6
                    moves.other.push(move);
                }
                move = "";
                break;
            case 'egg move':
                moves.egg_move.push(pokemon.moves[i]);
                break;
            case 'tutor':
                moves.tutor.push(pokemon.moves[i]);
                break;
            default:
                // this may never happen... unsure
                moves.other.push(pokemon.moves[i]);
        }
    }

    // sort lvl-up moves by ascending level
    moves.levelup.sort(function(a, b) {
        return a.level - b.level;
    });

    moves.machine.sort(function(a, b) {
        var aMachType = a.mach_id.slice(0,2);
        var bMachType = b.mach_id.slice(0,2);
        if (aMachType == bMachType) { 
            var aid = parseInt(a.mach_id.slice(2));
            var bid = parseInt(b.mach_id.slice(2));
            //alert(a.mach_id + " =?= " + b.mach_id);
            return aid - bid;
        } else {
            if (aMachType < bMachType){
                return 1;
            } else {
                return -1;
            }
        }
    });
    moves.egg_move.sort(function(a, b) {
        return a.name > b.name;
    });
    moves.other.sort(function(a, b) {
        return a.name > b.name;
    });

    // replace original moves list with formatted structure
    pokemon["moves"] = [moves];
}


function pokedex_sort(a, b) {
    // slice(15,-1) obtains national dex ID from resource uri.
    // this keeps from having to do another API call just for ID, although, one might happen anyway...
    var aid = parseInt(a.resource_uri.slice(15,-1), 10);
    var bid = parseInt(b.resource_uri.slice(15,-1), 10);
    return aid - bid;
}
function displayPokedex(renderID) {
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
                    htmlstr += '<img id="img'+pokedex[i].name+'" src="http://serebii.net/xy/pokemon/' + ('000' + nat_id).substr(-3) + '.png" />';
                    htmlstr += '<p>'+ nat_id + " : " + pokedex[i].name + '</p>\n';
                }
                $('#'+renderID).html(htmlstr);
            }
        });
}

/* ------------------ One-Time-Execution functions go below here ------------------ */
// generate inverted index for pokedex.
//   pokemon name => id
function writeInvertedPokedex()
{
    $.ajax({
            url: 'http://pokeapi.co/api/v1/pokedex/1/',
            dataType: 'jsonp',
            success: function(pokedex){
                $.post('invertedPokedex.php', {"pokedex": JSON.stringify(pokedex.pokemon)}, 
                    function(data, status){
                        $('#result').html(JSON.stringify(data));
                    });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert(errorThrown + ":\n" + textStatus);
            }
        });
}

//generate inverted index for TM/HM list
//   move => (TM|HM)number
function writeInvertedMachineIndex()
{
    $.ajax({
        dataType: 'json',
        url: '/pokedex/js/machineIndexHyphonated.json',
        success: function(machines) {
            $.post('/pokedex/php/invertedMachineIndex.php', {"machines": JSON.stringify(machines)},
                function(data, status) {
                    $('#result').html("STATUS:<br />"+status + "<br />DATA:<br />" + JSON.stringify(data));
                });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(errorThrown + ":\n" + textStatus);
        }
    });
}
